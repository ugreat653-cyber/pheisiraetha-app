#!/usr/bin/env python3
"""Validate an approved immutable Actions ZIP and copy a complete Pages overlay.
No building, repository mutation, deployment, metadata rewriting or package install.
"""
import hashlib, io, json, os, pathlib, stat, sys, urllib.error, urllib.parse, urllib.request, zipfile

# These values are replaced with the final qualified receipt before review.
REPOSITORY = "ugreat653-cyber/pheisiraetha-app"
REPOSITORY_ID = 1391424322
RUN_ID = 37846586369
HEAD = "db6920193fb76028947ce148cd8ed61c847c5c3d"
ARTIFACT_ID = 11580506475
ARCHIVE_SHA256 = "85bfe111a96f0e9773d505cbebe3d4750c4320f00eec6a370ce86147c33766b8"
OFF_DIGEST = "9d81180cc267b32fabf55a5643975b205581f98f7852036ebf3f788512ff58b6"
ON_DIGEST = "8dc1ede82f5e22c8c64b2f3172993376811bbb61dcec8cff4ef1638a8374963c"
ROLLBACK_DIGEST = "668b47ed36422df20689f50cd403067e243e2c009c8270667f78b7fb9c32706e"
BROWSER_SHA256 = "6c792041b07547a662e1b17974d1dc34a3db630379b45d9d89ddd7e3e68cc587"
IDS = ["PP-BUILD-01","PP-BOOTSTRAP-OFF","PP-HARDENING-01","PP-MIX-OFF","PP-MIX-ON","PP-ON-5","PP-ON-9","PP-FALLBACK","PP-IMPORT-01","PP-INSTALL-FAIL","PP-ROLLBACK-01"]
S3 = "7e583ac695be2b213d25591deab430664e682988"
PRODUCTION = "255a5d9d27461dcacaebc1bc80ab322dd54b4de8"
PREFIX = "pheisiraetha-public-release/"
MATRIX_PATH = "pheisiraetha-public-evidence/public-proposal-matrix.json"
EVIDENCE_PATH = PREFIX + "proposal-evidence.json"
MAX_BYTES = 20 * 1024 * 1024

def require(condition, message):
    if not condition:
        raise ValueError(message)

def sha(data):
    return hashlib.sha256(data).hexdigest()

def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")

def safe_name(name):
    require(isinstance(name, str) and name and "\\" not in name and "\x00" not in name, "Invalid archive path")
    parts = name.rstrip("/").split("/")
    require(all(p and p not in (".", "..") and ":" not in p for p in parts), "Unsafe archive path")
    require(not name.startswith("/"), "Absolute archive path")
    return name

def api_json(suffix):
    token = os.environ["GH_TOKEN"]
    url = "https://api.github.com/repos/" + REPOSITORY + suffix
    req = urllib.request.Request(url, headers={"Authorization":"Bearer " + token,
        "Accept":"application/vnd.github+json", "X-GitHub-Api-Version":"2022-11-28", "User-Agent":"PHEISIRAETHA-exact-release"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def archive_bytes():
    token = os.environ["GH_TOKEN"]
    url = "https://api.github.com/repos/" + REPOSITORY + "/actions/artifacts/" + str(ARTIFACT_ID) + "/zip"
    req = urllib.request.Request(url, headers={"Authorization":"Bearer " + token, "User-Agent":"PHEISIRAETHA-exact-release"})
    try:
        urllib.request.build_opener(NoRedirect()).open(req, timeout=30)
    except urllib.error.HTTPError as error:
        require(error.code == 302, "Artifact API did not return the expected download redirect")
        location = error.headers.get("Location")
        require(location and urllib.parse.urlsplit(location).scheme == "https", "HTTPS artifact download required")
    else:
        raise ValueError("Expected a signed artifact download redirect")
    # The repository token is sent ONLY to api.github.com, never to the signed storage URL.
    with urllib.request.urlopen(urllib.request.Request(location, headers={"User-Agent":"PHEISIRAETHA-exact-release"}), timeout=60) as response:
        data = response.read(MAX_BYTES + 1)
    require(len(data) <= MAX_BYTES, "Archive too large")
    require(sha(data) == ARCHIVE_SHA256, "Approved ZIP SHA256 mismatch")
    return data

def verify_metadata():
    run = api_json("/actions/runs/" + str(RUN_ID))
    require(run["id"] == RUN_ID and run["run_attempt"] == 1, "Run/attempt mismatch")
    require(run["status"] == "completed" and run["conclusion"] == "success", "Qualification run must be successful")
    require(run["head_sha"] == HEAD and run["event"] == "pull_request", "Qualification head/event mismatch")
    require(run["path"] == ".github/workflows/pheisiraetha-public-proposal.yml", "Unexpected qualification workflow")
    for key in ("repository", "head_repository"):
        require(run[key]["id"] == REPOSITORY_ID and run[key]["full_name"] == REPOSITORY, "Repository mismatch")
    artifact = api_json("/actions/artifacts/" + str(ARTIFACT_ID))
    require(artifact["id"] == ARTIFACT_ID and not artifact["expired"], "Approved artifact missing/expired")
    require(artifact["name"] == "pheisiraetha-public-proposal-" + str(RUN_ID) + "-1", "Artifact name mismatch")
    require(artifact["digest"] == "sha256:" + ARCHIVE_SHA256, "Artifact API digest mismatch")
    require(artifact["workflow_run"]["id"] == RUN_ID and artifact["workflow_run"]["head_sha"] == HEAD, "Artifact provenance mismatch")
    return {"run":RUN_ID, "head":HEAD, "artifact":ARTIFACT_ID, "zipSha256":ARCHIVE_SHA256, "expiresAt":artifact["expires_at"]}

def verified_overlays(data):
    require(sha(data) == ARCHIVE_SHA256, "Approved ZIP SHA256 mismatch")
    archive = zipfile.ZipFile(io.BytesIO(data))
    entries = {}
    total = 0
    for info in archive.infolist():
        safe_name(info.filename)
        require(not info.flag_bits & 1, "Encrypted archive entry")
        mode = info.external_attr >> 16
        require(not stat.S_ISLNK(mode), "Archive symlink forbidden")
        if info.is_dir():
            require(not mode or not stat.S_IFMT(mode) or stat.S_ISDIR(mode), "Invalid directory type")
            continue
        require(not mode or not stat.S_IFMT(mode) or stat.S_ISREG(mode), "Only regular archive files allowed")
        require(info.filename not in entries, "Duplicate archive entry")
        total += info.file_size
        require(total <= MAX_BYTES and len(entries) < 100, "Archive expansion limit")
        entries[info.filename] = archive.read(info)
    matrix = json.loads(entries[MATRIX_PATH])
    evidence = json.loads(entries[EVIDENCE_PATH])
    require(matrix["status"] == "PASS" and matrix["phase"] == "PRIVATE_HARDENED_PUBLIC_PROPOSAL", "Matrix is not qualified")
    require(matrix["candidateCommit"] == HEAD and matrix["integrationCommit"] == S3, "Matrix source mismatch")
    require(matrix["tests"] == 11 and matrix["skipped"] == 0 and matrix["todo"] == 0, "Incomplete matrix")
    require(matrix["frozenUnchanged"] is True and matrix["sourceFlag"] == "OFF", "Frozen source boundary mismatch")
    require(matrix["expectedMountPath"] == "/pheisiraetha-app/", "Project mount mismatch")
    for field in ("publicDeploymentPerformed", "publicActivationPerformed", "productionChanged"):
        require(matrix[field] is False, "Qualification crossed the private boundary")
    rows = matrix["rows"]
    require(sorted(row["id"] for row in rows) == sorted(IDS), "Exact witnessed case set required")
    require(all(row["status"] == "PASS" and row["witnesses"] for row in rows), "Matrix failure or missing witness")
    browser = matrix["browser"]
    require(browser["version"] == "154.0.8037.97" and browser["sha256Before"] == BROWSER_SHA256 and browser["sha256After"] == BROWSER_SHA256, "Accepted browser mismatch")
    require(evidence["sourceCommit"] == HEAD and evidence["status"] == "STAGED_UNQUALIFIED" and evidence["deploymentPerformed"] is False, "Immutable staging receipt mismatch")
    require(evidence["expectedMountPath"] == "/pheisiraetha-app/" and evidence["qualifiedBuilderBlob"] == "7982555aba12baf5323672da2371ed4a4829b893", "Builder/mount mismatch")
    rollback = next(row["witnesses"] for row in rows if row["id"] == "PP-ROLLBACK-01")
    require(rollback["exactTestedOverlayArchived"] is True and rollback["freshGeneration"] == "rollback-11", "Tested rollback must be archived")
    descriptions = {"off":evidence["off"], "on":evidence["on"], "rollback":rollback["testedOverlay"]}
    expected = {MATRIX_PATH, EVIDENCE_PATH}
    overlays = {}
    for name, digest in (("off", OFF_DIGEST), ("on", ON_DIGEST), ("rollback", ROLLBACK_DIGEST)):
        description = descriptions[name]
        require(description["releaseDigest"] == digest, "Approved inventory digest mismatch")
        require(description["activeMode"] == ("ON" if name == "on" else "OFF") and description["bootstrapFlag"] == "OFF", "Release mode mismatch")
        files = {}
        for item in description["files"]:
            file = safe_name(item["file"])
            require(not file.endswith("/") and file not in files, "Duplicate/invalid overlay leaf")
            archive_path = PREFIX + name + "/" + file
            expected.add(archive_path)
            content = entries[archive_path]
            require(len(content) == item["sizeBytes"] and sha(content) == item["sha256"], "Overlay size/hash mismatch: " + file)
            files[file] = content
        meta = json.loads(files["release-inventory.json"])
        inventory = meta["inventory"]
        require(meta["releaseDigest"] == digest and sha(canonical(inventory)) == digest, "Inventory canonical digest mismatch")
        require(inventory["generation"] == description["generation"], "Generation mismatch")
        require(inventory["scope"] == ("STAGED_ON_RELEASE_PROPOSAL" if name == "on" else "STAGED_OFF_RELEASE_PROPOSAL"), "Release scope mismatch")
        provenance = inventory["provenance"]
        require(provenance["integrationCommit"] == S3 and provenance["productionCommit"] == PRODUCTION and provenance["sourceFlag"] == "OFF", "Pinned production source mismatch")
        require(provenance["dtoVersion"] == "pheisiraetha-render-v1" and provenance["safetyPolicy"] == "safety-v1" and provenance["registryVersion"] == "safety-registry-v1", "Version contract mismatch")
        require(provenance["bootstrapKind"] == "HARDENED_S3_OFF", "Hardened OFF bootstrap required")
        require(sha(files["index.html"]) == description["bootstrapSha256"] and sha(files["sw.js"]) == description["workerSha256"], "Bootstrap/worker mismatch")
        require(sha(files["release-inventory.json"]) == description["inventoryFileSha256"], "Inventory file mismatch")
        require(sha(files[description["entryURL"]]) == description["entrySha256"], "Selected entry mismatch")
        assets = inventory["assets"]
        require(len({asset["url"] for asset in assets}) == len(assets), "Duplicate inventory asset")
        for asset in assets:
            file = safe_name(asset["url"].split("?")[0])
            content = files[file]
            require(len(content) == asset["sizeBytes"] and sha(content) == asset["sha256"], "Inventoried asset mismatch")
        overlays[name] = files
    require(set(entries) == expected, "Unexpected or missing ZIP files")
    require(overlays["off"]["index.html"] == overlays["on"]["index.html"] == overlays["rollback"]["index.html"], "Whole hardened bootstrap must match")
    off_assets = json.loads(overlays["off"]["release-inventory.json"])["inventory"]["assets"]
    rollback_assets = json.loads(overlays["rollback"]["release-inventory.json"])["inventory"]["assets"]
    require(off_assets == rollback_assets, "Whole previous OFF asset inventory must be restored")
    for asset in off_assets:
        file = asset["url"].split("?")[0]
        require(overlays["off"][file] == overlays["rollback"][file], "Rollback asset changed")
    return overlays

def copy_overlay(files, output):
    output = pathlib.Path(output)
    require(output.is_absolute() and output.parent.resolve() == pathlib.Path(os.environ["RUNNER_TEMP"]).resolve(), "Fresh runner-temp output required")
    require(not output.exists(), "Output already exists")
    output.mkdir()
    for file, content in files.items():
        target = output.joinpath(*safe_name(file).split("/"))
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open("xb") as stream:
            stream.write(content)
        require(target.read_bytes() == content, "Copied bytes differ")
    actual = {str(file.relative_to(output)).replace(os.sep, "/") for file in output.rglob("*") if file.is_file()}
    require(actual == set(files), "Copied file set differs")

if __name__ == "__main__":
    require(sys.platform == "linux", "Run transport validation only in the authorized Linux runner")
    require(len(sys.argv) == 3 and sys.argv[1] in ("ON", "ROLLBACK"), "Usage: verify-pages-archive.py ON|ROLLBACK fresh-output")
    provenance = verify_metadata()
    overlays = verified_overlays(archive_bytes())
    name = "on" if sys.argv[1] == "ON" else "rollback"
    copy_overlay(overlays[name], sys.argv[2])
    print(json.dumps({"transportGate":"PASS", "selectedMode":sys.argv[1], "files":len(overlays[name]), "deploymentPerformed":False, **provenance}, sort_keys=True))
