'use strict';

/**
 * Phase 2A: standalone, read-only computation. No production integration.
 * Contract: PHEISIRAETHA_ANALYSIS_ENGINE_SPEC(1).md, 2026-10-01.
 * Every threshold is a frozen Beta Heuristic v1, never statistical confidence.
 * Presentation locale is deliberately unused; all copy is internal key/data.
 */
const ENGINE_VERSION = 'analysis-phase2a-beta-heuristics-v1';
const SOURCE_COMMIT = '255a5d9d27461dcacaebc1bc80ab322dd54b4de8';
const SOURCE_VERSION = '0.1.0';
const DAY = 86400000;
const HEURISTICS = Object.freeze({ minimumSpacing: 7 * DAY, maximumGap: 28 * DAY,
  maximumObservations: 5, flatRatingRange: 1, lowRatingMaximum: 3,
  notableRatingDelta: 2, largeRatingStep: 4, notableHoursDelta: 1,
  flatHoursRange: 0.25 });
const DIMENSIONS = Object.freeze(['primary', 'success', 'scope', 'nonGoals', 'constraints', 'rationale']);
const RATINGS = Object.freeze(['desire', 'belief', 'emotionIntensity', 'mental', 'practical']);
const FREQUENCIES = Object.freeze(['freq0', 'freq1', 'freq2', 'freq3', 'freq4', 'freq5']);
const DIRECTIONS = Object.freeze(['toward', 'none', 'away', 'mixed', 'unknown']);
const BASES = Object.freeze(['direct', 'documented', 'otherPerson', 'subjective', 'insufficient', 'other']);
const DEFAULT_PROFILE_PATHS = Object.freeze([...RATINGS.map(k => `iep.${k}`), 'iep.emotion',
  'iep.frequency', 'iep.actions', 'iep.hours', 'oop.achievement', 'oop.direction',
  'oop.evidence', 'oop.currentState', 'oop.events', 'oop.external']);
const RULE_IDS = Object.freeze(['REF-01', 'QUAL-01', 'CMP-01', 'CMP-02', 'REV-01', 'REV-02',
  'TXT-01', 'INT-01', 'INT-02', 'PRA-01', 'PRA-02', 'MEN-01', 'MEN-02', 'EMO-01',
  'EMO-02', 'OUT-01', 'OUT-02', 'CTX-01', 'CTX-02', 'COND-01', 'REL-01', 'REL-02',
  'REL-03', 'MIX-01']);

// Frozen copy of exactly the 31 production emotion dictionaries at SOURCE_COMMIT.
// This data is independent of presentation locale and has no runtime UI dependency.
const EMOTION_LABELS = {
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
const emotionLookup = new Map();
for (const labels of Object.values(EMOTION_LABELS)) {
  labels.forEach((label, category) => {
    const key = normalizeText(label);
    if (!emotionLookup.has(key)) emotionLookup.set(key, new Set());
    emotionLookup.get(key).add(category);
  });
}

function normalizeText(value) {
  return typeof value === 'string' ? value.normalize('NFC').replace(/\r\n?/g, '\n').trim() : null;
}
function mapEmotion(value) {
  const label = normalizeText(value);
  const categories = emotionLookup.get(label);
  return { rawLabel: typeof value === 'string' ? value : null, normalizedLabel: label,
    category: categories?.size === 1 ? [...categories][0] : null,
    status: categories?.size === 1 ? 'known' : categories ? 'ambiguous' : 'unmapped',
    transformation: 'NFC_line_endings_outer_trim_then_frozen_dictionary_v16' };
}
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const owns = (value, key) => record(value) && Object.hasOwn(value, key);
const unique = values => [...new Set(values)];
const rating = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10;
const hours = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 168;
const nonblank = value => typeof value === 'string' && normalizeText(value) !== '';
const sameSignature = (a, b) => a !== null && b !== null && a.every((v, i) => v === b[i]);
function copy(value, seen = new Set()) {
  if (value === undefined) return null;
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return { unsupportedValue: 'non_json_reference' };
  seen.add(value);
  const result = Array.isArray(value) ? value.map(v => copy(v, seen)) :
    Object.fromEntries(Object.keys(value).map(k => [k, copy(value[k], seen)]));
  seen.delete(value);
  return result;
}

/** Only timezone-qualified ISO calendar timestamps are used for chronology.
 * Ambiguous import-compatible dates remain literal metadata, never reparsed or repaired.
 * Supported precision: minute, second, millisecond; no leap-second/24:00 normalization.
 */
function parseTimestamp(value) {
  if (typeof value !== 'string') return { valid: false, milliseconds: null, reason: 'invalid_timestamp_type' };
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return { valid: false, milliseconds: null, reason: 'ambiguous_or_unsupported_timestamp' };
  // Conversion of regex-validated timestamp digits only; raw ratings are never coerced.
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , zone] = match;
  const year = parseInt(yearText, 10), month = parseInt(monthText, 10), day = parseInt(dayText, 10);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const offsetValid = zone === 'Z' || (zone !== '-00:00' && parseInt(zone.slice(1, 3), 10) <= 23 &&
    parseInt(zone.slice(4, 6), 10) <= 59);
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1] ||
      parseInt(hourText, 10) > 23 || parseInt(minuteText, 10) > 59 ||
      (secondText !== undefined && parseInt(secondText, 10) > 59) || !offsetValid) {
    return { valid: false, milliseconds: null, reason: 'invalid_calendar_timestamp' };
  }
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? { valid: true, milliseconds, reason: null } :
    { valid: false, milliseconds: null, reason: 'invalid_calendar_timestamp' };
}

function field(raw, path, kind, required = false) {
  const parts = path.split('.');
  let parent = raw;
  for (const key of parts.slice(0, -1)) parent = record(parent) ? parent[key] : undefined;
  const exists = owns(parent, parts.at(-1));
  const value = exists ? parent[parts.at(-1)] : undefined;
  let reason = null;
  if (!exists) reason = 'missing_field';
  else if (kind === 'text') reason = typeof value !== 'string' ? 'invalid_type' :
    required && !nonblank(value) ? 'blank_required_text' : null;
  else if (kind === 'rating' || kind === 'hours') reason = typeof value !== 'number' ? 'invalid_type' :
    !Number.isFinite(value) ? 'non_finite_number' : !(kind === 'rating' ? rating(value) : hours(value)) ? 'out_of_range' : null;
  else if (Array.isArray(kind)) reason = !kind.includes(value) ? 'invalid_enum' : null;
  else if (kind === 'evidence') reason = !Array.isArray(value) ? 'invalid_type' :
    !value.every(v => BASES.includes(v)) ? 'invalid_enum' : null;
  return { path, exists, rawValue: value, valid: reason === null, reason };
}
function revisionMetadata(raw, decision) {
  const patch = raw?.revision;
  const keys = record(patch) ? Object.keys(patch) : [];
  const validPatch = record(patch) && keys.every(k => DIMENSIONS.includes(k) && nonblank(patch[k]));
  const empty = validPatch && keys.length === 0;
  const explicit = decision === 'yes' && validPatch && keys.length > 0;
  const conflict = ['no', 'unsure'].includes(decision) ? !validPatch || !empty : decision === 'yes' && !explicit;
  return { validPatch, empty, explicit, conflict,
    validPair: explicit || (['no', 'unsure'].includes(decision) && empty),
    selectedDimensions: DIMENSIONS.filter(k => keys.includes(k)), rawKeys: keys };
}
function basisStatus(value) {
  if (!Array.isArray(value) || !value.every(v => BASES.includes(v))) return 'invalid';
  const set = new Set(value);
  if (set.has('insufficient')) return 'insufficient';
  if (set.size === 0) return 'not_recorded';
  if (['direct', 'documented', 'otherPerson', 'subjective'].some(v => set.has(v))) return 'reported';
  return 'unspecified';
}
function adaptCycle(raw, index) {
  const source = record(raw) ? raw : {};
  const fields = {};
  for (const dimension of DIMENSIONS) fields[`cie.${dimension}`] = field(source, `cie.${dimension}`, 'text', true);
  for (const key of RATINGS) fields[`iep.${key}`] = field(source, `iep.${key}`, 'rating');
  fields['iep.hours'] = field(source, 'iep.hours', 'hours');
  fields['iep.emotion'] = field(source, 'iep.emotion', 'text');
  fields['iep.actions'] = field(source, 'iep.actions', 'text');
  fields['iep.frequency'] = field(source, 'iep.frequency', FREQUENCIES);
  fields['oop.achievement'] = field(source, 'oop.achievement', 'rating');
  fields['oop.direction'] = field(source, 'oop.direction', DIRECTIONS);
  fields['oop.evidence'] = field(source, 'oop.evidence', 'evidence');
  for (const key of ['currentState', 'events', 'external']) fields[`oop.${key}`] = field(source, `oop.${key}`, 'text');
  fields.intentional = field(source, 'intentional', ['yes', 'no', 'unsure']);
  const cieValid = DIMENSIONS.every(k => fields[`cie.${k}`].valid);
  const timestamp = parseTimestamp(source.createdAt);
  const revision = revisionMetadata(source, source.intentional);
  const emotion = mapEmotion(source.iep?.emotion);
  const validIdentity = typeof source.id === 'string' && source.id.trim() !== '';
  const defaultLike = RATINGS.every(k => fields[`iep.${k}`].valid && source.iep[k] === 5) &&
    emotion.status === 'known' && emotion.category === 2 && source.iep?.frequency === 'freq2' &&
    fields['iep.actions'].valid && !nonblank(source.iep.actions) && source.iep.hours === 0 &&
    source.oop?.achievement === 0 && source.oop?.direction === 'none' &&
    fields['oop.evidence'].valid && source.oop.evidence.length === 0 &&
    ['currentState', 'events', 'external'].every(k => fields[`oop.${k}`].valid && !nonblank(source.oop[k]));
  return { raw: source, index, fields, cieValid,
    signature: cieValid ? DIMENSIONS.map(k => normalizeText(source.cie[k])) : null,
    timestamp, revision, emotion, validIdentity, defaultLike,
    structural: record(raw) && record(source.cie) && record(source.iep) && record(source.oop) && record(source.revision),
    identityReasons: [], basisStatus: basisStatus(source.oop?.evidence) };
}
function ref(row, path, transformation, derivedValue) {
  const f = row.fields[path];
  let value;
  if (f) value = f.rawValue;
  else {
    value = row.raw;
    for (const key of path.split('.')) value = record(value) ? value[key] : undefined;
  }
  const result = { cycleId: row.validIdentity ? row.raw.id : null, arrayIndex: row.index,
    createdAt: typeof row.raw.createdAt === 'string' ? row.raw.createdAt : null,
    path: `intent.cycles[${row.index}].${path}`, rawValue: copy(value),
    present: f ? f.exists : value !== undefined };
  if (transformation) { result.transformation = transformation; result.derivedValue = copy(derivedValue); }
  return result;
}
function rowEvidence(rows, paths, comparability = false) {
  const allPaths = unique([...paths, 'id', 'createdAt', ...(comparability ?
    [...DIMENSIONS.map(k => `cie.${k}`), 'intentional', 'revision'] : [])]);
  return rows.flatMap(row => allPaths.map(path => path.startsWith('cie.') && row.fields[path]?.valid ?
    ref(row, path, 'NFC_line_endings_outer_trim', normalizeText(row.fields[path].rawValue)) :
    path === 'iep.emotion' ? ref(row, path, row.emotion.transformation, {category: row.emotion.category, status: row.emotion.status}) :
    path === 'createdAt' ? ref(row, path, 'strict_ISO_calendar_to_epoch_milliseconds', row.timestamp.milliseconds) :
    path === 'oop.evidence' && row.fields[path]?.valid ? ref(row, path, 'derived_set_then_basisStatus_v1',
      { selectedSet: unique(row.raw.oop.evidence), basisStatus: row.basisStatus }) : ref(row, path)));
}
function condition(name, observed, required, passed, inputPaths = [], formula = null) {
  return { name, observed: copy(observed), required: copy(required), passed, inputPaths, formula };
}
function valueAt(row, path) { return row.fields[path]?.rawValue; }
const COMMON_LIMITS = Object.freeze(['self_reported', 'historical_RIS_unavailable', 'rating_confirmation_unrecorded']);
const LEVEL_ORDER = Object.freeze({ EARLY_OBSERVATION: 0, COMPARISON: 1, REPEATED_PATTERN: 2, CONSISTENT_PATTERN: 3 });
const RULE_ORDER = Object.freeze(['REL-01', 'REL-02', 'REL-03', 'CTX-01', 'OUT-01', 'OUT-02',
  'PRA-01', 'PRA-02', 'MEN-01', 'MEN-02', 'EMO-02', 'EMO-01', 'INT-01',
  'CMP-01:practical', 'CMP-01:achievement', 'CMP-01:mental', 'CMP-01:hours', 'CMP-01:desire',
  'CMP-01:belief', 'CMP-01:emotionIntensity', 'CMP-02:frequency', 'INT-02', 'TXT-01', 'REF-01', 'REV-02']);
function makeCandidate(ruleId, domain, concept, group, rows, paths, conditions, data = {}, options = {}) {
  const key = options.metric ? `${ruleId}:${options.metric}` : ruleId;
  const reasons = unique(conditions.filter(c => !c.passed).map(c => c.name));
  const evidenceLevel = options.level || 'EARLY_OBSERVATION';
  const usedRows = options.usedRows || rows;
  const prerequisitePaths = unique([...paths, ...(conditions.some(c => c.name === 'POSSIBLE_UNREVIEWED_DEFAULTS') ? DEFAULT_PROFILE_PATHS : [])]);
  return { ruleId, candidateId: options.dimension ? `${key}:${options.dimension}` : key, domain, concept,
    status: options.status || 'READY', titleKey: `analysis.${ruleId}.title`,
    evidence: rowEvidence(rows, prerequisitePaths, options.comparability || false),
    ruleEvaluation: { usedCycleIds: usedRows.map(r => r.validIdentity ? r.raw.id : null),
      usedArrayIndices: usedRows.map(r => r.index), validatedIntermediateCycleIds: rows.map(r => r.validIdentity ? r.raw.id : null),
      excludedCycles: copy(options.exclusions || []),
      conditions, failedConditions: reasons, metric: options.metric || null },
    interpretation: { key: `analysis.${ruleId}.${options.variant || 'recordedObservation'}`, data: copy(data) },
    nextFocus: { kind: options.focusKind || 'observe', variablePaths: paths.map(p => `C.${p}`),
      promptKey: options.focus || `analysis.${ruleId}.observe`, optional: true,
      releaseStatus: 'NOT_RELEASED_TO_USER' },
    whyThisFocus: { key: `analysis.${ruleId}.selectionBasis`, data: { conditionNames: conditions.map(c => c.name) } },
    evidenceLevel, limitations: unique([...COMMON_LIMITS, ...(options.limitations || [])]),
    missingData: unique(['historical_RIS_versions', 'rating_confirmation_flags', ...(options.missingData || [])]),
    causality: 'not_determined', safetyDisposition: 'requires_separate_presentation_gate',
    eligible: reasons.length === 0, exclusionReasons: reasons,
    secondaryOnly: options.secondaryOnly || false,
    priority: { group, evidenceLevel, supportingObservations: usedRows.length,
      comparisonClass: options.notable ? 'notable_recorded_change' : 'neutral',
      fixedRuleOrder: RULE_ORDER.includes(key) ? RULE_ORDER.indexOf(key) : RULE_ORDER.includes(ruleId) ? RULE_ORDER.indexOf(ruleId) : RULE_ORDER.length,
      ruleId, dimensionIndex: options.dimension ? DIMENSIONS.indexOf(options.dimension) : -1 },
    observedFeatures: options.features || [] };
}
function comparePriority(a, b) {
  const ap = a.priority, bp = b.priority;
  return ap.group - bp.group || LEVEL_ORDER[bp.evidenceLevel] - LEVEL_ORDER[ap.evidenceLevel] ||
    bp.supportingObservations - ap.supportingObservations ||
    Number(bp.comparisonClass === 'notable_recorded_change') - Number(ap.comparisonClass === 'notable_recorded_change') ||
    ap.fixedRuleOrder - bp.fixedRuleOrder || (ap.ruleId < bp.ruleId ? -1 : ap.ruleId > bp.ruleId ? 1 : 0) ||
    ap.dimensionIndex - bp.dimensionIndex;
}

function analyze(snapshot, options = {}) {
  const safetyDecision = ['ALLOW', 'HOLD', 'UNKNOWN'].includes(options?.safetyDecision) ? options.safetyDecision : 'UNKNOWN';
  const result = { specVersion: 'analysis-phase1-proposal-1', engineVersion: ENGINE_VERSION,
    adapterVersion: 'raw-0.1.0-conservative-v1', dictionaryVersion: 'production-v16-31-locales',
    heuristicStatus: 'PRODUCT_HEURISTICS_FOR_BETA', status: 'INSUFFICIENT',
    inputReference: { sourceCommit: SOURCE_COMMIT, sourceVersion: record(snapshot) ? copy(snapshot.version) : null,
      intentId: typeof snapshot?.intent?.id === 'string' ? snapshot.intent.id : null,
      referenceProvenance: 'current_mutable_RIS_only' },
    primary: null, secondary: null, suppressedCandidates: [], selectionExplanation: null,
    limitations: [...COMMON_LIMITS], missingData: [], validation: { issues: [], globalTraceabilityDefect: false },
    segmentation: { currentSegment: [], boundaries: [], recordedBasisSame: false },
    timeWindow: { N_completed: 0, N_spaced: 0, usedCycleIds: [], excludedCycles: [] },
    comparisons: [], ruleEvaluations: [], capabilities: {},
    safety: { externalDecision: safetyDecision, releaseStatus: 'NOT_RELEASED_TO_USER', classifierImplemented: false },
    causality: 'not_determined' };
  if (!record(snapshot) || snapshot.version !== SOURCE_VERSION) {
    result.status = 'UNSUPPORTED_SOURCE';
    result.validation.issues.push({ path: 'version', reason: 'unsupported_source_version' });
    result.selectionExplanation = { key: 'analysis.unsupportedSource', data: {} };
    return result;
  }
  if (snapshot.intent === null) {
    result.status = safetyDecision === 'HOLD' ? 'SAFETY_HOLD' : 'EMPTY';
    result.selectionExplanation = { key: 'analysis.noCompletedObservations', data: {} };
    return result;
  }
  if (!record(snapshot.intent) || !Array.isArray(snapshot.intent.cycles)) {
    result.validation.issues.push({ path: 'intent', reason: 'malformed_intent_or_cycles' });
    result.selectionExplanation = { key: 'analysis.insufficientSource', data: {} };
    return result;
  }
  const intent = snapshot.intent;
  const rows = intent.cycles.map(adaptCycle);
  const issues = result.validation.issues;
  const addIssue = (path, reason, domain = 'traceability') => issues.push({ path, reason, domain });
  const intentTime = parseTimestamp(intent.createdAt);
  if (typeof intent.id !== 'string' || intent.id.trim() === '') addIssue('intent.id', 'invalid_intent_id');
  if (!intentTime.valid) addIssue('intent.createdAt', intentTime.reason);
  const risValid = DIMENSIONS.every(k => nonblank(intent.ris?.[k]));
  for (const k of DIMENSIONS) if (!nonblank(intent.ris?.[k])) addIssue(`intent.ris.${k}`,
    typeof intent.ris?.[k] === 'string' ? 'blank_required_text' : 'missing_or_invalid_reference', 'reference');
  const counts = new Map();
  for (const row of rows) if (row.validIdentity) counts.set(row.raw.id, (counts.get(row.raw.id) || 0) + 1);
  let priorTime = intentTime.valid ? intentTime.milliseconds : null;
  let segmentStart = 0;
  for (const row of rows) {
    const prefix = `intent.cycles[${row.index}]`;
    if (!row.validIdentity) row.identityReasons.push('invalid_cycle_id');
    if (row.validIdentity && counts.get(row.raw.id) > 1) row.identityReasons.push('duplicate_cycle_id');
    if (!row.timestamp.valid) row.identityReasons.push(row.timestamp.reason);
    if (row.timestamp.valid && priorTime !== null && (row.timestamp.milliseconds < priorTime ||
        (row.index > 0 && row.timestamp.milliseconds === priorTime))) row.identityReasons.push('invalid_chronology');
    if (row.timestamp.valid) priorTime = row.timestamp.milliseconds;
    for (const reason of row.identityReasons) addIssue(prefix, reason);
    for (const f of Object.values(row.fields)) if (!f.valid) addIssue(`${prefix}.${f.path}`, f.reason, f.path.split('.')[0]);
    if (!row.structural) addIssue(prefix, 'malformed_record', 'structure');
    if (!row.revision.validPair) addIssue(`${prefix}.revision`, 'invalid_revision_metadata', 'revision');
    if (row.emotion.status !== 'known') addIssue(`${prefix}.iep.emotion`, `${row.emotion.status}_emotion_label`, 'emotion');
    const reasons = [];
    if (row.identityReasons.length) reasons.push('invalid_ordering_or_identity');
    if (!row.cieValid) reasons.push('missing_required_CIE');
    if (!row.revision.validPair || !row.fields.intentional.valid) reasons.push('invalid_revision_metadata');
    if (row.raw.intentional === 'yes') reasons.push('explicit_revision_boundary');
    if (row.raw.intentional === 'unsure') reasons.push('unsure_boundary');
    if (reasons.length) {
      segmentStart = row.index + 1;
      result.segmentation.boundaries.push({ cycleId: row.validIdentity ? row.raw.id : null,
        arrayIndex: row.index, reasons: unique(reasons), includesBoundaryCycle: false });
    } else if (row.index > 0 && rows[row.index - 1].signature && !sameSignature(row.signature, rows[row.index - 1].signature)) {
      segmentStart = row.index;
      result.segmentation.boundaries.push({ cycleId: row.raw.id, arrayIndex: row.index,
        reasons: ['changed_CIE_signature'], includesBoundaryCycle: true });
    }
  }
  result.validation.globalTraceabilityDefect = issues.some(i => i.domain === 'traceability');
  // Completed = traceable saved record with required containers/CIE/decision/patch.
  // Measurements are validated separately so one invalid field cannot erase other domains.
  result.timeWindow.N_completed = rows.filter(r => r.identityReasons.length === 0 && r.structural &&
    r.cieValid && r.fields.intentional.valid && r.revision.validPair).length;
  result.validation.fullyValidCycleCount = rows.filter(r => r.identityReasons.length === 0 &&
    r.structural && Object.values(r.fields).every(f => f.valid) && r.revision.validPair).length;
  const segment = rows.slice(segmentStart);
  result.segmentation.currentSegment = segment.map(r => ({ cycleId: r.raw.id, arrayIndex: r.index }));
  result.segmentation.recordedBasisSame = segment.length > 0 && segment.every(r =>
    sameSignature(r.signature, segment[0].signature) && r.raw.intentional === 'no' && r.revision.empty);
  const reverseWindow = [];
  const exclusions = result.timeWindow.excludedCycles;
  for (let i = segment.length - 1; i >= 0 && reverseWindow.length < HEURISTICS.maximumObservations; i--) {
    const row = segment[i];
    if (!row.timestamp.valid) break;
    const gap = reverseWindow.length ? reverseWindow.at(-1).timestamp.milliseconds - row.timestamp.milliseconds : null;
    if (gap !== null && gap < HEURISTICS.minimumSpacing) {
      exclusions.push({ cycleId: row.raw.id, arrayIndex: row.index, reason: 'overlapping_7_day_reporting_window', gapMilliseconds: gap });
      continue;
    }
    if (gap !== null && gap > HEURISTICS.maximumGap) {
      exclusions.push({ cycleId: row.raw.id, arrayIndex: row.index, reason: 'long_observation_gap', gapMilliseconds: gap });
      break;
    }
    reverseWindow.push(row);
  }
  const window = reverseWindow.reverse();
  result.timeWindow.N_spaced = window.length;
  result.timeWindow.usedCycleIds = window.map(r => r.raw.id);
  result.timeWindow.usedArrayIndices = window.map(r => r.index);
  result.timeWindow.minimumSpacingMilliseconds = HEURISTICS.minimumSpacing;
  result.timeWindow.maximumGapMilliseconds = HEURISTICS.maximumGap;
  result.timeWindow.formulas = {
    N_completed: 'count(traceable saved records with required containers, CIE, valid decision/patch); field measurements validated separately',
    N_spaced: 'latest-to-earliest greedy selection; gap>=604800000ms, stop if next spaced gap>2419200000ms; maximum5',
    inputPaths: ['intent.createdAt', 'intent.cycles[*].id', 'intent.cycles[*].createdAt',
      'intent.cycles[*].cie', 'intent.cycles[*].intentional', 'intent.cycles[*].revision']
  };
  const scope = window.length ? rows.slice(window[0].index, window.at(-1).index + 1) : [];
  const patternLevel = window.length === 5 ? 'CONSISTENT_PATTERN' : 'REPEATED_PATTERN';
  const patternExclusions = [...exclusions, ...(window.length === 4 ? [{ cycleId: window[0].raw.id,
    arrayIndex: window[0].index, reason: 'four_observation_trend_uses_latest_three_only', guardScopeRetained: true }] : [])];
  const candidates = [];
  const latest = rows.at(-1);
  const active = [latest].filter(Boolean);
  const valids = (paths, selectedRows = scope) => selectedRows.length > 0 &&
    selectedRows.every(r => paths.every(p => r.fields[p]?.valid));
  const goodBasis = selectedRows => selectedRows.length > 0 && selectedRows.every(r =>
    r.fields['oop.achievement'].valid && r.fields['oop.direction'].valid &&
    ['toward', 'none', 'away'].includes(r.raw.oop.direction) && r.basisStatus === 'reported');
  const patternGate = paths => [
    condition('minimum_spaced_observations', window.length, '>=3', window.length >= 3),
    condition('traceability', issues.filter(i => i.domain === 'traceability'), 'valid identities and chronology', !result.validation.globalTraceabilityDefect),
    condition('recordedBasisSame', result.segmentation.recordedBasisSame, true, result.segmentation.recordedBasisSame,
      scope.flatMap(r => [...DIMENSIONS.map(k => `intent.cycles[${r.index}].cie.${k}`),
        `intent.cycles[${r.index}].intentional`, `intent.cycles[${r.index}].revision`]),
      'all six normalized CIE values equal throughout scope; all no; all patches empty'),
    condition('required_inputs_all_intermediate_cycles', scope.map(r => ({ arrayIndex: r.index,
      invalidPaths: paths.filter(p => !r.fields[p]?.valid) })), 'all valid', valids(paths),
      scope.flatMap(r => paths.map(p => `intent.cycles[${r.index}].${p}`))),
    condition('POSSIBLE_UNREVIEWED_DEFAULTS', scope.filter(r => r.defaultLike).map(r => r.raw.id), 'none', !scope.some(r => r.defaultLike),
      scope.flatMap(r => DEFAULT_PROFILE_PATHS.map(p => `intent.cycles[${r.index}].${p}`)),
      'exact complete default-like IEP/OOP profile; no inference about whether answers were reviewed')
  ];
  const patternOptions = extra => ({ level: patternLevel, usedRows: window, comparability: true, exclusions: patternExclusions, ...extra });
  function series(path) {
    const valid = valids([path]);
    const values = valid ? window.map(r => valueAt(r, path)) : [];
    const adjacent = values.slice(1).map((v, i) => v - values[i]);
    const largeStep = adjacent.some(d => Math.abs(d) >= HEURISTICS.largeRatingStep);
    const used = values.length === 4 ? values.slice(-3) : values;
    const deltas = used.slice(1).map((v, i) => v - used[i]);
    const five = used.length === 5;
    const first = five ? (used[0] + used[1]) / 2 : used[0];
    const last = five ? (used[3] + used[4]) / 2 : used.at(-1);
    const down = valid && window.length >= 3 && !largeStep && (five ? first - last >= 2 &&
      deltas.filter(d => d <= -1).length >= 3 && !deltas.some(d => d >= 2) :
      first - last >= 2 && deltas.length === 2 && deltas.every(d => d <= -1));
    const up = valid && window.length >= 3 && !largeStep && (five ? last - first >= 2 &&
      deltas.filter(d => d >= 1).length >= 3 && !deltas.some(d => d <= -2) :
      last - first >= 2 && deltas.length === 2 && deltas.every(d => d >= 1));
    const range = values.length ? Math.max(...values) - Math.min(...values) : null;
    return { path, valid, values, adjacent, trendValues: used, trendDeltas: deltas, first, last, down, up, largeStep, range,
      flat: valid && window.length >= 3 && !largeStep && range <= 1,
      low: valid && window.length >= 3 && !largeStep && values.every(v => v <= 3) };
  }
  function metricCondition(s, predicate) {
    return condition(`${predicate}(${s.path})`, { values: s.values, trendValues: s.trendValues,
      deltas: s.trendDeltas, range: s.range, endpointOrMidpointChange: s.valid && s.first !== undefined ? s.last - s.first : null },
    predicate === 'down' || predicate === 'up' ? window.length === 5 ?
      'midpoint difference >=2; >=3 steps >=1 in selected direction; no opposite step >=2' :
      'latest 3: endpoint change >=2; both steps >=1 in selected direction' : predicate === 'flat' ? 'range<=1' : 'each<=3',
    s[predicate], window.map(r => `intent.cycles[${r.index}].${s.path}`),
    predicate === 'flat' ? 'max(values)-min(values)' : predicate === 'low' ? 'every(value<=3)' :
      window.length === 5 ? '(x4+x5)/2-(x1+x2)/2; adjacent deltas' : 'x3-x1; adjacent deltas');
  }
  function stepCondition(s) { return condition('LARGE_STEP_REQUIRES_REPEAT', s.adjacent, 'all abs(delta)<4',
    !s.largeStep, window.map(r => `intent.cycles[${r.index}].${s.path}`), 'adjacent selected rating differences'); }
  const practical = series('iep.practical'), mental = series('iep.mental'), achievement = series('oop.achievement'), intensity = series('iep.emotionIntensity');
  function ratingMeasures(s) {
    const inputPaths = window.map(r => `intent.cycles[${r.index}].${s.path}`);
    return [
      { name: `${s.path}:range`, value: s.range, inputPaths, formula: 'max(selected values)-min(selected values)' },
      { name: `${s.path}:adjacentDeltas`, value: s.adjacent, inputPaths, formula: 'x[i+1]-x[i] for all selected observations, including fourth guard observation' },
      { name: `${s.path}:trendDeltas`, value: s.trendDeltas, inputPaths: window.slice(window.length === 4 ? 1 : 0).map(r => `intent.cycles[${r.index}].${s.path}`),
        formula: 'x[i+1]-x[i]; N=4 uses latest3, N=5 uses all5' },
      { name: `${s.path}:trendChange`, value: s.valid && s.first !== undefined ? s.last - s.first : null,
        inputPaths: window.slice(window.length === 4 ? 1 : 0).map(r => `intent.cycles[${r.index}].${s.path}`),
        formula: window.length === 5 ? '(x4+x5)/2-(x1+x2)/2' : 'x3-x1 on latest3' }
    ];
  }
  const hoursValid = valids(['iep.hours']);
  const hourValues = hoursValid ? window.map(r => r.raw.iep.hours) : [];
  const hourDeltas = hourValues.slice(1).map((v, i) => v - hourValues[i]);
  const hoursEndpoint = hourValues.length >= 2 ? hourValues.at(-1) - hourValues[0] : null;
  const hoursUp = hoursValid && hourValues.length >= 2 && hourDeltas.every(d => d >= 0) && hoursEndpoint >= 1;
  const hoursDown = hoursValid && hourValues.length >= 2 && hourDeltas.every(d => d <= 0) && hoursEndpoint <= -1;
  const hoursRange = hourValues.length ? Math.max(...hourValues) - Math.min(...hourValues) : null;
  const hoursStatus = !hoursValid ? 'unavailable' : hoursUp ? 'up' : hoursDown ? 'down' : hoursRange <= 0.25 ? 'flat' : 'varied';
  const outcomeEligible = result.segmentation.recordedBasisSame && goodBasis(scope);
  const sameEmotion = scope.length > 0 && scope.every(r => r.emotion.status === 'known' && r.emotion.category === scope[0].emotion.category);
  const knownNonOtherEmotion = sameEmotion && scope[0].emotion.category !== 9;
  const directions = valids(['oop.direction']) ? window.map(r => r.raw.oop.direction) : [];
  const mixedTriggers = [];
  if (latest?.revision.conflict) mixedTriggers.push('decision_patch_conflict');
  if (latest?.fields['oop.direction'].valid && latest.raw.oop.direction === 'mixed') mixedTriggers.push('direction_mixed');
  const patternBasePass = patternGate([]).every(c => c.passed);
  if (patternBasePass && outcomeEligible) {
    if ((achievement.down && directions.includes('toward')) || (achievement.up && directions.includes('away'))) mixedTriggers.push('achievement_direction_opposed');
    if (achievement.flat && directions.some(d => ['toward', 'away'].includes(d))) mixedTriggers.push('flat_achievement_direction_varied');
  }
  if (patternBasePass && hoursValid && ((practical.down && hoursUp) || (practical.up && hoursDown))) mixedTriggers.push('practical_hours_opposed');
  const mixedCondition = condition('mixed_evidence', mixedTriggers, 'no dependent mixed signals', mixedTriggers.length === 0);
  const outcomePaths = ['oop.achievement', 'oop.direction', 'oop.evidence'];
  const outcomeCondition = condition('outcomeEligible', scope.map(r => ({ cycleId: r.raw.id,
    basisStatus: r.basisStatus, direction: r.raw.oop?.direction })), 'same basis; valid rating; reported basis; toward/none/away', outcomeEligible,
    scope.flatMap(r => outcomePaths.map(p => `intent.cycles[${r.index}].${p}`)), 'basisStatus and recordedBasisSame gates');
  const hourGuard = (name, passed) => condition(name, { status: hoursStatus, values: hourValues, deltas: hourDeltas,
    endpointChange: hoursEndpoint, range: hoursRange }, 'valid hours and specified nonopposition', hoursValid && passed,
    scope.map(r => `intent.cycles[${r.index}].iep.hours`), 'monotone adjacent deltas; abs(endpoint)>=1h; flat range<=0.25h');

  if (!latest) {
    result.status = issues.length ? 'INSUFFICIENT' : safetyDecision === 'HOLD' ? 'SAFETY_HOLD' : 'EMPTY';
    result.selectionExplanation = { key: 'analysis.noCompletedObservations', data: {} };
    return result;
  }
  const latestOutcomeGood = goodBasis(active);
  const defaultLimits = latest.defaultLike ? ['POSSIBLE_UNREVIEWED_DEFAULTS'] : [];
  // A valid declared mixed direction is a MIX-01 signal, not a QUAL-01 defect.
  const qualityOutcomeProblem = latest.basisStatus !== 'reported' || !latest.fields['oop.achievement'].valid ||
    !latest.fields['oop.direction'].valid || latest.raw.oop?.direction === 'unknown';
  const qualifier = latest.defaultLike || qualityOutcomeProblem || !latest.cieValid || !latest.structural ||
    Object.values(latest.fields).some(f => !f.valid) || result.validation.globalTraceabilityDefect || !risValid;
  const globalHold = result.validation.globalTraceabilityDefect || latest.defaultLike;
  const latestPaths = [...DIMENSIONS.map(k => `cie.${k}`), ...RATINGS.map(k => `iep.${k}`),
    'iep.hours', 'iep.actions', 'iep.frequency', 'iep.emotion', ...outcomePaths,
    'oop.currentState', 'oop.events', 'oop.external', 'intentional', 'revision'];
  candidates.push(makeCandidate('QUAL-01', 'evidence_quality', 'THEFEIXI', 1, active, latestPaths,
    [condition('quality_limitation_present', qualifier, true, qualifier)],
    { defaultProfile: latest.defaultLike ? 'possible_default_like_recorded_profile' : null,
      basisStatus: latest.basisStatus, issues: issues.filter(i => i.path.startsWith(`intent.cycles[${latest.index}]`) || i.domain === 'traceability') },
    { status: 'INSUFFICIENT', limitations: defaultLimits, focus: 'analysis.observeEventAndBasis', focusKind: 'clarify' }));
  const reflectionFocus = !latestOutcomeGood || latest.defaultLike ? 'analysis.observeEventAndBasis' :
    latest.revision.explicit ? 'analysis.observeRevisedCriteria' :
    !latest.fields['iep.actions'].valid || !nonblank(latest.raw.iep.actions) ? 'analysis.observeActionAndEvent' :
    !latest.fields['oop.external'].valid || !nonblank(latest.raw.oop.external) ? 'analysis.observeExternalCircumstance' : 'analysis.observeOwnCriteriaAgain';
  const reflection = makeCandidate('REF-01', 'reflection', 'LIPHOZEI', 7, active, latestPaths,
    [condition('record_present', true, true, latest.structural)],
    { firstCompletedObservation: result.timeWindow.N_completed === 1, basisStatus: latest.basisStatus,
      currentReference: copy(intent.ris), emotion: copy(latest.emotion),
      assessment: { practical: copy(latest.raw.iep?.practical), hours: copy(latest.raw.iep?.hours),
        mental: copy(latest.raw.iep?.mental), achievement: copy(latest.raw.oop?.achievement), direction: copy(latest.raw.oop?.direction) } },
    { focus: reflectionFocus, limitations: defaultLimits, status: qualifier ? 'LIMITED' : 'READY' });
  for (const k of DIMENSIONS) reflection.evidence.push({ path: `intent.ris.${k}`, rawValue: copy(intent.ris?.[k]),
    transformation: 'NFC_line_endings_outer_trim', derivedValue: normalizeText(intent.ris?.[k]), reference: 'current_mutable_reference' });
  candidates.push(reflection);
  candidates.push(makeCandidate('REV-01', 'intentional_revision', 'DEINEIZA', 2, active,
    ['intentional', 'revision'], [condition('latest_explicit_valid_revision', latest.revision, 'yes + valid nonempty patch', latest.revision.explicit)],
    { selectedDimensions: latest.revision.selectedDimensions, beforeValues: 'unavailable' }, { focus: 'analysis.observeRevisedCriteria', features: ['revision_selection'] }));
  const revisionEvents = rows.filter(r => r.revision.explicit && r.identityReasons.length === 0 && r.validIdentity);
  const revisionCounts = Object.fromEntries(DIMENSIONS.map(k => [k, revisionEvents.filter(r => r.revision.selectedDimensions.includes(k)).length]));
  const maximumRevisionCount = Math.max(...Object.values(revisionCounts));
  candidates.push(makeCandidate('REV-02', 'revision_history', 'DEINEIZA', 7, revisionEvents, ['intentional', 'revision'],
    [condition('minimum_revision_events', revisionEvents.length, '>=3', revisionEvents.length >= 3),
      condition('traceability', result.validation.globalTraceabilityDefect, false, !result.validation.globalTraceabilityDefect)],
    { eventCount: revisionEvents.length, dimensionCounts: revisionCounts,
      mostSelectedDimensions: DIMENSIONS.filter(k => revisionCounts[k] === maximumRevisionCount) },
    { level: 'REPEATED_PATTERN', limitations: ['revision_selections_are_not_independent_process_observations'], features: ['revision_summary'] }));
  candidates.at(-1).ruleEvaluation.derivedMeasures = [
    { name: 'revision_event_count', value: revisionEvents.length,
      inputPaths: revisionEvents.flatMap(r => [`intent.cycles[${r.index}].intentional`, `intent.cycles[${r.index}].revision`]),
      formula: 'count(valid explicit yes + nonempty valid patch events; no time-spacing requirement)' },
    ...DIMENSIONS.map(dimension => ({ name: `revision_selection_count:${dimension}`, value: revisionCounts[dimension],
      inputPaths: revisionEvents.map(r => `intent.cycles[${r.index}].revision`),
      formula: `count(valid explicit events whose patch contains the ${dimension} key)` }))
  ];
  const wordingDimensions = DIMENSIONS.filter(k => nonblank(latest.raw.cie?.[k]) && nonblank(intent.ris?.[k]) &&
    normalizeText(latest.raw.cie[k]) !== normalizeText(intent.ris[k]));
  const prior = rows.at(-2);
  const changedAdjacentDimensions = prior ? DIMENSIONS.filter(k => nonblank(prior.raw.cie?.[k]) && nonblank(latest.raw.cie?.[k]) &&
    normalizeText(prior.raw.cie[k]) !== normalizeText(latest.raw.cie[k])) : [];
  const textRows = prior && changedAdjacentDimensions.length ? [prior, latest] : active;
  const textCandidate = makeCandidate('TXT-01', 'reference_wording', 'DEITHIATHO', 7, textRows,
    DIMENSIONS.map(k => `cie.${k}`), [condition('different_wording', [...wordingDimensions, ...changedAdjacentDimensions],
      'at least one literal nonblank mismatch', wordingDimensions.length > 0 || changedAdjacentDimensions.length > 0)],
    { currentReferenceDifferences: wordingDimensions, adjacentWordingDifferences: changedAdjacentDimensions,
      semanticMeaning: 'not_determined' }, { status: 'LIMITED', focus: 'analysis.checkWordingOrMeaning', features: ['wording_discrepancy'] });
  for (const k of DIMENSIONS) textCandidate.evidence.push({ path: `intent.ris.${k}`, rawValue: copy(intent.ris?.[k]),
    transformation: 'NFC_line_endings_outer_trim', derivedValue: normalizeText(intent.ris?.[k]), reference: 'current_mutable_reference' });
  candidates.push(textCandidate);

  const pair = prior ? [prior, latest] : [];
  const pairComparable = pair.length === 2 && pair.every(r => r.cieValid && r.raw.intentional === 'no' && r.revision.empty &&
    r.identityReasons.length === 0) && sameSignature(prior.signature, latest.signature) && !result.validation.globalTraceabilityDefect;
  const pairGap = pair.length === 2 && pair.every(r => r.timestamp.valid) ? latest.timestamp.milliseconds - prior.timestamp.milliseconds : null;
  const pairLimitations = [...(pairGap !== null && pairGap < HEURISTICS.minimumSpacing ? ['overlapping_reporting_windows'] : []),
    ...(!pairComparable && pair.length ? ['comparison_basis_changed_or_unavailable'] : [])];
  for (const metric of ['practical', 'achievement', 'mental', 'hours', 'desire', 'belief', 'emotionIntensity']) {
    const path = metric === 'achievement' ? 'oop.achievement' : `iep.${metric}`;
    const numericValid = pair.length === 2 && valids([path], pair);
    const categoryValid = metric !== 'emotionIntensity' || (pair.length === 2 && pair.every(r => r.emotion.status === 'known' &&
      r.emotion.category !== 9) && prior.emotion.category === latest.emotion.category);
    const delta = numericValid && categoryValid ? valueAt(latest, path) - valueAt(prior, path) : null;
    const notable = delta !== null && Math.abs(delta) >= (metric === 'hours' ? 1 : 2);
    const changeClass = delta === null ? 'unavailable' : delta === 0 ? 'same_recorded_value' : metric === 'hours' ?
      notable ? 'notable_recorded_change' : 'ordinary_hours_change' : notable ? 'notable_recorded_change' :
      Math.abs(delta) <= 1 ? 'nearby_ratings' : 'small_recorded_change';
    result.comparisons.push({ ruleId: 'CMP-01', metric, before: numericValid ? copy(valueAt(prior, path)) : null,
      after: numericValid ? copy(valueAt(latest, path)) : null, delta, changeClass, comparableBasis: pairComparable,
      limitations: pairLimitations, inputPaths: pair.map(r => `intent.cycles[${r.index}].${path}`), formula: 'after-before' });
    candidates.push(makeCandidate('CMP-01', metric === 'achievement' ? 'observed_outcome' : metric === 'emotionIntensity' ? 'emotion' :
      ['practical', 'hours'].includes(metric) ? 'practical_contribution' : 'mental_contribution',
    metric === 'achievement' ? 'LIPHOZEI' : ['practical', 'hours'].includes(metric) ? 'VIASIATAE' : 'DEINEIZA', 6,
    pair, [path, ...(metric === 'emotionIntensity' ? ['iep.emotion'] : [])],
    [condition('two_adjacent_saved_records', pair.length, 2, pair.length === 2),
      condition('valid_numeric_pair', numericValid, true, numericValid),
      condition('same_known_non_Other_emotion', categoryValid, true, categoryValid),
      condition('boundary', pairComparable, 'comparable basis for focused comparison; raw values available separately', pairComparable),
      condition('POSSIBLE_UNREVIEWED_DEFAULTS', pair.some(r => r.defaultLike), false, !pair.some(r => r.defaultLike))],
    { before: numericValid ? valueAt(prior, path) : null, after: numericValid ? valueAt(latest, path) : null, delta, changeClass },
    { level: 'COMPARISON', metric, notable, comparability: true, limitations: pairLimitations, features: [`comparison:${metric}`] }));
    candidates.at(-1).ruleEvaluation.derivedMeasures = [
      { name: 'signed_delta', value: delta, inputPaths: pair.map(r => `intent.cycles[${r.index}].${path}`), formula: 'after-before' },
      { name: 'change_class', value: changeClass, inputPaths: pair.map(r => `intent.cycles[${r.index}].${path}`),
        formula: metric === 'hours' ? 'same if delta=0; ordinary if 0<abs(delta)<1h; notable if abs(delta)>=1h' :
          'same if delta=0; nearby if 0<abs(delta)<=1; small if 1<abs(delta)<2; notable if abs(delta)>=2' }
    ];
  }
  const frequencyValid = pair.length === 2 && valids(['iep.frequency'], pair);
  const frequencyBefore = frequencyValid ? valueAt(prior, 'iep.frequency') : null;
  const frequencyAfter = frequencyValid ? valueAt(latest, 'iep.frequency') : null;
  const frequencyChange = !frequencyValid ? 'unavailable' : frequencyBefore === frequencyAfter ? 'same_category' :
    FREQUENCIES.indexOf(frequencyAfter) > FREQUENCIES.indexOf(frequencyBefore) ? 'higher_category' : 'lower_category';
  candidates.push(makeCandidate('CMP-02', 'mental_contribution', 'DEINEIZA', 6, pair, ['iep.frequency'],
    [condition('valid_frequency_pair', frequencyValid, true, frequencyValid),
      condition('boundary', pairComparable, true, pairComparable),
      condition('POSSIBLE_UNREVIEWED_DEFAULTS', pair.some(r => r.defaultLike), false, !pair.some(r => r.defaultLike))],
    { before: frequencyBefore, after: frequencyAfter, change: frequencyChange },
    { level: 'COMPARISON', metric: 'frequency', notable: frequencyValid && frequencyBefore !== frequencyAfter,
      comparability: true, limitations: pairLimitations, features: ['comparison:frequency'] }));

  candidates.push(makeCandidate('INT-01', 'intention_wording', 'FINAEFIA', 5, scope, [], patternGate([]),
    { normalizedCIESignature: window[0]?.signature || null, functionalRetention: 'unavailable' },
    patternOptions({ features: ['recorded_wording_recurrence'], limitations: ['wording_is_not_functional_retention'] })));
  for (const dimension of DIMENSIONS) {
    const path = `cie.${dimension}`;
    const difference = window.length > 0 && nonblank(intent.ris?.[dimension]) &&
      window.every(r => normalizeText(r.raw.cie?.[dimension]) === normalizeText(window[0].raw.cie?.[dimension])) &&
      normalizeText(window[0].raw.cie?.[dimension]) !== normalizeText(intent.ris[dimension]);
    const c = makeCandidate('INT-02', 'reference_wording', 'DEITHIATHO', 7, scope, [path],
      [...patternGate([path]), condition('repeated_wording_differs_from_current_reference', difference, true, difference)],
      { dimension, currentReference: copy(intent.ris?.[dimension]), recordedWording: copy(window[0]?.raw.cie?.[dimension]), semanticDrift: 'unavailable' },
      patternOptions({ dimension, status: 'LIMITED', focus: 'analysis.checkWordingOrMeaning', features: ['wording_discrepancy'] }));
    c.evidence.push({ path: `intent.ris.${dimension}`, rawValue: copy(intent.ris?.[dimension]),
      transformation: 'NFC_line_endings_outer_trim', derivedValue: normalizeText(intent.ris?.[dimension]), reference: 'current_mutable_reference' });
    candidates.push(c);
  }
  function atomic(id, domain, concept, metric, predicate, paths, extraConditions = [], extraOptions = {}) {
    const s = metric;
    const conditions = [...patternGate(paths), stepCondition(s),
      ...(predicate === 'up_or_down' ? [condition(`up_or_down(${s.path})`, { up: s.up, down: s.down, values: s.values },
        'D3/U3 or D5/U5', s.up || s.down, window.map(r => `intent.cycles[${r.index}].${s.path}`), 'dispatcher: N=4 latest3; N=5 all5')] :
      predicate === 'low_or_down' ? [condition(`low_or_down(${s.path})`, { low: s.low, down: s.down, values: s.values },
        'low_N or D3/D5', s.low || s.down, window.map(r => `intent.cycles[${r.index}].${s.path}`), 'every<=3 or trend dispatcher')] : [metricCondition(s, predicate)]),
      ...extraConditions];
    candidates.push(makeCandidate(id, domain, concept, 5, scope, paths, conditions,
      { values: s.values, trendValues: s.trendValues, trendDeltas: s.trendDeltas, direction: s.down ? 'decreased' : s.up ? 'increased' : s.low ? 'low' : 'nearby',
        hours: domain === 'practical_contribution' ? { values: hourValues, status: hoursStatus } : null },
      patternOptions({ features: [`${s.path}:${predicate}`], ...extraOptions })));
    candidates.at(-1).ruleEvaluation.derivedMeasures = ratingMeasures(s);
  }
  atomic('PRA-01', 'practical_contribution', 'VIASIATAE', practical, 'down', ['iep.practical'],
    [condition('practical_hours_opposed', mixedTriggers.includes('practical_hours_opposed'), false, !mixedTriggers.includes('practical_hours_opposed'))]);
  atomic('PRA-02', 'practical_contribution', 'VIASIATAE', practical, 'low', ['iep.practical']);
  atomic('MEN-01', 'mental_contribution', 'DEINEIZA', mental, 'low_or_down', ['iep.mental']);
  const frequencyAllValid = valids(['iep.frequency']);
  const frequencyValues = frequencyAllValid ? window.map(r => r.raw.iep.frequency) : [];
  const frequencyTrend = frequencyValues.length === 4 ? frequencyValues.slice(-3) : frequencyValues;
  const frequencySteps = frequencyTrend.slice(1).map((v, i) => FREQUENCIES.indexOf(v) < FREQUENCIES.indexOf(frequencyTrend[i]) ? 'lower' :
    v === frequencyTrend[i] ? 'same' : 'higher');
  const frequencyRepeated = frequencyValues.length >= 3 && frequencyValues.every(v => v === frequencyValues[0]);
  const frequencyDown = frequencyValues.length >= 3 && (frequencyValues.length === 5 ?
    frequencySteps.filter(v => v === 'lower').length >= 3 && !frequencySteps.includes('higher') :
    frequencySteps.length === 2 && frequencySteps.every(v => v === 'lower'));
  candidates.push(makeCandidate('MEN-02', 'mental_contribution', 'DEINEIZA', 5, scope, ['iep.frequency'],
    [...patternGate(['iep.frequency']), condition('frequency_recurrence_or_decrease', { values: frequencyValues, steps: frequencySteps },
      'all same; or latest3 both decrease; or 5 >=3 decreases with no increase', frequencyRepeated || frequencyDown,
      window.map(r => `intent.cycles[${r.index}].iep.frequency`), 'ordinal category order only')],
    { categories: frequencyValues, observation: frequencyRepeated ? 'same_category_repeated' : 'category_decreased' }, patternOptions({ features: ['frequency_pattern'] })));
  const emotionEvidence = scope.map(r => ref(r, 'iep.emotion', r.emotion.transformation, { category: r.emotion.category, status: r.emotion.status }));
  const emo1 = makeCandidate('EMO-01', 'emotion', 'DEINEIZA', 5, scope, ['iep.emotion'],
    [...patternGate(['iep.emotion']), condition('same_uniquely_mapped_emotion_category', scope.map(r => r.emotion), 'same known category', sameEmotion)],
    { category: scope[0]?.emotion.category ?? null, otherCategory: sameEmotion && scope[0].emotion.category === 9 },
    patternOptions({ limitations: sameEmotion && scope[0].emotion.category === 9 ? ['Other_does_not_identify_same_specific_emotion'] : [], features: ['emotion_category_recurrence'] }));
  emo1.evidence.push(...emotionEvidence);
  candidates.push(emo1);
  atomic('EMO-02', 'emotion', 'DEINEIZA', intensity, 'up_or_down', ['iep.emotionIntensity', 'iep.emotion'],
    [condition('same_known_non_Other_emotion', scope.map(r => r.emotion), 'same known category except Other', knownNonOtherEmotion)]);
  candidates.at(-1).evidence.push(...emotionEvidence);
  atomic('OUT-01', 'observed_outcome', 'LIPHOZEI', achievement, 'up_or_down', outcomePaths,
    [outcomeCondition, condition('opposing_recorded_directions', directions, 'no direction opposing rating trend',
      !mixedTriggers.includes('achievement_direction_opposed'))]);
  atomic('OUT-02', 'observed_outcome', 'LIPHOZEI', achievement, 'flat', outcomePaths,
    [outcomeCondition, condition('all_directions_none', directions, 'all none', directions.length >= 3 && directions.every(d => d === 'none'))]);
  const compositeLimits = ['unstructured_external_context', 'other_actor_contribution_unrecorded', 'actual_reporting_periods_unrecorded'];
  function composite(id, domain, concept, paths, conditions, data, features) {
    candidates.push(makeCandidate(id, domain, concept, 4, scope, paths,
      [...patternGate(paths), outcomeCondition, mixedCondition, ...conditions], data,
      patternOptions({ limitations: compositeLimits, missingData: ['typed_external_conditions', 'other_actor_contribution', 'actual_reporting_periods'], features })));
    candidates.at(-1).ruleEvaluation.derivedMeasures = [practical, mental, achievement, intensity]
      .filter(s => paths.includes(s.path)).flatMap(ratingMeasures);
  }
  composite('REL-01', 'practical_contribution', 'VIASIATAE', ['iep.practical', 'iep.hours', ...outcomePaths],
    [stepCondition(practical), metricCondition(practical, 'down'), stepCondition(achievement), metricCondition(achievement, 'flat'),
      condition('all_directions_none', directions, 'all none', directions.length >= 3 && directions.every(d => d === 'none')), hourGuard('no_Hup', !hoursUp)],
    { practical: practical.values, achievement: achievement.values, hours: hourValues }, ['iep.practical:down', 'practical_outcome_relationship']);
  composite('REL-02', 'practical_contribution', 'RULAFOSHAE', ['iep.practical', 'iep.hours', ...outcomePaths],
    [stepCondition(practical), metricCondition(practical, 'up'), stepCondition(achievement), metricCondition(achievement, 'up'),
      condition('direction_not_away', directions, 'no away', !directions.includes('away')), hourGuard('no_Hdown', !hoursDown)],
    { practical: practical.values, achievement: achievement.values, hours: hourValues }, ['practical_outcome_cochange']);
  const internalSource = mental.down || mental.up ? 'mental' : knownNonOtherEmotion && (intensity.down || intensity.up) ? 'emotionIntensity' : null;
  composite('REL-03', internalSource === 'emotionIntensity' ? 'emotion' : 'mental_contribution', 'RULAFOSHAE', ['iep.mental', 'iep.practical', ...outcomePaths,
    ...(internalSource === 'emotionIntensity' ? ['iep.emotion', 'iep.emotionIntensity'] : [])].filter(p => internalSource === 'emotionIntensity' ? p !== 'iep.mental' : true),
    [stepCondition(practical), metricCondition(practical, 'flat'), stepCondition(achievement), metricCondition(achievement, 'flat'),
      condition('internal_rating_changed', { branch: internalSource, mental: mental.values, emotionIntensity: intensity.values,
        sameKnownNonOtherEmotion: knownNonOtherEmotion }, 'mental D/U; otherwise known non-Other intensity D/U', internalSource !== null)],
    { internalSource, internalValues: internalSource === 'mental' ? mental.values : intensity.values,
      practical: practical.values, achievement: achievement.values }, ['internal_outcome_relationship', 'oop.achievement:flat',
        internalSource === 'mental' ? 'iep.mental:low_or_down' : 'iep.emotionIntensity:up_or_down']);
  if (internalSource === 'emotionIntensity') candidates.at(-1).evidence.push(...emotionEvidence);
  composite('CTX-01', 'external_context', 'KAEKITO', ['iep.practical', 'iep.hours', ...outcomePaths],
    [stepCondition(practical), metricCondition(practical, 'flat'), stepCondition(achievement), metricCondition(achievement, 'down'),
      condition('directions_not_toward', directions, 'no toward', !directions.includes('toward')), hourGuard('no_Hup_or_Hdown', !hoursUp && !hoursDown)],
    { practical: practical.values, achievement: achievement.values, externalTrajectory: 'unavailable' }, ['context_observation_domain']);
  candidates.push(makeCandidate('CTX-02', 'external_context', 'KAEKITO', 7, active, ['oop.external'],
    [condition('recorded_external_text_present', nonblank(latest.raw.oop?.external), true,
      latest.fields['oop.external'].valid && nonblank(latest.raw.oop.external))],
    { literalRecord: copy(latest.raw.oop?.external), semanticClassification: 'unavailable' },
    { secondaryOnly: true, limitations: ['unstructured_external_context'], features: ['external_literal_record'] }));
  const cond = makeCandidate('COND-01', 'condition_capability', 'VAQUQA', 7, active, ['oop.external'],
    [condition('typed_linked_conditions_available', false, true, false)], { capability: 'not_instrumented' },
    { secondaryOnly: true, missingData: ['typed_linked_conditions'], status: 'LIMITED' });
  cond.nextFocus = null;
  candidates.push(cond);
  result.capabilities = { FINAEFIA: { status: 'limited_wording_proxy', functionalAssessment: 'unavailable' },
    DEITHIATHO: { status: 'neutral_discrepancy_only', semanticDrift: 'unavailable' },
    VIASIATAE: { status: 'separate_practical_hours_literal_actions', fullEnergyOrOtherActorMeasurement: 'unavailable' },
    KAEKITO: { status: 'recorded_context_direction_evidence', obstacleTrajectory: 'unavailable' },
    VAQUQA: { ruleId: 'COND-01', status: 'capability_gap', conditionSufficiency: 'unavailable' },
    LIPHOZEI: { status: 'self_reported_outcome', automaticCriterionFulfilment: 'unavailable', verifiedSuccess: 'unavailable' } };
  const mixRows = mixedTriggers.some(t => !['decision_patch_conflict', 'direction_mixed'].includes(t)) ? scope : active;
  // Computed OR-predicate details retain all their raw inputs even when only the
  // latest declared direction triggered the observation. Supporting count stays
  // one for that latest-only trigger; extra evidence never upgrades its level.
  const mixEvidenceRows = [...new Map([...scope, ...active].map(r => [r.index, r])).values()];
  candidates.push(makeCandidate('MIX-01', 'mixed_evidence', 'THEFEIXI', latest.revision.conflict ? 1 : 3, mixEvidenceRows,
    ['intentional', 'revision', 'iep.practical', 'iep.hours', ...outcomePaths,
      ...(mixRows === scope ? DEFAULT_PROFILE_PATHS : [])],
    [condition('mixed_signal_present', mixedTriggers, 'one or more exact specified predicates', mixedTriggers.length > 0)],
    { triggers: mixedTriggers, practical: practical.values, hours: hourValues, achievement: achievement.values,
      directions, scopes: { practical: 'current_rating', achievement: 'current_rating', hours: 'past_seven_days', direction: 'past_seven_days' } },
    { status: 'MIXED', level: mixRows === scope ? patternLevel : 'EARLY_OBSERVATION', comparability: window.length > 0,
      usedRows: mixRows === scope ? window : active, exclusions: mixRows === scope ? patternExclusions : [],
      limitations: ['measures_can_have_different_time_scopes'], focusKind: 'clarify', focus: 'analysis.clarifyOneRecordedAssessment', features: ['mixed_assessment'] }));
  const mix = candidates.at(-1);
  mix.ruleEvaluation.triggerEvaluations = [
    condition('decision_patch_conflict', { decision: latest.raw.intentional, revision: latest.revision },
      '(no/unsure + nonempty/invalid patch) OR (yes + empty/invalid patch)', latest.revision.conflict,
      [`intent.cycles[${latest.index}].intentional`, `intent.cycles[${latest.index}].revision`], 'exact decision/patch predicate'),
    condition('direction_mixed', latest.raw.oop?.direction, 'mixed', mixedTriggers.includes('direction_mixed'),
      [`intent.cycles[${latest.index}].oop.direction`], 'latest recorded direction===mixed'),
    condition('achievement_direction_opposed', { achievement: achievement.values, directions },
      'eligible bases AND (D3/D5 + any toward OR U3/U5 + any away)', mixedTriggers.includes('achievement_direction_opposed'),
      scope.flatMap(r => outcomePaths.map(p => `intent.cycles[${r.index}].${p}`)), 'frozen achievement trend dispatcher AND opposing direction category'),
    condition('flat_achievement_direction_varied', { achievement: achievement.values, range: achievement.range, directions },
      'eligible bases AND range<=1 AND any toward/away', mixedTriggers.includes('flat_achievement_direction_varied'),
      scope.flatMap(r => outcomePaths.map(p => `intent.cycles[${r.index}].${p}`)), 'flat_N rating AND recorded direction has toward/away'),
    condition('practical_hours_opposed', { practical: practical.values, hours: hourValues, hoursStatus },
      'practical D3/D5 with Hup OR U3/U5 with Hdown', mixedTriggers.includes('practical_hours_opposed'),
      scope.flatMap(r => ['iep.practical', 'iep.hours'].map(p => `intent.cycles[${r.index}].${p}`)),
      'frozen practical trend dispatcher AND monotone hours change with abs(endpoint)>=1h')
  ];
  mix.ruleEvaluation.derivedMeasures = [...ratingMeasures(practical), ...ratingMeasures(achievement)];

  // The nextFocus variables are observation targets, not all prerequisite evidence paths.
  const focusPaths = {
    'QUAL-01': ['C.oop.events', 'C.oop.evidence'],
    'REV-01': [...latest.revision.selectedDimensions.map(d => `C.cie.${d}`), 'C.oop.events'],
    'REV-02': ['C.revision'], 'INT-01': ['C.cie'], 'INT-02': ['C.cie', 'intent.ris'], 'TXT-01': ['C.cie', 'intent.ris'],
    'PRA-01': ['C.iep.practical', 'C.iep.actions'], 'PRA-02': ['C.iep.practical', 'C.iep.hours', 'C.iep.actions'],
    'MEN-01': ['C.iep.mental'], 'MEN-02': ['C.iep.frequency'], 'EMO-01': ['C.iep.emotion', 'C.iep.emotionIntensity'],
    'EMO-02': ['C.iep.emotionIntensity'], 'OUT-01': ['C.oop.events', 'C.cie.success'], 'OUT-02': ['C.oop.events', 'C.cie.success'],
    'REL-01': ['C.iep.practical', 'C.iep.actions', 'C.oop.events'], 'REL-02': ['C.iep.practical', 'C.oop.events', 'C.oop.external'],
    'REL-03': [internalSource === 'emotionIntensity' ? 'C.iep.emotionIntensity' : 'C.iep.mental'],
    'CTX-01': ['C.oop.external'], 'CTX-02': ['C.oop.external'],
    'MIX-01': mixedTriggers.includes('decision_patch_conflict') ? ['C.intentional', 'C.revision'] :
      mixedTriggers.includes('practical_hours_opposed') ? ['C.iep.practical'] : ['C.oop.direction'] };
  for (const c of candidates) if (c.nextFocus && focusPaths[c.ruleId]) c.nextFocus.variablePaths = focusPaths[c.ruleId];
  // Disclose optional hours/actions literally for practical rules; they never become a score.
  for (const c of candidates.filter(c => ['PRA-01', 'PRA-02'].includes(c.ruleId))) {
    c.evidence.push(...rowEvidence(scope, ['iep.hours', 'iep.actions']));
    if (!hoursValid) c.limitations.push('hours_corroboration_unavailable');
  }
  for (const c of candidates.filter(c => ['PRA-01', 'PRA-02', 'REL-01', 'REL-02', 'CTX-01', 'MIX-01'].includes(c.ruleId))) {
    c.ruleEvaluation.hoursCorroboration = { values: hourValues, deltas: hourDeltas, endpointChange: hoursEndpoint,
      range: hoursRange, status: hoursStatus, inputPaths: window.map(r => `intent.cycles[${r.index}].iep.hours`),
      formulas: { deltas: 'h[i+1]-h[i]', endpointChange: 'last-first', range: 'max-min',
        up: 'all deltas>=0 AND endpoint>=1h', down: 'all deltas<=0 AND endpoint<=-1h', flat: 'range<=0.25h' } };
  }
  result.ruleEvaluations = candidates.map(c => ({ ruleId: c.ruleId, candidateId: c.candidateId, eligible: c.eligible,
    priority: copy(c.priority), ...copy(c.ruleEvaluation) }));
  const independentFocused = candidates.some(c => c.eligible && [4, 5, 6].includes(c.priority.group));
  const qual = candidates.find(c => c.ruleId === 'QUAL-01');
  if (!globalHold && independentFocused) qual.secondaryOnly = true;
  const eligible = candidates.filter(c => c.eligible && !c.secondaryOnly).sort(comparePriority);
  let primary = eligible[0] || null;
  const featureSubsumed = c => primary && c.observedFeatures.length > 0 &&
    c.observedFeatures.every(f => primary.observedFeatures.includes(f));
  const secondaryEligible = candidates.filter(c => c.eligible && c !== primary && c.ruleId !== 'REF-01' &&
    c.ruleId !== 'REV-01' && !featureSubsumed(c) &&
    !(c.ruleId === 'TXT-01' && primary?.ruleId === 'REV-01') &&
    !(primary?.ruleId === 'MIX-01' && ['OUT-01', 'OUT-02', 'REL-01', 'REL-02', 'REL-03', 'CTX-01'].includes(c.ruleId)) &&
    !(primary?.ruleId === 'QUAL-01' && globalHold && c.priority.group <= 6));
  secondaryEligible.sort((a, b) => Number(a.domain === primary?.domain) - Number(b.domain === primary?.domain) || comparePriority(a, b));
  let secondary = secondaryEligible[0] || null;
  if (safetyDecision === 'HOLD') { primary = null; secondary = null; }
  result.primary = primary ? copy(primary) : null;
  result.secondary = secondary ? copy(secondary) : null;
  if (result.secondary) { result.secondary.nextFocus = null; result.secondary.whyThisFocus = null; }
  for (const c of candidates) {
    if (c === primary || c === secondary) continue;
    result.suppressedCandidates.push({ ruleId: c.ruleId, candidateId: c.candidateId, eligible: c.eligible,
      reasons: c.eligible ? safetyDecision === 'HOLD' ? ['safety_hold'] : featureSubsumed(c) ? ['subsumed_by_primary'] :
        c.secondaryOnly ? ['observation_only_or_domain_limitation'] : ['lower_fixed_priority'] : c.exclusionReasons,
      failedConditions: copy(c.ruleEvaluation.conditions.filter(v => !v.passed)), priority: copy(c.priority) });
  }
  result.status = safetyDecision === 'HOLD' ? 'SAFETY_HOLD' : primary?.status === 'MIXED' ? 'MIXED' :
    primary?.ruleId === 'QUAL-01' || !primary ? 'INSUFFICIENT' : primary.status === 'LIMITED' ||
      issues.some(i => i.domain !== 'emotion') || !latestOutcomeGood ? 'LIMITED' : 'READY';
  result.selectionExplanation = { key: safetyDecision === 'HOLD' ? 'analysis.externalSafetyHold' : 'analysis.fixedPriorityTuple',
    data: { selectedCandidate: primary?.candidateId || null, selectedTuple: primary ? copy(primary.priority) : null,
      secondaryCandidate: secondary?.candidateId || null, secondaryPreference: 'different_domain_then_fixed_tuple',
      domainQualityHold: qual.secondaryOnly ? 'independent_focused_candidate_available' : 'no_independent_focused_candidate_or_global_defect' } };
  result.limitations = unique([...result.limitations, ...defaultLimits, ...pairLimitations,
    ...(exclusions.some(e => e.reason === 'long_observation_gap') ? ['long_observation_gap'] : []),
    ...(latest.emotion.status !== 'known' ? [`${latest.emotion.status}_emotion_label`] : [])]);
  result.missingData = unique(issues.filter(i => i.reason.includes('missing') || i.reason === 'blank_required_text').map(i => i.path));
  return result;
}

module.exports = { analyze, normalizeText, mapEmotion, parseTimestamp, ENGINE_VERSION, SOURCE_COMMIT,
  SOURCE_VERSION, RULE_IDS, DIMENSIONS, HEURISTICS, EMOTION_LABELS };
