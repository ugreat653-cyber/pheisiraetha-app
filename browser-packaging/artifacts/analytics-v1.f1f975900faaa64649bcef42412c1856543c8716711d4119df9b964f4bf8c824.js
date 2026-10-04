"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // frozen/analysis.js
  var require_analysis = __commonJS({
    "frozen/analysis.js"(exports, module) {
      "use strict";
      var ENGINE_VERSION = "analysis-phase2a-beta-heuristics-v1";
      var SOURCE_COMMIT = "255a5d9d27461dcacaebc1bc80ab322dd54b4de8";
      var SOURCE_VERSION = "0.1.0";
      var DAY = 864e5;
      var HEURISTICS = Object.freeze({
        minimumSpacing: 7 * DAY,
        maximumGap: 28 * DAY,
        maximumObservations: 5,
        flatRatingRange: 1,
        lowRatingMaximum: 3,
        notableRatingDelta: 2,
        largeRatingStep: 4,
        notableHoursDelta: 1,
        flatHoursRange: 0.25
      });
      var DIMENSIONS = Object.freeze(["primary", "success", "scope", "nonGoals", "constraints", "rationale"]);
      var RATINGS = Object.freeze(["desire", "belief", "emotionIntensity", "mental", "practical"]);
      var FREQUENCIES = Object.freeze(["freq0", "freq1", "freq2", "freq3", "freq4", "freq5"]);
      var DIRECTIONS = Object.freeze(["toward", "none", "away", "mixed", "unknown"]);
      var BASES = Object.freeze(["direct", "documented", "otherPerson", "subjective", "insufficient", "other"]);
      var DEFAULT_PROFILE_PATHS = Object.freeze([
        ...RATINGS.map((k) => `iep.${k}`),
        "iep.emotion",
        "iep.frequency",
        "iep.actions",
        "iep.hours",
        "oop.achievement",
        "oop.direction",
        "oop.evidence",
        "oop.currentState",
        "oop.events",
        "oop.external"
      ]);
      var RULE_IDS = Object.freeze([
        "REF-01",
        "QUAL-01",
        "CMP-01",
        "CMP-02",
        "REV-01",
        "REV-02",
        "TXT-01",
        "INT-01",
        "INT-02",
        "PRA-01",
        "PRA-02",
        "MEN-01",
        "MEN-02",
        "EMO-01",
        "EMO-02",
        "OUT-01",
        "OUT-02",
        "CTX-01",
        "CTX-02",
        "COND-01",
        "REL-01",
        "REL-02",
        "REL-03",
        "MIX-01"
      ]);
      var EMOTION_LABELS = {
        "en": [
          "Love / affection",
          "Joy / excitement",
          "Hope / positive anticipation",
          "Calm / contentment",
          "Fear / anxiety",
          "Anger / frustration",
          "Sadness / disappointment",
          "Shame / guilt",
          "Neutral / little emotion",
          "Other"
        ],
        "de": [
          "Liebe / Zuneigung",
          "Freude / Begeisterung",
          "Hoffnung / positive Erwartung",
          "Ruhe / Zufriedenheit",
          "Angst / Sorge",
          "Ärger / Frustration",
          "Traurigkeit / Enttäuschung",
          "Scham / Schuldgefühl",
          "Neutral / kaum Emotion",
          "Sonstiges"
        ],
        "ru": [
          "Любовь / привязанность",
          "Радость / воодушевление",
          "Надежда / позитивное ожидание",
          "Спокойствие / удовлетворённость",
          "Страх / тревога",
          "Гнев / фрустрация",
          "Грусть / разочарование",
          "Стыд / вина",
          "Нейтрально / почти без эмоций",
          "Другое"
        ],
        "fr": [
          "Amour / affection",
          "Joie / enthousiasme",
          "Espoir / attente positive",
          "Calme / satisfaction",
          "Peur / anxiété",
          "Colère / frustration",
          "Tristesse / déception",
          "Honte / culpabilité",
          "Neutre / peu d’émotion",
          "Autre"
        ],
        "es": [
          "Amor / afecto",
          "Alegría / entusiasmo",
          "Esperanza / expectativa positiva",
          "Calma / satisfacción",
          "Miedo / ansiedad",
          "Enfado / frustración",
          "Tristeza / decepción",
          "Vergüenza / culpa",
          "Neutral / poca emoción",
          "Otro"
        ],
        "it": [
          "Amore / affetto",
          "Gioia / entusiasmo",
          "Speranza / aspettativa positiva",
          "Calma / soddisfazione",
          "Paura / ansia",
          "Rabbia / frustrazione",
          "Tristezza / delusione",
          "Vergogna / colpa",
          "Neutro / poca emozione",
          "Altro"
        ],
        "pt": [
          "Amor / afeto",
          "Alegria / entusiasmo",
          "Esperança / expectativa positiva",
          "Calma / satisfação",
          "Medo / ansiedade",
          "Raiva / frustração",
          "Tristeza / desilusão",
          "Vergonha / culpa",
          "Neutro / pouca emoção",
          "Outro"
        ],
        "nl": [
          "Liefde / genegenheid",
          "Blijdschap / enthousiasme",
          "Hoop / positieve verwachting",
          "Rust / tevredenheid",
          "Angst / bezorgdheid",
          "Boosheid / frustratie",
          "Verdriet / teleurstelling",
          "Schaamte / schuldgevoel",
          "Neutraal / weinig emotie",
          "Anders"
        ],
        "pl": [
          "Miłość / przywiązanie",
          "Radość / entuzjazm",
          "Nadzieja / pozytywne oczekiwanie",
          "Spokój / zadowolenie",
          "Strach / niepokój",
          "Złość / frustracja",
          "Smutek / rozczarowanie",
          "Wstyd / poczucie winy",
          "Neutralnie / niewiele emocji",
          "Inne"
        ],
        "uk": [
          "Любов / прихильність",
          "Радість / натхнення",
          "Надія / позитивне очікування",
          "Спокій / задоволення",
          "Страх / тривога",
          "Гнів / роздратування",
          "Сум / розчарування",
          "Сором / провина",
          "Нейтрально / мало емоцій",
          "Інше"
        ],
        "cs": [
          "Láska / náklonnost",
          "Radost / nadšení",
          "Naděje / pozitivní očekávání",
          "Klid / spokojenost",
          "Strach / úzkost",
          "Hněv / frustrace",
          "Smutek / zklamání",
          "Stud / vina",
          "Neutrální / málo emocí",
          "Jiné"
        ],
        "sk": [
          "Láska / náklonnosť",
          "Radosť / nadšenie",
          "Nádej / pozitívne očakávanie",
          "Pokoj / spokojnosť",
          "Strach / úzkosť",
          "Hnev / frustrácia",
          "Smútok / sklamanie",
          "Hanba / vina",
          "Neutrálne / málo emócií",
          "Iné"
        ],
        "hu": [
          "Szeretet / vonzalom",
          "Öröm / lelkesedés",
          "Remény / pozitív várakozás",
          "Nyugalom / elégedettség",
          "Félelem / szorongás",
          "Düh / frusztráció",
          "Szomorúság / csalódás",
          "Szégyen / bűntudat",
          "Semleges / kevés érzelem",
          "Egyéb"
        ],
        "ro": [
          "Iubire / afecțiune",
          "Bucurie / entuziasm",
          "Speranță / așteptare pozitivă",
          "Calm / mulțumire",
          "Frică / anxietate",
          "Furie / frustrare",
          "Tristețe / dezamăgire",
          "Rușine / vinovăție",
          "Neutru / puține emoții",
          "Altul"
        ],
        "bg": [
          "Любов / привързаност",
          "Радост / въодушевление",
          "Надежда / положително очакване",
          "Спокойствие / удовлетворение",
          "Страх / тревожност",
          "Гняв / раздразнение",
          "Тъга / разочарование",
          "Срам / вина",
          "Неутрално / малко емоции",
          "Друго"
        ],
        "el": [
          "Αγάπη / στοργή",
          "Χαρά / ενθουσιασμός",
          "Ελπίδα / θετική προσδοκία",
          "Ηρεμία / ικανοποίηση",
          "Φόβος / άγχος",
          "Θυμός / απογοήτευση",
          "Θλίψη / απογοήτευση",
          "Ντροπή / ενοχή",
          "Ουδέτερο / λίγο συναίσθημα",
          "Άλλο"
        ],
        "tr": [
          "Sevgi / yakınlık",
          "Sevinç / heyecan",
          "Umut / olumlu beklenti",
          "Sakinlik / memnuniyet",
          "Korku / kaygı",
          "Öfke / hayal kırıklığı",
          "Üzüntü / hayal kırıklığı",
          "Utanç / suçluluk",
          "Nötr / az duygu",
          "Diğer"
        ],
        "sv": [
          "Kärlek / tillgivenhet",
          "Glädje / entusiasm",
          "Hopp / positiv förväntan",
          "Lugn / tillfredsställelse",
          "Rädsla / oro",
          "Ilska / frustration",
          "Sorg / besvikelse",
          "Skam / skuld",
          "Neutral / lite känslor",
          "Annat"
        ],
        "no": [
          "Kjærlighet / hengivenhet",
          "Glede / begeistring",
          "Håp / positiv forventning",
          "Ro / tilfredshet",
          "Frykt / angst",
          "Sinne / frustrasjon",
          "Sorg / skuffelse",
          "Skam / skyld",
          "Nøytral / lite følelser",
          "Annet"
        ],
        "da": [
          "Kærlighed / hengivenhed",
          "Glæde / begejstring",
          "Håb / positiv forventning",
          "Ro / tilfredshed",
          "Frygt / angst",
          "Vrede / frustration",
          "Sorg / skuffelse",
          "Skam / skyld",
          "Neutral / få følelser",
          "Andet"
        ],
        "fi": [
          "Rakkaus / kiintymys",
          "Ilo / innostus",
          "Toivo / myönteinen odotus",
          "Rauha / tyytyväisyys",
          "Pelko / ahdistus",
          "Viha / turhautuminen",
          "Suru / pettymys",
          "Häpeä / syyllisyys",
          "Neutraali / vähän tunteita",
          "Muu"
        ],
        "ar": [
          "حب / مودة",
          "فرح / حماس",
          "أمل / توقع إيجابي",
          "هدوء / رضا",
          "خوف / قلق",
          "غضب / إحباط",
          "حزن / خيبة أمل",
          "خجل / شعور بالذنب",
          "حياد / مشاعر قليلة",
          "أخرى"
        ],
        "he": [
          "אהבה / חיבה",
          "שמחה / התלהבות",
          "תקווה / ציפייה חיובית",
          "רוגע / שביעות רצון",
          "פחד / חרדה",
          "כעס / תסכול",
          "עצב / אכזבה",
          "בושה / אשמה",
          "ניטרלי / מעט רגש",
          "אחר"
        ],
        "hi": [
          "प्रेम / लगाव",
          "खुशी / उत्साह",
          "आशा / सकारात्मक अपेक्षा",
          "शांति / संतोष",
          "डर / चिंता",
          "क्रोध / हताशा",
          "उदासी / निराशा",
          "शर्म / अपराधबोध",
          "तटस्थ / कम भावना",
          "अन्य"
        ],
        "zh": [
          "爱／亲近",
          "喜悦／兴奋",
          "希望／积极期待",
          "平静／满足",
          "恐惧／焦虑",
          "愤怒／挫败",
          "悲伤／失望",
          "羞耻／内疚",
          "中性／情绪很少",
          "其他"
        ],
        "ja": [
          "愛情／親しみ",
          "喜び／高揚",
          "希望／前向きな期待",
          "落ち着き／満足",
          "恐怖／不安",
          "怒り／もどかしさ",
          "悲しみ／失望",
          "恥／罪悪感",
          "中立／感情が少ない",
          "その他"
        ],
        "ko": [
          "사랑 / 애정",
          "기쁨 / 설렘",
          "희망 / 긍정적 기대",
          "평온 / 만족",
          "두려움 / 불안",
          "분노 / 좌절",
          "슬픔 / 실망",
          "수치심 / 죄책감",
          "중립 / 감정이 적음",
          "기타"
        ],
        "id": [
          "Cinta / kasih sayang",
          "Gembira / antusias",
          "Harapan / penantian positif",
          "Tenang / puas",
          "Takut / cemas",
          "Marah / frustrasi",
          "Sedih / kecewa",
          "Malu / rasa bersalah",
          "Netral / sedikit emosi",
          "Lainnya"
        ],
        "ms": [
          "Cinta / kasih sayang",
          "Gembira / teruja",
          "Harapan / jangkaan positif",
          "Tenang / puas hati",
          "Takut / bimbang",
          "Marah / kecewa",
          "Sedih / hampa",
          "Malu / rasa bersalah",
          "Neutral / sedikit emosi",
          "Lain-lain"
        ],
        "th": [
          "ความรัก / ความผูกพัน",
          "ความสุข / ความตื่นเต้น",
          "ความหวัง / การคาดหวังเชิงบวก",
          "ความสงบ / ความพอใจ",
          "ความกลัว / ความวิตก",
          "ความโกรธ / ความคับข้องใจ",
          "ความเศร้า / ความผิดหวัง",
          "ความอับอาย / ความรู้สึกผิด",
          "เฉย ๆ / อารมณ์น้อย",
          "อื่น ๆ"
        ],
        "vi": [
          "Yêu thương / gắn bó",
          "Vui vẻ / hào hứng",
          "Hy vọng / mong đợi tích cực",
          "Bình tĩnh / hài lòng",
          "Sợ hãi / lo âu",
          "Giận dữ / bức bối",
          "Buồn bã / thất vọng",
          "Xấu hổ / tội lỗi",
          "Trung tính / ít cảm xúc",
          "Khác"
        ]
      };
      for (const labels of Object.values(EMOTION_LABELS)) Object.freeze(labels);
      Object.freeze(EMOTION_LABELS);
      var emotionLookup = /* @__PURE__ */ new Map();
      for (const labels of Object.values(EMOTION_LABELS)) {
        labels.forEach((label, category) => {
          const key = normalizeText(label);
          if (!emotionLookup.has(key)) emotionLookup.set(key, /* @__PURE__ */ new Set());
          emotionLookup.get(key).add(category);
        });
      }
      function normalizeText(value) {
        return typeof value === "string" ? value.normalize("NFC").replace(/\r\n?/g, "\n").trim() : null;
      }
      function mapEmotion(value) {
        const label = normalizeText(value);
        const categories = emotionLookup.get(label);
        return {
          rawLabel: typeof value === "string" ? value : null,
          normalizedLabel: label,
          category: categories?.size === 1 ? [...categories][0] : null,
          status: categories?.size === 1 ? "known" : categories ? "ambiguous" : "unmapped",
          transformation: "NFC_line_endings_outer_trim_then_frozen_dictionary_v16"
        };
      }
      var record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
      var owns = (value, key) => record(value) && Object.hasOwn(value, key);
      var unique = (values) => [...new Set(values)];
      var rating = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 10;
      var hours = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 168;
      var nonblank = (value) => typeof value === "string" && normalizeText(value) !== "";
      var sameSignature = (a, b) => a !== null && b !== null && a.every((v, i) => v === b[i]);
      function copy(value, seen = /* @__PURE__ */ new Set()) {
        if (value === void 0) return null;
        if (value === null || typeof value !== "object") return value;
        if (seen.has(value)) return { unsupportedValue: "non_json_reference" };
        seen.add(value);
        const result = Array.isArray(value) ? value.map((v) => copy(v, seen)) : Object.fromEntries(Object.keys(value).map((k) => [k, copy(value[k], seen)]));
        seen.delete(value);
        return result;
      }
      function parseTimestamp(value) {
        if (typeof value !== "string") return { valid: false, milliseconds: null, reason: "invalid_timestamp_type" };
        const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
        if (!match) return { valid: false, milliseconds: null, reason: "ambiguous_or_unsupported_timestamp" };
        const [, yearText, monthText, dayText, hourText, minuteText, secondText, , zone] = match;
        const year = parseInt(yearText, 10), month = parseInt(monthText, 10), day = parseInt(dayText, 10);
        const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const offsetValid = zone === "Z" || zone !== "-00:00" && parseInt(zone.slice(1, 3), 10) <= 23 && parseInt(zone.slice(4, 6), 10) <= 59;
        if (month < 1 || month > 12 || day < 1 || day > days[month - 1] || parseInt(hourText, 10) > 23 || parseInt(minuteText, 10) > 59 || secondText !== void 0 && parseInt(secondText, 10) > 59 || !offsetValid) {
          return { valid: false, milliseconds: null, reason: "invalid_calendar_timestamp" };
        }
        const milliseconds = Date.parse(value);
        return Number.isFinite(milliseconds) ? { valid: true, milliseconds, reason: null } : { valid: false, milliseconds: null, reason: "invalid_calendar_timestamp" };
      }
      function field(raw, path, kind, required = false) {
        const parts = path.split(".");
        let parent = raw;
        for (const key of parts.slice(0, -1)) parent = record(parent) ? parent[key] : void 0;
        const exists = owns(parent, parts.at(-1));
        const value = exists ? parent[parts.at(-1)] : void 0;
        let reason = null;
        if (!exists) reason = "missing_field";
        else if (kind === "text") reason = typeof value !== "string" ? "invalid_type" : required && !nonblank(value) ? "blank_required_text" : null;
        else if (kind === "rating" || kind === "hours") reason = typeof value !== "number" ? "invalid_type" : !Number.isFinite(value) ? "non_finite_number" : !(kind === "rating" ? rating(value) : hours(value)) ? "out_of_range" : null;
        else if (Array.isArray(kind)) reason = !kind.includes(value) ? "invalid_enum" : null;
        else if (kind === "evidence") reason = !Array.isArray(value) ? "invalid_type" : !value.every((v) => BASES.includes(v)) ? "invalid_enum" : null;
        return { path, exists, rawValue: value, valid: reason === null, reason };
      }
      function revisionMetadata(raw, decision) {
        const patch = raw?.revision;
        const keys = record(patch) ? Object.keys(patch) : [];
        const validPatch = record(patch) && keys.every((k) => DIMENSIONS.includes(k) && nonblank(patch[k]));
        const empty = validPatch && keys.length === 0;
        const explicit = decision === "yes" && validPatch && keys.length > 0;
        const conflict = ["no", "unsure"].includes(decision) ? !validPatch || !empty : decision === "yes" && !explicit;
        return {
          validPatch,
          empty,
          explicit,
          conflict,
          validPair: explicit || ["no", "unsure"].includes(decision) && empty,
          selectedDimensions: DIMENSIONS.filter((k) => keys.includes(k)),
          rawKeys: keys
        };
      }
      function basisStatus(value) {
        if (!Array.isArray(value) || !value.every((v) => BASES.includes(v))) return "invalid";
        const set = new Set(value);
        if (set.has("insufficient")) return "insufficient";
        if (set.size === 0) return "not_recorded";
        if (["direct", "documented", "otherPerson", "subjective"].some((v) => set.has(v))) return "reported";
        return "unspecified";
      }
      function adaptCycle(raw, index) {
        const source = record(raw) ? raw : {};
        const fields = {};
        for (const dimension of DIMENSIONS) fields[`cie.${dimension}`] = field(source, `cie.${dimension}`, "text", true);
        for (const key of RATINGS) fields[`iep.${key}`] = field(source, `iep.${key}`, "rating");
        fields["iep.hours"] = field(source, "iep.hours", "hours");
        fields["iep.emotion"] = field(source, "iep.emotion", "text");
        fields["iep.actions"] = field(source, "iep.actions", "text");
        fields["iep.frequency"] = field(source, "iep.frequency", FREQUENCIES);
        fields["oop.achievement"] = field(source, "oop.achievement", "rating");
        fields["oop.direction"] = field(source, "oop.direction", DIRECTIONS);
        fields["oop.evidence"] = field(source, "oop.evidence", "evidence");
        for (const key of ["currentState", "events", "external"]) fields[`oop.${key}`] = field(source, `oop.${key}`, "text");
        fields.intentional = field(source, "intentional", ["yes", "no", "unsure"]);
        const cieValid = DIMENSIONS.every((k) => fields[`cie.${k}`].valid);
        const timestamp = parseTimestamp(source.createdAt);
        const revision = revisionMetadata(source, source.intentional);
        const emotion = mapEmotion(source.iep?.emotion);
        const validIdentity = typeof source.id === "string" && source.id.trim() !== "";
        const defaultLike = RATINGS.every((k) => fields[`iep.${k}`].valid && source.iep[k] === 5) && emotion.status === "known" && emotion.category === 2 && source.iep?.frequency === "freq2" && fields["iep.actions"].valid && !nonblank(source.iep.actions) && source.iep.hours === 0 && source.oop?.achievement === 0 && source.oop?.direction === "none" && fields["oop.evidence"].valid && source.oop.evidence.length === 0 && ["currentState", "events", "external"].every((k) => fields[`oop.${k}`].valid && !nonblank(source.oop[k]));
        return {
          raw: source,
          index,
          fields,
          cieValid,
          signature: cieValid ? DIMENSIONS.map((k) => normalizeText(source.cie[k])) : null,
          timestamp,
          revision,
          emotion,
          validIdentity,
          defaultLike,
          structural: record(raw) && record(source.cie) && record(source.iep) && record(source.oop) && record(source.revision),
          identityReasons: [],
          basisStatus: basisStatus(source.oop?.evidence)
        };
      }
      function ref(row, path, transformation, derivedValue) {
        const f = row.fields[path];
        let value;
        if (f) value = f.rawValue;
        else {
          value = row.raw;
          for (const key of path.split(".")) value = record(value) ? value[key] : void 0;
        }
        const result = {
          cycleId: row.validIdentity ? row.raw.id : null,
          arrayIndex: row.index,
          createdAt: typeof row.raw.createdAt === "string" ? row.raw.createdAt : null,
          path: `intent.cycles[${row.index}].${path}`,
          rawValue: copy(value),
          present: f ? f.exists : value !== void 0
        };
        if (transformation) {
          result.transformation = transformation;
          result.derivedValue = copy(derivedValue);
        }
        return result;
      }
      function rowEvidence(rows, paths, comparability = false) {
        const allPaths = unique([...paths, "id", "createdAt", ...comparability ? [...DIMENSIONS.map((k) => `cie.${k}`), "intentional", "revision"] : []]);
        return rows.flatMap((row) => allPaths.map((path) => path.startsWith("cie.") && row.fields[path]?.valid ? ref(row, path, "NFC_line_endings_outer_trim", normalizeText(row.fields[path].rawValue)) : path === "iep.emotion" ? ref(row, path, row.emotion.transformation, { category: row.emotion.category, status: row.emotion.status }) : path === "createdAt" ? ref(row, path, "strict_ISO_calendar_to_epoch_milliseconds", row.timestamp.milliseconds) : path === "oop.evidence" && row.fields[path]?.valid ? ref(
          row,
          path,
          "derived_set_then_basisStatus_v1",
          { selectedSet: unique(row.raw.oop.evidence), basisStatus: row.basisStatus }
        ) : ref(row, path)));
      }
      function condition(name, observed, required, passed, inputPaths = [], formula = null) {
        return { name, observed: copy(observed), required: copy(required), passed, inputPaths, formula };
      }
      function valueAt(row, path) {
        return row.fields[path]?.rawValue;
      }
      var COMMON_LIMITS = Object.freeze(["self_reported", "historical_RIS_unavailable", "rating_confirmation_unrecorded"]);
      var LEVEL_ORDER = Object.freeze({ EARLY_OBSERVATION: 0, COMPARISON: 1, REPEATED_PATTERN: 2, CONSISTENT_PATTERN: 3 });
      var RULE_ORDER = Object.freeze([
        "REL-01",
        "REL-02",
        "REL-03",
        "CTX-01",
        "OUT-01",
        "OUT-02",
        "PRA-01",
        "PRA-02",
        "MEN-01",
        "MEN-02",
        "EMO-02",
        "EMO-01",
        "INT-01",
        "CMP-01:practical",
        "CMP-01:achievement",
        "CMP-01:mental",
        "CMP-01:hours",
        "CMP-01:desire",
        "CMP-01:belief",
        "CMP-01:emotionIntensity",
        "CMP-02:frequency",
        "INT-02",
        "TXT-01",
        "REF-01",
        "REV-02"
      ]);
      function makeCandidate(ruleId, domain, concept, group, rows, paths, conditions, data = {}, options = {}) {
        const key = options.metric ? `${ruleId}:${options.metric}` : ruleId;
        const reasons = unique(conditions.filter((c) => !c.passed).map((c) => c.name));
        const evidenceLevel = options.level || "EARLY_OBSERVATION";
        const usedRows = options.usedRows || rows;
        const prerequisitePaths = unique([...paths, ...conditions.some((c) => c.name === "POSSIBLE_UNREVIEWED_DEFAULTS") ? DEFAULT_PROFILE_PATHS : []]);
        return {
          ruleId,
          candidateId: options.dimension ? `${key}:${options.dimension}` : key,
          domain,
          concept,
          status: options.status || "READY",
          titleKey: `analysis.${ruleId}.title`,
          evidence: rowEvidence(rows, prerequisitePaths, options.comparability || false),
          ruleEvaluation: {
            usedCycleIds: usedRows.map((r) => r.validIdentity ? r.raw.id : null),
            usedArrayIndices: usedRows.map((r) => r.index),
            validatedIntermediateCycleIds: rows.map((r) => r.validIdentity ? r.raw.id : null),
            excludedCycles: copy(options.exclusions || []),
            conditions,
            failedConditions: reasons,
            metric: options.metric || null
          },
          interpretation: { key: `analysis.${ruleId}.${options.variant || "recordedObservation"}`, data: copy(data) },
          nextFocus: {
            kind: options.focusKind || "observe",
            variablePaths: paths.map((p) => `C.${p}`),
            promptKey: options.focus || `analysis.${ruleId}.observe`,
            optional: true,
            releaseStatus: "NOT_RELEASED_TO_USER"
          },
          whyThisFocus: { key: `analysis.${ruleId}.selectionBasis`, data: { conditionNames: conditions.map((c) => c.name) } },
          evidenceLevel,
          limitations: unique([...COMMON_LIMITS, ...options.limitations || []]),
          missingData: unique(["historical_RIS_versions", "rating_confirmation_flags", ...options.missingData || []]),
          causality: "not_determined",
          safetyDisposition: "requires_separate_presentation_gate",
          eligible: reasons.length === 0,
          exclusionReasons: reasons,
          secondaryOnly: options.secondaryOnly || false,
          priority: {
            group,
            evidenceLevel,
            supportingObservations: usedRows.length,
            comparisonClass: options.notable ? "notable_recorded_change" : "neutral",
            fixedRuleOrder: RULE_ORDER.includes(key) ? RULE_ORDER.indexOf(key) : RULE_ORDER.includes(ruleId) ? RULE_ORDER.indexOf(ruleId) : RULE_ORDER.length,
            ruleId,
            dimensionIndex: options.dimension ? DIMENSIONS.indexOf(options.dimension) : -1
          },
          observedFeatures: options.features || []
        };
      }
      function comparePriority(a, b) {
        const ap = a.priority, bp = b.priority;
        return ap.group - bp.group || LEVEL_ORDER[bp.evidenceLevel] - LEVEL_ORDER[ap.evidenceLevel] || bp.supportingObservations - ap.supportingObservations || Number(bp.comparisonClass === "notable_recorded_change") - Number(ap.comparisonClass === "notable_recorded_change") || ap.fixedRuleOrder - bp.fixedRuleOrder || (ap.ruleId < bp.ruleId ? -1 : ap.ruleId > bp.ruleId ? 1 : 0) || ap.dimensionIndex - bp.dimensionIndex;
      }
      function analyze(snapshot, options = {}) {
        const safetyDecision = ["ALLOW", "HOLD", "UNKNOWN"].includes(options?.safetyDecision) ? options.safetyDecision : "UNKNOWN";
        const result = {
          specVersion: "analysis-phase1-proposal-1",
          engineVersion: ENGINE_VERSION,
          adapterVersion: "raw-0.1.0-conservative-v1",
          dictionaryVersion: "production-v16-31-locales",
          heuristicStatus: "PRODUCT_HEURISTICS_FOR_BETA",
          status: "INSUFFICIENT",
          inputReference: {
            sourceCommit: SOURCE_COMMIT,
            sourceVersion: record(snapshot) ? copy(snapshot.version) : null,
            intentId: typeof snapshot?.intent?.id === "string" ? snapshot.intent.id : null,
            referenceProvenance: "current_mutable_RIS_only"
          },
          primary: null,
          secondary: null,
          suppressedCandidates: [],
          selectionExplanation: null,
          limitations: [...COMMON_LIMITS],
          missingData: [],
          validation: { issues: [], globalTraceabilityDefect: false },
          segmentation: { currentSegment: [], boundaries: [], recordedBasisSame: false },
          timeWindow: { N_completed: 0, N_spaced: 0, usedCycleIds: [], excludedCycles: [] },
          comparisons: [],
          ruleEvaluations: [],
          capabilities: {},
          safety: { externalDecision: safetyDecision, releaseStatus: "NOT_RELEASED_TO_USER", classifierImplemented: false },
          causality: "not_determined"
        };
        if (!record(snapshot) || snapshot.version !== SOURCE_VERSION) {
          result.status = "UNSUPPORTED_SOURCE";
          result.validation.issues.push({ path: "version", reason: "unsupported_source_version" });
          result.selectionExplanation = { key: "analysis.unsupportedSource", data: {} };
          return result;
        }
        if (snapshot.intent === null) {
          result.status = safetyDecision === "HOLD" ? "SAFETY_HOLD" : "EMPTY";
          result.selectionExplanation = { key: "analysis.noCompletedObservations", data: {} };
          return result;
        }
        if (!record(snapshot.intent) || !Array.isArray(snapshot.intent.cycles)) {
          result.validation.issues.push({ path: "intent", reason: "malformed_intent_or_cycles" });
          result.selectionExplanation = { key: "analysis.insufficientSource", data: {} };
          return result;
        }
        const intent = snapshot.intent;
        const rows = intent.cycles.map(adaptCycle);
        const issues = result.validation.issues;
        const addIssue = (path, reason, domain = "traceability") => issues.push({ path, reason, domain });
        const intentTime = parseTimestamp(intent.createdAt);
        if (typeof intent.id !== "string" || intent.id.trim() === "") addIssue("intent.id", "invalid_intent_id");
        if (!intentTime.valid) addIssue("intent.createdAt", intentTime.reason);
        const risValid = DIMENSIONS.every((k) => nonblank(intent.ris?.[k]));
        for (const k of DIMENSIONS) if (!nonblank(intent.ris?.[k])) addIssue(
          `intent.ris.${k}`,
          typeof intent.ris?.[k] === "string" ? "blank_required_text" : "missing_or_invalid_reference",
          "reference"
        );
        const counts = /* @__PURE__ */ new Map();
        for (const row of rows) if (row.validIdentity) counts.set(row.raw.id, (counts.get(row.raw.id) || 0) + 1);
        let priorTime = intentTime.valid ? intentTime.milliseconds : null;
        let segmentStart = 0;
        for (const row of rows) {
          const prefix = `intent.cycles[${row.index}]`;
          if (!row.validIdentity) row.identityReasons.push("invalid_cycle_id");
          if (row.validIdentity && counts.get(row.raw.id) > 1) row.identityReasons.push("duplicate_cycle_id");
          if (!row.timestamp.valid) row.identityReasons.push(row.timestamp.reason);
          if (row.timestamp.valid && priorTime !== null && (row.timestamp.milliseconds < priorTime || row.index > 0 && row.timestamp.milliseconds === priorTime)) row.identityReasons.push("invalid_chronology");
          if (row.timestamp.valid) priorTime = row.timestamp.milliseconds;
          for (const reason of row.identityReasons) addIssue(prefix, reason);
          for (const f of Object.values(row.fields)) if (!f.valid) addIssue(`${prefix}.${f.path}`, f.reason, f.path.split(".")[0]);
          if (!row.structural) addIssue(prefix, "malformed_record", "structure");
          if (!row.revision.validPair) addIssue(`${prefix}.revision`, "invalid_revision_metadata", "revision");
          if (row.emotion.status !== "known") addIssue(`${prefix}.iep.emotion`, `${row.emotion.status}_emotion_label`, "emotion");
          const reasons = [];
          if (row.identityReasons.length) reasons.push("invalid_ordering_or_identity");
          if (!row.cieValid) reasons.push("missing_required_CIE");
          if (!row.revision.validPair || !row.fields.intentional.valid) reasons.push("invalid_revision_metadata");
          if (row.raw.intentional === "yes") reasons.push("explicit_revision_boundary");
          if (row.raw.intentional === "unsure") reasons.push("unsure_boundary");
          if (reasons.length) {
            segmentStart = row.index + 1;
            result.segmentation.boundaries.push({
              cycleId: row.validIdentity ? row.raw.id : null,
              arrayIndex: row.index,
              reasons: unique(reasons),
              includesBoundaryCycle: false
            });
          } else if (row.index > 0 && rows[row.index - 1].signature && !sameSignature(row.signature, rows[row.index - 1].signature)) {
            segmentStart = row.index;
            result.segmentation.boundaries.push({
              cycleId: row.raw.id,
              arrayIndex: row.index,
              reasons: ["changed_CIE_signature"],
              includesBoundaryCycle: true
            });
          }
        }
        result.validation.globalTraceabilityDefect = issues.some((i) => i.domain === "traceability");
        result.timeWindow.N_completed = rows.filter((r) => r.identityReasons.length === 0 && r.structural && r.cieValid && r.fields.intentional.valid && r.revision.validPair).length;
        result.validation.fullyValidCycleCount = rows.filter((r) => r.identityReasons.length === 0 && r.structural && Object.values(r.fields).every((f) => f.valid) && r.revision.validPair).length;
        const segment = rows.slice(segmentStart);
        result.segmentation.currentSegment = segment.map((r) => ({ cycleId: r.raw.id, arrayIndex: r.index }));
        result.segmentation.recordedBasisSame = segment.length > 0 && segment.every((r) => sameSignature(r.signature, segment[0].signature) && r.raw.intentional === "no" && r.revision.empty);
        const reverseWindow = [];
        const exclusions = result.timeWindow.excludedCycles;
        for (let i = segment.length - 1; i >= 0 && reverseWindow.length < HEURISTICS.maximumObservations; i--) {
          const row = segment[i];
          if (!row.timestamp.valid) break;
          const gap = reverseWindow.length ? reverseWindow.at(-1).timestamp.milliseconds - row.timestamp.milliseconds : null;
          if (gap !== null && gap < HEURISTICS.minimumSpacing) {
            exclusions.push({ cycleId: row.raw.id, arrayIndex: row.index, reason: "overlapping_7_day_reporting_window", gapMilliseconds: gap });
            continue;
          }
          if (gap !== null && gap > HEURISTICS.maximumGap) {
            exclusions.push({ cycleId: row.raw.id, arrayIndex: row.index, reason: "long_observation_gap", gapMilliseconds: gap });
            break;
          }
          reverseWindow.push(row);
        }
        const window = reverseWindow.reverse();
        result.timeWindow.N_spaced = window.length;
        result.timeWindow.usedCycleIds = window.map((r) => r.raw.id);
        result.timeWindow.usedArrayIndices = window.map((r) => r.index);
        result.timeWindow.minimumSpacingMilliseconds = HEURISTICS.minimumSpacing;
        result.timeWindow.maximumGapMilliseconds = HEURISTICS.maximumGap;
        result.timeWindow.formulas = {
          N_completed: "count(traceable saved records with required containers, CIE, valid decision/patch); field measurements validated separately",
          N_spaced: "latest-to-earliest greedy selection; gap>=604800000ms, stop if next spaced gap>2419200000ms; maximum5",
          inputPaths: [
            "intent.createdAt",
            "intent.cycles[*].id",
            "intent.cycles[*].createdAt",
            "intent.cycles[*].cie",
            "intent.cycles[*].intentional",
            "intent.cycles[*].revision"
          ]
        };
        const scope = window.length ? rows.slice(window[0].index, window.at(-1).index + 1) : [];
        const patternLevel = window.length === 5 ? "CONSISTENT_PATTERN" : "REPEATED_PATTERN";
        const patternExclusions = [...exclusions, ...window.length === 4 ? [{
          cycleId: window[0].raw.id,
          arrayIndex: window[0].index,
          reason: "four_observation_trend_uses_latest_three_only",
          guardScopeRetained: true
        }] : []];
        const candidates = [];
        const latest = rows.at(-1);
        const active = [latest].filter(Boolean);
        const valids = (paths, selectedRows = scope) => selectedRows.length > 0 && selectedRows.every((r) => paths.every((p) => r.fields[p]?.valid));
        const goodBasis = (selectedRows) => selectedRows.length > 0 && selectedRows.every((r) => r.fields["oop.achievement"].valid && r.fields["oop.direction"].valid && ["toward", "none", "away"].includes(r.raw.oop.direction) && r.basisStatus === "reported");
        const patternGate = (paths) => [
          condition("minimum_spaced_observations", window.length, ">=3", window.length >= 3),
          condition("traceability", issues.filter((i) => i.domain === "traceability"), "valid identities and chronology", !result.validation.globalTraceabilityDefect),
          condition(
            "recordedBasisSame",
            result.segmentation.recordedBasisSame,
            true,
            result.segmentation.recordedBasisSame,
            scope.flatMap((r) => [
              ...DIMENSIONS.map((k) => `intent.cycles[${r.index}].cie.${k}`),
              `intent.cycles[${r.index}].intentional`,
              `intent.cycles[${r.index}].revision`
            ]),
            "all six normalized CIE values equal throughout scope; all no; all patches empty"
          ),
          condition(
            "required_inputs_all_intermediate_cycles",
            scope.map((r) => ({
              arrayIndex: r.index,
              invalidPaths: paths.filter((p) => !r.fields[p]?.valid)
            })),
            "all valid",
            valids(paths),
            scope.flatMap((r) => paths.map((p) => `intent.cycles[${r.index}].${p}`))
          ),
          condition(
            "POSSIBLE_UNREVIEWED_DEFAULTS",
            scope.filter((r) => r.defaultLike).map((r) => r.raw.id),
            "none",
            !scope.some((r) => r.defaultLike),
            scope.flatMap((r) => DEFAULT_PROFILE_PATHS.map((p) => `intent.cycles[${r.index}].${p}`)),
            "exact complete default-like IEP/OOP profile; no inference about whether answers were reviewed"
          )
        ];
        const patternOptions = (extra) => ({ level: patternLevel, usedRows: window, comparability: true, exclusions: patternExclusions, ...extra });
        function series(path) {
          const valid = valids([path]);
          const values = valid ? window.map((r) => valueAt(r, path)) : [];
          const adjacent = values.slice(1).map((v, i) => v - values[i]);
          const largeStep = adjacent.some((d) => Math.abs(d) >= HEURISTICS.largeRatingStep);
          const used = values.length === 4 ? values.slice(-3) : values;
          const deltas = used.slice(1).map((v, i) => v - used[i]);
          const five = used.length === 5;
          const first = five ? (used[0] + used[1]) / 2 : used[0];
          const last = five ? (used[3] + used[4]) / 2 : used.at(-1);
          const down = valid && window.length >= 3 && !largeStep && (five ? first - last >= 2 && deltas.filter((d) => d <= -1).length >= 3 && !deltas.some((d) => d >= 2) : first - last >= 2 && deltas.length === 2 && deltas.every((d) => d <= -1));
          const up = valid && window.length >= 3 && !largeStep && (five ? last - first >= 2 && deltas.filter((d) => d >= 1).length >= 3 && !deltas.some((d) => d <= -2) : last - first >= 2 && deltas.length === 2 && deltas.every((d) => d >= 1));
          const range = values.length ? Math.max(...values) - Math.min(...values) : null;
          return {
            path,
            valid,
            values,
            adjacent,
            trendValues: used,
            trendDeltas: deltas,
            first,
            last,
            down,
            up,
            largeStep,
            range,
            flat: valid && window.length >= 3 && !largeStep && range <= 1,
            low: valid && window.length >= 3 && !largeStep && values.every((v) => v <= 3)
          };
        }
        function metricCondition(s, predicate) {
          return condition(
            `${predicate}(${s.path})`,
            {
              values: s.values,
              trendValues: s.trendValues,
              deltas: s.trendDeltas,
              range: s.range,
              endpointOrMidpointChange: s.valid && s.first !== void 0 ? s.last - s.first : null
            },
            predicate === "down" || predicate === "up" ? window.length === 5 ? "midpoint difference >=2; >=3 steps >=1 in selected direction; no opposite step >=2" : "latest 3: endpoint change >=2; both steps >=1 in selected direction" : predicate === "flat" ? "range<=1" : "each<=3",
            s[predicate],
            window.map((r) => `intent.cycles[${r.index}].${s.path}`),
            predicate === "flat" ? "max(values)-min(values)" : predicate === "low" ? "every(value<=3)" : window.length === 5 ? "(x4+x5)/2-(x1+x2)/2; adjacent deltas" : "x3-x1; adjacent deltas"
          );
        }
        function stepCondition(s) {
          return condition(
            "LARGE_STEP_REQUIRES_REPEAT",
            s.adjacent,
            "all abs(delta)<4",
            !s.largeStep,
            window.map((r) => `intent.cycles[${r.index}].${s.path}`),
            "adjacent selected rating differences"
          );
        }
        const practical = series("iep.practical"), mental = series("iep.mental"), achievement = series("oop.achievement"), intensity = series("iep.emotionIntensity");
        function ratingMeasures(s) {
          const inputPaths = window.map((r) => `intent.cycles[${r.index}].${s.path}`);
          return [
            { name: `${s.path}:range`, value: s.range, inputPaths, formula: "max(selected values)-min(selected values)" },
            { name: `${s.path}:adjacentDeltas`, value: s.adjacent, inputPaths, formula: "x[i+1]-x[i] for all selected observations, including fourth guard observation" },
            {
              name: `${s.path}:trendDeltas`,
              value: s.trendDeltas,
              inputPaths: window.slice(window.length === 4 ? 1 : 0).map((r) => `intent.cycles[${r.index}].${s.path}`),
              formula: "x[i+1]-x[i]; N=4 uses latest3, N=5 uses all5"
            },
            {
              name: `${s.path}:trendChange`,
              value: s.valid && s.first !== void 0 ? s.last - s.first : null,
              inputPaths: window.slice(window.length === 4 ? 1 : 0).map((r) => `intent.cycles[${r.index}].${s.path}`),
              formula: window.length === 5 ? "(x4+x5)/2-(x1+x2)/2" : "x3-x1 on latest3"
            }
          ];
        }
        const hoursValid = valids(["iep.hours"]);
        const hourValues = hoursValid ? window.map((r) => r.raw.iep.hours) : [];
        const hourDeltas = hourValues.slice(1).map((v, i) => v - hourValues[i]);
        const hoursEndpoint = hourValues.length >= 2 ? hourValues.at(-1) - hourValues[0] : null;
        const hoursUp = hoursValid && hourValues.length >= 2 && hourDeltas.every((d) => d >= 0) && hoursEndpoint >= 1;
        const hoursDown = hoursValid && hourValues.length >= 2 && hourDeltas.every((d) => d <= 0) && hoursEndpoint <= -1;
        const hoursRange = hourValues.length ? Math.max(...hourValues) - Math.min(...hourValues) : null;
        const hoursStatus = !hoursValid ? "unavailable" : hoursUp ? "up" : hoursDown ? "down" : hoursRange <= 0.25 ? "flat" : "varied";
        const outcomeEligible = result.segmentation.recordedBasisSame && goodBasis(scope);
        const sameEmotion = scope.length > 0 && scope.every((r) => r.emotion.status === "known" && r.emotion.category === scope[0].emotion.category);
        const knownNonOtherEmotion = sameEmotion && scope[0].emotion.category !== 9;
        const directions = valids(["oop.direction"]) ? window.map((r) => r.raw.oop.direction) : [];
        const mixedTriggers = [];
        if (latest?.revision.conflict) mixedTriggers.push("decision_patch_conflict");
        if (latest?.fields["oop.direction"].valid && latest.raw.oop.direction === "mixed") mixedTriggers.push("direction_mixed");
        const patternBasePass = patternGate([]).every((c) => c.passed);
        if (patternBasePass && outcomeEligible) {
          if (achievement.down && directions.includes("toward") || achievement.up && directions.includes("away")) mixedTriggers.push("achievement_direction_opposed");
          if (achievement.flat && directions.some((d) => ["toward", "away"].includes(d))) mixedTriggers.push("flat_achievement_direction_varied");
        }
        if (patternBasePass && hoursValid && (practical.down && hoursUp || practical.up && hoursDown)) mixedTriggers.push("practical_hours_opposed");
        const mixedCondition = condition("mixed_evidence", mixedTriggers, "no dependent mixed signals", mixedTriggers.length === 0);
        const outcomePaths = ["oop.achievement", "oop.direction", "oop.evidence"];
        const outcomeCondition = condition(
          "outcomeEligible",
          scope.map((r) => ({
            cycleId: r.raw.id,
            basisStatus: r.basisStatus,
            direction: r.raw.oop?.direction
          })),
          "same basis; valid rating; reported basis; toward/none/away",
          outcomeEligible,
          scope.flatMap((r) => outcomePaths.map((p) => `intent.cycles[${r.index}].${p}`)),
          "basisStatus and recordedBasisSame gates"
        );
        const hourGuard = (name, passed) => condition(
          name,
          {
            status: hoursStatus,
            values: hourValues,
            deltas: hourDeltas,
            endpointChange: hoursEndpoint,
            range: hoursRange
          },
          "valid hours and specified nonopposition",
          hoursValid && passed,
          scope.map((r) => `intent.cycles[${r.index}].iep.hours`),
          "monotone adjacent deltas; abs(endpoint)>=1h; flat range<=0.25h"
        );
        if (!latest) {
          result.status = issues.length ? "INSUFFICIENT" : safetyDecision === "HOLD" ? "SAFETY_HOLD" : "EMPTY";
          result.selectionExplanation = { key: "analysis.noCompletedObservations", data: {} };
          return result;
        }
        const latestOutcomeGood = goodBasis(active);
        const defaultLimits = latest.defaultLike ? ["POSSIBLE_UNREVIEWED_DEFAULTS"] : [];
        const qualityOutcomeProblem = latest.basisStatus !== "reported" || !latest.fields["oop.achievement"].valid || !latest.fields["oop.direction"].valid || latest.raw.oop?.direction === "unknown";
        const qualifier = latest.defaultLike || qualityOutcomeProblem || !latest.cieValid || !latest.structural || Object.values(latest.fields).some((f) => !f.valid) || result.validation.globalTraceabilityDefect || !risValid;
        const globalHold = result.validation.globalTraceabilityDefect || latest.defaultLike;
        const latestPaths = [
          ...DIMENSIONS.map((k) => `cie.${k}`),
          ...RATINGS.map((k) => `iep.${k}`),
          "iep.hours",
          "iep.actions",
          "iep.frequency",
          "iep.emotion",
          ...outcomePaths,
          "oop.currentState",
          "oop.events",
          "oop.external",
          "intentional",
          "revision"
        ];
        candidates.push(makeCandidate(
          "QUAL-01",
          "evidence_quality",
          "THEFEIXI",
          1,
          active,
          latestPaths,
          [condition("quality_limitation_present", qualifier, true, qualifier)],
          {
            defaultProfile: latest.defaultLike ? "possible_default_like_recorded_profile" : null,
            basisStatus: latest.basisStatus,
            issues: issues.filter((i) => i.path.startsWith(`intent.cycles[${latest.index}]`) || i.domain === "traceability")
          },
          { status: "INSUFFICIENT", limitations: defaultLimits, focus: "analysis.observeEventAndBasis", focusKind: "clarify" }
        ));
        const reflectionFocus = !latestOutcomeGood || latest.defaultLike ? "analysis.observeEventAndBasis" : latest.revision.explicit ? "analysis.observeRevisedCriteria" : !latest.fields["iep.actions"].valid || !nonblank(latest.raw.iep.actions) ? "analysis.observeActionAndEvent" : !latest.fields["oop.external"].valid || !nonblank(latest.raw.oop.external) ? "analysis.observeExternalCircumstance" : "analysis.observeOwnCriteriaAgain";
        const reflection = makeCandidate(
          "REF-01",
          "reflection",
          "LIPHOZEI",
          7,
          active,
          latestPaths,
          [condition("record_present", true, true, latest.structural)],
          {
            firstCompletedObservation: result.timeWindow.N_completed === 1,
            basisStatus: latest.basisStatus,
            currentReference: copy(intent.ris),
            emotion: copy(latest.emotion),
            assessment: {
              practical: copy(latest.raw.iep?.practical),
              hours: copy(latest.raw.iep?.hours),
              mental: copy(latest.raw.iep?.mental),
              achievement: copy(latest.raw.oop?.achievement),
              direction: copy(latest.raw.oop?.direction)
            }
          },
          { focus: reflectionFocus, limitations: defaultLimits, status: qualifier ? "LIMITED" : "READY" }
        );
        for (const k of DIMENSIONS) reflection.evidence.push({
          path: `intent.ris.${k}`,
          rawValue: copy(intent.ris?.[k]),
          transformation: "NFC_line_endings_outer_trim",
          derivedValue: normalizeText(intent.ris?.[k]),
          reference: "current_mutable_reference"
        });
        candidates.push(reflection);
        candidates.push(makeCandidate(
          "REV-01",
          "intentional_revision",
          "DEINEIZA",
          2,
          active,
          ["intentional", "revision"],
          [condition("latest_explicit_valid_revision", latest.revision, "yes + valid nonempty patch", latest.revision.explicit)],
          { selectedDimensions: latest.revision.selectedDimensions, beforeValues: "unavailable" },
          { focus: "analysis.observeRevisedCriteria", features: ["revision_selection"] }
        ));
        const revisionEvents = rows.filter((r) => r.revision.explicit && r.identityReasons.length === 0 && r.validIdentity);
        const revisionCounts = Object.fromEntries(DIMENSIONS.map((k) => [k, revisionEvents.filter((r) => r.revision.selectedDimensions.includes(k)).length]));
        const maximumRevisionCount = Math.max(...Object.values(revisionCounts));
        candidates.push(makeCandidate(
          "REV-02",
          "revision_history",
          "DEINEIZA",
          7,
          revisionEvents,
          ["intentional", "revision"],
          [
            condition("minimum_revision_events", revisionEvents.length, ">=3", revisionEvents.length >= 3),
            condition("traceability", result.validation.globalTraceabilityDefect, false, !result.validation.globalTraceabilityDefect)
          ],
          {
            eventCount: revisionEvents.length,
            dimensionCounts: revisionCounts,
            mostSelectedDimensions: DIMENSIONS.filter((k) => revisionCounts[k] === maximumRevisionCount)
          },
          { level: "REPEATED_PATTERN", limitations: ["revision_selections_are_not_independent_process_observations"], features: ["revision_summary"] }
        ));
        candidates.at(-1).ruleEvaluation.derivedMeasures = [
          {
            name: "revision_event_count",
            value: revisionEvents.length,
            inputPaths: revisionEvents.flatMap((r) => [`intent.cycles[${r.index}].intentional`, `intent.cycles[${r.index}].revision`]),
            formula: "count(valid explicit yes + nonempty valid patch events; no time-spacing requirement)"
          },
          ...DIMENSIONS.map((dimension) => ({
            name: `revision_selection_count:${dimension}`,
            value: revisionCounts[dimension],
            inputPaths: revisionEvents.map((r) => `intent.cycles[${r.index}].revision`),
            formula: `count(valid explicit events whose patch contains the ${dimension} key)`
          }))
        ];
        const wordingDimensions = DIMENSIONS.filter((k) => nonblank(latest.raw.cie?.[k]) && nonblank(intent.ris?.[k]) && normalizeText(latest.raw.cie[k]) !== normalizeText(intent.ris[k]));
        const prior = rows.at(-2);
        const changedAdjacentDimensions = prior ? DIMENSIONS.filter((k) => nonblank(prior.raw.cie?.[k]) && nonblank(latest.raw.cie?.[k]) && normalizeText(prior.raw.cie[k]) !== normalizeText(latest.raw.cie[k])) : [];
        const textRows = prior && changedAdjacentDimensions.length ? [prior, latest] : active;
        const textCandidate = makeCandidate(
          "TXT-01",
          "reference_wording",
          "DEITHIATHO",
          7,
          textRows,
          DIMENSIONS.map((k) => `cie.${k}`),
          [condition(
            "different_wording",
            [...wordingDimensions, ...changedAdjacentDimensions],
            "at least one literal nonblank mismatch",
            wordingDimensions.length > 0 || changedAdjacentDimensions.length > 0
          )],
          {
            currentReferenceDifferences: wordingDimensions,
            adjacentWordingDifferences: changedAdjacentDimensions,
            semanticMeaning: "not_determined"
          },
          { status: "LIMITED", focus: "analysis.checkWordingOrMeaning", features: ["wording_discrepancy"] }
        );
        for (const k of DIMENSIONS) textCandidate.evidence.push({
          path: `intent.ris.${k}`,
          rawValue: copy(intent.ris?.[k]),
          transformation: "NFC_line_endings_outer_trim",
          derivedValue: normalizeText(intent.ris?.[k]),
          reference: "current_mutable_reference"
        });
        candidates.push(textCandidate);
        const pair = prior ? [prior, latest] : [];
        const pairComparable = pair.length === 2 && pair.every((r) => r.cieValid && r.raw.intentional === "no" && r.revision.empty && r.identityReasons.length === 0) && sameSignature(prior.signature, latest.signature) && !result.validation.globalTraceabilityDefect;
        const pairGap = pair.length === 2 && pair.every((r) => r.timestamp.valid) ? latest.timestamp.milliseconds - prior.timestamp.milliseconds : null;
        const pairLimitations = [
          ...pairGap !== null && pairGap < HEURISTICS.minimumSpacing ? ["overlapping_reporting_windows"] : [],
          ...!pairComparable && pair.length ? ["comparison_basis_changed_or_unavailable"] : []
        ];
        for (const metric of ["practical", "achievement", "mental", "hours", "desire", "belief", "emotionIntensity"]) {
          const path = metric === "achievement" ? "oop.achievement" : `iep.${metric}`;
          const numericValid = pair.length === 2 && valids([path], pair);
          const categoryValid = metric !== "emotionIntensity" || pair.length === 2 && pair.every((r) => r.emotion.status === "known" && r.emotion.category !== 9) && prior.emotion.category === latest.emotion.category;
          const delta = numericValid && categoryValid ? valueAt(latest, path) - valueAt(prior, path) : null;
          const notable = delta !== null && Math.abs(delta) >= (metric === "hours" ? 1 : 2);
          const changeClass = delta === null ? "unavailable" : delta === 0 ? "same_recorded_value" : metric === "hours" ? notable ? "notable_recorded_change" : "ordinary_hours_change" : notable ? "notable_recorded_change" : Math.abs(delta) <= 1 ? "nearby_ratings" : "small_recorded_change";
          result.comparisons.push({
            ruleId: "CMP-01",
            metric,
            before: numericValid ? copy(valueAt(prior, path)) : null,
            after: numericValid ? copy(valueAt(latest, path)) : null,
            delta,
            changeClass,
            comparableBasis: pairComparable,
            limitations: pairLimitations,
            inputPaths: pair.map((r) => `intent.cycles[${r.index}].${path}`),
            formula: "after-before"
          });
          candidates.push(makeCandidate(
            "CMP-01",
            metric === "achievement" ? "observed_outcome" : metric === "emotionIntensity" ? "emotion" : ["practical", "hours"].includes(metric) ? "practical_contribution" : "mental_contribution",
            metric === "achievement" ? "LIPHOZEI" : ["practical", "hours"].includes(metric) ? "VIASIATAE" : "DEINEIZA",
            6,
            pair,
            [path, ...metric === "emotionIntensity" ? ["iep.emotion"] : []],
            [
              condition("two_adjacent_saved_records", pair.length, 2, pair.length === 2),
              condition("valid_numeric_pair", numericValid, true, numericValid),
              condition("same_known_non_Other_emotion", categoryValid, true, categoryValid),
              condition("boundary", pairComparable, "comparable basis for focused comparison; raw values available separately", pairComparable),
              condition("POSSIBLE_UNREVIEWED_DEFAULTS", pair.some((r) => r.defaultLike), false, !pair.some((r) => r.defaultLike))
            ],
            { before: numericValid ? valueAt(prior, path) : null, after: numericValid ? valueAt(latest, path) : null, delta, changeClass },
            { level: "COMPARISON", metric, notable, comparability: true, limitations: pairLimitations, features: [`comparison:${metric}`] }
          ));
          candidates.at(-1).ruleEvaluation.derivedMeasures = [
            { name: "signed_delta", value: delta, inputPaths: pair.map((r) => `intent.cycles[${r.index}].${path}`), formula: "after-before" },
            {
              name: "change_class",
              value: changeClass,
              inputPaths: pair.map((r) => `intent.cycles[${r.index}].${path}`),
              formula: metric === "hours" ? "same if delta=0; ordinary if 0<abs(delta)<1h; notable if abs(delta)>=1h" : "same if delta=0; nearby if 0<abs(delta)<=1; small if 1<abs(delta)<2; notable if abs(delta)>=2"
            }
          ];
        }
        const frequencyValid = pair.length === 2 && valids(["iep.frequency"], pair);
        const frequencyBefore = frequencyValid ? valueAt(prior, "iep.frequency") : null;
        const frequencyAfter = frequencyValid ? valueAt(latest, "iep.frequency") : null;
        const frequencyChange = !frequencyValid ? "unavailable" : frequencyBefore === frequencyAfter ? "same_category" : FREQUENCIES.indexOf(frequencyAfter) > FREQUENCIES.indexOf(frequencyBefore) ? "higher_category" : "lower_category";
        candidates.push(makeCandidate(
          "CMP-02",
          "mental_contribution",
          "DEINEIZA",
          6,
          pair,
          ["iep.frequency"],
          [
            condition("valid_frequency_pair", frequencyValid, true, frequencyValid),
            condition("boundary", pairComparable, true, pairComparable),
            condition("POSSIBLE_UNREVIEWED_DEFAULTS", pair.some((r) => r.defaultLike), false, !pair.some((r) => r.defaultLike))
          ],
          { before: frequencyBefore, after: frequencyAfter, change: frequencyChange },
          {
            level: "COMPARISON",
            metric: "frequency",
            notable: frequencyValid && frequencyBefore !== frequencyAfter,
            comparability: true,
            limitations: pairLimitations,
            features: ["comparison:frequency"]
          }
        ));
        candidates.push(makeCandidate(
          "INT-01",
          "intention_wording",
          "FINAEFIA",
          5,
          scope,
          [],
          patternGate([]),
          { normalizedCIESignature: window[0]?.signature || null, functionalRetention: "unavailable" },
          patternOptions({ features: ["recorded_wording_recurrence"], limitations: ["wording_is_not_functional_retention"] })
        ));
        for (const dimension of DIMENSIONS) {
          const path = `cie.${dimension}`;
          const difference = window.length > 0 && nonblank(intent.ris?.[dimension]) && window.every((r) => normalizeText(r.raw.cie?.[dimension]) === normalizeText(window[0].raw.cie?.[dimension])) && normalizeText(window[0].raw.cie?.[dimension]) !== normalizeText(intent.ris[dimension]);
          const c = makeCandidate(
            "INT-02",
            "reference_wording",
            "DEITHIATHO",
            7,
            scope,
            [path],
            [...patternGate([path]), condition("repeated_wording_differs_from_current_reference", difference, true, difference)],
            { dimension, currentReference: copy(intent.ris?.[dimension]), recordedWording: copy(window[0]?.raw.cie?.[dimension]), semanticDrift: "unavailable" },
            patternOptions({ dimension, status: "LIMITED", focus: "analysis.checkWordingOrMeaning", features: ["wording_discrepancy"] })
          );
          c.evidence.push({
            path: `intent.ris.${dimension}`,
            rawValue: copy(intent.ris?.[dimension]),
            transformation: "NFC_line_endings_outer_trim",
            derivedValue: normalizeText(intent.ris?.[dimension]),
            reference: "current_mutable_reference"
          });
          candidates.push(c);
        }
        function atomic(id, domain, concept, metric, predicate, paths, extraConditions = [], extraOptions = {}) {
          const s = metric;
          const conditions = [
            ...patternGate(paths),
            stepCondition(s),
            ...predicate === "up_or_down" ? [condition(
              `up_or_down(${s.path})`,
              { up: s.up, down: s.down, values: s.values },
              "D3/U3 or D5/U5",
              s.up || s.down,
              window.map((r) => `intent.cycles[${r.index}].${s.path}`),
              "dispatcher: N=4 latest3; N=5 all5"
            )] : predicate === "low_or_down" ? [condition(
              `low_or_down(${s.path})`,
              { low: s.low, down: s.down, values: s.values },
              "low_N or D3/D5",
              s.low || s.down,
              window.map((r) => `intent.cycles[${r.index}].${s.path}`),
              "every<=3 or trend dispatcher"
            )] : [metricCondition(s, predicate)],
            ...extraConditions
          ];
          candidates.push(makeCandidate(
            id,
            domain,
            concept,
            5,
            scope,
            paths,
            conditions,
            {
              values: s.values,
              trendValues: s.trendValues,
              trendDeltas: s.trendDeltas,
              direction: s.down ? "decreased" : s.up ? "increased" : s.low ? "low" : "nearby",
              hours: domain === "practical_contribution" ? { values: hourValues, status: hoursStatus } : null
            },
            patternOptions({ features: [`${s.path}:${predicate}`], ...extraOptions })
          ));
          candidates.at(-1).ruleEvaluation.derivedMeasures = ratingMeasures(s);
        }
        atomic(
          "PRA-01",
          "practical_contribution",
          "VIASIATAE",
          practical,
          "down",
          ["iep.practical"],
          [condition("practical_hours_opposed", mixedTriggers.includes("practical_hours_opposed"), false, !mixedTriggers.includes("practical_hours_opposed"))]
        );
        atomic("PRA-02", "practical_contribution", "VIASIATAE", practical, "low", ["iep.practical"]);
        atomic("MEN-01", "mental_contribution", "DEINEIZA", mental, "low_or_down", ["iep.mental"]);
        const frequencyAllValid = valids(["iep.frequency"]);
        const frequencyValues = frequencyAllValid ? window.map((r) => r.raw.iep.frequency) : [];
        const frequencyTrend = frequencyValues.length === 4 ? frequencyValues.slice(-3) : frequencyValues;
        const frequencySteps = frequencyTrend.slice(1).map((v, i) => FREQUENCIES.indexOf(v) < FREQUENCIES.indexOf(frequencyTrend[i]) ? "lower" : v === frequencyTrend[i] ? "same" : "higher");
        const frequencyRepeated = frequencyValues.length >= 3 && frequencyValues.every((v) => v === frequencyValues[0]);
        const frequencyDown = frequencyValues.length >= 3 && (frequencyValues.length === 5 ? frequencySteps.filter((v) => v === "lower").length >= 3 && !frequencySteps.includes("higher") : frequencySteps.length === 2 && frequencySteps.every((v) => v === "lower"));
        candidates.push(makeCandidate(
          "MEN-02",
          "mental_contribution",
          "DEINEIZA",
          5,
          scope,
          ["iep.frequency"],
          [...patternGate(["iep.frequency"]), condition(
            "frequency_recurrence_or_decrease",
            { values: frequencyValues, steps: frequencySteps },
            "all same; or latest3 both decrease; or 5 >=3 decreases with no increase",
            frequencyRepeated || frequencyDown,
            window.map((r) => `intent.cycles[${r.index}].iep.frequency`),
            "ordinal category order only"
          )],
          { categories: frequencyValues, observation: frequencyRepeated ? "same_category_repeated" : "category_decreased" },
          patternOptions({ features: ["frequency_pattern"] })
        ));
        const emotionEvidence = scope.map((r) => ref(r, "iep.emotion", r.emotion.transformation, { category: r.emotion.category, status: r.emotion.status }));
        const emo1 = makeCandidate(
          "EMO-01",
          "emotion",
          "DEINEIZA",
          5,
          scope,
          ["iep.emotion"],
          [...patternGate(["iep.emotion"]), condition("same_uniquely_mapped_emotion_category", scope.map((r) => r.emotion), "same known category", sameEmotion)],
          { category: scope[0]?.emotion.category ?? null, otherCategory: sameEmotion && scope[0].emotion.category === 9 },
          patternOptions({ limitations: sameEmotion && scope[0].emotion.category === 9 ? ["Other_does_not_identify_same_specific_emotion"] : [], features: ["emotion_category_recurrence"] })
        );
        emo1.evidence.push(...emotionEvidence);
        candidates.push(emo1);
        atomic(
          "EMO-02",
          "emotion",
          "DEINEIZA",
          intensity,
          "up_or_down",
          ["iep.emotionIntensity", "iep.emotion"],
          [condition("same_known_non_Other_emotion", scope.map((r) => r.emotion), "same known category except Other", knownNonOtherEmotion)]
        );
        candidates.at(-1).evidence.push(...emotionEvidence);
        atomic(
          "OUT-01",
          "observed_outcome",
          "LIPHOZEI",
          achievement,
          "up_or_down",
          outcomePaths,
          [outcomeCondition, condition(
            "opposing_recorded_directions",
            directions,
            "no direction opposing rating trend",
            !mixedTriggers.includes("achievement_direction_opposed")
          )]
        );
        atomic(
          "OUT-02",
          "observed_outcome",
          "LIPHOZEI",
          achievement,
          "flat",
          outcomePaths,
          [outcomeCondition, condition("all_directions_none", directions, "all none", directions.length >= 3 && directions.every((d) => d === "none"))]
        );
        const compositeLimits = ["unstructured_external_context", "other_actor_contribution_unrecorded", "actual_reporting_periods_unrecorded"];
        function composite(id, domain, concept, paths, conditions, data, features) {
          candidates.push(makeCandidate(
            id,
            domain,
            concept,
            4,
            scope,
            paths,
            [...patternGate(paths), outcomeCondition, mixedCondition, ...conditions],
            data,
            patternOptions({ limitations: compositeLimits, missingData: ["typed_external_conditions", "other_actor_contribution", "actual_reporting_periods"], features })
          ));
          candidates.at(-1).ruleEvaluation.derivedMeasures = [practical, mental, achievement, intensity].filter((s) => paths.includes(s.path)).flatMap(ratingMeasures);
        }
        composite(
          "REL-01",
          "practical_contribution",
          "VIASIATAE",
          ["iep.practical", "iep.hours", ...outcomePaths],
          [
            stepCondition(practical),
            metricCondition(practical, "down"),
            stepCondition(achievement),
            metricCondition(achievement, "flat"),
            condition("all_directions_none", directions, "all none", directions.length >= 3 && directions.every((d) => d === "none")),
            hourGuard("no_Hup", !hoursUp)
          ],
          { practical: practical.values, achievement: achievement.values, hours: hourValues },
          ["iep.practical:down", "practical_outcome_relationship"]
        );
        composite(
          "REL-02",
          "practical_contribution",
          "RULAFOSHAE",
          ["iep.practical", "iep.hours", ...outcomePaths],
          [
            stepCondition(practical),
            metricCondition(practical, "up"),
            stepCondition(achievement),
            metricCondition(achievement, "up"),
            condition("direction_not_away", directions, "no away", !directions.includes("away")),
            hourGuard("no_Hdown", !hoursDown)
          ],
          { practical: practical.values, achievement: achievement.values, hours: hourValues },
          ["practical_outcome_cochange"]
        );
        const internalSource = mental.down || mental.up ? "mental" : knownNonOtherEmotion && (intensity.down || intensity.up) ? "emotionIntensity" : null;
        composite(
          "REL-03",
          internalSource === "emotionIntensity" ? "emotion" : "mental_contribution",
          "RULAFOSHAE",
          [
            "iep.mental",
            "iep.practical",
            ...outcomePaths,
            ...internalSource === "emotionIntensity" ? ["iep.emotion", "iep.emotionIntensity"] : []
          ].filter((p) => internalSource === "emotionIntensity" ? p !== "iep.mental" : true),
          [
            stepCondition(practical),
            metricCondition(practical, "flat"),
            stepCondition(achievement),
            metricCondition(achievement, "flat"),
            condition("internal_rating_changed", {
              branch: internalSource,
              mental: mental.values,
              emotionIntensity: intensity.values,
              sameKnownNonOtherEmotion: knownNonOtherEmotion
            }, "mental D/U; otherwise known non-Other intensity D/U", internalSource !== null)
          ],
          {
            internalSource,
            internalValues: internalSource === "mental" ? mental.values : intensity.values,
            practical: practical.values,
            achievement: achievement.values
          },
          [
            "internal_outcome_relationship",
            "oop.achievement:flat",
            internalSource === "mental" ? "iep.mental:low_or_down" : "iep.emotionIntensity:up_or_down"
          ]
        );
        if (internalSource === "emotionIntensity") candidates.at(-1).evidence.push(...emotionEvidence);
        composite(
          "CTX-01",
          "external_context",
          "KAEKITO",
          ["iep.practical", "iep.hours", ...outcomePaths],
          [
            stepCondition(practical),
            metricCondition(practical, "flat"),
            stepCondition(achievement),
            metricCondition(achievement, "down"),
            condition("directions_not_toward", directions, "no toward", !directions.includes("toward")),
            hourGuard("no_Hup_or_Hdown", !hoursUp && !hoursDown)
          ],
          { practical: practical.values, achievement: achievement.values, externalTrajectory: "unavailable" },
          ["context_observation_domain"]
        );
        candidates.push(makeCandidate(
          "CTX-02",
          "external_context",
          "KAEKITO",
          7,
          active,
          ["oop.external"],
          [condition(
            "recorded_external_text_present",
            nonblank(latest.raw.oop?.external),
            true,
            latest.fields["oop.external"].valid && nonblank(latest.raw.oop.external)
          )],
          { literalRecord: copy(latest.raw.oop?.external), semanticClassification: "unavailable" },
          { secondaryOnly: true, limitations: ["unstructured_external_context"], features: ["external_literal_record"] }
        ));
        const cond = makeCandidate(
          "COND-01",
          "condition_capability",
          "VAQUQA",
          7,
          active,
          ["oop.external"],
          [condition("typed_linked_conditions_available", false, true, false)],
          { capability: "not_instrumented" },
          { secondaryOnly: true, missingData: ["typed_linked_conditions"], status: "LIMITED" }
        );
        cond.nextFocus = null;
        candidates.push(cond);
        result.capabilities = {
          FINAEFIA: { status: "limited_wording_proxy", functionalAssessment: "unavailable" },
          DEITHIATHO: { status: "neutral_discrepancy_only", semanticDrift: "unavailable" },
          VIASIATAE: { status: "separate_practical_hours_literal_actions", fullEnergyOrOtherActorMeasurement: "unavailable" },
          KAEKITO: { status: "recorded_context_direction_evidence", obstacleTrajectory: "unavailable" },
          VAQUQA: { ruleId: "COND-01", status: "capability_gap", conditionSufficiency: "unavailable" },
          LIPHOZEI: { status: "self_reported_outcome", automaticCriterionFulfilment: "unavailable", verifiedSuccess: "unavailable" }
        };
        const mixRows = mixedTriggers.some((t) => !["decision_patch_conflict", "direction_mixed"].includes(t)) ? scope : active;
        const mixEvidenceRows = [...new Map([...scope, ...active].map((r) => [r.index, r])).values()];
        candidates.push(makeCandidate(
          "MIX-01",
          "mixed_evidence",
          "THEFEIXI",
          latest.revision.conflict ? 1 : 3,
          mixEvidenceRows,
          [
            "intentional",
            "revision",
            "iep.practical",
            "iep.hours",
            ...outcomePaths,
            ...mixRows === scope ? DEFAULT_PROFILE_PATHS : []
          ],
          [condition("mixed_signal_present", mixedTriggers, "one or more exact specified predicates", mixedTriggers.length > 0)],
          {
            triggers: mixedTriggers,
            practical: practical.values,
            hours: hourValues,
            achievement: achievement.values,
            directions,
            scopes: { practical: "current_rating", achievement: "current_rating", hours: "past_seven_days", direction: "past_seven_days" }
          },
          {
            status: "MIXED",
            level: mixRows === scope ? patternLevel : "EARLY_OBSERVATION",
            comparability: window.length > 0,
            usedRows: mixRows === scope ? window : active,
            exclusions: mixRows === scope ? patternExclusions : [],
            limitations: ["measures_can_have_different_time_scopes"],
            focusKind: "clarify",
            focus: "analysis.clarifyOneRecordedAssessment",
            features: ["mixed_assessment"]
          }
        ));
        const mix = candidates.at(-1);
        mix.ruleEvaluation.triggerEvaluations = [
          condition(
            "decision_patch_conflict",
            { decision: latest.raw.intentional, revision: latest.revision },
            "(no/unsure + nonempty/invalid patch) OR (yes + empty/invalid patch)",
            latest.revision.conflict,
            [`intent.cycles[${latest.index}].intentional`, `intent.cycles[${latest.index}].revision`],
            "exact decision/patch predicate"
          ),
          condition(
            "direction_mixed",
            latest.raw.oop?.direction,
            "mixed",
            mixedTriggers.includes("direction_mixed"),
            [`intent.cycles[${latest.index}].oop.direction`],
            "latest recorded direction===mixed"
          ),
          condition(
            "achievement_direction_opposed",
            { achievement: achievement.values, directions },
            "eligible bases AND (D3/D5 + any toward OR U3/U5 + any away)",
            mixedTriggers.includes("achievement_direction_opposed"),
            scope.flatMap((r) => outcomePaths.map((p) => `intent.cycles[${r.index}].${p}`)),
            "frozen achievement trend dispatcher AND opposing direction category"
          ),
          condition(
            "flat_achievement_direction_varied",
            { achievement: achievement.values, range: achievement.range, directions },
            "eligible bases AND range<=1 AND any toward/away",
            mixedTriggers.includes("flat_achievement_direction_varied"),
            scope.flatMap((r) => outcomePaths.map((p) => `intent.cycles[${r.index}].${p}`)),
            "flat_N rating AND recorded direction has toward/away"
          ),
          condition(
            "practical_hours_opposed",
            { practical: practical.values, hours: hourValues, hoursStatus },
            "practical D3/D5 with Hup OR U3/U5 with Hdown",
            mixedTriggers.includes("practical_hours_opposed"),
            scope.flatMap((r) => ["iep.practical", "iep.hours"].map((p) => `intent.cycles[${r.index}].${p}`)),
            "frozen practical trend dispatcher AND monotone hours change with abs(endpoint)>=1h"
          )
        ];
        mix.ruleEvaluation.derivedMeasures = [...ratingMeasures(practical), ...ratingMeasures(achievement)];
        const focusPaths = {
          "QUAL-01": ["C.oop.events", "C.oop.evidence"],
          "REV-01": [...latest.revision.selectedDimensions.map((d) => `C.cie.${d}`), "C.oop.events"],
          "REV-02": ["C.revision"],
          "INT-01": ["C.cie"],
          "INT-02": ["C.cie", "intent.ris"],
          "TXT-01": ["C.cie", "intent.ris"],
          "PRA-01": ["C.iep.practical", "C.iep.actions"],
          "PRA-02": ["C.iep.practical", "C.iep.hours", "C.iep.actions"],
          "MEN-01": ["C.iep.mental"],
          "MEN-02": ["C.iep.frequency"],
          "EMO-01": ["C.iep.emotion", "C.iep.emotionIntensity"],
          "EMO-02": ["C.iep.emotionIntensity"],
          "OUT-01": ["C.oop.events", "C.cie.success"],
          "OUT-02": ["C.oop.events", "C.cie.success"],
          "REL-01": ["C.iep.practical", "C.iep.actions", "C.oop.events"],
          "REL-02": ["C.iep.practical", "C.oop.events", "C.oop.external"],
          "REL-03": [internalSource === "emotionIntensity" ? "C.iep.emotionIntensity" : "C.iep.mental"],
          "CTX-01": ["C.oop.external"],
          "CTX-02": ["C.oop.external"],
          "MIX-01": mixedTriggers.includes("decision_patch_conflict") ? ["C.intentional", "C.revision"] : mixedTriggers.includes("practical_hours_opposed") ? ["C.iep.practical"] : ["C.oop.direction"]
        };
        for (const c of candidates) if (c.nextFocus && focusPaths[c.ruleId]) c.nextFocus.variablePaths = focusPaths[c.ruleId];
        for (const c of candidates.filter((c2) => ["PRA-01", "PRA-02"].includes(c2.ruleId))) {
          c.evidence.push(...rowEvidence(scope, ["iep.hours", "iep.actions"]));
          if (!hoursValid) c.limitations.push("hours_corroboration_unavailable");
        }
        for (const c of candidates.filter((c2) => ["PRA-01", "PRA-02", "REL-01", "REL-02", "CTX-01", "MIX-01"].includes(c2.ruleId))) {
          c.ruleEvaluation.hoursCorroboration = {
            values: hourValues,
            deltas: hourDeltas,
            endpointChange: hoursEndpoint,
            range: hoursRange,
            status: hoursStatus,
            inputPaths: window.map((r) => `intent.cycles[${r.index}].iep.hours`),
            formulas: {
              deltas: "h[i+1]-h[i]",
              endpointChange: "last-first",
              range: "max-min",
              up: "all deltas>=0 AND endpoint>=1h",
              down: "all deltas<=0 AND endpoint<=-1h",
              flat: "range<=0.25h"
            }
          };
        }
        result.ruleEvaluations = candidates.map((c) => ({
          ruleId: c.ruleId,
          candidateId: c.candidateId,
          eligible: c.eligible,
          priority: copy(c.priority),
          ...copy(c.ruleEvaluation)
        }));
        const independentFocused = candidates.some((c) => c.eligible && [4, 5, 6].includes(c.priority.group));
        const qual = candidates.find((c) => c.ruleId === "QUAL-01");
        if (!globalHold && independentFocused) qual.secondaryOnly = true;
        const eligible = candidates.filter((c) => c.eligible && !c.secondaryOnly).sort(comparePriority);
        let primary = eligible[0] || null;
        const featureSubsumed = (c) => primary && c.observedFeatures.length > 0 && c.observedFeatures.every((f) => primary.observedFeatures.includes(f));
        const secondaryEligible = candidates.filter((c) => c.eligible && c !== primary && c.ruleId !== "REF-01" && c.ruleId !== "REV-01" && !featureSubsumed(c) && !(c.ruleId === "TXT-01" && primary?.ruleId === "REV-01") && !(primary?.ruleId === "MIX-01" && ["OUT-01", "OUT-02", "REL-01", "REL-02", "REL-03", "CTX-01"].includes(c.ruleId)) && !(primary?.ruleId === "QUAL-01" && globalHold && c.priority.group <= 6));
        secondaryEligible.sort((a, b) => Number(a.domain === primary?.domain) - Number(b.domain === primary?.domain) || comparePriority(a, b));
        let secondary = secondaryEligible[0] || null;
        if (safetyDecision === "HOLD") {
          primary = null;
          secondary = null;
        }
        result.primary = primary ? copy(primary) : null;
        result.secondary = secondary ? copy(secondary) : null;
        if (result.secondary) {
          result.secondary.nextFocus = null;
          result.secondary.whyThisFocus = null;
        }
        for (const c of candidates) {
          if (c === primary || c === secondary) continue;
          result.suppressedCandidates.push({
            ruleId: c.ruleId,
            candidateId: c.candidateId,
            eligible: c.eligible,
            reasons: c.eligible ? safetyDecision === "HOLD" ? ["safety_hold"] : featureSubsumed(c) ? ["subsumed_by_primary"] : c.secondaryOnly ? ["observation_only_or_domain_limitation"] : ["lower_fixed_priority"] : c.exclusionReasons,
            failedConditions: copy(c.ruleEvaluation.conditions.filter((v) => !v.passed)),
            priority: copy(c.priority)
          });
        }
        result.status = safetyDecision === "HOLD" ? "SAFETY_HOLD" : primary?.status === "MIXED" ? "MIXED" : primary?.ruleId === "QUAL-01" || !primary ? "INSUFFICIENT" : primary.status === "LIMITED" || issues.some((i) => i.domain !== "emotion") || !latestOutcomeGood ? "LIMITED" : "READY";
        result.selectionExplanation = {
          key: safetyDecision === "HOLD" ? "analysis.externalSafetyHold" : "analysis.fixedPriorityTuple",
          data: {
            selectedCandidate: primary?.candidateId || null,
            selectedTuple: primary ? copy(primary.priority) : null,
            secondaryCandidate: secondary?.candidateId || null,
            secondaryPreference: "different_domain_then_fixed_tuple",
            domainQualityHold: qual.secondaryOnly ? "independent_focused_candidate_available" : "no_independent_focused_candidate_or_global_defect"
          }
        };
        result.limitations = unique([
          ...result.limitations,
          ...defaultLimits,
          ...pairLimitations,
          ...exclusions.some((e) => e.reason === "long_observation_gap") ? ["long_observation_gap"] : [],
          ...latest.emotion.status !== "known" ? [`${latest.emotion.status}_emotion_label`] : []
        ]);
        result.missingData = unique(issues.filter((i) => i.reason.includes("missing") || i.reason === "blank_required_text").map((i) => i.path));
        return result;
      }
      module.exports = {
        analyze,
        normalizeText,
        mapEmotion,
        parseTimestamp,
        ENGINE_VERSION,
        SOURCE_COMMIT,
        SOURCE_VERSION,
        RULE_IDS,
        DIMENSIONS,
        HEURISTICS,
        EMOTION_LABELS
      };
    }
  });

  // frozen/safety.js
  var require_safety = __commonJS({
    "frozen/safety.js"(exports, module) {
      "use strict";
      var frozenEngine = require_analysis();
      var SAFETY_VERSION = "safety-v1";
      var REGISTRY_VERSION = "safety-registry-v1";
      var FALLBACK_ID = "safety.fallback.noInterpretationOrNextFocus";
      var FALLBACK_TEXT = "No interpretation or next focus is shown here.";
      var ENGINE_REFERENCE = Object.freeze({
        codeCommit: "94b112488e576e08495443d93c048a528c39aac7",
        engineVersion: "analysis-phase2a-beta-heuristics-v1",
        sourceCommit: "255a5d9d27461dcacaebc1bc80ab322dd54b4de8",
        sourceVersion: "0.1.0"
      });
      var D = Object.freeze(["primary", "success", "scope", "nonGoals", "constraints", "rationale"]);
      var FREQUENCIES = Object.freeze(["freq0", "freq1", "freq2", "freq3", "freq4", "freq5"]);
      var DIRECTIONS = Object.freeze(["toward", "none", "away", "mixed", "unknown"]);
      var BASES = Object.freeze(["direct", "documented", "otherPerson", "subjective", "insufficient", "other"]);
      var STATUSES = Object.freeze(["EMPTY", "READY", "LIMITED", "INSUFFICIENT", "MIXED", "SAFETY_HOLD", "UNSUPPORTED_SOURCE"]);
      var LEVELS = Object.freeze(["EARLY_OBSERVATION", "COMPARISON", "REPEATED_PATTERN", "CONSISTENT_PATTERN"]);
      var REASONS = Object.freeze([
        "REGISTERED_PRESENTATION",
        "FORBIDDEN_FUNCTION",
        "FORBIDDEN_ROLE",
        "FORBIDDEN_BINDING",
        "FORBIDDEN_RULE_NEXT_FOCUS",
        "UPSTREAM_HOLD",
        "UNKNOWN_TEMPLATE",
        "UNKNOWN_VERSION",
        "UNMAPPED_ENGINE_KEY",
        "UNKNOWN_VARIANT",
        "INVALID_BINDING",
        "INVALID_SOURCE",
        "INVALID_PROVENANCE",
        "INVALID_MANIFEST",
        "EMPTY_ANALYTICAL_PLAN",
        "REGISTRY_UNAVAILABLE",
        "POLICY_VERSION_MISMATCH",
        "SEMANTIC_DEPENDENCY",
        "ENGINE_GATE_UNMET",
        "BOUNDARY_ERROR"
      ]);
      var COMMON_LIMITS = Object.freeze(["self_reported", "historical_RIS_unavailable", "rating_confirmation_unrecorded"]);
      function freezeTrusted(value) {
        if (value && typeof value === "object") {
          Object.values(value).forEach(freezeTrusted);
          Object.freeze(value);
        }
        return value;
      }
      var equal = (a, b) => {
        if (Object.is(a, b)) return true;
        if (!a || !b || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) !== Array.isArray(b)) return false;
        const ak = Object.keys(a), bk = Object.keys(b);
        return ak.length === bk.length && ak.every((k) => Object.hasOwn(b, k) && equal(a[k], b[k]));
      };
      var plainRecord = (v) => v !== null && typeof v === "object" && !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v));
      var exactKeys = (v, keys) => plainRecord(v) && Object.keys(v).length === keys.length && keys.every((k) => Object.hasOwn(v, k));
      var nonblank = (v) => typeof v === "string" && frozenEngine.normalizeText(v) !== "";
      var bounded = (v, max) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;
      var count = (v) => Number.isSafeInteger(v) && v >= 0;
      var orderedDimensions = (v) => Array.isArray(v) && v.length > 0 && equal(v, D.filter((d) => v.includes(d)));
      var uniqueOne = (values) => values.length === 1 ? values[0] : null;
      var reasonOrder = (values) => REASONS.filter((r) => values.includes(r));
      function plainData(value) {
        const work = [{ value, ancestors: /* @__PURE__ */ new Set() }];
        while (work.length) {
          const item = work.pop(), v = item.value;
          if (v === null || ["string", "number", "boolean"].includes(typeof v)) continue;
          if (typeof v !== "object" || item.ancestors.has(v)) return false;
          const array = Array.isArray(v);
          if (array ? Object.getPrototypeOf(v) !== Array.prototype : !plainRecord(v)) return false;
          const descriptors = Object.getOwnPropertyDescriptors(v), keys = Reflect.ownKeys(descriptors);
          if (keys.some((k) => typeof k !== "string")) return false;
          if (array && keys.length !== v.length + 1) return false;
          const ancestors = new Set(item.ancestors);
          ancestors.add(v);
          for (const key of keys) {
            const descriptor = descriptors[key];
            if (!Object.hasOwn(descriptor, "value")) return false;
            if (array && key === "length") continue;
            if (!descriptor.enumerable || array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= v.length)) return false;
            work.push({ value: descriptor.value, ancestors });
          }
        }
        return true;
      }
      var PHYSICAL_SELECTORS = freezeTrusted({
        RECORDS: ["C.ruleEvaluation.usedArrayIndices", "C.ruleEvaluation.usedCycleIds", "C.evidence"],
        CURRENT: ["C.ruleEvaluation.usedArrayIndices", "C.evidence[].path", "C.evidence[].rawValue"],
        PAIR: ["C.ruleEvaluation.usedArrayIndices", "C.evidence[].path", "C.evidence[].rawValue"],
        SERIES: ["C.ruleEvaluation.usedArrayIndices", "C.evidence[].path", "C.evidence[].rawValue"],
        ENGINE_DELTA: [
          "E.comparisons[ruleId=CMP-01,metric].before",
          "E.comparisons[ruleId=CMP-01,metric].after",
          "E.comparisons[ruleId=CMP-01,metric].delta",
          "E.comparisons[ruleId=CMP-01,metric].inputPaths",
          "C.interpretation.data.before",
          "C.interpretation.data.after",
          "C.interpretation.data.delta",
          "C.ruleEvaluation.derivedMeasures[name=signed_delta].value",
          "C.ruleEvaluation.derivedMeasures[name=signed_delta].inputPaths"
        ],
        ENGINE_ORDINAL: ["C.interpretation.data.before", "C.interpretation.data.after", "C.interpretation.data.change"],
        ENGINE_DIMENSIONS: ["C.interpretation.data.currentReferenceDifferences", "C.interpretation.data.adjacentWordingDifferences"],
        ENGINE_DIMENSION: ["C.interpretation.data.dimension"],
        ENGINE_EMOTION_CURRENT: [
          "C.interpretation.data.emotion.category",
          "C.interpretation.data.emotion.status",
          "C.evidence[path=iep.emotion].derivedValue"
        ],
        ENGINE_EMOTION_RECURRENT: [
          "C.interpretation.data.category",
          "C.interpretation.data.otherCategory",
          "C.ruleEvaluation.conditions[name=same_uniquely_mapped_emotion_category].observed",
          "C.evidence[path=iep.emotion].derivedValue"
        ],
        ENGINE_EMOTION_OTHER: ["C.interpretation.data.category", "C.interpretation.data.otherCategory"],
        ENGINE_EMOTION_SERIES_GATE: [
          "C.ruleEvaluation.conditions[name=same_known_non_Other_emotion].observed",
          "C.ruleEvaluation.conditions[name=internal_rating_changed].observed.sameKnownNonOtherEmotion",
          "C.evidence[path=iep.emotion].derivedValue"
        ],
        REVISION_KEYS: ["C.interpretation.data.selectedDimensions", "C.ruleEvaluation.conditions[name=latest_explicit_valid_revision].observed.selectedDimensions"],
        REVISION_EVENT_COUNT: ["C.interpretation.data.eventCount", "C.ruleEvaluation.derivedMeasures[name=revision_event_count].value"],
        REVISION_KEY_COUNTS: ["C.interpretation.data.dimensionCounts", "C.ruleEvaluation.derivedMeasures[name=revision_selection_count:dimension].value"],
        EXTERNAL_RECORD_PRESENT: ["C.ruleEvaluation.conditions[name=recorded_external_text_present].observed", "C.evidence[path=oop.external]"],
        MIX_BRANCH: [
          "C.interpretation.data.triggers",
          "C.ruleEvaluation.conditions[name=mixed_signal_present].observed",
          "C.ruleEvaluation.triggerEvaluations",
          "C.nextFocus.variablePaths"
        ],
        SELECTED_RULE: ["C.ruleId", "C.candidateId", "C.titleKey"],
        FIXED_FIELDS: ["trusted M01-M23 FIXED_FIELDS constants"],
        CAPABILITY_GAP: ["E.capabilities.VAQUQA.ruleId", "E.capabilities.VAQUQA.status", "E.capabilities.VAQUQA.conditionSufficiency"],
        SELECTION_BASIS: [
          "E.ruleEvaluations",
          "E.selectionExplanation.data.selectedCandidate",
          "E.selectionExplanation.data.selectedTuple",
          "E.selectionExplanation.data.secondaryCandidate"
        ],
        CAPABILITY_ABSENCE: []
        // MF1/MF2 are unreachable with a selected frozen-engine primary.
      });
      var LEAF_READERS = freezeTrusted({
        "iep.desire": (r) => r.iep?.desire,
        "iep.belief": (r) => r.iep?.belief,
        "iep.mental": (r) => r.iep?.mental,
        "iep.practical": (r) => r.iep?.practical,
        "iep.emotionIntensity": (r) => r.iep?.emotionIntensity,
        "iep.hours": (r) => r.iep?.hours,
        "iep.frequency": (r) => r.iep?.frequency,
        "iep.emotion": (r) => r.iep?.emotion,
        "iep.actions": (r) => r.iep?.actions,
        "oop.achievement": (r) => r.oop?.achievement,
        "oop.direction": (r) => r.oop?.direction,
        "oop.evidence": (r) => r.oop?.evidence,
        "oop.currentState": (r) => r.oop?.currentState,
        "oop.events": (r) => r.oop?.events,
        "oop.external": (r) => r.oop?.external,
        "intentional": (r) => r.intentional,
        "revision": (r) => r.revision,
        "id": (r) => r.id,
        "createdAt": (r) => r.createdAt,
        "cie.primary": (r) => r.cie?.primary,
        "cie.success": (r) => r.cie?.success,
        "cie.scope": (r) => r.cie?.scope,
        "cie.nonGoals": (r) => r.cie?.nonGoals,
        "cie.constraints": (r) => r.cie?.constraints,
        "cie.rationale": (r) => r.cie?.rationale
      });
      var RIS_READERS = freezeTrusted({
        primary: (r) => r.primary,
        success: (r) => r.success,
        scope: (r) => r.scope,
        nonGoals: (r) => r.nonGoals,
        constraints: (r) => r.constraints,
        rationale: (r) => r.rationale
      });
      var U = freezeTrusted([
        ["practical", "iep.practical", "practical rating", "0–10 self-report rating", "source-record scope"],
        ["achievement", "oop.achievement", "achievement rating", "0–10 self-report rating", "source-record scope"],
        ["mental", "iep.mental", "mental-effort rating", "0–10 self-report rating", "source-record scope"],
        ["hours", "iep.hours", "recorded hours", "hours", "past seven days per record"],
        ["desire", "iep.desire", "desire rating", "0–10 self-report rating", "source-record scope"],
        ["belief", "iep.belief", "belief rating", "0–10 self-report rating", "source-record scope"],
        ["emotionIntensity", "iep.emotionIntensity", "emotion-intensity rating", "0–10 self-report rating", "source-record scope"]
      ]);
      var I = freezeTrusted([["mental", "iep.mental", "mental-effort"], ["emotionIntensity", "iep.emotionIntensity", "emotion-intensity"]]);
      var B = freezeTrusted([
        ["B1", "analysis.observeEventAndBasis"],
        ["B2", "analysis.observeRevisedCriteria"],
        ["B3", "analysis.observeActionAndEvent"],
        ["B4", "analysis.observeExternalCircumstance"],
        ["B5", "analysis.observeOwnCriteriaAgain"]
      ]);
      var CAPABILITY_SELECTOR = freezeTrusted({
        capabilityPath: "capabilities.VAQUQA",
        ruleId: "COND-01",
        status: "capability_gap",
        conditionSufficiency: "unavailable"
      });
      var M_ROWS = freezeTrusted([
        ["M01", "REF-01", ["PRIMARY"], "desire, belief, mental-effort, practical, emotion-intensity and achievement ratings; hours; frequency and outcome direction"],
        ["M02", "QUAL-01", ["PRIMARY"], "assessment-basis limitation metadata"],
        ["M03", "CMP-01", ["PRIMARY", "SECONDARY"], "selected recorded metric, units and before/after/delta"],
        ["M04", "CMP-02", ["PRIMARY", "SECONDARY"], "frequency category pair and ordinal-change metadata"],
        ["M05", "TXT-01", ["PRIMARY", "SECONDARY"], "fixed dimension names with literal wording-difference metadata"],
        ["M06", "INT-01", ["PRIMARY", "SECONDARY"], "six-dimension normalized wording-recurrence metadata"],
        ["M07", "INT-02", ["PRIMARY", "SECONDARY"], "one fixed dimension name with recurring wording-mismatch metadata"],
        ["M08", "PRA-01", ["PRIMARY", "SECONDARY"], "practical-rating series"],
        ["M09", "PRA-02", ["PRIMARY", "SECONDARY"], "practical-rating series and separate past-seven-days hours"],
        ["M10", "MEN-01", ["PRIMARY", "SECONDARY"], "mental-effort rating series"],
        ["M11", "MEN-02", ["PRIMARY", "SECONDARY"], "recorded frequency-category series"],
        ["M12", "EMO-01", ["PRIMARY", "SECONDARY"], "recorded mapped-category recurrence metadata"],
        ["M13", "EMO-02", ["PRIMARY", "SECONDARY"], "emotion-intensity ratings within one mapped non-Other category"],
        ["M14", "OUT-01", ["PRIMARY", "SECONDARY"], "achievement-rating, outcome-direction and evidence-basis selections"],
        ["M15", "OUT-02", ["PRIMARY", "SECONDARY"], "nearby achievement ratings and recorded none direction"],
        ["M16", "CTX-01", ["PRIMARY", "SECONDARY"], "separate practical and achievement rating series"],
        ["M17", "CTX-02", ["SECONDARY"], "external-context record-presence metadata"],
        ["M18", "REV-01", ["PRIMARY", "SECONDARY"], "recorded revision-selection dimension keys"],
        ["M19", "REV-02", ["PRIMARY", "SECONDARY"], "revision-selection event count and six dimension-key counts"],
        ["M20", "REL-01", ["PRIMARY", "SECONDARY"], "separate practical and achievement rating series"],
        ["M21", "REL-02", ["PRIMARY", "SECONDARY"], "practical and achievement rating series in the same observations"],
        ["M22", "REL-03", ["PRIMARY", "SECONDARY"], "selected internal rating and separate practical and achievement rating series"],
        ["M23", "MIX-01", ["PRIMARY", "SECONDARY"], "mixed or different-scope rating, hours, direction or decision/patch metadata"]
      ]);
      function engineTuple(row, candidateId, metric = null, dimension = null, branch = "recorded", variant = "recordedObservation") {
        return {
          ruleId: row[1],
          candidateId,
          key: `analysis.${row[1]}.title`,
          metric,
          dimension,
          branch,
          variant
        };
      }
      var MAPPINGS = freezeTrusted(M_ROWS.flatMap((row) => {
        const rule = row[1];
        let tuples;
        if (rule === "REF-01") tuples = B.flatMap((b) => ["CURRENT_CATEGORY_UNAVAILABLE", "CURRENT_KNOWN_CATEGORY"].map((v) => engineTuple(row, "REF-01", null, null, b[0], v)));
        else if (rule === "QUAL-01") tuples = ["insufficient_basis", "possible_default_profile"].map((b) => engineTuple(row, rule, null, null, b));
        else if (rule === "CMP-01") tuples = U.map((u) => engineTuple(row, `CMP-01:${u[0]}`, u[0]));
        else if (rule === "CMP-02") tuples = [engineTuple(row, "CMP-02:frequency", "frequency")];
        else if (rule === "INT-02") tuples = D.map((d) => engineTuple(row, `INT-02:${d}`, null, d));
        else if (rule === "MEN-01") tuples = ["low_range", "decreasing"].map((b) => engineTuple(row, rule, null, null, b));
        else if (rule === "MEN-02") tuples = ["same_category_repeated", "category_decreased"].map((b) => engineTuple(row, rule, null, null, b));
        else if (rule === "EMO-01") tuples = ["known_non_other", "other"].map((b) => engineTuple(row, rule, null, null, b));
        else if (["EMO-02", "OUT-01"].includes(rule)) tuples = ["increased", "decreased"].map((b) => engineTuple(row, rule, null, null, b));
        else if (rule === "REL-03") tuples = I.map((i) => engineTuple(row, rule, i[0]));
        else if (rule === "MIX-01") tuples = ["decision_patch_conflict", "practical_hours_opposed", "recorded_direction"].map((b) => engineTuple(row, rule, null, null, b));
        else tuples = [engineTuple(row, rule)];
        return tuples.map((selector) => ({ mappingId: row[0], selector, allowedSurfaces: row[2], fixedFields: row[3] }));
      }));
      var SELECTOR_TABLE = freezeTrusted([
        ...[
          "iep.desire",
          "iep.belief",
          "iep.mental",
          "iep.practical",
          "iep.emotionIntensity",
          "oop.achievement",
          "iep.hours",
          "iep.frequency",
          "oop.direction"
        ].map((f) => `CURRENT(${f})`),
        ...U.flatMap((u) => [`PAIR(${u[1]})`, `ENGINE_DELTA(${u[1]})`]),
        "PAIR(iep.frequency)",
        ...[
          "iep.practical",
          "iep.hours",
          "iep.mental",
          "iep.frequency",
          "iep.emotionIntensity",
          "oop.achievement",
          "oop.direction",
          "oop.evidence"
        ].map((f) => `SERIES(${f})`),
        "ENGINE_ORDINAL",
        "ENGINE_DIMENSIONS",
        "ENGINE_DIMENSION",
        "ENGINE_EMOTION_CURRENT",
        "ENGINE_EMOTION_RECURRENT",
        "ENGINE_EMOTION_OTHER",
        "ENGINE_EMOTION_SERIES_GATE",
        "REVISION_KEYS",
        "REVISION_EVENT_COUNT",
        "REVISION_KEY_COUNTS",
        "EXTERNAL_RECORD_PRESENT",
        "MIX_BRANCH",
        "SELECTED_RULE",
        "FIXED_FIELDS",
        "CAPABILITY_GAP",
        "U.metricLabel",
        "U.units",
        "U.scope",
        "I.metricLabel"
      ]);
      var FACTUAL_MANIFEST_IDS = Object.freeze([
        "safety.manifest.primaryFactual",
        "safety.manifest.primaryAndSecondaryFactual",
        "safety.manifest.primaryFactualWithCapability",
        "safety.manifest.primaryAndSecondaryFactualWithCapability"
      ]);
      var SURFACE_SLOTS = freezeTrusted({
        PRIMARY: ["primary.insight", "primary.why.values", "primary.why.selection", "primary.why.limitations"],
        SECONDARY: ["secondary.insight", "secondary.why.values", "secondary.why.selection", "secondary.why.limitations"]
      });
      var MANIFESTS = freezeTrusted([
        { manifestId: "safety.manifest.fallbackOnly", slots: ["fallback"], declaredAbsentSlots: ["primary", "secondary"] },
        {
          manifestId: FACTUAL_MANIFEST_IDS[0],
          slots: [...SURFACE_SLOTS.PRIMARY],
          declaredAbsentSlots: ["primary.interpretation", "primary.nextFocus", "primary.why.capability", "secondary"]
        },
        {
          manifestId: FACTUAL_MANIFEST_IDS[1],
          slots: [...SURFACE_SLOTS.PRIMARY, ...SURFACE_SLOTS.SECONDARY],
          declaredAbsentSlots: ["primary.interpretation", "primary.nextFocus", "primary.why.capability", "secondary.interpretation", "secondary.nextFocus", "secondary.whyThisFocus"]
        },
        {
          manifestId: FACTUAL_MANIFEST_IDS[2],
          slots: [...SURFACE_SLOTS.PRIMARY, "primary.why.capability"],
          declaredAbsentSlots: ["primary.interpretation", "primary.nextFocus", "secondary"]
        },
        {
          manifestId: FACTUAL_MANIFEST_IDS[3],
          slots: [...SURFACE_SLOTS.PRIMARY, "primary.why.capability", ...SURFACE_SLOTS.SECONDARY],
          declaredAbsentSlots: ["primary.interpretation", "primary.nextFocus", "secondary.interpretation", "secondary.nextFocus", "secondary.whyThisFocus"]
        }
      ].map((m) => ({ ...m, manifestVersion: 1, policyVersion: SAFETY_VERSION, registryVersion: REGISTRY_VERSION })));
      function binding(name, type, selector, extra = {}) {
        const range = ["rating", "ratingList"].includes(type) ? [0, 10] : ["hours", "hoursList"].includes(type) ? [0, 168] : type === "emotionIndex" ? [0, 9] : type === "count" ? [0, Number.MAX_SAFE_INTEGER] : null;
        return { name, type, selector, required: true, range, transform: type.endsWith("List") ? type === "basisList" ? "enum_record_groups_comma_then_semicolon" : "exact_values_comma_space" : type === "dimensions" ? "fixed_D_order_comma_space" : "exact_inert_value", ...extra };
      }
      var CURRENT_BINDINGS = [
        ...[
          ["desire", "iep.desire"],
          ["belief", "iep.belief"],
          ["mental", "iep.mental"],
          ["practical", "iep.practical"],
          ["intensity", "iep.emotionIntensity"],
          ["achievement", "oop.achievement"]
        ].map(([n, f]) => binding(n, "rating", `CURRENT(${f})`, { field: f })),
        binding("hours", "hours", "CURRENT(iep.hours)", { field: "iep.hours" }),
        binding("frequency", "frequency", "CURRENT(iep.frequency)", { field: "iep.frequency" }),
        binding("direction", "direction", "CURRENT(oop.direction)", { field: "oop.direction" })
      ];
      var comparisonBinding = (name, type, prefix, extra = {}) => binding(name, type, null, {
        selectorByMetric: Object.fromEntries(U.map((u) => [u[0], `${prefix}(${u[1]})`])),
        ...extra
      });
      var seriesBinding = (n, t, f) => binding(n, t, `SERIES(${f})`, { field: f });
      var COCHANGE_BINDINGS = [seriesBinding("practical", "ratingList", "iep.practical"), seriesBinding("achievement", "ratingList", "oop.achievement")];
      var BINDINGS_BY_ROW = freezeTrusted({
        E01: [],
        E02: CURRENT_BINDINGS,
        E03: [...CURRENT_BINDINGS, binding("categoryIndex", "emotionIndex", "ENGINE_EMOTION_CURRENT")],
        E04: [],
        E05: [
          binding("metricLabel", "metricLabel", "U.metricLabel"),
          binding("units", "units", "U.units"),
          binding("scope", "scope", "U.scope"),
          comparisonBinding("before", "rating", "PAIR", {
            pairIndex: 0,
            typeByMetric: Object.fromEntries(U.map((u) => [u[0], u[0] === "hours" ? "hours" : "rating"])),
            rangeByMetric: Object.fromEntries(U.map((u) => [u[0], [0, u[0] === "hours" ? 168 : 10]]))
          }),
          comparisonBinding("after", "rating", "PAIR", {
            pairIndex: 1,
            typeByMetric: Object.fromEntries(U.map((u) => [u[0], u[0] === "hours" ? "hours" : "rating"])),
            rangeByMetric: Object.fromEntries(U.map((u) => [u[0], [0, u[0] === "hours" ? 168 : 10]]))
          }),
          comparisonBinding("delta", "delta", "ENGINE_DELTA", { rangeByMetric: Object.fromEntries(U.map((u) => [u[0], u[0] === "hours" ? [-168, 168] : [-10, 10]])) })
        ],
        E06: [
          binding("before", "frequency", "PAIR(iep.frequency)", { field: "iep.frequency", pairIndex: 0 }),
          binding("after", "frequency", "PAIR(iep.frequency)", { field: "iep.frequency", pairIndex: 1 }),
          binding("ordinalChange", "ordinalChange", "ENGINE_ORDINAL")
        ],
        E07: [binding("dimensions", "dimensions", "ENGINE_DIMENSIONS")],
        E08: [],
        E09: [binding("dimension", "dimension", "ENGINE_DIMENSION")],
        E10: [seriesBinding("ratings", "ratingList", "iep.practical")],
        E11: [seriesBinding("ratings", "ratingList", "iep.practical"), seriesBinding("hours", "hoursList", "iep.hours")],
        E12: [seriesBinding("ratings", "ratingList", "iep.mental")],
        E13: [seriesBinding("categories", "frequencyList", "iep.frequency")],
        E14: [binding("categoryIndex", "emotionIndex", "ENGINE_EMOTION_RECURRENT")],
        E15: [],
        E16: [seriesBinding("intensities", "ratingList", "iep.emotionIntensity")],
        E17: [seriesBinding("ratings", "ratingList", "oop.achievement"), seriesBinding("directions", "directionList", "oop.direction"), seriesBinding("bases", "basisList", "oop.evidence")],
        E18: [seriesBinding("ratings", "ratingList", "oop.achievement")],
        E19: COCHANGE_BINDINGS,
        E20: [],
        E21: [binding("dimensions", "dimensions", "REVISION_KEYS")],
        E22: [binding("eventCount", "count", "REVISION_EVENT_COUNT"), ...D.map((d) => binding(`${d}Count`, "count", "REVISION_KEY_COUNTS", { dimension: d }))],
        E23: COCHANGE_BINDINGS,
        E24: COCHANGE_BINDINGS,
        E25: [binding("metricLabel", "metricLabel", "I.metricLabel"), binding("internal", "ratingList", null, {
          selectorByMetric: Object.fromEntries(I.map((i) => [i[0], `SERIES(${i[1]})`]))
        }), ...COCHANGE_BINDINGS],
        E26: [],
        E27: [binding("fieldNames", "fieldNames", "FIXED_FIELDS")],
        E28: [binding("ruleId", "ruleId", "SELECTED_RULE")],
        E29: [],
        E30: []
      });
      var ENTRY_BODIES = [
        {
          "row": "E01",
          "templateId": "safety.fallback.noInterpretationOrNextFocus",
          "role": "FALLBACK",
          "allowedPresentationFunction": "FIXED_FALLBACK",
          "canonicalText": "No interpretation or next focus is shown here."
        },
        {
          "row": "E02",
          "templateId": "safety.insight.currentRecordedAssessments",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
          "canonicalText": "Current recorded self-report ratings (0–10): desire {desire}; belief {belief}; mental effort {mental}; practical {practical}; emotion intensity {intensity}; achievement {achievement}. Recorded hours for the past seven days: {hours}. Recorded frequency category: {frequency}. Recorded outcome direction: {direction}."
        },
        {
          "row": "E03",
          "templateId": "safety.insight.currentRecordedAssessmentsAndCategory",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
          "canonicalText": "Current recorded self-report ratings (0–10): desire {desire}; belief {belief}; mental effort {mental}; practical {practical}; emotion intensity {intensity}; achievement {achievement}. Recorded hours for the past seven days: {hours}. Recorded frequency category: {frequency}. Recorded outcome direction: {direction}. Recorded mapped emotion-category index: {categoryIndex}. The category does not establish a mood or a specific emotion within Other."
        },
        {
          "row": "E04",
          "templateId": "safety.insight.assessmentBasisLimitation",
          "role": "INSIGHT",
          "allowedPresentationFunction": "STATE_DATA_LIMITATION",
          "canonicalText": "The selected saved assessment has an assessment-basis limitation under the frozen rule. Missing information does not establish that no event occurred."
        },
        {
          "row": "E05",
          "templateId": "safety.insight.numericComparison",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
          "canonicalText": "Recorded {metricLabel}: before {before}; after {after}; engine-reported difference {delta}. Units: {units}. Time scope: {scope}. These are recorded self-reports."
        },
        {
          "row": "E06",
          "templateId": "safety.insight.frequencyComparison",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_CATEGORIES",
          "canonicalText": "Recorded frequency categories: before {before}; after {after}. The engine's ordinal comparison is {ordinalChange}. The categories are not thought counts or equal-interval measurements."
        },
        {
          "row": "E07",
          "templateId": "safety.insight.literalWordingDifferences",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_WORDING_METADATA",
          "canonicalText": "Literal wording differences were recorded for: {dimensions}. This compares recorded wording with the current saved RIS; it does not determine meaning or reconstruct an earlier RIS."
        },
        {
          "row": "E08",
          "templateId": "safety.insight.normalizedWordingRecurrence",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_WORDING_METADATA",
          "canonicalText": "Normalized CIE wording recurred across primary, success, scope, nonGoals, constraints and rationale in the selected saved observations. Wording recurrence does not establish functional retention."
        },
        {
          "row": "E09",
          "templateId": "safety.insight.recurringWordingMismatch",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_WORDING_METADATA",
          "canonicalText": "Recurring recorded wording for {dimension} differs from the current saved RIS wording. Earlier RIS versions are unavailable; no semantic drift is determined."
        },
        {
          "row": "E10",
          "templateId": "safety.insight.practicalRatingDecrease",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
          "canonicalText": "Recorded practical ratings in the selected observations: {ratings} (0–10 self-reports). The frozen rule identified a decrease in these ratings."
        },
        {
          "row": "E11",
          "templateId": "safety.insight.practicalLowRangeAndHours",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
          "canonicalText": "Recorded practical ratings in the selected observations: {ratings} (0–10 self-reports), within the frozen rule's low range. Separately recorded hours for the past seven days per record: {hours}. The ratings do not establish absence of action."
        },
        {
          "row": "E12",
          "templateId": "safety.insight.mentalEffortRatings",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
          "canonicalText": "Recorded mental-effort ratings in the selected observations: {ratings} (0–10 self-reports). These ratings are not a measure of health or available energy."
        },
        {
          "row": "E13",
          "templateId": "safety.insight.frequencyCategories",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_CATEGORIES",
          "canonicalText": "Recorded frequency categories in the selected observations: {categories}. These selections are not a cognitive-performance score."
        },
        {
          "row": "E14",
          "templateId": "safety.insight.knownCategoryRecurrence",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_CATEGORIES",
          "canonicalText": "Recorded mapped emotion-category index {categoryIndex} recurred in the selected saved observations. Category recurrence does not establish a chronic mood."
        },
        {
          "row": "E15",
          "templateId": "safety.insight.otherCategorySelected",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_CATEGORIES",
          "canonicalText": "Other was selected in the saved observations used by the rule. This does not identify one specific emotion."
        },
        {
          "row": "E16",
          "templateId": "safety.insight.sameCategoryIntensityChange",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
          "canonicalText": "Recorded emotion-intensity ratings in the selected observations: {intensities} (0–10 self-reports). The existing comparison uses one uniquely mapped non-Other category. Intensity change is not a wellbeing assessment."
        },
        {
          "row": "E17",
          "templateId": "safety.insight.achievementRatingChange",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
          "canonicalText": "Recorded achievement ratings in the selected observations: {ratings} (0–10 self-reports). Recorded outcome directions: {directions}. Recorded evidence-basis selections, grouped by record: {bases}. These selections do not verify success, failure or completion."
        },
        {
          "row": "E18",
          "templateId": "safety.insight.nearbyAchievementRatings",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
          "canonicalText": "Recorded achievement ratings in the selected observations: {ratings} (0–10 self-reports). These ratings are nearby under the frozen rule. The recorded outcome direction is none in each selected observation. This does not establish stagnation."
        },
        {
          "row": "E19",
          "templateId": "safety.insight.contextSeriesFacts",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_COCHANGE",
          "canonicalText": "Recorded practical ratings: {practical}; recorded achievement ratings: {achievement} (separate 0–10 self-reports). The practical ratings are nearby and the achievement ratings decrease under the frozen rule. An external cause is not determined."
        },
        {
          "row": "E20",
          "templateId": "safety.insight.externalRecordPresent",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_WORDING_METADATA",
          "canonicalText": "An external-context record is present in the selected saved observation. Its meaning and any causal role are not determined."
        },
        {
          "row": "E21",
          "templateId": "safety.insight.recordedRevisionSelections",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_REVISION_SELECTIONS",
          "canonicalText": "The saved explicit revision selection includes: {dimensions}. Selected dimension keys do not establish that wording changed, and no revision is applied here."
        },
        {
          "row": "E22",
          "templateId": "safety.insight.recordedRevisionCounts",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_REVISION_SELECTIONS",
          "canonicalText": "Recorded explicit revision-selection events: {eventCount}. Selected dimension-key counts: primary {primaryCount}; success {successCount}; scope {scopeCount}; nonGoals {nonGoalsCount}; constraints {constraintsCount}; rationale {rationaleCount}. These counts do not assess revision quality or apply a revision."
        },
        {
          "row": "E23",
          "templateId": "safety.insight.practicalDecreaseNearbyAchievement",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_COCHANGE",
          "canonicalText": "Recorded practical ratings: {practical}; recorded achievement ratings: {achievement} (separate 0–10 self-reports). The practical ratings decrease while the achievement ratings remain nearby under the frozen rule. No action–outcome cause is determined."
        },
        {
          "row": "E24",
          "templateId": "safety.insight.recordedRatingCoIncrease",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_COCHANGE",
          "canonicalText": "Recorded practical ratings: {practical}; recorded achievement ratings: {achievement} (separate 0–10 self-reports). Both rating series increase in the selected observations under the frozen rule. Co-change does not establish an effect or efficacy."
        },
        {
          "row": "E25",
          "templateId": "safety.insight.internalRatingSeriesFacts",
          "role": "INSIGHT",
          "allowedPresentationFunction": "DESCRIBE_RECORDED_COCHANGE",
          "canonicalText": "Recorded {metricLabel} ratings: {internal}; recorded practical ratings: {practical}; recorded achievement ratings: {achievement} (separate 0–10 self-reports). The selected internal-rating series changes while practical and achievement ratings remain nearby under the frozen rule. Causality is not determined."
        },
        {
          "row": "E26",
          "templateId": "safety.insight.mixedRecordMetadata",
          "role": "INSIGHT",
          "allowedPresentationFunction": "STATE_DATA_LIMITATION",
          "canonicalText": "The selected saved records contain mixed or different-scope assessment metadata under the frozen rule. Ratings, hours, outcome directions and revision-decision metadata are not combined into one measure or automatically reconciled."
        },
        {
          "row": "E27",
          "templateId": "safety.why.recordedInformationUsed",
          "role": "WHY",
          "allowedPresentationFunction": "EXPLAIN_SELECTION_BASIS",
          "canonicalText": "The selected saved record references supply the recorded information shown here: {fieldNames}. Each value, category or structural fact retains its own source scope."
        },
        {
          "row": "E28",
          "templateId": "safety.why.ruleSelectionBasis",
          "role": "WHY",
          "allowedPresentationFunction": "EXPLAIN_SELECTION_BASIS",
          "canonicalText": "Rule {ruleId} supplied the existing eligibility and selection basis for this factual presentation. This explains the selection of recorded information, not why an event occurred."
        },
        {
          "row": "E29",
          "templateId": "safety.why.recordedDataLimitations",
          "role": "WHY",
          "allowedPresentationFunction": "STATE_DATA_LIMITATION",
          "canonicalText": "Recorded self-reports and category selections are not independently verified outcomes. Actual reporting periods and earlier RIS versions are not reconstructed. Objective meaning and causality remain undetermined; no recommendation follows from this presentation."
        },
        {
          "row": "E30",
          "templateId": "safety.why.conditionAssessmentUnavailable",
          "role": "WHY",
          "allowedPresentationFunction": "STATE_CAPABILITY_LIMITATION",
          "canonicalText": "Typed linked condition assessment is unavailable in the current data. This does not establish that any condition is missing, necessary or sufficient."
        }
      ];
      var RULE_BY_ROW = freezeTrusted({
        E04: "QUAL-01",
        E05: "CMP-01",
        E06: "CMP-02",
        E07: "TXT-01",
        E08: "INT-01",
        E09: "INT-02",
        E10: "PRA-01",
        E11: "PRA-02",
        E12: "MEN-01",
        E13: "MEN-02",
        E16: "EMO-02",
        E17: "OUT-01",
        E18: "OUT-02",
        E19: "CTX-01",
        E20: "CTX-02",
        E21: "REV-01",
        E22: "REV-02",
        E23: "REL-01",
        E24: "REL-02",
        E25: "REL-03",
        E26: "MIX-01"
      });
      function mappingsForRow(row) {
        if (row === "E01") return [];
        if (row === "E30") return [{ mappingId: "MC", selector: CAPABILITY_SELECTOR, allowedSurfaces: ["PRIMARY"] }];
        if (["E27", "E28", "E29"].includes(row)) return MAPPINGS;
        if (["E02", "E03"].includes(row)) return MAPPINGS.filter((m) => m.selector.ruleId === "REF-01" && m.selector.variant === (row === "E02" ? "CURRENT_CATEGORY_UNAVAILABLE" : "CURRENT_KNOWN_CATEGORY"));
        if (["E14", "E15"].includes(row)) return MAPPINGS.filter((m) => m.selector.ruleId === "EMO-01" && m.selector.branch === (row === "E14" ? "known_non_other" : "other"));
        return MAPPINGS.filter((m) => m.selector.ruleId === RULE_BY_ROW[row]);
      }
      var ENTRY_GATES = freezeTrusted({
        E03: ["ENGINE_EMOTION_CURRENT"],
        E05: ["ENGINE_DELTA"],
        E06: ["ENGINE_ORDINAL"],
        E07: ["ENGINE_DIMENSIONS"],
        E08: ["normalized_six_dimension_recurrence"],
        E09: ["ENGINE_DIMENSION"],
        E14: ["ENGINE_EMOTION_RECURRENT"],
        E15: ["ENGINE_EMOTION_OTHER"],
        E16: ["ENGINE_EMOTION_SERIES_GATE"],
        E17: ["outcomeEligible"],
        E18: ["all_directions_none", "outcomeEligible"],
        E20: ["EXTERNAL_RECORD_PRESENT"],
        E21: ["REVISION_KEYS"],
        E22: ["REVISION_EVENT_COUNT", "REVISION_KEY_COUNTS"],
        E25: ["internal_rating_changed", "ENGINE_EMOTION_SERIES_GATE_if_intensity"],
        E26: ["MIX_BRANCH"],
        E30: ["CAPABILITY_GAP"]
      });
      var TEMPLATE_REGISTRY = freezeTrusted(ENTRY_BODIES.map((body) => {
        const engineMappings = mappingsForRow(body.row), allowedBindings = BINDINGS_BY_ROW[body.row];
        const allowedSurfaces = body.row === "E01" ? ["FALLBACK"] : body.row === "E30" ? ["PRIMARY"] : ["PRIMARY", "SECONDARY"].filter((s) => engineMappings.some((m) => m.allowedSurfaces.includes(s)));
        const manifests = body.row === "E01" ? [MANIFESTS[0].manifestId] : body.row === "E30" || body.row === "E20" ? body.row === "E30" ? [FACTUAL_MANIFEST_IDS[2], FACTUAL_MANIFEST_IDS[3]] : [FACTUAL_MANIFEST_IDS[1], FACTUAL_MANIFEST_IDS[3]] : FACTUAL_MANIFEST_IDS;
        const slotSuffix = body.role === "INSIGHT" ? "insight" : body.row === "E27" ? "why.values" : body.row === "E28" ? "why.selection" : body.row === "E29" ? "why.limitations" : "why.capability";
        return {
          ...body,
          templateVersion: 1,
          policyVersion: SAFETY_VERSION,
          registryVersion: REGISTRY_VERSION,
          allowedRuleIds: body.row === "E01" || body.row === "E30" ? [] : M_ROWS.map((m) => m[1]).filter((r) => engineMappings.some((m) => m.selector.ruleId === r)),
          allowedBindings,
          allowedSourcePaths: [...new Set(allowedBindings.flatMap((b) => b.selector === null ? Object.values(b.selectorByMetric) : [b.selector]))],
          allowedSurfaces,
          engineMappings,
          safetyClassification: "ALLOW",
          approvedVariants: {},
          localeVariantsExist: false,
          requiredEvidence: {
            common: body.row === "E01" ? [] : [
              "plain_data",
              "frozen_engine_and_source_identity",
              "exact_selected_candidate",
              "existing_eligibility_and_limitations",
              "complete_manifest",
              "typed_exact_provenance"
            ],
            gates: ENTRY_GATES[body.row] || [],
            mappings: engineMappings
          },
          manifestVersion: 1,
          manifestMembership: manifests.flatMap((manifestId) => body.row === "E01" ? [{ manifestId, slot: "fallback" }] : allowedSurfaces.filter((s) => s === "PRIMARY" || [FACTUAL_MANIFEST_IDS[1], FACTUAL_MANIFEST_IDS[3]].includes(manifestId)).map((s) => ({ manifestId, slot: `${s === "PRIMARY" ? "primary" : "secondary"}.${slotSuffix}` })))
        };
      }));
      freezeTrusted(ENTRY_BODIES);
      var entryByRow = (row) => TEMPLATE_REGISTRY.find((e) => e.row === row);
      function registryValid() {
        const fields = [
          "templateId",
          "templateVersion",
          "role",
          "allowedRuleIds",
          "allowedBindings",
          "allowedSourcePaths",
          "allowedPresentationFunction",
          "safetyClassification",
          "canonicalText",
          "approvedVariants",
          "allowedSurfaces",
          "engineMappings",
          "requiredEvidence",
          "manifestVersion"
        ];
        return TEMPLATE_REGISTRY.length === 30 && MANIFESTS.length === 5 && new Set(TEMPLATE_REGISTRY.map((e) => `${e.templateId}/${e.templateVersion}/${e.role}`)).size === 30 && TEMPLATE_REGISTRY.every((e) => Object.isFrozen(e) && fields.every((f) => Object.hasOwn(e, f)) && e.templateVersion === 1 && e.manifestVersion === 1 && ["ALLOW", "HOLD", "UNKNOWN"].includes(e.safetyClassification) && e.policyVersion === SAFETY_VERSION && e.registryVersion === REGISTRY_VERSION && !["NEXT_FOCUS", "INTERPRETATION"].includes(e.role) && e.allowedSourcePaths.every((p) => SELECTOR_TABLE.includes(p)) && equal([...e.canonicalText.matchAll(/\{([A-Za-z]+)\}/g)].map((m) => m[1]).sort(), e.allowedBindings.map((b) => b.name).sort())) && entryByRow("E01").templateId === FALLBACK_ID && entryByRow("E01").canonicalText === FALLBACK_TEXT;
      }
      function reject(code) {
        throw { code };
      }
      function requireGate(passed, code = "INVALID_PROVENANCE") {
        if (!passed) reject(code);
      }
      function engineContract(e, source) {
        return plainRecord(e) && e.engineVersion === ENGINE_REFERENCE.engineVersion && e.specVersion === "analysis-phase1-proposal-1" && e.adapterVersion === "raw-0.1.0-conservative-v1" && e.dictionaryVersion === "production-v16-31-locales" && e.heuristicStatus === "PRODUCT_HEURISTICS_FOR_BETA" && e.causality === "not_determined" && STATUSES.includes(e.status) && exactKeys(e.safety, ["externalDecision", "releaseStatus", "classifierImplemented"]) && ["ALLOW", "HOLD", "UNKNOWN"].includes(e.safety.externalDecision) && e.safety.releaseStatus === "NOT_RELEASED_TO_USER" && e.safety.classifierImplemented === false && e.inputReference?.sourceCommit === ENGINE_REFERENCE.sourceCommit && e.inputReference.sourceVersion === source?.version && e.inputReference.referenceProvenance === "current_mutable_RIS_only" && e.inputReference.intentId === (typeof source?.intent?.id === "string" ? source.intent.id : null) && Object.hasOwn(e, "primary") && Object.hasOwn(e, "secondary") && Array.isArray(e.ruleEvaluations) && Array.isArray(e.comparisons);
      }
      function helpersValid() {
        return frozenEngine.ENGINE_VERSION === ENGINE_REFERENCE.engineVersion && frozenEngine.SOURCE_COMMIT === ENGINE_REFERENCE.sourceCommit && frozenEngine.SOURCE_VERSION === ENGINE_REFERENCE.sourceVersion && equal(frozenEngine.DIMENSIONS, D) && ["normalizeText", "mapEmotion", "parseTimestamp"].every((k) => typeof frozenEngine[k] === "function") && frozenEngine.EMOTION_LABELS.en[9] === "Other";
      }
      var FORBIDDEN_FUNCTIONS = Object.freeze([
        "BEHAVIOURAL_OPTIMISATION",
        "EFFORT_INCREASE",
        "EFFORT_DECREASE",
        "ACTION_PRESCRIPTION",
        "PERSISTENCE_ADVICE",
        "MINDSET_MODIFICATION",
        "BELIEF_MODIFICATION",
        "EMOTION_MODIFICATION",
        "OBSTACLE_REMOVAL",
        "EXECUTION_PLANNING",
        "DIAGNOSTIC_FRAMING",
        "THERAPEUTIC_FRAMING",
        "TREATMENT_ADVICE",
        "CAUSAL_CLAIM",
        "PREDICTION",
        "AUTOMATIC_REVISION",
        "OBJECTIVE_OPTIMISATION",
        "CRITERIA_OPTIMISATION",
        "SCOPE_OPTIMISATION",
        "HIGH_STAKES_DIRECTIVE",
        "GLOBAL_SAFETY_CLAIM"
      ]);
      var RAW_FIELDS = Object.freeze([
        ...D.map((d) => `cie.${d}`),
        "iep.actions",
        "iep.emotion",
        "oop.currentState",
        "oop.events",
        "oop.external",
        "revision"
      ]);
      var FORBIDDEN_RAW_SELECTORS = Object.freeze([
        ...RAW_FIELDS.flatMap((f) => [`CURRENT(${f})`, `PAIR(${f})`, `SERIES(${f})`]),
        ...D.map((d) => `intent.ris.${d}`)
      ]);
      var KNOWN_SLOTS = Object.freeze([
        ...SURFACE_SLOTS.PRIMARY,
        ...SURFACE_SLOTS.SECONDARY,
        "primary.why.capability",
        "primary.interpretation",
        "primary.nextFocus",
        "secondary.interpretation",
        "secondary.nextFocus",
        "secondary.whyThisFocus",
        "secondary.recommendation",
        "fallback"
      ]);
      function ownData(value, key) {
        if (value === null || typeof value !== "object") return void 0;
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        return descriptor && Object.hasOwn(descriptor, "value") ? descriptor.value : void 0;
      }
      function trustedEntryReasons(request) {
        const entry = TEMPLATE_REGISTRY.find((e) => e.templateId === ownData(request, "templateId") && e.templateVersion === ownData(request, "templateVersion"));
        return entry && (entry.safetyClassification === "HOLD" || FORBIDDEN_FUNCTIONS.includes(entry.allowedPresentationFunction)) ? ["FORBIDDEN_FUNCTION"] : [];
      }
      function structuralHolds(request) {
        const reasons = [], role = ownData(request, "role"), surface = ownData(request, "surface"), slot = ownData(request, "slot");
        const focus = role === "NEXT_FOCUS" || ["primary.nextFocus", "secondary.nextFocus", "secondary.recommendation"].includes(slot);
        const selector = ownData(request, "engineSelector");
        const forbiddenRule = [ownData(request, "ruleId"), ownData(selector, "ruleId")].some((r) => ["CTX-02", "COND-01"].includes(r));
        const forbiddenKey = [selector, ownData(selector, "key"), ownData(selector, "promptKey")].some((k) => ["analysis.CTX-02.observe", "analysis.COND-01.observe"].includes(k));
        if (focus && (forbiddenRule || forbiddenKey)) reasons.push("FORBIDDEN_RULE_NEXT_FOCUS");
        if (surface === "SECONDARY" && (focus || ["RECOMMENDATION", "ADVICE"].includes(role) || ownData(request, "recommendation") !== void 0 || ownData(request, "advice") !== void 0) || ["secondary.nextFocus", "secondary.recommendation", "secondary.whyThisFocus"].includes(slot)) reasons.push("FORBIDDEN_ROLE");
        const bindings = ownData(request, "bindings");
        if (Array.isArray(bindings)) {
          for (let i = 0; i < bindings.length; i++) {
            if (FORBIDDEN_RAW_SELECTORS.includes(ownData(ownData(bindings, String(i)), "selector"))) reasons.push("FORBIDDEN_BINDING");
          }
        }
        return reasonOrder(reasons);
      }
      function trustedUpstreamHold(e) {
        const safety = ownData(e, "safety"), reference = ownData(e, "inputReference");
        return ownData(e, "engineVersion") === ENGINE_REFERENCE.engineVersion && ownData(e, "specVersion") === "analysis-phase1-proposal-1" && ownData(e, "adapterVersion") === "raw-0.1.0-conservative-v1" && ownData(e, "dictionaryVersion") === "production-v16-31-locales" && ownData(reference, "sourceCommit") === ENGINE_REFERENCE.sourceCommit && ownData(reference, "sourceVersion") === ENGINE_REFERENCE.sourceVersion && ownData(safety, "externalDecision") === "HOLD" && ownData(safety, "releaseStatus") === "NOT_RELEASED_TO_USER" && ownData(safety, "classifierImplemented") === false;
      }
      function cycleField(source, index, field) {
        requireGate(Number.isSafeInteger(index) && index >= 0 && index < source.intent.cycles.length && Object.hasOwn(LEAF_READERS, field));
        return LEAF_READERS[field](source.intent.cycles[index]);
      }
      function evidenceAt(context, index, field) {
        const { c, source } = context, cycle = source.intent.cycles[index], path = `intent.cycles[${index}].${field}`;
        const matches = c.evidence.filter((e) => e.path === path);
        requireGate(matches.length > 0 && matches.every((e) => equal(e, matches[0])));
        const ev = matches[0];
        requireGate(ev.arrayIndex === index && ev.cycleId === cycle.id && ev.createdAt === cycle.createdAt && ev.present === true && equal(ev.rawValue, cycleField(source, index, field)));
        return ev;
      }
      function risEvidence(context, dimension) {
        const matches = context.c.evidence.filter((e2) => e2.path === `intent.ris.${dimension}`);
        requireGate(matches.length > 0 && matches.every((e2) => equal(e2, matches[0])));
        const e = matches[0], raw = RIS_READERS[dimension](context.source.intent.ris);
        requireGate(e.reference === "current_mutable_reference" && equal(e.rawValue, raw) && e.transformation === "NFC_line_endings_outer_trim" && e.derivedValue === frozenEngine.normalizeText(raw));
        return e;
      }
      function conditionAt(context, name) {
        const c = uniqueOne(context.c.ruleEvaluation.conditions.filter((c2) => c2.name === name));
        requireGate(c !== null && c.passed === true, "ENGINE_GATE_UNMET");
        return c;
      }
      function measureAt(context, name) {
        const measure = uniqueOne((context.c.ruleEvaluation.derivedMeasures || []).filter((m) => m.name === name));
        requireGate(measure !== null && Array.isArray(measure.inputPaths));
        return measure;
      }
      function sourceRefs(context, fields, indices = context.indices) {
        return indices.flatMap((arrayIndex) => fields.map((field) => {
          evidenceAt(context, arrayIndex, field);
          return { arrayIndex, cycleId: context.source.intent.cycles[arrayIndex].id, path: `intent.cycles[${arrayIndex}].${field}` };
        }));
      }
      function gateEmotion(context, indices, nonOther) {
        const mappings = indices.map((i) => {
          const ev = evidenceAt(context, i, "iep.emotion"), m = frozenEngine.mapEmotion(ev.rawValue);
          requireGate(ev.transformation === "NFC_line_endings_outer_trim_then_frozen_dictionary_v16" && equal(ev.derivedValue, { category: m.category, status: m.status }));
          requireGate(m.status === "known" && Number.isInteger(m.category) && bounded(m.category, 9) && (!nonOther || m.category !== 9), "ENGINE_GATE_UNMET");
          return m;
        });
        requireGate(mappings.length > 0 && mappings.every((m) => m.category === mappings[0].category), "ENGINE_GATE_UNMET");
        return mappings[0].category;
      }
      function revisionAt(context, i) {
        const decision = evidenceAt(context, i, "intentional").rawValue, patch = evidenceAt(context, i, "revision").rawValue;
        requireGate(decision === "yes" && plainRecord(patch) && Object.keys(patch).length > 0 && Object.keys(patch).every((k) => D.includes(k) && nonblank(patch[k])), "ENGINE_GATE_UNMET");
        return D.filter((d) => Object.hasOwn(patch, d));
      }
      function validateSource(source, e) {
        requireGate(helpersValid() && plainRecord(source) && source.version === ENGINE_REFERENCE.sourceVersion, "INVALID_SOURCE");
        requireGate(engineContract(e, source), "INVALID_SOURCE");
        if (source.intent === null) return;
        const intent = source.intent;
        requireGate(plainRecord(intent) && Array.isArray(intent.cycles) && plainRecord(intent.ris) && nonblank(intent.id) && frozenEngine.parseTimestamp(intent.createdAt).valid, "INVALID_SOURCE");
        const ids = /* @__PURE__ */ new Set();
        let previous = frozenEngine.parseTimestamp(intent.createdAt).milliseconds;
        for (const cycle of intent.cycles) {
          requireGate(plainRecord(cycle) && nonblank(cycle.id) && !ids.has(cycle.id), "INVALID_SOURCE");
          ids.add(cycle.id);
          const stamp = frozenEngine.parseTimestamp(cycle.createdAt);
          requireGate(stamp.valid && stamp.milliseconds >= previous && (ids.size === 1 || stamp.milliseconds > previous), "INVALID_SOURCE");
          previous = stamp.milliseconds;
        }
      }
      function candidateContext(source, engine, surface) {
        const c = surface === "PRIMARY" ? engine.primary : engine.secondary;
        requireGate(plainRecord(c) && c.eligible === true && c.causality === "not_determined" && c.safetyDisposition === "requires_separate_presentation_gate" && STATUSES.includes(c.status) && LEVELS.includes(c.evidenceLevel) && Array.isArray(c.limitations) && COMMON_LIMITS.every((l) => c.limitations.includes(l)) && Array.isArray(c.missingData) && c.missingData.includes("historical_RIS_versions") && Array.isArray(c.exclusionReasons) && c.exclusionReasons.length === 0 && plainRecord(c.ruleEvaluation) && Array.isArray(c.ruleEvaluation.conditions) && c.ruleEvaluation.conditions.length > 0 && c.ruleEvaluation.conditions.every((v) => exactKeys(v, ["name", "observed", "required", "passed", "inputPaths", "formula"]) && typeof v.name === "string" && v.passed === true && Array.isArray(v.inputPaths)) && Array.isArray(c.ruleEvaluation.failedConditions) && c.ruleEvaluation.failedConditions.length === 0 && Array.isArray(c.evidence), "ENGINE_GATE_UNMET");
        requireGate(surface !== "PRIMARY" || c.secondaryOnly === false, "ENGINE_GATE_UNMET");
        requireGate(surface !== "SECONDARY" || c.nextFocus === null && c.whyThisFocus === null, "ENGINE_GATE_UNMET");
        const indices = c.ruleEvaluation.usedArrayIndices;
        requireGate(Array.isArray(indices) && indices.length > 0 && indices.every((i, n) => Number.isSafeInteger(i) && i >= 0 && i < source.intent.cycles.length && (n === 0 || i > indices[n - 1])));
        requireGate(equal(c.ruleEvaluation.usedCycleIds, indices.map((i) => source.intent.cycles[i].id)) && c.priority?.supportingObservations === indices.length && c.priority.evidenceLevel === c.evidenceLevel && c.priority.ruleId === c.ruleId);
        const evaluation = uniqueOne(engine.ruleEvaluations.filter((v) => v.ruleId === c.ruleId && v.candidateId === c.candidateId));
        requireGate(evaluation !== null && evaluation.eligible === true && equal(evaluation.priority, c.priority));
        const evaluationData = Object.fromEntries(Object.entries(evaluation).filter(([k]) => !["ruleId", "candidateId", "eligible", "priority"].includes(k)));
        requireGate(equal(evaluationData, c.ruleEvaluation));
        requireGate(engine.selectionExplanation?.key === "analysis.fixedPriorityTuple" && engine.selectionExplanation.data.selectedCandidate === engine.primary?.candidateId && engine.selectionExplanation.data.secondaryCandidate === (engine.secondary?.candidateId || null) && equal(engine.selectionExplanation.data.selectedTuple, engine.primary?.priority));
        requireGate(plainRecord(c.interpretation) && plainRecord(c.interpretation.data));
        const context = { source, engine, surface, c, indices, data: c.interpretation.data };
        for (const i of indices) {
          evidenceAt(context, i, "id");
          evidenceAt(context, i, "createdAt");
        }
        for (const ev of c.evidence) {
          requireGate(plainRecord(ev) && typeof ev.path === "string");
          const risKey = D.find((d) => ev.path === `intent.ris.${d}`);
          if (risKey) {
            risEvidence(context, risKey);
            continue;
          }
          requireGate(Number.isSafeInteger(ev.arrayIndex) && ev.arrayIndex >= 0 && ev.arrayIndex < source.intent.cycles.length);
          const field = Object.keys(LEAF_READERS).find((f) => ev.path === `intent.cycles[${ev.arrayIndex}].${f}`);
          requireGate(field !== void 0);
          const raw = cycleField(source, ev.arrayIndex, field);
          requireGate(ev.cycleId === source.intent.cycles[ev.arrayIndex].id && ev.createdAt === source.intent.cycles[ev.arrayIndex].createdAt && equal(ev.rawValue, raw === void 0 ? null : raw));
          if (field.startsWith("cie.") && ev.transformation) requireGate(ev.transformation === "NFC_line_endings_outer_trim" && ev.derivedValue === frozenEngine.normalizeText(raw));
          if (field === "createdAt") requireGate(ev.transformation === "strict_ISO_calendar_to_epoch_milliseconds" && ev.derivedValue === frozenEngine.parseTimestamp(raw).milliseconds);
          if (field === "iep.emotion") {
            const m = frozenEngine.mapEmotion(raw);
            requireGate(ev.transformation === m.transformation && equal(ev.derivedValue, { category: m.category, status: m.status }));
          }
          if (field === "oop.evidence" && ev.transformation) requireGate(ev.transformation === "derived_set_then_basisStatus_v1" && Array.isArray(raw) && raw.every((b) => BASES.includes(b)) && equal(ev.derivedValue?.selectedSet, [...new Set(raw)]));
        }
        for (const condition of c.ruleEvaluation.conditions) {
          for (const path of condition.inputPaths) requireGate(c.evidence.some((e) => e.path === path));
        }
        if (surface === "PRIMARY") requireGate(c.whyThisFocus?.key === `analysis.${c.ruleId}.selectionBasis` && equal(c.whyThisFocus.data?.conditionNames, c.ruleEvaluation.conditions.map((v) => v.name)) && plainRecord(c.nextFocus) && c.nextFocus.optional === true && c.nextFocus.releaseStatus === "NOT_RELEASED_TO_USER" && ["observe", "clarify"].includes(c.nextFocus.kind));
        return context;
      }
      var PATTERN_CONDITIONS = Object.freeze([
        "minimum_spaced_observations",
        "traceability",
        "recordedBasisSame",
        "required_inputs_all_intermediate_cycles",
        "POSSIBLE_UNREVIEWED_DEFAULTS"
      ]);
      var CONDITION_NAMES = freezeTrusted({
        "REF-01": ["record_present"],
        "QUAL-01": ["quality_limitation_present"],
        "CMP-01": ["two_adjacent_saved_records", "valid_numeric_pair", "same_known_non_Other_emotion", "boundary", "POSSIBLE_UNREVIEWED_DEFAULTS"],
        "CMP-02": ["valid_frequency_pair", "boundary", "POSSIBLE_UNREVIEWED_DEFAULTS"],
        "TXT-01": ["different_wording"],
        "REV-01": ["latest_explicit_valid_revision"],
        "REV-02": ["minimum_revision_events", "traceability"],
        "INT-01": PATTERN_CONDITIONS,
        "INT-02": [...PATTERN_CONDITIONS, "repeated_wording_differs_from_current_reference"],
        "PRA-01": [...PATTERN_CONDITIONS, "LARGE_STEP_REQUIRES_REPEAT", "down(iep.practical)", "practical_hours_opposed"],
        "PRA-02": [...PATTERN_CONDITIONS, "LARGE_STEP_REQUIRES_REPEAT", "low(iep.practical)"],
        "MEN-01": [...PATTERN_CONDITIONS, "LARGE_STEP_REQUIRES_REPEAT", "low_or_down(iep.mental)"],
        "MEN-02": [...PATTERN_CONDITIONS, "frequency_recurrence_or_decrease"],
        "EMO-01": [...PATTERN_CONDITIONS, "same_uniquely_mapped_emotion_category"],
        "EMO-02": [...PATTERN_CONDITIONS, "LARGE_STEP_REQUIRES_REPEAT", "up_or_down(iep.emotionIntensity)", "same_known_non_Other_emotion"],
        "OUT-01": [...PATTERN_CONDITIONS, "LARGE_STEP_REQUIRES_REPEAT", "up_or_down(oop.achievement)", "outcomeEligible", "opposing_recorded_directions"],
        "OUT-02": [...PATTERN_CONDITIONS, "LARGE_STEP_REQUIRES_REPEAT", "flat(oop.achievement)", "outcomeEligible", "all_directions_none"],
        "REL-01": [
          ...PATTERN_CONDITIONS,
          "outcomeEligible",
          "mixed_evidence",
          "LARGE_STEP_REQUIRES_REPEAT",
          "down(iep.practical)",
          "LARGE_STEP_REQUIRES_REPEAT",
          "flat(oop.achievement)",
          "all_directions_none",
          "no_Hup"
        ],
        "REL-02": [
          ...PATTERN_CONDITIONS,
          "outcomeEligible",
          "mixed_evidence",
          "LARGE_STEP_REQUIRES_REPEAT",
          "up(iep.practical)",
          "LARGE_STEP_REQUIRES_REPEAT",
          "up(oop.achievement)",
          "direction_not_away",
          "no_Hdown"
        ],
        "REL-03": [
          ...PATTERN_CONDITIONS,
          "outcomeEligible",
          "mixed_evidence",
          "LARGE_STEP_REQUIRES_REPEAT",
          "flat(iep.practical)",
          "LARGE_STEP_REQUIRES_REPEAT",
          "flat(oop.achievement)",
          "internal_rating_changed"
        ],
        "CTX-01": [
          ...PATTERN_CONDITIONS,
          "outcomeEligible",
          "mixed_evidence",
          "LARGE_STEP_REQUIRES_REPEAT",
          "flat(iep.practical)",
          "LARGE_STEP_REQUIRES_REPEAT",
          "down(oop.achievement)",
          "directions_not_toward",
          "no_Hup_or_Hdown"
        ],
        "CTX-02": ["recorded_external_text_present"],
        "MIX-01": ["mixed_signal_present"]
      });
      var FOCUS_KEYS = freezeTrusted({
        "QUAL-01": "analysis.observeEventAndBasis",
        "REV-01": "analysis.observeRevisedCriteria",
        "TXT-01": "analysis.checkWordingOrMeaning",
        "INT-02": "analysis.checkWordingOrMeaning",
        "MIX-01": "analysis.clarifyOneRecordedAssessment",
        "CMP-01": "analysis.CMP-01.observe",
        "CMP-02": "analysis.CMP-02.observe",
        "REV-02": "analysis.REV-02.observe",
        "INT-01": "analysis.INT-01.observe",
        "PRA-01": "analysis.PRA-01.observe",
        "PRA-02": "analysis.PRA-02.observe",
        "MEN-01": "analysis.MEN-01.observe",
        "MEN-02": "analysis.MEN-02.observe",
        "EMO-01": "analysis.EMO-01.observe",
        "EMO-02": "analysis.EMO-02.observe",
        "OUT-01": "analysis.OUT-01.observe",
        "OUT-02": "analysis.OUT-02.observe",
        "CTX-01": "analysis.CTX-01.observe",
        "REL-01": "analysis.REL-01.observe",
        "REL-02": "analysis.REL-02.observe",
        "REL-03": "analysis.REL-03.observe"
      });
      function valuesFor(context, field, indices = context.indices) {
        return indices.map((i) => evidenceAt(context, i, field).rawValue);
      }
      function validMeasurement(values, field) {
        if (field === "iep.hours") return values.every((v) => bounded(v, 168));
        if (field === "iep.frequency") return values.every((v) => FREQUENCIES.includes(v));
        if (field === "oop.direction") return values.every((v) => DIRECTIONS.includes(v));
        if (field === "oop.evidence") return values.every((v) => Array.isArray(v) && v.every((b) => BASES.includes(b)));
        return values.every((v) => bounded(v, 10));
      }
      function guardScope(context) {
        const indices = [...new Set(context.c.evidence.filter((e) => Number.isSafeInteger(e.arrayIndex)).map((e) => e.arrayIndex))];
        requireGate(equal(context.c.ruleEvaluation.validatedIntermediateCycleIds, indices.map((i) => context.source.intent.cycles[i].id)));
        return indices;
      }
      function validatePattern(context) {
        const { engine, indices, c } = context, guards = guardScope(context);
        requireGate(indices.length >= 3 && indices.length <= 5 && equal(indices, engine.timeWindow.usedArrayIndices) && equal(c.ruleEvaluation.usedCycleIds, engine.timeWindow.usedCycleIds) && engine.timeWindow.N_spaced === indices.length && engine.segmentation.recordedBasisSame === true && engine.validation.globalTraceabilityDefect === false && guards.length >= indices.length && guards.every((i, n) => n === 0 || i === guards[n - 1] + 1) && guards[0] === indices[0] && guards.at(-1) === indices.at(-1), "ENGINE_GATE_UNMET");
        requireGate(conditionAt(context, "minimum_spaced_observations").observed === indices.length && conditionAt(context, "recordedBasisSame").observed === true, "ENGINE_GATE_UNMET");
        const signature = D.map((d) => frozenEngine.normalizeText(evidenceAt(context, guards[0], `cie.${d}`).rawValue));
        requireGate(signature.every(nonblank), "ENGINE_GATE_UNMET");
        for (const i of guards) {
          requireGate(equal(D.map((d) => frozenEngine.normalizeText(evidenceAt(context, i, `cie.${d}`).rawValue)), signature) && evidenceAt(context, i, "intentional").rawValue === "no" && exactKeys(evidenceAt(context, i, "revision").rawValue, []), "ENGINE_GATE_UNMET");
        }
        const times = indices.map((i) => frozenEngine.parseTimestamp(context.source.intent.cycles[i].createdAt).milliseconds);
        requireGate(times.every((t, n) => n === 0 || t - times[n - 1] >= 6048e5 && t - times[n - 1] <= 24192e5), "ENGINE_GATE_UNMET");
        const required = conditionAt(context, "required_inputs_all_intermediate_cycles");
        requireGate(Array.isArray(required.observed) && equal(required.observed.map((r) => r.arrayIndex), guards) && required.observed.every((r) => Array.isArray(r.invalidPaths) && r.invalidPaths.length === 0));
        return guards;
      }
      function validatePair(context, field) {
        const { indices, source, c } = context;
        requireGate(indices.length === 2 && indices[0] === source.intent.cycles.length - 2 && indices[1] === source.intent.cycles.length - 1 && c.evidenceLevel === "COMPARISON", "ENGINE_GATE_UNMET");
        for (const i of indices) requireGate(evidenceAt(context, i, "intentional").rawValue === "no" && exactKeys(evidenceAt(context, i, "revision").rawValue, []), "ENGINE_GATE_UNMET");
        const signatures = indices.map((i) => D.map((d) => frozenEngine.normalizeText(evidenceAt(context, i, `cie.${d}`).rawValue)));
        requireGate(signatures[0].every(nonblank) && equal(signatures[0], signatures[1]), "ENGINE_GATE_UNMET");
        const values = valuesFor(context, field);
        requireGate(validMeasurement(values, field), "INVALID_BINDING");
        return values;
      }
      function validateNumericPair(context, u) {
        const values = validatePair(context, u[1]);
        const comparison = uniqueOne(context.engine.comparisons.filter((c) => c.ruleId === "CMP-01" && c.metric === u[0]));
        const measure = measureAt(context, "signed_delta");
        const paths = context.indices.map((i) => `intent.cycles[${i}].${u[1]}`), max = u[0] === "hours" ? 168 : 10;
        requireGate(comparison !== null && comparison.comparableBasis === true && equal(comparison.inputPaths, paths) && equal(measure.inputPaths, paths) && comparison.formula === "after-before" && measure.formula === "after-before" && comparison.before === values[0] && comparison.after === values[1] && context.data.before === comparison.before && context.data.after === comparison.after && context.data.delta === comparison.delta && measure.value === comparison.delta && Number.isFinite(comparison.delta) && comparison.delta >= -max && comparison.delta <= max && context.data.changeClass === comparison.changeClass && comparison.limitations.every((l) => context.c.limitations.includes(l)));
        if (u[0] === "emotionIntensity") gateEmotion(context, context.indices, true);
        context.comparison = comparison;
      }
      function validateOutcome(context, guards) {
        const gate = conditionAt(context, "outcomeEligible");
        requireGate(Array.isArray(gate.observed) && equal(gate.observed.map((r) => r.cycleId), guards.map((i) => context.source.intent.cycles[i].id)));
        for (let n = 0; n < guards.length; n++) {
          const i = guards[n], basis = evidenceAt(context, i, "oop.evidence"), achievement = evidenceAt(context, i, "oop.achievement").rawValue, direction = evidenceAt(context, i, "oop.direction").rawValue;
          requireGate(bounded(achievement, 10) && ["toward", "none", "away"].includes(direction) && basis.derivedValue?.basisStatus === "reported" && !basis.rawValue.includes("insufficient") && basis.rawValue.some((b) => ["direct", "documented", "otherPerson", "subjective"].includes(b)) && gate.observed[n].basisStatus === "reported" && gate.observed[n].direction === direction, "ENGINE_GATE_UNMET");
        }
      }
      function validateSeriesMetadata(context, field, dataValues) {
        const values = valuesFor(context, field);
        requireGate(validMeasurement(values, field) && equal(values, dataValues), "INVALID_BINDING");
        const paths = context.indices.map((i) => `intent.cycles[${i}].${field}`);
        const rangeMeasure = measureAt(context, `${field}:range`);
        requireGate(equal(rangeMeasure.inputPaths, paths));
        return values;
      }
      function selectMapping(context) {
        const { c, data, indices, source, surface } = context;
        requireGate(Object.hasOwn(CONDITION_NAMES, c.ruleId) && equal(c.ruleEvaluation.conditions.map((v) => v.name), CONDITION_NAMES[c.ruleId]), "UNMAPPED_ENGINE_KEY");
        let branch = "recorded", metric = null, dimension = null, variant = "recordedObservation";
        const pattern = CONDITION_NAMES[c.ruleId].includes("minimum_spaced_observations");
        const guards = pattern ? validatePattern(context) : guardScope(context);
        if (["REF-01", "QUAL-01", "REV-01", "CTX-02"].includes(c.ruleId)) requireGate(indices.length === 1 && indices[0] === source.intent.cycles.length - 1);
        if (["REF-01", "QUAL-01"].includes(c.ruleId)) requireGate(surface === "PRIMARY", "UNMAPPED_ENGINE_KEY");
        if (c.ruleId === "REF-01") {
          const i = indices[0], emotion = frozenEngine.mapEmotion(evidenceAt(context, i, "iep.emotion").rawValue);
          requireGate(equal(data.emotion, emotion));
          const basis = evidenceAt(context, i, "oop.evidence"), decision = evidenceAt(context, i, "intentional").rawValue, patch = evidenceAt(context, i, "revision").rawValue;
          const defaultProfile = c.limitations.includes("POSSIBLE_UNREVIEWED_DEFAULTS");
          const good = bounded(cycleField(source, i, "oop.achievement"), 10) && ["toward", "none", "away"].includes(cycleField(source, i, "oop.direction")) && basis.derivedValue?.basisStatus === "reported";
          const explicit = decision === "yes" && plainRecord(patch) && Object.keys(patch).length > 0 && Object.keys(patch).every((d) => D.includes(d) && nonblank(patch[d]));
          branch = !good || defaultProfile ? "B1" : explicit ? "B2" : !nonblank(cycleField(source, i, "iep.actions")) ? "B3" : !nonblank(cycleField(source, i, "oop.external")) ? "B4" : "B5";
          requireGate(c.nextFocus.promptKey === B.find((b) => b[0] === branch)[1] && c.nextFocus.kind === "observe", "UNKNOWN_VARIANT");
          variant = emotion.status === "known" ? "CURRENT_KNOWN_CATEGORY" : "CURRENT_CATEGORY_UNAVAILABLE";
          for (const d of D) risEvidence(context, d);
        } else if (c.ruleId === "QUAL-01") {
          requireGate(c.status === "INSUFFICIENT" && conditionAt(context, "quality_limitation_present").observed === true, "ENGINE_GATE_UNMET");
          if (data.defaultProfile === "possible_default_like_recorded_profile") branch = "possible_default_profile";
          else {
            const i = indices[0];
            requireGate(data.defaultProfile === null && (!["reported"].includes(data.basisStatus) || !bounded(cycleField(source, i, "oop.achievement"), 10) || !["toward", "none", "away", "mixed"].includes(cycleField(source, i, "oop.direction"))), "UNKNOWN_VARIANT");
            branch = "insufficient_basis";
          }
        } else if (c.ruleId === "CMP-01") {
          const u = U.find((u2) => c.candidateId === `CMP-01:${u2[0]}`);
          requireGate(u !== void 0 && c.ruleEvaluation.metric === u[0], "UNKNOWN_VARIANT");
          metric = u[0];
          validateNumericPair(context, u);
        } else if (c.ruleId === "CMP-02") {
          metric = "frequency";
          const values = validatePair(context, "iep.frequency");
          requireGate(data.before === values[0] && data.after === values[1] && ["higher_category", "lower_category", "same_category"].includes(data.change), "ENGINE_GATE_UNMET");
          const expected = values[0] === values[1] ? "same_category" : FREQUENCIES.indexOf(values[1]) > FREQUENCIES.indexOf(values[0]) ? "higher_category" : "lower_category";
          requireGate(data.change === expected);
        } else if (c.ruleId === "TXT-01") {
          requireGate(orderedDimensions(data.currentReferenceDifferences) && Array.isArray(data.adjacentWordingDifferences), "ENGINE_GATE_UNMET");
          const last = indices.at(-1);
          for (const d of D) risEvidence(context, d);
          const actual = D.filter((d) => nonblank(cycleField(source, last, `cie.${d}`)) && nonblank(source.intent.ris[d]) && frozenEngine.normalizeText(cycleField(source, last, `cie.${d}`)) !== frozenEngine.normalizeText(source.intent.ris[d]));
          requireGate(equal(data.currentReferenceDifferences, actual));
        } else if (c.ruleId === "INT-01") {
          requireGate(equal(data.normalizedCIESignature, D.map((d) => frozenEngine.normalizeText(cycleField(source, indices[0], `cie.${d}`)))) && data.functionalRetention === "unavailable");
        } else if (c.ruleId === "INT-02") {
          dimension = data.dimension;
          requireGate(D.includes(dimension), "UNKNOWN_VARIANT");
          risEvidence(context, dimension);
          requireGate(data.currentReference === source.intent.ris[dimension] && data.recordedWording === cycleField(source, indices[0], `cie.${dimension}`) && data.semanticDrift === "unavailable" && frozenEngine.normalizeText(data.recordedWording) !== frozenEngine.normalizeText(data.currentReference));
        } else if (["PRA-01", "PRA-02", "MEN-01", "EMO-02", "OUT-01", "OUT-02"].includes(c.ruleId)) {
          const field = ["PRA-01", "PRA-02"].includes(c.ruleId) ? "iep.practical" : c.ruleId === "MEN-01" ? "iep.mental" : c.ruleId === "EMO-02" ? "iep.emotionIntensity" : "oop.achievement";
          validateSeriesMetadata(context, field, data.values);
          if (c.ruleId === "MEN-01") {
            const observed = conditionAt(context, "low_or_down(iep.mental)").observed;
            requireGate(observed.down === true || observed.low === true, "ENGINE_GATE_UNMET");
            branch = observed.down === true ? "decreasing" : "low_range";
          }
          if (["EMO-02", "OUT-01"].includes(c.ruleId)) {
            branch = data.direction;
            requireGate(["increased", "decreased"].includes(branch), "UNKNOWN_VARIANT");
          }
          if (c.ruleId === "EMO-02") {
            gateEmotion(context, guards, true);
            requireGate(equal(
              conditionAt(context, "same_known_non_Other_emotion").observed,
              guards.map((i) => frozenEngine.mapEmotion(cycleField(source, i, "iep.emotion")))
            ));
          }
          if (c.ruleId === "PRA-02") {
            const hours = valuesFor(context, "iep.hours");
            requireGate(validMeasurement(hours, "iep.hours") && equal(data.hours?.values, hours) && equal(c.ruleEvaluation.hoursCorroboration?.values, hours) && equal(c.ruleEvaluation.hoursCorroboration.inputPaths, indices.map((i) => `intent.cycles[${i}].iep.hours`)), "INVALID_BINDING");
          }
          if (["OUT-01", "OUT-02"].includes(c.ruleId)) validateOutcome(context, guards);
          if (c.ruleId === "OUT-02") requireGate(valuesFor(context, "oop.direction").every((d) => d === "none"), "ENGINE_GATE_UNMET");
        } else if (c.ruleId === "MEN-02") {
          requireGate(equal(data.categories, valuesFor(context, "iep.frequency")) && validMeasurement(data.categories, "iep.frequency"));
          branch = data.observation;
          requireGate(["same_category_repeated", "category_decreased"].includes(branch), "UNKNOWN_VARIANT");
        } else if (c.ruleId === "EMO-01") {
          const category = gateEmotion(context, guards, false);
          requireGate(data.category === category && data.otherCategory === (category === 9) && equal(
            conditionAt(context, "same_uniquely_mapped_emotion_category").observed,
            guards.map((i) => frozenEngine.mapEmotion(cycleField(source, i, "iep.emotion")))
          ));
          branch = category === 9 ? "other" : "known_non_other";
        } else if (c.ruleId === "CTX-02") {
          requireGate(surface === "SECONDARY" && c.secondaryOnly === true && conditionAt(context, "recorded_external_text_present").observed === true && nonblank(evidenceAt(context, indices[0], "oop.external").rawValue) && data.literalRecord === cycleField(source, indices[0], "oop.external") && data.semanticClassification === "unavailable", "ENGINE_GATE_UNMET");
        } else if (c.ruleId === "REV-01") {
          const keys = revisionAt(context, indices[0]);
          requireGate(equal(data.selectedDimensions, keys) && data.beforeValues === "unavailable" && equal(conditionAt(context, "latest_explicit_valid_revision").observed.selectedDimensions, keys));
        } else if (c.ruleId === "REV-02") {
          requireGate(count(data.eventCount) && data.eventCount === indices.length && data.eventCount >= 3 && exactKeys(data.dimensionCounts, D) && conditionAt(context, "minimum_revision_events").observed === data.eventCount);
          const events = indices.map((i) => revisionAt(context, i)), eventMeasure = measureAt(context, "revision_event_count");
          requireGate(eventMeasure.value === data.eventCount && equal(eventMeasure.inputPaths, indices.flatMap((i) => [`intent.cycles[${i}].intentional`, `intent.cycles[${i}].revision`])));
          for (const d of D) {
            const m = measureAt(context, `revision_selection_count:${d}`), n = data.dimensionCounts[d];
            requireGate(count(n) && n <= data.eventCount && n === events.filter((keys) => keys.includes(d)).length && m.value === n && equal(m.inputPaths, indices.map((i) => `intent.cycles[${i}].revision`)));
          }
        } else if (["REL-01", "REL-02", "REL-03", "CTX-01"].includes(c.ruleId)) {
          validateOutcome(context, guards);
          validateSeriesMetadata(context, "iep.practical", data.practical);
          validateSeriesMetadata(context, "oop.achievement", data.achievement);
          if (c.ruleId === "REL-03") {
            metric = data.internalSource;
            const i = I.find((i2) => i2[0] === metric);
            requireGate(i !== void 0, "UNKNOWN_VARIANT");
            validateSeriesMetadata(context, i[1], data.internalValues);
            const internal = conditionAt(context, "internal_rating_changed").observed;
            requireGate(internal.branch === metric);
            if (metric === "emotionIntensity") {
              gateEmotion(context, guards, true);
              requireGate(internal.sameKnownNonOtherEmotion === true, "ENGINE_GATE_UNMET");
            }
          }
          if (c.ruleId === "REL-01") requireGate(valuesFor(context, "oop.direction").every((d) => d === "none"), "ENGINE_GATE_UNMET");
        } else if (c.ruleId === "MIX-01") {
          requireGate(c.status === "MIXED" && context.engine.status === "MIXED" && Array.isArray(data.triggers) && data.triggers.length > 0 && data.triggers.every((t) => [
            "decision_patch_conflict",
            "direction_mixed",
            "achievement_direction_opposed",
            "flat_achievement_direction_varied",
            "practical_hours_opposed"
          ].includes(t)) && equal(conditionAt(context, "mixed_signal_present").observed, data.triggers));
          const evaluations = c.ruleEvaluation.triggerEvaluations;
          requireGate(Array.isArray(evaluations) && equal(
            evaluations.map((v) => v.name),
            ["decision_patch_conflict", "direction_mixed", "achievement_direction_opposed", "flat_achievement_direction_varied", "practical_hours_opposed"]
          ) && evaluations.every((v) => v.passed === data.triggers.includes(v.name) && v.inputPaths.every((p) => c.evidence.some((e) => e.path === p))));
          branch = data.triggers.includes("decision_patch_conflict") ? "decision_patch_conflict" : data.triggers.includes("practical_hours_opposed") ? "practical_hours_opposed" : "recorded_direction";
          if (surface === "PRIMARY") requireGate(equal(c.nextFocus.variablePaths, branch === "decision_patch_conflict" ? ["C.intentional", "C.revision"] : branch === "practical_hours_opposed" ? ["C.iep.practical"] : ["C.oop.direction"]));
        }
        const mapping = uniqueOne(MAPPINGS.filter((m) => m.selector.ruleId === c.ruleId && m.selector.candidateId === c.candidateId && m.selector.metric === metric && m.selector.dimension === dimension && m.selector.branch === branch && m.selector.variant === variant && m.allowedSurfaces.includes(surface)));
        requireGate(mapping !== null, "UNKNOWN_VARIANT");
        requireGate(c.titleKey === mapping.selector.key && c.interpretation.key === `analysis.${c.ruleId}.recordedObservation`, "UNMAPPED_ENGINE_KEY");
        requireGate(c.ruleEvaluation.metric === (["CMP-01", "CMP-02"].includes(c.ruleId) ? metric : null), "UNKNOWN_VARIANT");
        if (surface === "PRIMARY" && c.ruleId !== "REF-01") requireGate(c.nextFocus.promptKey === FOCUS_KEYS[c.ruleId] && c.nextFocus.kind === (["QUAL-01", "MIX-01"].includes(c.ruleId) ? "clarify" : "observe"), "UNKNOWN_VARIANT");
        context.mapping = mapping;
        context.guards = guards;
        context.insightEntry = c.ruleId === "REF-01" ? entryByRow(variant === "CURRENT_KNOWN_CATEGORY" ? "E03" : "E02") : c.ruleId === "EMO-01" ? entryByRow(branch === "other" ? "E15" : "E14") : TEMPLATE_REGISTRY.find((e) => e.role === "INSIGHT" && RULE_BY_ROW[e.row] === c.ruleId);
        requireGate(context.insightEntry !== void 0, "UNMAPPED_ENGINE_KEY");
        return context;
      }
      function resolveBinding(context, def) {
        const { mapping, indices, data } = context, metric = mapping.selector.metric;
        const selector = def.selector === null ? def.selectorByMetric[metric] : def.selector;
        requireGate(SELECTOR_TABLE.includes(selector), "INVALID_BINDING");
        const u = U.find((u2) => u2[0] === metric), internal = I.find((i) => i[0] === metric);
        let value, refs = [];
        if (selector === "U.metricLabel" || selector === "U.units" || selector === "U.scope") {
          requireGate(u !== void 0, "UNKNOWN_VARIANT");
          value = selector === "U.metricLabel" ? u[2] : selector === "U.units" ? u[3] : u[4];
        } else if (selector === "I.metricLabel") {
          requireGate(internal !== void 0, "UNKNOWN_VARIANT");
          value = internal[2];
        } else if (selector === "FIXED_FIELDS") value = mapping.fixedFields;
        else if (selector === "SELECTED_RULE") value = mapping.selector.ruleId;
        else if (selector === "ENGINE_ORDINAL") {
          refs = sourceRefs(context, ["iep.frequency"]);
          value = { higher_category: "increased", lower_category: "decreased", same_category: "unchanged" }[data.change];
        } else if (selector === "ENGINE_EMOTION_CURRENT" || selector === "ENGINE_EMOTION_RECURRENT") {
          refs = sourceRefs(context, ["iep.emotion"]);
          value = gateEmotion(context, indices, selector === "ENGINE_EMOTION_RECURRENT");
        } else if (selector === "ENGINE_DIMENSIONS") {
          refs = [...sourceRefs(context, D.map((d) => `cie.${d}`), [indices.at(-1)]), ...D.map((d) => ({ path: risEvidence(context, d).path }))];
          value = data.currentReferenceDifferences.slice();
        } else if (selector === "ENGINE_DIMENSION") {
          refs = [...sourceRefs(context, [`cie.${mapping.selector.dimension}`]), { path: risEvidence(context, mapping.selector.dimension).path }];
          value = data.dimension;
        } else if (selector === "REVISION_KEYS" || selector === "REVISION_EVENT_COUNT" || selector === "REVISION_KEY_COUNTS") {
          refs = sourceRefs(context, ["intentional", "revision"]);
          value = selector === "REVISION_KEYS" ? data.selectedDimensions.slice() : selector === "REVISION_EVENT_COUNT" ? data.eventCount : data.dimensionCounts[def.dimension];
        } else {
          const field = def.field || (context.c.ruleId === "CMP-01" ? u?.[1] : internal?.[1]);
          requireGate(Object.hasOwn(LEAF_READERS, field), "INVALID_BINDING");
          refs = sourceRefs(context, [field]);
          if (selector === `CURRENT(${field})`) {
            requireGate(indices.length === 1);
            value = valuesFor(context, field)[0];
          } else if (selector === `PAIR(${field})`) {
            requireGate(indices.length === 2);
            value = valuesFor(context, field)[def.pairIndex];
          } else if (selector === `ENGINE_DELTA(${field})`) value = context.comparison?.delta;
          else if (selector === `SERIES(${field})`) {
            value = field === "oop.evidence" ? indices.map((i) => {
              const ev = evidenceAt(context, i, field);
              requireGate(Array.isArray(ev.derivedValue?.selectedSet), "INVALID_BINDING");
              return ev.derivedValue.selectedSet.slice();
            }) : valuesFor(context, field);
          } else reject("INVALID_BINDING");
        }
        requireGate(validBindingValue(def, value, context), "INVALID_BINDING");
        return { selector, sourceRefs: refs, value };
      }
      function validBindingValue(def, value, context) {
        const metric = context.mapping.selector.metric, type = def.typeByMetric ? def.typeByMetric[metric] : def.type;
        if (type === "rating" || type === "hours") return bounded(value, type === "hours" ? 168 : 10);
        if (type === "ratingList" || type === "hoursList") return Array.isArray(value) && value.length === context.indices.length && value.every((v) => bounded(v, type === "hoursList" ? 168 : 10));
        if (type === "delta") return typeof value === "number" && Number.isFinite(value) && value >= def.rangeByMetric[metric][0] && value <= def.rangeByMetric[metric][1];
        if (type === "frequency" || type === "direction") return (type === "frequency" ? FREQUENCIES : DIRECTIONS).includes(value);
        if (type === "frequencyList" || type === "directionList") return Array.isArray(value) && value.length === context.indices.length && value.every((v) => (type === "frequencyList" ? FREQUENCIES : DIRECTIONS).includes(v));
        if (type === "basisList") return Array.isArray(value) && value.length === context.indices.length && value.every((group) => Array.isArray(group) && group.every((b) => BASES.includes(b)) && new Set(group).size === group.length);
        if (type === "emotionIndex") return Number.isInteger(value) && bounded(value, 9) && (context.c.ruleId !== "EMO-01" || value !== 9);
        if (type === "dimension") return value === context.mapping.selector.dimension && D.includes(value);
        if (type === "dimensions") return orderedDimensions(value);
        if (type === "count") return count(value) && value <= context.indices.length;
        if (type === "ordinalChange") return ["increased", "decreased", "unchanged"].includes(value);
        if (type === "ruleId") return value === context.mapping.selector.ruleId && value !== "COND-01";
        if (type === "fieldNames") return value === context.mapping.fixedFields;
        if (["metricLabel", "units", "scope"].includes(type)) {
          const u = U.find((u2) => u2[0] === metric), i = I.find((i2) => i2[0] === metric);
          return value === (def.selector === "I.metricLabel" ? i?.[2] : type === "metricLabel" ? u?.[2] : type === "units" ? u?.[3] : u?.[4]);
        }
        return false;
      }
      function expectedEntry(context, slot) {
        if (slot.endsWith(".insight")) return context.insightEntry;
        if (slot.endsWith(".why.values")) return entryByRow("E27");
        if (slot.endsWith(".why.selection")) return entryByRow("E28");
        if (slot.endsWith(".why.limitations")) return entryByRow("E29");
        return null;
      }
      function approvedComponent(request, bindings) {
        return {
          componentId: request.componentId,
          surface: request.surface,
          role: request.role,
          slot: request.slot,
          templateId: request.templateId,
          templateVersion: request.templateVersion,
          bindings
        };
      }
      function evaluateComponent(request, contexts, manifest, engine) {
        requireGate(exactKeys(request, [
          "componentId",
          "surface",
          "role",
          "slot",
          "templateId",
          "templateVersion",
          "ruleId",
          "candidateId",
          "engineSelector",
          "bindings"
        ]), "INVALID_MANIFEST");
        if (request.role === "NEXT_FOCUS" || request.slot === "primary.nextFocus") reject("UNMAPPED_ENGINE_KEY");
        const entry = TEMPLATE_REGISTRY.find((e) => e.templateId === request.templateId);
        requireGate(entry !== void 0, "UNKNOWN_TEMPLATE");
        return evaluateTrustedComponent(request, contexts, manifest, engine, entry);
      }
      function evaluateTrustedComponent(request, contexts, manifest, engine, entry) {
        requireGate(exactKeys(request, [
          "componentId",
          "surface",
          "role",
          "slot",
          "templateId",
          "templateVersion",
          "ruleId",
          "candidateId",
          "engineSelector",
          "bindings"
        ]), "INVALID_MANIFEST");
        requireGate(request.templateId === entry.templateId, "UNKNOWN_TEMPLATE");
        requireGate(request.templateVersion === entry.templateVersion, "UNKNOWN_VERSION");
        if (entry.safetyClassification === "HOLD" || FORBIDDEN_FUNCTIONS.includes(entry.allowedPresentationFunction)) reject("FORBIDDEN_FUNCTION");
        requireGate(entry.safetyClassification === "ALLOW", "UNKNOWN_TEMPLATE");
        requireGate(manifest !== null && manifest.slots.includes(request.slot) && request.componentId === request.slot && entry.manifestMembership.some((m) => m.manifestId === manifest.manifestId && m.slot === request.slot), "INVALID_MANIFEST");
        requireGate(entry.role === request.role && entry.allowedSurfaces.includes(request.surface), "UNMAPPED_ENGINE_KEY");
        let context;
        if (request.slot === "primary.why.capability") {
          requireGate(entry.row === "E30" && request.surface === "PRIMARY" && request.role === "WHY" && request.ruleId === null && request.candidateId === null && equal(request.engineSelector, CAPABILITY_SELECTOR), "UNMAPPED_ENGINE_KEY");
          requireGate(exactKeys(engine.capabilities?.VAQUQA, ["ruleId", "status", "conditionSufficiency"]) && engine.capabilities.VAQUQA.ruleId === "COND-01" && engine.capabilities.VAQUQA.status === "capability_gap" && engine.capabilities.VAQUQA.conditionSufficiency === "unavailable", "ENGINE_GATE_UNMET");
          requireGate(Array.isArray(request.bindings) && request.bindings.length === 0, "INVALID_BINDING");
          return approvedComponent(request, {});
        }
        context = request.surface === "PRIMARY" ? contexts.PRIMARY : request.surface === "SECONDARY" ? contexts.SECONDARY : null;
        requireGate(context !== null && context !== void 0, "ENGINE_GATE_UNMET");
        if (context.error) reject(context.error);
        requireGate(request.ruleId === context.c.ruleId && request.candidateId === context.c.candidateId && request.engineSelector?.key === context.mapping.selector.key, "UNMAPPED_ENGINE_KEY");
        requireGate(equal(request.engineSelector, context.mapping.selector) && entry.engineMappings.some((m) => equal(m.selector, request.engineSelector) && m.allowedSurfaces.includes(request.surface)), "UNKNOWN_VARIANT");
        if (request.role === "NEXT_FOCUS") requireGate(request.surface === "PRIMARY" && ["OBSERVE", "REVIEW", "COMPARE", "CLARIFY", "RECORD"].includes(entry.allowedPresentationFunction), "UNMAPPED_ENGINE_KEY");
        else requireGate(expectedEntry(context, request.slot)?.templateId === request.templateId, "UNKNOWN_VARIANT");
        requireGate(Array.isArray(request.bindings) && request.bindings.length === entry.allowedBindings.length && new Set(request.bindings.map((b) => b.name)).size === entry.allowedBindings.length, "INVALID_BINDING");
        const bindings = {};
        for (const def of entry.allowedBindings) {
          const ref = uniqueOne(request.bindings.filter((b) => b.name === def.name));
          requireGate(ref !== null && exactKeys(ref, ["name", "selector", "sourceRefs"]) && Array.isArray(ref.sourceRefs), "INVALID_BINDING");
          const resolved = resolveBinding(context, def);
          requireGate(ref.selector === resolved.selector, "INVALID_BINDING");
          requireGate(equal(ref.sourceRefs, resolved.sourceRefs), "INVALID_PROVENANCE");
          bindings[def.name] = resolved.value;
        }
        return approvedComponent(request, bindings);
      }
      function safeComponentIdentity(request) {
        const templateId = ownData(request, "templateId"), componentId = ownData(request, "componentId"), surface = ownData(request, "surface"), role = ownData(request, "role"), version = ownData(request, "templateVersion");
        return {
          componentId: KNOWN_SLOTS.includes(componentId) ? componentId : null,
          surface: ["PRIMARY", "SECONDARY", "FALLBACK"].includes(surface) ? surface : null,
          role: ["INSIGHT", "INTERPRETATION", "WHY", "NEXT_FOCUS", "FALLBACK"].includes(role) ? role : null,
          templateId: TEMPLATE_REGISTRY.some((e) => e.templateId === templateId) ? templateId : null,
          templateVersion: Number.isSafeInteger(version) && version > 0 ? version : null
        };
      }
      function failureCode(error) {
        return REASONS.includes(ownData(error, "code")) ? ownData(error, "code") : "BOUNDARY_ERROR";
      }
      function fallbackPresentation() {
        return {
          dtoVersion: "safety-presentation-v1",
          mode: "FALLBACK_ONLY",
          primary: null,
          secondary: null,
          fallback: { templateId: FALLBACK_ID, templateVersion: 1, role: "FALLBACK", bindings: {} }
        };
      }
      function bundlePresentation(components) {
        const makeSurface = (surface) => {
          const selected = components.filter((c) => c.surface === surface);
          if (selected.length === 0) return null;
          const result = { insight: selected.find((c) => c.role === "INSIGHT"), interpretation: null, why: selected.filter((c) => c.role === "WHY") };
          if (surface === "PRIMARY") result.nextFocus = null;
          return result;
        };
        return {
          dtoVersion: "safety-presentation-v1",
          mode: "APPROVED_BUNDLE",
          primary: makeSurface("PRIMARY"),
          secondary: makeSurface("SECONDARY"),
          fallback: null
        };
      }
      function outputResult(verdict, registryAvailable, engineStatus, engineReleaseStatus, results, reasons, approved) {
        const fallback = verdict !== "ALLOW";
        return {
          safetyVersion: SAFETY_VERSION,
          registryVersion: registryAvailable ? REGISTRY_VERSION : null,
          verdict,
          objectiveMeaning: "UNKNOWN",
          causality: "not_determined",
          engineReference: { ...ENGINE_REFERENCE },
          engineStatus,
          engineReleaseStatus,
          componentResults: results,
          bundleReasonCodes: reasonOrder(reasons),
          presentation: fallback ? fallbackPresentation() : bundlePresentation(approved),
          fallbackVerdict: fallback ? "ALLOW" : null,
          persisted: false
        };
      }
      function assessPresentation(input) {
        const bundleReasons = [], componentResults = [], approved = [], holds = [];
        let requests = [], source, engine, plan, registryAvailable = false, engineStatus = null, engineReleaseStatus = null;
        let contexts = {}, manifest = null, dataValid = false;
        try {
          source = ownData(input, "sourceSnapshot");
          engine = ownData(input, "engineResult");
          plan = ownData(input, "presentationPlan");
          if (trustedUpstreamHold(engine)) holds.push("UPSTREAM_HOLD");
          const components = ownData(plan, "components");
          if (Array.isArray(components)) {
            requests = Array.from({ length: components.length }, (_, i) => ownData(components, String(i)));
            for (const request of requests) holds.push(...structuralHolds(request), ...trustedEntryReasons(request));
          }
          registryAvailable = registryValid();
          if (!registryAvailable) bundleReasons.push("REGISTRY_UNAVAILABLE");
          dataValid = exactKeys(input, ["sourceSnapshot", "engineResult", "presentationPlan"]) && plainData(source) && plainData(engine) && plainData(plan);
          if (!dataValid) bundleReasons.push("INVALID_SOURCE");
          if (dataValid) {
            if (engineContract(engine, source)) {
              engineStatus = engine.status;
              engineReleaseStatus = engine.safety.releaseStatus;
            }
            try {
              validateSource(source, engine);
            } catch (error) {
              dataValid = false;
              bundleReasons.push(failureCode(error));
            }
          }
          if (dataValid && registryAvailable) {
            if (engine.primary === null) bundleReasons.push("EMPTY_ANALYTICAL_PLAN");
            else {
              const cap = engine.capabilities?.VAQUQA;
              if (!exactKeys(cap, ["ruleId", "status", "conditionSufficiency"]) || cap.ruleId !== "COND-01" || cap.status !== "capability_gap" || cap.conditionSufficiency !== "unavailable") bundleReasons.push("ENGINE_GATE_UNMET");
              else manifest = MANIFESTS[engine.secondary === null ? 3 : 4];
              for (const surface of ["PRIMARY", "SECONDARY"]) {
                if (surface === "SECONDARY" && engine.secondary === null) continue;
                try {
                  contexts[surface] = selectMapping(candidateContext(source, engine, surface));
                } catch (error) {
                  contexts[surface] = { error: failureCode(error) };
                  bundleReasons.push(failureCode(error));
                }
              }
              if (engine.secondary !== null && engine.secondary?.candidateId === engine.primary?.candidateId) bundleReasons.push("INVALID_PROVENANCE");
            }
            if (!exactKeys(plan, ["policyVersion", "registryVersion", "manifestId", "manifestVersion", "components", "declaredAbsentSlots"])) bundleReasons.push("INVALID_MANIFEST");
            if (plan.policyVersion !== SAFETY_VERSION || plan.registryVersion !== REGISTRY_VERSION) bundleReasons.push("POLICY_VERSION_MISMATCH");
            if (plan.manifestVersion !== 1) bundleReasons.push("UNKNOWN_VERSION");
            if (requests.length === 0) bundleReasons.push("EMPTY_ANALYTICAL_PLAN");
            if (manifest === null || plan.manifestId !== manifest.manifestId || !Array.isArray(plan.components) || !equal(plan.components.map((c) => c?.slot), manifest.slots) || !equal(plan.declaredAbsentSlots, manifest.declaredAbsentSlots) || new Set(plan.components.map((c) => c?.componentId)).size !== plan.components.length) bundleReasons.push("INVALID_MANIFEST");
          }
          for (const request of requests) {
            const result = safeComponentIdentity(request), componentReasons = reasonOrder([...structuralHolds(request), ...trustedEntryReasons(request)]);
            let component = null;
            if (componentReasons.length === 0) {
              if (!dataValid) componentReasons.push("INVALID_SOURCE");
              else if (!registryAvailable) componentReasons.push("REGISTRY_UNAVAILABLE");
              else {
                try {
                  component = evaluateComponent(request, contexts, manifest, engine);
                } catch (error) {
                  componentReasons.push(failureCode(error));
                }
              }
            }
            const hold = componentReasons.some((r) => ["FORBIDDEN_FUNCTION", "FORBIDDEN_ROLE", "FORBIDDEN_BINDING", "FORBIDDEN_RULE_NEXT_FOCUS"].includes(r));
            result.verdict = hold ? "HOLD" : componentReasons.length ? "UNKNOWN" : "ALLOW";
            result.reasonCodes = result.verdict === "ALLOW" ? ["REGISTERED_PRESENTATION"] : reasonOrder(componentReasons);
            componentResults.push(result);
            if (component) approved.push(component);
            if (result.verdict !== "ALLOW") bundleReasons.push(...result.reasonCodes);
          }
        } catch (error) {
          bundleReasons.push("BOUNDARY_ERROR");
        }
        bundleReasons.push(...holds);
        if (!requests.length && !bundleReasons.includes("EMPTY_ANALYTICAL_PLAN")) bundleReasons.push("EMPTY_ANALYTICAL_PLAN");
        const verdict = holds.length || componentResults.some((r) => r.verdict === "HOLD") ? "HOLD" : bundleReasons.length || !manifest || componentResults.length !== manifest.slots.length || componentResults.some((r) => r.verdict !== "ALLOW") ? "UNKNOWN" : "ALLOW";
        if (verdict === "ALLOW") bundleReasons.push("REGISTERED_PRESENTATION");
        return outputResult(verdict, registryAvailable, engineStatus, engineReleaseStatus, componentResults, bundleReasons, approved);
      }
      module.exports = { SAFETY_VERSION, REGISTRY_VERSION, TEMPLATE_REGISTRY, assessPresentation };
    }
  });

  // runtime-core/plain-data.cjs
  var require_plain_data = __commonJS({
    "runtime-core/plain-data.cjs"(exports, module) {
      "use strict";
      var RuntimeCoreFailure = class extends Error {
        constructor(code) {
          super(code);
          this.name = "RuntimeCoreFailure";
          this.code = code;
        }
      };
      function requireContract(ok, code) {
        if (!ok) throw new RuntimeCoreFailure(code);
      }
      var record = (value) => value !== null && typeof value === "object" && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
      var exactKeys = (value, keys) => record(value) && Reflect.ownKeys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
      function visitPlainData(value, code, copy) {
        let result;
        const ancestors = /* @__PURE__ */ new Set();
        const work = [{ value, parent: null, key: null }];
        while (work.length) {
          const item = work.pop();
          if (item.exit) {
            ancestors.delete(item.exit);
            continue;
          }
          const current = item.value;
          let output = current;
          if (current !== null && typeof current === "object") {
            const array = Array.isArray(current), prototype = Object.getPrototypeOf(current);
            requireContract((array ? prototype === Array.prototype : record(current)) && !ancestors.has(current), code);
            const descriptors = Object.getOwnPropertyDescriptors(current);
            const keys = Reflect.ownKeys(descriptors);
            requireContract(keys.every((key) => typeof key === "string"), code);
            const length = array ? descriptors.length.value : null;
            requireContract(!array || keys.length === length + 1, code);
            const children = [];
            for (const key of keys) {
              const descriptor = descriptors[key];
              requireContract(Object.hasOwn(descriptor, "value"), code);
              if (array && key === "length") continue;
              requireContract(descriptor.enumerable && (!array || /^(0|[1-9][0-9]*)$/.test(key) && Number(key) < length), code);
              children.push({ key, value: descriptor.value });
            }
            output = copy ? array ? new Array(length) : Object.create(prototype) : null;
            ancestors.add(current);
            work.push({ exit: current });
            for (let i = children.length - 1; i >= 0; i--)
              work.push({ ...children[i], parent: output });
          } else {
            requireContract(current === null || ["string", "boolean"].includes(typeof current) || typeof current === "number" && Number.isFinite(current), code);
          }
          if (copy) {
            if (item.key === null) result = output;
            else Object.defineProperty(
              item.parent,
              item.key,
              { value: output, enumerable: true, configurable: true, writable: true }
            );
          }
        }
        return result;
      }
      function clonePlainData(value, code) {
        return visitPlainData(value, code, true);
      }
      function assertPlainData(value, code) {
        visitPlainData(value, code, false);
      }
      function equalData(left, right) {
        const work = [[left, right]];
        while (work.length) {
          const [a, b] = work.pop();
          if (Object.is(a, b)) continue;
          if (!a || !b || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) !== Array.isArray(b)) return false;
          const keys = Object.keys(a);
          if (keys.length !== Object.keys(b).length) return false;
          for (const key of keys) {
            if (!Object.hasOwn(b, key)) return false;
            work.push([a[key], b[key]]);
          }
        }
        return true;
      }
      module.exports = { RuntimeCoreFailure, requireContract, record, exactKeys, clonePlainData, assertPlainData, equalData };
    }
  });

  // runtime-core/source-snapshot.cjs
  var require_source_snapshot = __commonJS({
    "runtime-core/source-snapshot.cjs"(exports, module) {
      "use strict";
      var { clonePlainData, RuntimeCoreFailure } = require_plain_data();
      function buildAnalysisSourceSnapshot(committedState) {
        try {
          return clonePlainData(committedState, "SOURCE_NOT_JSON_PLAIN_DATA");
        } catch {
          throw new RuntimeCoreFailure("SOURCE_NOT_JSON_PLAIN_DATA");
        }
      }
      module.exports = { buildAnalysisSourceSnapshot };
    }
  });

  // runtime-core/closed-catalog.cjs
  var require_closed_catalog = __commonJS({
    "runtime-core/closed-catalog.cjs"(exports, module) {
      "use strict";
      var D = ["primary", "success", "scope", "nonGoals", "constraints", "rationale"];
      var U = [
        ["practical", "iep.practical"],
        ["achievement", "oop.achievement"],
        ["mental", "iep.mental"],
        ["hours", "iep.hours"],
        ["desire", "iep.desire"],
        ["belief", "iep.belief"],
        ["emotionIntensity", "iep.emotionIntensity"]
      ];
      var I = [["mental", "iep.mental"], ["emotionIntensity", "iep.emotionIntensity"]];
      var B = [
        "analysis.observeEventAndBasis",
        "analysis.observeRevisedCriteria",
        "analysis.observeActionAndEvent",
        "analysis.observeExternalCircumstance",
        "analysis.observeOwnCriteriaAgain"
      ];
      var X = [
        "decision_patch_conflict",
        "direction_mixed",
        "achievement_direction_opposed",
        "flat_achievement_direction_varied",
        "practical_hours_opposed"
      ];
      var CAPABILITY = {
        capabilityPath: "capabilities.VAQUQA",
        ruleId: "COND-01",
        status: "capability_gap",
        conditionSufficiency: "unavailable"
      };
      var MANIFEST3 = "safety.manifest.primaryFactualWithCapability";
      var MANIFEST4 = "safety.manifest.primaryAndSecondaryFactualWithCapability";
      var ABSENT3 = ["primary.interpretation", "primary.nextFocus", "secondary"];
      var ABSENT4 = [
        "primary.interpretation",
        "primary.nextFocus",
        "secondary.interpretation",
        "secondary.nextFocus",
        "secondary.whyThisFocus"
      ];
      var RULES = [
        "REF-01",
        "QUAL-01",
        "CMP-01",
        "CMP-02",
        "TXT-01",
        "INT-01",
        "INT-02",
        "PRA-01",
        "PRA-02",
        "MEN-01",
        "MEN-02",
        "EMO-01",
        "EMO-02",
        "OUT-01",
        "OUT-02",
        "CTX-01",
        "CTX-02",
        "REV-01",
        "REV-02",
        "REL-01",
        "REL-02",
        "REL-03",
        "MIX-01"
      ];
      var FIXED_ROWS = {
        "QUAL-01": "E04",
        "CMP-01": "E05",
        "CMP-02": "E06",
        "TXT-01": "E07",
        "INT-01": "E08",
        "INT-02": "E09",
        "PRA-01": "E10",
        "PRA-02": "E11",
        "MEN-01": "E12",
        "MEN-02": "E13",
        "EMO-02": "E16",
        "OUT-01": "E17",
        "OUT-02": "E18",
        "CTX-01": "E19",
        "CTX-02": "E20",
        "REV-01": "E21",
        "REV-02": "E22",
        "REL-01": "E23",
        "REL-02": "E24",
        "REL-03": "E25",
        "MIX-01": "E26"
      };
      var MAPPINGS = RULES.flatMap((ruleId, n) => {
        const tuple = (metric = null, dimension = null, branch = "recorded", variant = "recordedObservation") => ({
          ruleId,
          candidateId: ruleId === "CMP-01" || ruleId === "CMP-02" ? `${ruleId}:${metric}` : ruleId === "INT-02" ? `${ruleId}:${dimension}` : ruleId,
          key: `analysis.${ruleId}.title`,
          metric,
          dimension,
          branch,
          variant
        });
        let selectors;
        if (ruleId === "REF-01") selectors = B.flatMap((_, i) => ["CURRENT_CATEGORY_UNAVAILABLE", "CURRENT_KNOWN_CATEGORY"].map((v) => tuple(null, null, `B${i + 1}`, v)));
        else if (ruleId === "QUAL-01") selectors = ["insufficient_basis", "possible_default_profile"].map((b) => tuple(null, null, b));
        else if (ruleId === "CMP-01") selectors = U.map((u) => tuple(u[0]));
        else if (ruleId === "CMP-02") selectors = [tuple("frequency")];
        else if (ruleId === "INT-02") selectors = D.map((d) => tuple(null, d));
        else if (ruleId === "MEN-01") selectors = ["low_range", "decreasing"].map((b) => tuple(null, null, b));
        else if (ruleId === "MEN-02") selectors = ["same_category_repeated", "category_decreased"].map((b) => tuple(null, null, b));
        else if (ruleId === "EMO-01") selectors = ["known_non_other", "other"].map((b) => tuple(null, null, b));
        else if (["EMO-02", "OUT-01"].includes(ruleId)) selectors = ["increased", "decreased"].map((b) => tuple(null, null, b));
        else if (ruleId === "REL-03") selectors = I.map((i) => tuple(i[0]));
        else if (ruleId === "MIX-01") selectors = ["decision_patch_conflict", "practical_hours_opposed", "recorded_direction"].map((b) => tuple(null, null, b));
        else selectors = [tuple()];
        return selectors.map((selector) => ({
          mappingId: `M${String(n + 1).padStart(2, "0")}`,
          selector,
          allowedSurfaces: ["REF-01", "QUAL-01"].includes(ruleId) ? ["PRIMARY"] : ruleId === "CTX-02" ? ["SECONDARY"] : ["PRIMARY", "SECONDARY"]
        }));
      });
      var current = [
        ["desire", "iep.desire"],
        ["belief", "iep.belief"],
        ["mental", "iep.mental"],
        ["practical", "iep.practical"],
        ["intensity", "iep.emotionIntensity"],
        ["achievement", "oop.achievement"],
        ["hours", "iep.hours"],
        ["frequency", "iep.frequency"],
        ["direction", "oop.direction"]
      ].map(([name, field]) => ({ name, selector: `CURRENT(${field})` }));
      var one = (name, selector) => ({ name, selector });
      var series = (name, field) => one(name, `SERIES(${field})`);
      var cochange = [series("practical", "iep.practical"), series("achievement", "oop.achievement")];
      var byMetric = (name, prefix, metrics) => ({
        name,
        selector: null,
        selectorByMetric: Object.fromEntries(metrics.map(([metric, field]) => [metric, `${prefix}(${field})`]))
      });
      var BINDINGS = {
        E01: [],
        E02: current,
        E03: [...current, one("categoryIndex", "ENGINE_EMOTION_CURRENT")],
        E04: [],
        E05: [
          one("metricLabel", "U.metricLabel"),
          one("units", "U.units"),
          one("scope", "U.scope"),
          byMetric("before", "PAIR", U),
          byMetric("after", "PAIR", U),
          byMetric("delta", "ENGINE_DELTA", U)
        ],
        E06: [one("before", "PAIR(iep.frequency)"), one("after", "PAIR(iep.frequency)"), one("ordinalChange", "ENGINE_ORDINAL")],
        E07: [one("dimensions", "ENGINE_DIMENSIONS")],
        E08: [],
        E09: [one("dimension", "ENGINE_DIMENSION")],
        E10: [series("ratings", "iep.practical")],
        E11: [series("ratings", "iep.practical"), series("hours", "iep.hours")],
        E12: [series("ratings", "iep.mental")],
        E13: [series("categories", "iep.frequency")],
        E14: [one("categoryIndex", "ENGINE_EMOTION_RECURRENT")],
        E15: [],
        E16: [series("intensities", "iep.emotionIntensity")],
        E17: [series("ratings", "oop.achievement"), series("directions", "oop.direction"), series("bases", "oop.evidence")],
        E18: [series("ratings", "oop.achievement")],
        E19: cochange,
        E20: [],
        E21: [one("dimensions", "REVISION_KEYS")],
        E22: [one("eventCount", "REVISION_EVENT_COUNT"), ...D.map((d) => one(`${d}Count`, "REVISION_KEY_COUNTS"))],
        E23: cochange,
        E24: cochange,
        E25: [one("metricLabel", "I.metricLabel"), byMetric("internal", "SERIES", I), ...cochange],
        E26: [],
        E27: [one("fieldNames", "FIXED_FIELDS")],
        E28: [one("ruleId", "SELECTED_RULE")],
        E29: [],
        E30: []
      };
      var IDS = [
        "safety.fallback.noInterpretationOrNextFocus",
        "safety.insight.currentRecordedAssessments",
        "safety.insight.currentRecordedAssessmentsAndCategory",
        "safety.insight.assessmentBasisLimitation",
        "safety.insight.numericComparison",
        "safety.insight.frequencyComparison",
        "safety.insight.literalWordingDifferences",
        "safety.insight.normalizedWordingRecurrence",
        "safety.insight.recurringWordingMismatch",
        "safety.insight.practicalRatingDecrease",
        "safety.insight.practicalLowRangeAndHours",
        "safety.insight.mentalEffortRatings",
        "safety.insight.frequencyCategories",
        "safety.insight.knownCategoryRecurrence",
        "safety.insight.otherCategorySelected",
        "safety.insight.sameCategoryIntensityChange",
        "safety.insight.achievementRatingChange",
        "safety.insight.nearbyAchievementRatings",
        "safety.insight.contextSeriesFacts",
        "safety.insight.externalRecordPresent",
        "safety.insight.recordedRevisionSelections",
        "safety.insight.recordedRevisionCounts",
        "safety.insight.practicalDecreaseNearbyAchievement",
        "safety.insight.recordedRatingCoIncrease",
        "safety.insight.internalRatingSeriesFacts",
        "safety.insight.mixedRecordMetadata",
        "safety.why.recordedInformationUsed",
        "safety.why.ruleSelectionBasis",
        "safety.why.recordedDataLimitations",
        "safety.why.conditionAssessmentUnavailable"
      ];
      var ENTRIES = IDS.map((templateId, i) => {
        const row = `E${String(i + 1).padStart(2, "0")}`;
        const mappings = i === 0 ? [] : row === "E30" ? [{ mappingId: "MC", selector: CAPABILITY, allowedSurfaces: ["PRIMARY"] }] : MAPPINGS.filter((m) => ["E27", "E28", "E29"].includes(row) || (["E02", "E03"].includes(row) ? m.selector.ruleId === "REF-01" && m.selector.variant === (row === "E02" ? "CURRENT_CATEGORY_UNAVAILABLE" : "CURRENT_KNOWN_CATEGORY") : ["E14", "E15"].includes(row) ? m.selector.ruleId === "EMO-01" && m.selector.branch === (row === "E14" ? "known_non_other" : "other") : FIXED_ROWS[m.selector.ruleId] === row));
        return {
          row,
          templateId,
          role: i === 0 ? "FALLBACK" : i < 26 ? "INSIGHT" : "WHY",
          bindings: BINDINGS[row],
          mappings
        };
      });
      function freeze(value) {
        if (value && typeof value === "object" && !Object.isFrozen(value)) {
          Object.values(value).forEach(freeze);
          Object.freeze(value);
        }
        return value;
      }
      module.exports = freeze({ D, U, I, B, X, CAPABILITY, MANIFEST3, MANIFEST4, ABSENT3, ABSENT4, MAPPINGS, ENTRIES });
    }
  });

  // runtime-core/presentation-plan.cjs
  var require_presentation_plan = __commonJS({
    "runtime-core/presentation-plan.cjs"(exports, module) {
      "use strict";
      var { RuntimeCoreFailure, requireContract: need, record, exactKeys, assertPlainData, equalData } = require_plain_data();
      var { D, U, I, B, X, CAPABILITY, MANIFEST3, MANIFEST4, ABSENT3, ABSENT4, MAPPINGS, ENTRIES } = require_closed_catalog();
      var POLICY = "safety-v1", REGISTRY = "safety-registry-v1";
      var PROVENANCE = "PLAN_PROVENANCE_MISMATCH", MAPPING = "PLAN_MAPPING_MISMATCH";
      var leaf = (object, key) => record(object) && Object.hasOwn(object, key) ? { present: true, value: object[key] } : { present: false, value: null };
      var LEAVES = Object.freeze({
        id: (c) => leaf(c, "id"),
        createdAt: (c) => leaf(c, "createdAt"),
        intentional: (c) => leaf(c, "intentional"),
        revision: (c) => leaf(c, "revision"),
        "iep.desire": (c) => leaf(c.iep, "desire"),
        "iep.belief": (c) => leaf(c.iep, "belief"),
        "iep.mental": (c) => leaf(c.iep, "mental"),
        "iep.practical": (c) => leaf(c.iep, "practical"),
        "iep.emotionIntensity": (c) => leaf(c.iep, "emotionIntensity"),
        "iep.hours": (c) => leaf(c.iep, "hours"),
        "iep.frequency": (c) => leaf(c.iep, "frequency"),
        "iep.emotion": (c) => leaf(c.iep, "emotion"),
        "iep.actions": (c) => leaf(c.iep, "actions"),
        "oop.achievement": (c) => leaf(c.oop, "achievement"),
        "oop.direction": (c) => leaf(c.oop, "direction"),
        "oop.evidence": (c) => leaf(c.oop, "evidence"),
        "oop.currentState": (c) => leaf(c.oop, "currentState"),
        "oop.events": (c) => leaf(c.oop, "events"),
        "oop.external": (c) => leaf(c.oop, "external"),
        "cie.primary": (c) => leaf(c.cie, "primary"),
        "cie.success": (c) => leaf(c.cie, "success"),
        "cie.scope": (c) => leaf(c.cie, "scope"),
        "cie.nonGoals": (c) => leaf(c.cie, "nonGoals"),
        "cie.constraints": (c) => leaf(c.cie, "constraints"),
        "cie.rationale": (c) => leaf(c.cie, "rationale")
      });
      var RIS = Object.freeze({
        primary: (r) => leaf(r, "primary"),
        success: (r) => leaf(r, "success"),
        scope: (r) => leaf(r, "scope"),
        nonGoals: (r) => leaf(r, "nonGoals"),
        constraints: (r) => leaf(r, "constraints"),
        rationale: (r) => leaf(r, "rationale")
      });
      function unique(rows, code) {
        need(Array.isArray(rows) && rows.length === 1, code);
        return rows[0];
      }
      function immutable(value) {
        const work = [value], seen = /* @__PURE__ */ new Set();
        while (work.length) {
          const v = work.pop();
          if (v && typeof v === "object" && !seen.has(v)) {
            need(Object.isFrozen(v), "PLAN_REGISTRY_MISMATCH");
            seen.add(v);
            work.push(...Object.values(v));
          }
        }
      }
      var bindingIdentity = (b) => b.selector === null ? { name: b.name, selector: null, selectorByMetric: b.selectorByMetric } : { name: b.name, selector: b.selector };
      var mappingIdentity = (m) => ({ mappingId: m.mappingId, selector: m.selector, allowedSurfaces: m.allowedSurfaces });
      function checkRegistry(registry) {
        const code = "PLAN_REGISTRY_MISMATCH";
        assertPlainData(registry, code);
        need(Array.isArray(registry) && registry.length === 30, code);
        immutable(registry);
        return ENTRIES.map((expected) => {
          const entry = unique(registry.filter((e) => e.row === expected.row), code);
          need(entry.templateId === expected.templateId && entry.templateVersion === 1 && entry.role === expected.role && entry.policyVersion === POLICY && entry.registryVersion === REGISTRY && entry.manifestVersion === 1 && entry.safetyClassification === "ALLOW", code);
          need(Array.isArray(entry.engineMappings) && equalData(entry.engineMappings.map(mappingIdentity), expected.mappings), code);
          need(Array.isArray(entry.allowedBindings) && equalData(entry.allowedBindings.map(bindingIdentity), expected.bindings), code);
          const paths = [...new Set(expected.bindings.flatMap((b) => b.selector === null ? Object.values(b.selectorByMetric) : [b.selector]))];
          const surfaces = expected.row === "E01" ? ["FALLBACK"] : ["PRIMARY", "SECONDARY"].filter((s) => expected.mappings.some((m) => m.allowedSurfaces.includes(s)));
          need(equalData(entry.allowedSourcePaths, paths) && equalData(entry.allowedSurfaces, surfaces) && Array.isArray(entry.manifestMembership), code);
          return entry;
        });
      }
      function checkEngine(source, e) {
        const code = "PLAN_ENGINE_IDENTITY_MISMATCH";
        need(record(e) && e.engineVersion === "analysis-phase2a-beta-heuristics-v1" && e.specVersion === "analysis-phase1-proposal-1" && e.adapterVersion === "raw-0.1.0-conservative-v1" && e.dictionaryVersion === "production-v16-31-locales" && e.heuristicStatus === "PRODUCT_HEURISTICS_FOR_BETA" && e.causality === "not_determined" && record(e.inputReference) && e.inputReference.sourceCommit === "255a5d9d27461dcacaebc1bc80ab322dd54b4de8" && e.inputReference.sourceVersion === "0.1.0" && source?.version === "0.1.0" && e.inputReference.referenceProvenance === "current_mutable_RIS_only" && e.inputReference.intentId === (typeof source?.intent?.id === "string" ? source.intent.id : null) && Object.hasOwn(e, "primary") && Object.hasOwn(e, "secondary") && Array.isArray(e.ruleEvaluations) && Array.isArray(e.comparisons), code);
      }
      function selectedContext(source, e, surface) {
        const c = surface === "PRIMARY" ? e.primary : e.secondary;
        need(record(source.intent) && Array.isArray(source.intent.cycles) && record(c) && c.eligible === true && record(c.ruleEvaluation) && Array.isArray(c.ruleEvaluation.conditions) && Array.isArray(c.evidence) && record(c.interpretation) && record(c.interpretation.data), MAPPING);
        need(c.interpretation.key === `analysis.${c.ruleId}.recordedObservation` && (surface === "PRIMARY" ? c.secondaryOnly === false : c.nextFocus === null && c.whyThisFocus === null), MAPPING);
        const indices = c.ruleEvaluation.usedArrayIndices;
        need(Array.isArray(indices) && indices.length > 0 && indices.every((i, n) => Number.isSafeInteger(i) && i >= 0 && i < source.intent.cycles.length && (n === 0 || i > indices[n - 1]) && record(source.intent.cycles[i])), PROVENANCE);
        need(equalData(c.ruleEvaluation.usedCycleIds, indices.map((i) => source.intent.cycles[i].id)) && c.priority?.ruleId === c.ruleId && c.priority.supportingObservations === indices.length && c.priority.evidenceLevel === c.evidenceLevel, PROVENANCE);
        const evaluation = unique(e.ruleEvaluations.filter((v) => v.ruleId === c.ruleId && v.candidateId === c.candidateId), PROVENANCE);
        need(evaluation.eligible === true && equalData(evaluation.priority, c.priority) && equalData(Object.fromEntries(Object.entries(evaluation).filter(([key]) => !["ruleId", "candidateId", "eligible", "priority"].includes(key))), c.ruleEvaluation), PROVENANCE);
        need(e.selectionExplanation?.key === "analysis.fixedPriorityTuple" && e.selectionExplanation.data?.selectedCandidate === e.primary.candidateId && e.selectionExplanation.data.secondaryCandidate === (e.secondary === null ? null : e.secondary.candidateId) && equalData(e.selectionExplanation.data.selectedTuple, e.primary.priority), PROVENANCE);
        const evidence = /* @__PURE__ */ new Map();
        for (const ev of c.evidence) {
          need(record(ev) && typeof ev.path === "string", PROVENANCE);
          if (evidence.has(ev.path)) need(equalData(evidence.get(ev.path), ev), PROVENANCE);
          evidence.set(ev.path, ev);
          const dim = D.find((d) => ev.path === `intent.ris.${d}`);
          if (dim) {
            const raw = RIS[dim](source.intent.ris);
            need(ev.reference === "current_mutable_reference" && ev.transformation === "NFC_line_endings_outer_trim" && equalData(ev.rawValue, raw.value), PROVENANCE);
          } else {
            need(Number.isSafeInteger(ev.arrayIndex) && ev.arrayIndex >= 0 && ev.arrayIndex < source.intent.cycles.length && record(source.intent.cycles[ev.arrayIndex]), PROVENANCE);
            const field = Object.keys(LEAVES).find((f) => ev.path === `intent.cycles[${ev.arrayIndex}].${f}`);
            need(field !== void 0, PROVENANCE);
            const cycle = source.intent.cycles[ev.arrayIndex], raw = LEAVES[field](cycle);
            need(ev.cycleId === cycle.id && ev.createdAt === cycle.createdAt && ev.present === raw.present && equalData(ev.rawValue, raw.value), PROVENANCE);
          }
        }
        need(c.ruleEvaluation.conditions.length > 0 && c.ruleEvaluation.conditions.every((condition2) => record(condition2) && condition2.passed === true && Array.isArray(condition2.inputPaths) && condition2.inputPaths.every((path) => evidence.has(path))), PROVENANCE);
        const context = { source, e, c, surface, indices, evidence, data: c.interpretation.data };
        for (const index of indices) {
          cycleRef(context, index, "id");
          cycleRef(context, index, "createdAt");
        }
        return context;
      }
      function condition(context, name) {
        return unique(context.c.ruleEvaluation.conditions.filter((row) => row.name === name), MAPPING);
      }
      function selectorFor(context) {
        const { c, data } = context;
        let metric = null, dimension = null, branch = "recorded", variant = "recordedObservation";
        if (c.ruleId === "REF-01") {
          const index = B.indexOf(c.nextFocus?.promptKey), emotion = data.emotion;
          need(index >= 0 && record(emotion) && ["known", "ambiguous", "unmapped"].includes(emotion.status), MAPPING);
          need(emotion.status === "known" ? Number.isInteger(emotion.category) && emotion.category >= 0 && emotion.category <= 9 : emotion.category === null, MAPPING);
          branch = `B${index + 1}`;
          variant = emotion.status === "known" ? "CURRENT_KNOWN_CATEGORY" : "CURRENT_CATEGORY_UNAVAILABLE";
          const ev = context.evidence.get(cycleRef(context, context.indices[0], "iep.emotion").path);
          need(equalData(ev.derivedValue, { category: emotion.category, status: emotion.status }), MAPPING);
        } else if (c.ruleId === "QUAL-01") {
          need(data.defaultProfile === null || data.defaultProfile === "possible_default_like_recorded_profile", MAPPING);
          branch = data.defaultProfile === null ? "insufficient_basis" : "possible_default_profile";
        } else if (c.ruleId === "CMP-01" || c.ruleId === "CMP-02") {
          metric = c.ruleEvaluation.metric;
          need(c.ruleId === "CMP-01" ? U.some((u) => u[0] === metric) : metric === "frequency", MAPPING);
        } else if (c.ruleId === "INT-02") {
          dimension = data.dimension;
          need(D.includes(dimension), MAPPING);
        } else if (c.ruleId === "MEN-01") {
          const observed = condition(context, "low_or_down(iep.mental)").observed;
          need(record(observed) && typeof observed.down === "boolean" && typeof observed.low === "boolean" && (observed.down || observed.low), MAPPING);
          branch = observed.down ? "decreasing" : "low_range";
        } else if (c.ruleId === "MEN-02") {
          branch = data.observation;
          need(["same_category_repeated", "category_decreased"].includes(branch), MAPPING);
        } else if (c.ruleId === "EMO-01") {
          need(typeof data.otherCategory === "boolean" && Number.isInteger(data.category) && data.category >= 0 && data.category <= 9 && data.otherCategory === (data.category === 9), MAPPING);
          branch = data.otherCategory ? "other" : "known_non_other";
        } else if (c.ruleId === "EMO-02" || c.ruleId === "OUT-01") {
          branch = data.direction;
          need(["increased", "decreased"].includes(branch), MAPPING);
        } else if (c.ruleId === "REL-03") {
          metric = data.internalSource;
          need(I.some((i) => i[0] === metric), MAPPING);
        } else if (c.ruleId === "MIX-01") {
          need(Array.isArray(data.triggers) && data.triggers.length > 0 && data.triggers.every((t) => X.includes(t)) && new Set(data.triggers).size === data.triggers.length && equalData(condition(context, "mixed_signal_present").observed, data.triggers), MAPPING);
          branch = data.triggers.includes("decision_patch_conflict") ? "decision_patch_conflict" : data.triggers.includes("practical_hours_opposed") ? "practical_hours_opposed" : "recorded_direction";
        }
        need(c.ruleEvaluation.metric === (["CMP-01", "CMP-02"].includes(c.ruleId) ? metric : null), MAPPING);
        const selector = { ruleId: c.ruleId, candidateId: c.candidateId, key: c.titleKey, metric, dimension, branch, variant };
        const mapping = unique(MAPPINGS.filter((m) => equalData(m.selector, selector) && m.allowedSurfaces.includes(context.surface)), MAPPING);
        return mapping.selector;
      }
      function cycleRef(context, arrayIndex, field) {
        const path = `intent.cycles[${arrayIndex}].${field}`, ev = context.evidence.get(path);
        need(Object.hasOwn(LEAVES, field) && ev !== void 0, PROVENANCE);
        const cycle = context.source.intent.cycles[arrayIndex], raw = LEAVES[field](cycle);
        need(raw.present && ev.present === true && ev.arrayIndex === arrayIndex && ev.cycleId === cycle.id && ev.createdAt === cycle.createdAt && equalData(ev.rawValue, raw.value), PROVENANCE);
        return { arrayIndex, cycleId: cycle.id, path };
      }
      function cycleRefs(context, fields, indices = context.indices) {
        return indices.flatMap((index) => fields.map((field) => cycleRef(context, index, field)));
      }
      function risRef(context, dimension) {
        need(D.includes(dimension), PROVENANCE);
        const path = `intent.ris.${dimension}`, ev = context.evidence.get(path), raw = RIS[dimension](context.source.intent.ris);
        need(raw.present && ev !== void 0 && ev.reference === "current_mutable_reference" && equalData(ev.rawValue, raw.value), PROVENANCE);
        return { path };
      }
      var FIELD_SELECTORS = new Map([
        ...[
          "iep.desire",
          "iep.belief",
          "iep.mental",
          "iep.practical",
          "iep.emotionIntensity",
          "oop.achievement",
          "iep.hours",
          "iep.frequency",
          "oop.direction"
        ].map((field) => [`CURRENT(${field})`, { field, prefix: "CURRENT" }]),
        ...[...U.map((u) => u[1]), "iep.frequency"].map((field) => [`PAIR(${field})`, { field, prefix: "PAIR" }]),
        ...U.map(([, field]) => [`ENGINE_DELTA(${field})`, { field, prefix: "ENGINE_DELTA" }]),
        ...[
          "iep.practical",
          "iep.hours",
          "iep.mental",
          "iep.frequency",
          "iep.emotionIntensity",
          "oop.achievement",
          "oop.direction",
          "oop.evidence"
        ].map((field) => [`SERIES(${field})`, { field, prefix: "SERIES" }])
      ]);
      function referencesFor(context, selector, tuple) {
        if (["U.metricLabel", "U.units", "U.scope", "I.metricLabel", "FIXED_FIELDS", "SELECTED_RULE"].includes(selector)) return [];
        if (selector === "ENGINE_ORDINAL") {
          need(context.indices.length === 2, PROVENANCE);
          return cycleRefs(context, ["iep.frequency"]);
        }
        if (selector === "ENGINE_EMOTION_CURRENT" || selector === "ENGINE_EMOTION_RECURRENT") return cycleRefs(context, ["iep.emotion"]);
        if (selector === "ENGINE_DIMENSIONS") {
          const dimensions = context.data.currentReferenceDifferences;
          need(Array.isArray(dimensions) && dimensions.length > 0 && equalData(dimensions, D.filter((d) => dimensions.includes(d))), MAPPING);
          return [...cycleRefs(context, D.map((d) => `cie.${d}`), [context.indices.at(-1)]), ...D.map((d) => risRef(context, d))];
        }
        if (selector === "ENGINE_DIMENSION") return [...cycleRefs(context, [`cie.${tuple.dimension}`]), risRef(context, tuple.dimension)];
        if (["REVISION_KEYS", "REVISION_EVENT_COUNT", "REVISION_KEY_COUNTS"].includes(selector))
          return cycleRefs(context, ["intentional", "revision"]);
        const selected = FIELD_SELECTORS.get(selector);
        need(selected !== void 0, MAPPING);
        if (selected.prefix === "CURRENT") need(context.indices.length === 1, PROVENANCE);
        if (selected.prefix === "PAIR" || selected.prefix === "ENGINE_DELTA") need(context.indices.length === 2, PROVENANCE);
        const refs = cycleRefs(context, [selected.field]);
        if (selected.prefix === "ENGINE_DELTA") {
          const comparison = unique(context.e.comparisons.filter((row) => row.ruleId === "CMP-01" && row.metric === tuple.metric), PROVENANCE);
          const measure = unique(context.c.ruleEvaluation.derivedMeasures?.filter((row) => row.name === "signed_delta"), PROVENANCE);
          need(equalData(comparison.inputPaths, refs.map((r) => r.path)) && equalData(measure.inputPaths, comparison.inputPaths) && equalData(comparison.before, context.data.before) && equalData(comparison.after, context.data.after) && equalData(comparison.delta, context.data.delta) && equalData(measure.value, comparison.delta), PROVENANCE);
        }
        return refs;
      }
      function component(context, entry, slot, manifestId, tuple) {
        need(entry.allowedSurfaces.includes(context.surface) && entry.engineMappings.some((m) => equalData(m.selector, tuple) && m.allowedSurfaces.includes(context.surface)) && entry.manifestMembership.some((m) => m.manifestId === manifestId && m.slot === slot), "PLAN_REGISTRY_MISMATCH");
        const bindings = entry.allowedBindings.map((def) => {
          const selector = def.selector === null ? def.selectorByMetric[tuple.metric] : def.selector;
          return { name: def.name, selector, sourceRefs: referencesFor(context, selector, tuple) };
        });
        return {
          componentId: slot,
          surface: context.surface,
          role: entry.role,
          slot,
          templateId: entry.templateId,
          templateVersion: 1,
          ruleId: tuple.ruleId,
          candidateId: tuple.candidateId,
          engineSelector: { ...tuple },
          bindings
        };
      }
      function surfaceComponents(context, entries, manifestId) {
        const tuple = selectorFor(context);
        const insight = unique(entries.filter((entry) => entry.role === "INSIGHT" && entry.engineMappings.some((m) => equalData(m.selector, tuple) && m.allowedSurfaces.includes(context.surface))), MAPPING);
        const prefix = context.surface === "PRIMARY" ? "primary" : "secondary";
        return [[insight, "insight"], [entries[26], "why.values"], [entries[27], "why.selection"], [entries[28], "why.limitations"]].map(([entry, suffix]) => component(context, entry, `${prefix}.${suffix}`, manifestId, tuple));
      }
      function capabilityComponent(e, entries, manifestId) {
        const capability = e.capabilities?.VAQUQA, entry = entries[29], slot = "primary.why.capability";
        need(exactKeys(capability, ["ruleId", "status", "conditionSufficiency"]) && capability.ruleId === CAPABILITY.ruleId && capability.status === CAPABILITY.status && capability.conditionSufficiency === CAPABILITY.conditionSufficiency, "PLAN_CAPABILITY_MISMATCH");
        need(entry.templateId === "safety.why.conditionAssessmentUnavailable" && entry.role === "WHY" && entry.manifestMembership.some((m) => m.manifestId === manifestId && m.slot === slot), "PLAN_REGISTRY_MISMATCH");
        return {
          componentId: slot,
          surface: "PRIMARY",
          role: "WHY",
          slot,
          templateId: entry.templateId,
          templateVersion: 1,
          ruleId: null,
          candidateId: null,
          engineSelector: { ...CAPABILITY },
          bindings: []
        };
      }
      function buildPresentationPlan(input) {
        try {
          assertPlainData(input, "PLAN_INPUT_NOT_PLAIN_DATA");
          need(exactKeys(input, ["sourceSnapshot", "engineResult", "trustedRegistry"]), "PLAN_INPUT_SHAPE_MISMATCH");
          const { sourceSnapshot: source, engineResult: e, trustedRegistry } = input;
          const entries = checkRegistry(trustedRegistry);
          checkEngine(source, e);
          const envelope = {
            policyVersion: POLICY,
            registryVersion: REGISTRY,
            manifestId: null,
            manifestVersion: 1,
            components: [],
            declaredAbsentSlots: ["primary", "secondary"]
          };
          if (e.primary === null) return envelope;
          need(e.secondary === null || record(e.secondary), MAPPING);
          const manifestId = e.secondary === null ? MANIFEST3 : MANIFEST4;
          const primary = selectedContext(source, e, "PRIMARY");
          const components = [...surfaceComponents(primary, entries, manifestId), capabilityComponent(e, entries, manifestId)];
          if (e.secondary !== null) components.push(...surfaceComponents(selectedContext(source, e, "SECONDARY"), entries, manifestId));
          return { ...envelope, manifestId, components, declaredAbsentSlots: [...e.secondary === null ? ABSENT3 : ABSENT4] };
        } catch (error) {
          if (error instanceof RuntimeCoreFailure) throw error;
          throw new RuntimeCoreFailure("PLAN_INPUT_NOT_PLAIN_DATA");
        }
      }
      module.exports = { buildPresentationPlan };
    }
  });

  // runtime-facade/safety-contract.cjs
  var require_safety_contract = __commonJS({
    "runtime-facade/safety-contract.cjs"(exports, module) {
      "use strict";
      var { assertPlainData, exactKeys, equalData, requireContract: need } = require_plain_data();
      var ENGINE_REFERENCE = Object.freeze({
        codeCommit: "94b112488e576e08495443d93c048a528c39aac7",
        engineVersion: "analysis-phase2a-beta-heuristics-v1",
        sourceCommit: "255a5d9d27461dcacaebc1bc80ab322dd54b4de8",
        sourceVersion: "0.1.0"
      });
      var STATUSES = Object.freeze(["EMPTY", "READY", "LIMITED", "INSUFFICIENT", "MIXED", "SAFETY_HOLD", "UNSUPPORTED_SOURCE"]);
      var nullableString = (value) => value === null || typeof value === "string" && value.length > 0;
      function diagnostic(value) {
        return exactKeys(value, ["componentId", "surface", "role", "templateId", "templateVersion", "verdict", "reasonCodes"]) && nullableString(value.componentId) && nullableString(value.templateId) && (value.surface === null || ["PRIMARY", "SECONDARY", "FALLBACK"].includes(value.surface)) && (value.role === null || ["INSIGHT", "INTERPRETATION", "WHY", "NEXT_FOCUS", "FALLBACK"].includes(value.role)) && (value.templateVersion === null || Number.isSafeInteger(value.templateVersion) && value.templateVersion > 0) && ["ALLOW", "HOLD", "UNKNOWN"].includes(value.verdict) && Array.isArray(value.reasonCodes) && value.reasonCodes.length > 0 && value.reasonCodes.every((code) => typeof code === "string" && code.length > 0);
      }
      function validateSafetyResult(result) {
        const code = "INCOMPATIBLE_SAFETY_RESULT";
        assertPlainData(result, code);
        need(exactKeys(result, [
          "safetyVersion",
          "registryVersion",
          "verdict",
          "objectiveMeaning",
          "causality",
          "engineReference",
          "engineStatus",
          "engineReleaseStatus",
          "componentResults",
          "bundleReasonCodes",
          "presentation",
          "fallbackVerdict",
          "persisted"
        ]), code);
        need(result.safetyVersion === "safety-v1" && result.registryVersion === "safety-registry-v1" && result.objectiveMeaning === "UNKNOWN" && result.causality === "not_determined" && result.persisted === false && equalData(result.engineReference, ENGINE_REFERENCE) && (result.engineStatus === null || STATUSES.includes(result.engineStatus)) && (result.engineReleaseStatus === null || result.engineReleaseStatus === "NOT_RELEASED_TO_USER") && Array.isArray(result.componentResults) && result.componentResults.every(diagnostic) && Array.isArray(result.bundleReasonCodes) && result.bundleReasonCodes.every((value) => typeof value === "string" && value.length > 0), code);
        const presentation = result.presentation;
        need(exactKeys(presentation, ["dtoVersion", "mode", "primary", "secondary", "fallback"]) && presentation.dtoVersion === "safety-presentation-v1", code);
        if (result.verdict === "ALLOW") {
          need(presentation.mode === "APPROVED_BUNDLE" && presentation.primary !== null && presentation.fallback === null && result.fallbackVerdict === null && result.engineStatus !== null && result.engineReleaseStatus === "NOT_RELEASED_TO_USER", code);
        } else {
          need(["HOLD", "UNKNOWN"].includes(result.verdict) && presentation.mode === "FALLBACK_ONLY" && presentation.primary === null && presentation.secondary === null && result.fallbackVerdict === "ALLOW" && exactKeys(presentation.fallback, ["templateId", "templateVersion", "role", "bindings"]) && presentation.fallback.templateId === "safety.fallback.noInterpretationOrNextFocus" && presentation.fallback.templateVersion === 1 && presentation.fallback.role === "FALLBACK" && exactKeys(presentation.fallback.bindings, []), code);
        }
        return presentation;
      }
      module.exports = { validateSafetyResult };
    }
  });

  // runtime-facade/canonical-formatter.cjs
  var require_canonical_formatter = __commonJS({
    "runtime-facade/canonical-formatter.cjs"(exports, module) {
      "use strict";
      var { TEMPLATE_REGISTRY } = require_safety();
      var { assertPlainData, exactKeys, record, equalData, requireContract: need } = require_plain_data();
      var { D } = require_closed_catalog();
      var CODE = "CANONICAL_FORMAT_FAILURE";
      var FREQUENCIES = Object.freeze(["freq0", "freq1", "freq2", "freq3", "freq4", "freq5"]);
      var DIRECTIONS = Object.freeze(["toward", "none", "away", "mixed", "unknown"]);
      var BASES = Object.freeze(["direct", "documented", "otherPerson", "subjective", "insufficient", "other"]);
      var U = Object.freeze([
        ["practical", "practical rating", "0–10 self-report rating", "source-record scope"],
        ["achievement", "achievement rating", "0–10 self-report rating", "source-record scope"],
        ["mental", "mental-effort rating", "0–10 self-report rating", "source-record scope"],
        ["hours", "recorded hours", "hours", "past seven days per record"],
        ["desire", "desire rating", "0–10 self-report rating", "source-record scope"],
        ["belief", "belief rating", "0–10 self-report rating", "source-record scope"],
        ["emotionIntensity", "emotion-intensity rating", "0–10 self-report rating", "source-record scope"]
      ].map(Object.freeze));
      var I = Object.freeze([["mental", "mental-effort"], ["emotionIntensity", "emotion-intensity"]].map(Object.freeze));
      var WHY = Object.freeze([
        "safety.why.recordedInformationUsed",
        "safety.why.ruleSelectionBasis",
        "safety.why.recordedDataLimitations",
        "safety.why.conditionAssessmentUnavailable"
      ]);
      var MF3 = "safety.manifest.primaryFactualWithCapability", MF4 = "safety.manifest.primaryAndSecondaryFactualWithCapability";
      function trustedEntry(templateId, role, surface2) {
        need(Array.isArray(TEMPLATE_REGISTRY) && Object.isFrozen(TEMPLATE_REGISTRY) && TEMPLATE_REGISTRY.length === 30, CODE);
        const matches = TEMPLATE_REGISTRY.filter((entry2) => entry2.templateId === templateId);
        need(matches.length === 1, CODE);
        const entry = matches[0];
        need(Object.isFrozen(entry) && entry.templateVersion === 1 && entry.policyVersion === "safety-v1" && entry.registryVersion === "safety-registry-v1" && entry.safetyClassification === "ALLOW" && entry.role === role && entry.allowedSurfaces.includes(surface2) && typeof entry.canonicalText === "string" && Array.isArray(entry.allowedBindings) && Array.isArray(entry.manifestMembership), CODE);
        return entry;
      }
      function numberText(value) {
        need(typeof value === "number" && Number.isFinite(value), CODE);
        return Object.is(value, -0) ? "-0" : String(value);
      }
      function numeric(value, range, integer = false) {
        need(typeof value === "number" && Number.isFinite(value) && Array.isArray(range) && range.length === 2 && value >= range[0] && value <= range[1] && (!integer || Number.isSafeInteger(value)), CODE);
        return numberText(value);
      }
      function list(value, format) {
        need(Array.isArray(value) && value.length > 0, CODE);
        return value.map(format).join(", ");
      }
      function token(value, values) {
        need(typeof value === "string" && values.includes(value), CODE);
        return value;
      }
      function metricFor(entry, bindings) {
        if (entry.row === "E05") {
          const matches = U.filter((row) => bindings.metricLabel === row[1] && bindings.units === row[2] && bindings.scope === row[3]);
          need(matches.length === 1, CODE);
          return matches[0][0];
        }
        if (entry.row === "E25") {
          const matches = I.filter((row) => row[1] === bindings.metricLabel);
          need(matches.length === 1, CODE);
          return matches[0][0];
        }
        return null;
      }
      function bindingText(def, value, entry, context, metric, bindings) {
        const type = def.typeByMetric ? def.typeByMetric[metric] : def.type;
        const transform = type === "basisList" ? "enum_record_groups_comma_then_semicolon" : type === "dimensions" ? "fixed_D_order_comma_space" : ["ratingList", "hoursList", "frequencyList", "directionList"].includes(type) ? "exact_values_comma_space" : "exact_inert_value";
        need(def.required === true && def.transform === transform, CODE);
        const range = def.rangeByMetric ? def.rangeByMetric[metric] : def.range;
        if (["rating", "hours", "delta"].includes(type)) return numeric(value, range);
        if (type === "ratingList" || type === "hoursList") return list(value, (item) => numeric(item, range));
        if (type === "emotionIndex") {
          need(entry.row !== "E14" || value !== 9, CODE);
          return numeric(value, range, true);
        }
        if (type === "count") {
          need(def.selector !== "REVISION_KEY_COUNTS" || value <= bindings.eventCount, CODE);
          return numeric(value, range, true);
        }
        if (type === "frequency") return token(value, FREQUENCIES);
        if (type === "direction") return token(value, DIRECTIONS);
        if (type === "frequencyList") return list(value, (item) => token(item, FREQUENCIES));
        if (type === "directionList") return list(value, (item) => token(item, DIRECTIONS));
        if (type === "basisList") {
          need(Array.isArray(value) && value.length > 0, CODE);
          return value.map((group) => {
            need(Array.isArray(group) && group.length > 0 && new Set(group).size === group.length, CODE);
            return group.map((item) => token(item, BASES)).join(", ");
          }).join("; ");
        }
        if (type === "dimension") return token(value, D);
        if (type === "dimensions") {
          need(Array.isArray(value) && value.length > 0 && equalData(value, D.filter((d) => value.includes(d))), CODE);
          return value.join(", ");
        }
        if (type === "ordinalChange") return token(value, ["increased", "decreased", "unchanged"]);
        if (type === "ruleId") {
          need(context.insight.allowedRuleIds.length === 1 && value === context.insight.allowedRuleIds[0] && value !== "COND-01", CODE);
          return value;
        }
        if (type === "fieldNames") {
          need(typeof value === "string" && context.insight.engineMappings.every((m) => m.fixedFields === value), CODE);
          return value;
        }
        if (["metricLabel", "units", "scope"].includes(type)) {
          const row = def.selector === "I.metricLabel" ? I.find((i) => i[0] === metric) : U.find((u) => u[0] === metric);
          need(row !== void 0 && value === row[type === "metricLabel" ? 1 : type === "units" ? 2 : 3], CODE);
          return value;
        }
        need(false, CODE);
      }
      function body(entry, bindings, context) {
        const definitions = entry.allowedBindings;
        need(exactKeys(bindings, definitions.map((def) => def.name)) && new Set(definitions.map((def) => def.name)).size === definitions.length, CODE);
        const placeholders = [...entry.canonicalText.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map((match) => match[1]);
        const names = new Set(placeholders);
        need(names.size === definitions.length && definitions.every((def) => names.has(def.name)) && !/[{}]/.test(entry.canonicalText.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, "")), CODE);
        const metric = metricFor(entry, bindings), texts = /* @__PURE__ */ Object.create(null), lengths = [];
        for (const def of definitions) {
          texts[def.name] = bindingText(def, bindings[def.name], entry, context, metric, bindings);
          if (def.type.endsWith("List")) lengths.push(bindings[def.name].length);
        }
        need(lengths.every((length) => length === lengths[0]), CODE);
        return entry.canonicalText.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (_, name) => texts[name]);
      }
      function component(value, slot, surface2, role, manifestId, context, expectedId = null) {
        need(exactKeys(value, ["componentId", "surface", "role", "slot", "templateId", "templateVersion", "bindings"]) && value.componentId === slot && value.slot === slot && value.surface === surface2 && value.role === role && value.templateVersion === 1 && (expectedId === null || value.templateId === expectedId), CODE);
        const entry = trustedEntry(value.templateId, role, surface2);
        need(entry.manifestMembership.some((member) => member.manifestId === manifestId && member.slot === slot), CODE);
        return {
          componentId: slot,
          surface: surface2,
          role,
          slot,
          templateId: entry.templateId,
          templateVersion: 1,
          text: body(entry, value.bindings, context)
        };
      }
      function surface(value, name, manifestId) {
        const primary = name === "PRIMARY", prefix = primary ? "primary" : "secondary";
        need(exactKeys(value, primary ? ["insight", "interpretation", "why", "nextFocus"] : ["insight", "interpretation", "why"]) && value.interpretation === null && (!primary || value.nextFocus === null) && Array.isArray(value.why) && value.why.length === (primary ? 4 : 3) && record(value.insight), CODE);
        const context = { insight: trustedEntry(value.insight.templateId, "INSIGHT", name) };
        const out = [component(value.insight, `${prefix}.insight`, name, "INSIGHT", manifestId, context)];
        const suffixes = ["values", "selection", "limitations", "capability"];
        for (let i = 0; i < value.why.length; i++) out.push(component(
          value.why[i],
          `${prefix}.why.${suffixes[i]}`,
          name,
          "WHY",
          manifestId,
          context,
          WHY[i]
        ));
        return out;
      }
      function formatPresentation(presentation) {
        need(arguments.length === 1, CODE);
        assertPlainData(presentation, CODE);
        need(exactKeys(presentation, ["dtoVersion", "mode", "primary", "secondary", "fallback"]) && presentation.dtoVersion === "safety-presentation-v1", CODE);
        if (presentation.mode === "FALLBACK_ONLY") {
          const fallback = presentation.fallback;
          need(presentation.primary === null && presentation.secondary === null && exactKeys(fallback, ["templateId", "templateVersion", "role", "bindings"]) && fallback.templateId === "safety.fallback.noInterpretationOrNextFocus" && fallback.templateVersion === 1 && fallback.role === "FALLBACK" && exactKeys(fallback.bindings, []), CODE);
          const entry = trustedEntry(fallback.templateId, "FALLBACK", "FALLBACK");
          need(entry.canonicalText === "No interpretation or next focus is shown here." && entry.manifestMembership.some((m) => m.manifestId === "safety.manifest.fallbackOnly" && m.slot === "fallback"), CODE);
          return [{
            componentId: "fallback",
            surface: "FALLBACK",
            role: "FALLBACK",
            slot: "fallback",
            templateId: entry.templateId,
            templateVersion: 1,
            text: body(entry, fallback.bindings, { insight: entry })
          }];
        }
        need(presentation.mode === "APPROVED_BUNDLE" && presentation.primary !== null && presentation.fallback === null && (presentation.secondary === null || record(presentation.secondary)), CODE);
        const manifestId = presentation.secondary === null ? MF3 : MF4;
        const out = surface(presentation.primary, "PRIMARY", manifestId);
        if (presentation.secondary !== null) out.push(...surface(presentation.secondary, "SECONDARY", manifestId));
        return out;
      }
      module.exports = { formatPresentation };
    }
  });

  // runtime-facade/runtime.cjs
  var require_runtime = __commonJS({
    "runtime-facade/runtime.cjs"(exports, module) {
      "use strict";
      var analysis = require_analysis();
      var safety = require_safety();
      var { buildAnalysisSourceSnapshot } = require_source_snapshot();
      var { buildPresentationPlan } = require_presentation_plan();
      var { assertPlainData, exactKeys, requireContract: need } = require_plain_data();
      var { validateSafetyResult } = require_safety_contract();
      var { formatPresentation } = require_canonical_formatter();
      function renderDto(mode, components) {
        need(["APPROVED_BUNDLE", "FALLBACK_ONLY", "UNAVAILABLE"].includes(mode), "RENDER_DTO_FAILURE");
        assertPlainData(components, "RENDER_DTO_FAILURE");
        need(Array.isArray(components) && (mode === "UNAVAILABLE" ? components.length === 0 : mode === "FALLBACK_ONLY" ? components.length === 1 : [5, 9].includes(components.length)), "RENDER_DTO_FAILURE");
        const copied = components.map((c) => {
          need(exactKeys(c, ["componentId", "surface", "role", "slot", "templateId", "templateVersion", "text"]) && ["componentId", "surface", "role", "slot", "templateId", "text"].every((key) => typeof c[key] === "string") && c.templateVersion === 1, "RENDER_DTO_FAILURE");
          return Object.freeze({
            componentId: c.componentId,
            surface: c.surface,
            role: c.role,
            slot: c.slot,
            templateId: c.templateId,
            templateVersion: 1,
            text: c.text
          });
        });
        return Object.freeze({ dtoVersion: "pheisiraetha-render-v1", mode, lang: "en", dir: "ltr", components: Object.freeze(copied) });
      }
      function unavailable() {
        return renderDto("UNAVAILABLE", []);
      }
      var evaluate = Object.freeze({ evaluate(committedState) {
        try {
          if (arguments.length !== 1) return unavailable();
          const sourceSnapshot = buildAnalysisSourceSnapshot(committedState);
          const engineResult = analysis.analyze(sourceSnapshot);
          const presentationPlan = buildPresentationPlan({ sourceSnapshot, engineResult, trustedRegistry: safety.TEMPLATE_REGISTRY });
          const result = safety.assessPresentation({ sourceSnapshot, engineResult, presentationPlan });
          const presentation = validateSafetyResult(result);
          const components = formatPresentation(presentation);
          return renderDto(presentation.mode, components);
        } catch {
          return unavailable();
        }
      } }.evaluate);
      module.exports = { evaluate };
    }
  });

  // entry.cjs
  var require_entry = __commonJS({
    "entry.cjs"() {
      if ("PHEISIRAETHA_ANALYTICS_V1" in globalThis) throw new Error("ANALYTICS_NAMESPACE_COLLISION");
      var { evaluate } = require_runtime();
      Object.defineProperty(globalThis, "PHEISIRAETHA_ANALYTICS_V1", {
        value: Object.freeze({ evaluate }),
        enumerable: true,
        writable: false,
        configurable: false
      });
    }
  });
  require_entry();
})();
