// Metadata dyal 114 sourate (generated mn quran-json@3.1.2) — bla fetch bach l-liste tban f l-blassa
// [id, arabic, transliteration, fr, en, type (mk = mecquoise, md = médinoise), verses]
type Row = [number, string, string, string, string, "mk" | "md", number];

const ROWS: Row[] = [
  [1, "الفاتحة", "Al-Fatihah", "L'ouverture", "The Opener", "mk", 7],
  [2, "البقرة", "Al-Baqarah", "La vache", "The Cow", "md", 286],
  [3, "آل عمران", "Ali 'Imran", "La famille de 'imran", "Family of Imran", "md", 200],
  [4, "النساء", "An-Nisa", "Les femmes", "The Women", "md", 176],
  [5, "المائدة", "Al-Ma'idah", "La table servie", "The Table Spread", "md", 120],
  [6, "الأنعام", "Al-An'am", "Les bestiaux", "The Cattle", "mk", 165],
  [7, "الأعراف", "Al-A'raf", "Al-A'raf", "The Heights", "mk", 206],
  [8, "الأنفال", "Al-Anfal", "Le butin", "The Spoils of War", "md", 75],
  [9, "التوبة", "At-Tawbah", "Le repentir", "The Repentance", "md", 129],
  [10, "يونس", "Yunus", "Jonas", "Jonah", "mk", 109],
  [11, "هود", "Hud", "Houd", "Hud", "mk", 123],
  [12, "يوسف", "Yusuf", "Joseph", "Joseph", "mk", 111],
  [13, "الرعد", "Ar-Ra'd", "Le tonnerre", "The Thunder", "md", 43],
  [14, "ابراهيم", "Ibrahim", "Abraham", "Abraham", "mk", 52],
  [15, "الحجر", "Al-Hijr", "Al-Hijr", "The Rocky Tract", "mk", 99],
  [16, "النحل", "An-Nahl", "Les abeilles", "The Bee", "mk", 128],
  [17, "الإسراء", "Al-Isra", "Le voyage nocturne", "The Night Journey", "mk", 111],
  [18, "الكهف", "Al-Kahf", "La caverne", "The Cave", "mk", 110],
  [19, "مريم", "Maryam", "Marie", "Mary", "mk", 98],
  [20, "طه", "Taha", "Ta-Ha", "Ta-Ha", "mk", 135],
  [21, "الأنبياء", "Al-Anbya", "Les prophètes", "The Prophets", "mk", 112],
  [22, "الحج", "Al-Hajj", "Le pèlerinage", "The Pilgrimage", "md", 78],
  [23, "المؤمنون", "Al-Mu'minun", "Les croyants", "The Believers", "mk", 118],
  [24, "النور", "An-Nur", "La lumière", "The Light", "md", 64],
  [25, "الفرقان", "Al-Furqan", "Le discernement", "The Criterion", "mk", 77],
  [26, "الشعراء", "Ash-Shu'ara", "Les poètes", "The Poets", "mk", 227],
  [27, "النمل", "An-Naml", "Les fourmis", "The Ant", "mk", 93],
  [28, "القصص", "Al-Qasas", "Le récit", "The Stories", "mk", 88],
  [29, "العنكبوت", "Al-'Ankabut", "L'araignée", "The Spider", "mk", 69],
  [30, "الروم", "Ar-Rum", "Les romains", "The Romans", "mk", 60],
  [31, "لقمان", "Luqman", "Louqman", "Luqman", "mk", 34],
  [32, "السجدة", "As-Sajdah", "La prosternation", "The Prostration", "mk", 30],
  [33, "الأحزاب", "Al-Ahzab", "Les coalisés", "The Combined Forces", "md", 73],
  [34, "سبإ", "Saba", "Saba'", "Sheba", "mk", 54],
  [35, "فاطر", "Fatir", "Le Créateur", "Originator", "mk", 45],
  [36, "يس", "Ya-Sin", "Ya-Sin", "Ya Sin", "mk", 83],
  [37, "الصافات", "As-Saffat", "Les rangés", "Those who set the Ranks", "mk", 182],
  [38, "ص", "Sad", "Sad", "The Letter \"Saad\"", "mk", 88],
  [39, "الزمر", "Az-Zumar", "Les groupes", "The Troops", "mk", 75],
  [40, "غافر", "Ghafir", "Le Pardonneur", "The Forgiver", "mk", 85],
  [41, "فصلت", "Fussilat", "Les versets explicites", "Explained in Detail", "mk", 54],
  [42, "الشورى", "Ash-Shuraa", "La concertation", "The Consultation", "mk", 53],
  [43, "الزخرف", "Az-Zukhruf", "L'ornement", "The Ornaments of Gold", "mk", 89],
  [44, "الدخان", "Ad-Dukhan", "La fumée", "The Smoke", "mk", 59],
  [45, "الجاثية", "Al-Jathiyah", "L'agenouillée", "The Crouching", "mk", 37],
  [46, "الأحقاف", "Al-Ahqaf", "Al-Ahqaf", "The Wind-Curved Sandhills", "mk", 35],
  [47, "محمد", "Muhammad", "Mouhammad", "Muhammad", "md", 38],
  [48, "الفتح", "Al-Fath", "La victoire éclatante", "The Victory", "md", 29],
  [49, "الحجرات", "Al-Hujurat", "Les appartements", "The Rooms", "md", 18],
  [50, "ق", "Qaf", "Qaf", "The Letter \"Qaf\"", "mk", 45],
  [51, "الذاريات", "Adh-Dhariyat", "Qui éparpillent", "The Winnowing Winds", "mk", 60],
  [52, "الطور", "At-Tur", "Le mont At-Tour", "The Mount", "mk", 49],
  [53, "النجم", "An-Najm", "L'étoile", "The Star", "mk", 62],
  [54, "القمر", "Al-Qamar", "La lune", "The Moon", "mk", 55],
  [55, "الرحمن", "Ar-Rahman", "Le Tout Miséricordieux", "The Beneficent", "md", 78],
  [56, "الواقعة", "Al-Waqi'ah", "L'inévitable", "The Inevitable", "mk", 96],
  [57, "الحديد", "Al-Hadid", "Le fer", "The Iron", "md", 29],
  [58, "المجادلة", "Al-Mujadila", "La discussion", "The Pleading Woman", "md", 22],
  [59, "الحشر", "Al-Hashr", "L'exode", "The Exile", "md", 24],
  [60, "الممتحنة", "Al-Mumtahanah", "L'éprouvée", "She that is to be examined", "md", 13],
  [61, "الصف", "As-Saf", "Le rang", "The Ranks", "md", 14],
  [62, "الجمعة", "Al-Jumu'ah", "Le vendredi", "The Congregation, Friday", "md", 11],
  [63, "المنافقون", "Al-Munafiqun", "Les hypocrites", "The Hypocrites", "md", 11],
  [64, "التغابن", "At-Taghabun", "La grande perte", "The Mutual Disillusion", "md", 18],
  [65, "الطلاق", "At-Talaq", "Le divorce", "The Divorce", "md", 12],
  [66, "التحريم", "At-Tahrim", "L'interdiction", "The Prohibition", "md", 12],
  [67, "الملك", "Al-Mulk", "La royauté", "The Sovereignty", "mk", 30],
  [68, "القلم", "Al-Qalam", "La plume", "The Pen", "mk", 52],
  [69, "الحاقة", "Al-Haqqah", "L'inéluctable", "The Reality", "mk", 52],
  [70, "المعارج", "Al-Ma'arij", "Les voies d'ascension", "The Ascending Stairways", "mk", 44],
  [71, "نوح", "Nuh", "Noé", "Noah", "mk", 28],
  [72, "الجن", "Al-Jinn", "Les djinns", "The Jinn", "mk", 28],
  [73, "المزمل", "Al-Muzzammil", "L'enveloppé", "The Enshrouded One", "mk", 20],
  [74, "المدثر", "Al-Muddaththir", "Celui qui se couvre", "The Cloaked One", "mk", 56],
  [75, "القيامة", "Al-Qiyamah", "La résurrection", "The Resurrection", "mk", 40],
  [76, "الانسان", "Al-Insan", "L'homme", "The Man", "md", 31],
  [77, "المرسلات", "Al-Mursalat", "Les envoyés", "The Emissaries", "mk", 50],
  [78, "النبإ", "An-Naba", "La nouvelle", "The Tidings", "mk", 40],
  [79, "النازعات", "An-Nazi'at", "Ceux qui arrachent", "Those who drag forth", "mk", 46],
  [80, "عبس", "'Abasa", "Il s'est renfrogné", "He Frowned", "mk", 42],
  [81, "التكوير", "At-Takwir", "L'obscurcissement", "The Overthrowing", "mk", 29],
  [82, "الإنفطار", "Al-Infitar", "La rupture", "The Cleaving", "mk", 19],
  [83, "المطففين", "Al-Mutaffifin", "Les fraudeurs", "The Defrauding", "mk", 36],
  [84, "الإنشقاق", "Al-Inshiqaq", "La déchirure", "The Sundering", "mk", 25],
  [85, "البروج", "Al-Buruj", "Les constellations", "The Mansions of the Stars", "mk", 22],
  [86, "الطارق", "At-Tariq", "L'astre nocturne", "The Nightcommer", "mk", 17],
  [87, "الأعلى", "Al-A'la", "Le Très-Haut", "The Most High", "mk", 19],
  [88, "الغاشية", "Al-Ghashiyah", "L'enveloppante", "The Overwhelming", "mk", 26],
  [89, "الفجر", "Al-Fajr", "L'aube", "The Dawn", "mk", 30],
  [90, "البلد", "Al-Balad", "La cité", "The City", "mk", 20],
  [91, "الشمس", "Ash-Shams", "Le soleil", "The Sun", "mk", 15],
  [92, "الليل", "Al-Layl", "La nuit", "The Night", "mk", 21],
  [93, "الضحى", "Ad-Duhaa", "Le jour montant", "The Morning Hours", "mk", 11],
  [94, "الشرح", "Ash-Sharh", "L'ouverture", "The Relief", "mk", 8],
  [95, "التين", "At-Tin", "Les figues", "The Fig", "mk", 8],
  [96, "العلق", "Al-'Alaq", "L'adhérence", "The Clot", "mk", 19],
  [97, "القدر", "Al-Qadr", "La destinée", "The Power", "mk", 5],
  [98, "البينة", "Al-Bayyinah", "La preuve", "The Clear Proof", "md", 8],
  [99, "الزلزلة", "Az-Zalzalah", "Le séisme", "The Earthquake", "md", 8],
  [100, "العاديات", "Al-'Adiyat", "Les coursiers", "The Courser", "mk", 11],
  [101, "القارعة", "Al-Qari'ah", "Le fracas", "The Calamity", "mk", 11],
  [102, "التكاثر", "At-Takathur", "La course aux richesses", "The Rivalry in world increase", "mk", 8],
  [103, "العصر", "Al-'Asr", "Le temps", "The Declining Day", "mk", 3],
  [104, "الهمزة", "Al-Humazah", "Les calomniateurs", "The Traducer", "mk", 9],
  [105, "الفيل", "Al-Fil", "L'éléphant", "The Elephant", "mk", 5],
  [106, "قريش", "Quraysh", "Les Quraysh", "Quraysh", "mk", 4],
  [107, "الماعون", "Al-Ma'un", "L'entraide", "The Small kindnesses", "mk", 7],
  [108, "الكوثر", "Al-Kawthar", "L'abondance", "The Abundance", "mk", 3],
  [109, "الكافرون", "Al-Kafirun", "Les mécréants", "The Disbelievers", "mk", 6],
  [110, "النصر", "An-Nasr", "Le secours", "The Divine Support", "md", 3],
  [111, "المسد", "Al-Masad", "Les fibres", "The Palm Fiber", "mk", 5],
  [112, "الإخلاص", "Al-Ikhlas", "La sincérité", "The Sincerity", "mk", 4],
  [113, "الفلق", "Al-Falaq", "L'aube naissante", "The Daybreak", "mk", 5],
  [114, "الناس", "An-Nas", "Les humains", "Mankind", "mk", 6],
];

export interface SurahMeta {
  id: number;
  ar: string;
  translit: string;
  fr: string;
  en: string;
  type: "mk" | "md";
  verses: number;
}

export const SURAHS: SurahMeta[] = ROWS.map(([id, ar, translit, fr, en, type, verses]) => ({
  id, ar, translit, fr, en, type, verses,
}));

export const TOTAL_AYAHS = 6236;

// 3adad l-ayat 9bel kol sourate (prefix sum)
const BEFORE: number[] = (() => {
  const out = [0];
  for (let i = 0; i < SURAHS.length; i++) out.push(out[i] + SURAHS[i].verses);
  return out;
})();

export const getSurah = (id: number): SurahMeta => SURAHS[Math.min(Math.max(id, 1), 114) - 1];

/** Index global dyal l-aya (1..6236) */
export const globalIndex = (surah: number, ayah: number): number => BEFORE[surah - 1] + ayah;

/** Progress dyal l-khatma f % (checkpoint = akhir aya t9rat) */
export const khatmaProgress = (surah: number, ayah: number, completed = false): number => {
  if (completed) return 100;
  if (surah === 1 && ayah === 1) return 0;
  return Math.min(100, (globalIndex(surah, ayah) / TOTAL_AYAHS) * 100);
};

// Bdya dyal kol juz2 [surah, ayah]
const JUZ_STARTS: [number, number][] = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 83], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

/** Bdya dyal juz2 (1..30) */
export const juzStart = (juz: number): { surah: number; ayah: number } => {
  const [surah, ayah] = JUZ_STARTS[Math.min(Math.max(juz, 1), 30) - 1];
  return { surah, ayah };
};

/** Mn index global (1..6236) l (sourate, aya) */
export const fromGlobalIndex = (g: number): { surah: number; ayah: number } => {
  let s = 1;
  while (s < 114 && BEFORE[s] < g) s++;
  return { surah: s, ayah: g - BEFORE[s - 1] };
};

export const juzOf = (surah: number, ayah: number): number => {
  const g = globalIndex(surah, ayah);
  let juz = 1;
  JUZ_STARTS.forEach(([s, a], i) => { if (globalIndex(s, a) <= g) juz = i + 1; });
  return juz;
};

/** Chiffres arabes (١٢٣) l-علامات dyal l-ayat */
export const toArabicDigits = (n: number): string =>
  String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);