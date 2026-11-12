// Adhkar & ad3iya (Hisn al-Muslim) — text, 3adad, ma3na (fr/en), fadl (fr/en/ar) w l-masdar
// Kolchi mn l-Qur'an w l-a7adith l-ma39oula (Bukhari, Muslim, Abu Dawud, Tirmidhi...)

export interface L3 { fr: string; en: string; ar: string }
export interface Dhikr {
  id: string;
  ar: string;
  count: number;
  tr: { fr: string; en: string };
  fadl?: L3;
  src: string;
}
export type CategoryIcon =
  | "sunrise" | "sunset" | "prayer" | "moon" | "alarm" | "repent" | "sparkle" | "heart" | "book" | "shield" | "home";

export interface AdhkarCategory {
  id: string;
  icon: CategoryIcon;
  hue: number;            // loun dyal l-carte
  title: L3;
  desc: L3;
  intro?: L3;             // fadl 3am dyal l-categorie
  items: Dhikr[];
}

/* ------------------------------------------------------------------ */
/* Fadl / textes partagés                                              */
/* ------------------------------------------------------------------ */

const KURSI = "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ ۝ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ";
const KURSI_TR = {
  fr: "Ayat al-Kursi (Al-Baqara 255) : « Allah ! Point de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même… »",
  en: "Ayat al-Kursi (Al-Baqara 255): “Allah — there is no god but Him, the Ever-Living, the Sustainer of all…”",
};

const IKHLAS = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ";
const FALAQ = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ";
const NAS = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ";

const QULS_FADL: L3 = {
  fr: "« Récite Qul huwa Allahu ahad et les deux protectrices (Al-Falaq et An-Nas) trois fois matin et soir : elles te suffiront contre toute chose. »",
  en: "“Recite Qul huwa Allahu ahad and the two protectors (Al-Falaq and An-Nas) three times morning and evening; they will suffice you against everything.”",
  ar: "«قُلْ هُوَ اللَّهُ أَحَدٌ وَالْمُعَوِّذَتَيْنِ حِينَ تُمْسِي وَحِينَ تُصْبِحُ ثَلَاثَ مَرَّاتٍ تَكْفِيكَ مِنْ كُلِّ شَيْءٍ».",
};

const SAYYID = "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ";
const SAYYID_TR = {
  fr: "Ô Allah, Tu es mon Seigneur, nulle divinité sauf Toi. Tu m'as créé et je suis Ton serviteur ; je reste fidèle à Ton pacte autant que je le peux. Je me réfugie auprès de Toi contre le mal que j'ai commis. Je reconnais Tes bienfaits envers moi et je reconnais mon péché : pardonne-moi, car nul ne pardonne les péchés sauf Toi.",
  en: "O Allah, You are my Lord, there is no god but You. You created me and I am Your servant; I keep Your covenant as best I can. I seek refuge in You from the evil I have done. I acknowledge Your favours upon me and I admit my sin, so forgive me, for none forgives sins but You.",
};
const SAYYID_FADL: L3 = {
  fr: "C'est le « maître de la demande de pardon ». Celui qui le dit le jour avec certitude et meurt avant le soir fait partie des gens du Paradis ; de même la nuit.",
  en: "It is the “master of seeking forgiveness”. Whoever says it by day with certainty and dies before evening is among the people of Paradise; likewise at night.",
  ar: "سَيِّدُ الِاسْتِغْفَارِ: «مَنْ قَالَهَا مِنَ النَّهَارِ مُوقِنًا بِهَا فَمَاتَ مِنْ يَوْمِهِ قَبْلَ أَنْ يُمْسِيَ فَهُوَ مِنْ أَهْلِ الْجَنَّةِ، وَمَنْ قَالَهَا مِنَ اللَّيْلِ… فَهُوَ مِنْ أَهْلِ الْجَنَّةِ».",
};

const TAHLIL = "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ";
const TAHLIL_TR = {
  fr: "Nulle divinité sauf Allah, Seul, sans associé. À Lui la royauté, à Lui la louange, et Il est capable de toute chose.",
  en: "There is no god but Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things.",
};

const SUBHANA_BIHAMDIH_FADL: L3 = {
  fr: "Celui qui dit « Subhana Allah wa bihamdih » cent fois par jour, ses péchés sont effacés même s'ils étaient comme l'écume de la mer.",
  en: "Whoever says “Subhan Allah wa bihamdih” a hundred times a day, his sins are wiped away even if they were like the foam of the sea.",
  ar: "«مَنْ قَالَ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ فِي يَوْمٍ مِائَةَ مَرَّةٍ حُطَّتْ خَطَايَاهُ وَإِنْ كَانَتْ مِثْلَ زَبَدِ الْبَحْرِ».",
};

const SALAT_IBRAHIMIYYA = "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ";

const YUNUS = "لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ";

/* ------------------------------------------------------------------ */
/* Sabah / Masa (nfs l-adhkar, b sighat l-wa9t)                        */
/* ------------------------------------------------------------------ */

interface ME extends Omit<Dhikr, "ar" | "tr"> {
  sabah: string;
  masa?: string;
  tr: { fr: string; en: string };
  trMasa?: { fr: string; en: string };
  only?: "sabah" | "masa";
}

const MORNING_EVENING: ME[] = [
  {
    id: "kursi", sabah: KURSI, count: 1, tr: KURSI_TR,
    fadl: {
      fr: "Celui qui la récite le matin est protégé des djinns jusqu'au soir, et celui qui la récite le soir est protégé jusqu'au matin.",
      en: "Whoever recites it in the morning is protected from the jinn until evening, and whoever recites it in the evening is protected until morning.",
      ar: "«مَنْ قَالَهَا حِينَ يُصْبِحُ أُجِيرَ مِنَ الْجِنِّ حَتَّى يُمْسِيَ، وَمَنْ قَالَهَا حِينَ يُمْسِي أُجِيرَ مِنْهُمْ حَتَّى يُصْبِحَ».",
    },
    src: "النسائي في الكبرى، الحاكم — صحّحه الألباني",
  },
  { id: "ikhlas", sabah: IKHLAS, count: 3, tr: { fr: "Sourate Al-Ikhlas : « Dis : Il est Allah, Unique… »", en: "Surah Al-Ikhlas: “Say: He is Allah, the One…”" }, fadl: QULS_FADL, src: "أبو داود 5082، الترمذي 3575" },
  { id: "falaq", sabah: FALAQ, count: 3, tr: { fr: "Sourate Al-Falaq : « Dis : Je cherche refuge auprès du Seigneur de l'aube… »", en: "Surah Al-Falaq: “Say: I seek refuge in the Lord of daybreak…”" }, fadl: QULS_FADL, src: "أبو داود 5082، الترمذي 3575" },
  { id: "nas", sabah: NAS, count: 3, tr: { fr: "Sourate An-Nas : « Dis : Je cherche refuge auprès du Seigneur des hommes… »", en: "Surah An-Nas: “Say: I seek refuge in the Lord of mankind…”" }, fadl: QULS_FADL, src: "أبو داود 5082، الترمذي 3575" },
  {
    id: "mulk",
    sabah: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
    masa: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
    count: 1,
    tr: { fr: "Nous voici au matin et la royauté appartient à Allah… Seigneur, je Te demande le bien de ce jour et de ce qui suit, et je me réfugie auprès de Toi contre son mal ; contre la paresse, la vieillesse pénible, le châtiment du Feu et de la tombe.", en: "We have reached the morning and the dominion belongs to Allah… My Lord, I ask You for the good of this day and what follows it, and seek refuge in You from its evil; from laziness, the misery of old age, and the punishment of the Fire and the grave." },
    trMasa: { fr: "Nous voici au soir et la royauté appartient à Allah… Seigneur, je Te demande le bien de cette nuit et de ce qui suit, et je me réfugie auprès de Toi contre son mal ; contre la paresse, la vieillesse pénible, le châtiment du Feu et de la tombe.", en: "We have reached the evening and the dominion belongs to Allah… My Lord, I ask You for the good of this night and what follows it, and seek refuge in You from its evil; from laziness, the misery of old age, and the punishment of the Fire and the grave." },
    fadl: { fr: "Le Prophète ﷺ le disait chaque matin et chaque soir.", en: "The Prophet ﷺ used to say it every morning and evening.", ar: "كَانَ النَّبِيُّ ﷺ يَقُولُهُ إِذَا أَصْبَحَ وَإِذَا أَمْسَى." },
    src: "مسلم 2723",
  },
  {
    id: "sayyid", sabah: SAYYID, count: 1, tr: SAYYID_TR, fadl: SAYYID_FADL, src: "البخاري 6306",
  },
  {
    id: "bika",
    sabah: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
    masa: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
    count: 1,
    tr: { fr: "Ô Allah, c'est par Toi que nous atteignons le matin et le soir, par Toi que nous vivons et mourons, et vers Toi est la résurrection.", en: "O Allah, by You we reach the morning and the evening, by You we live and die, and to You is the resurrection." },
    trMasa: { fr: "Ô Allah, c'est par Toi que nous atteignons le soir et le matin, par Toi que nous vivons et mourons, et vers Toi est le retour.", en: "O Allah, by You we reach the evening and the morning, by You we live and die, and to You is the final return." },
    src: "الترمذي 3391، أبو داود 5068",
  },
  {
    id: "bismillah", sabah: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", count: 3,
    tr: { fr: "Au nom d'Allah, avec le nom duquel rien sur terre ni dans le ciel ne peut nuire, et Il est l'Audient, l'Omniscient.", en: "In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing." },
    fadl: { fr: "Celui qui le dit trois fois le matin et trois fois le soir, rien ne lui nuira.", en: "Whoever says it three times in the morning and three times in the evening, nothing will harm him.", ar: "«مَنْ قَالَهَا ثَلَاثَ مَرَّاتٍ لَمْ يَضُرَّهُ شَيْءٌ»." },
    src: "أبو داود 5088، الترمذي 3388",
  },
  {
    id: "radhitu", sabah: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا", count: 3,
    tr: { fr: "Je suis satisfait d'Allah comme Seigneur, de l'Islam comme religion et de Muhammad ﷺ comme Prophète.", en: "I am pleased with Allah as Lord, with Islam as religion and with Muhammad ﷺ as Prophet." },
    fadl: { fr: "Allah s'engage à satisfaire, le Jour de la Résurrection, celui qui le dit trois fois matin et soir.", en: "Allah has taken it upon Himself to please, on the Day of Resurrection, whoever says it three times morning and evening.", ar: "«كَانَ حَقًّا عَلَى اللَّهِ أَنْ يُرْضِيَهُ يَوْمَ الْقِيَامَةِ»." },
    src: "أبو داود 5072، الترمذي 3389",
  },
  {
    id: "hayy", sabah: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ", count: 1,
    tr: { fr: "Ô Vivant, ô Celui qui subsiste par Lui-même, par Ta miséricorde j'implore Ton secours : arrange toutes mes affaires et ne me confie pas à moi-même, ne serait-ce qu'un clin d'œil.", en: "O Ever-Living, O Sustainer, by Your mercy I seek help: set right all my affairs and do not leave me to myself even for the blink of an eye." },
    fadl: { fr: "Conseil du Prophète ﷺ à sa fille Fatima, à dire matin et soir.", en: "The Prophet's ﷺ advice to his daughter Fatima, to be said morning and evening.", ar: "وَصِيَّةُ النَّبِيِّ ﷺ لِفَاطِمَةَ رَضِيَ اللَّهُ عَنْهَا: «أَنْ تَقُولِي إِذَا أَصْبَحْتِ وَإِذَا أَمْسَيْتِ»." },
    src: "النسائي في الكبرى، الحاكم — حسّنه الألباني",
  },
  {
    id: "afini", sabah: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَٰهَ إِلَّا أَنْتَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَٰهَ إِلَّا أَنْتَ", count: 3,
    tr: { fr: "Ô Allah, accorde la santé à mon corps, à mon ouïe, à ma vue ; nulle divinité sauf Toi. Ô Allah, je me réfugie auprès de Toi contre la mécréance, la pauvreté et le châtiment de la tombe.", en: "O Allah, grant health to my body, my hearing and my sight; there is no god but You. O Allah, I seek refuge in You from disbelief, poverty and the punishment of the grave." },
    src: "أبو داود 5090",
  },
  {
    id: "afw", sabah: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي", count: 1,
    tr: { fr: "Ô Allah, je Te demande le pardon et la préservation ici-bas et dans l'au-delà, dans ma religion, ma vie, ma famille et mes biens. Couvre mes défauts, apaise mes craintes, protège-moi de devant, de derrière, de droite, de gauche et d'en haut, et je me réfugie dans Ta grandeur pour ne pas être pris par en dessous.", en: "O Allah, I ask You for pardon and well-being in this world and the next, in my religion, my life, my family and my wealth. Cover my faults, calm my fears, guard me from before me, behind me, my right, my left and above me, and I seek refuge in Your greatness from being taken from beneath me." },
    fadl: { fr: "Le Prophète ﷺ ne délaissait jamais ces invocations, ni le matin ni le soir.", en: "The Prophet ﷺ never abandoned these supplications, morning or evening.", ar: "«لَمْ يَكُنْ رَسُولُ اللَّهِ ﷺ يَدَعُ هَؤُلَاءِ الدَّعَوَاتِ حِينَ يُمْسِي وَحِينَ يُصْبِحُ»." },
    src: "أبو داود 5074، ابن ماجه 3871",
  },
  {
    id: "alim", sabah: "اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ، فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي، وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ، وَأَنْ أَقْتَرِفَ عَلَى نَفْسِي سُوءًا أَوْ أَجُرَّهُ إِلَى مُسْلِمٍ", count: 1,
    tr: { fr: "Ô Allah, Connaisseur de l'invisible et du visible, Créateur des cieux et de la terre, Seigneur et Possesseur de toute chose, j'atteste qu'il n'y a de divinité que Toi. Je me réfugie auprès de Toi contre le mal de mon âme, le mal de Satan et son associationnisme, et contre le fait de commettre un mal contre moi-même ou de l'attirer sur un musulman.", en: "O Allah, Knower of the unseen and the seen, Creator of the heavens and the earth, Lord and Sovereign of all things, I bear witness that there is no god but You. I seek refuge in You from the evil of my soul, from the evil of Satan and his call to shirk, and from wronging myself or bringing harm upon a Muslim." },
    fadl: { fr: "Enseigné par le Prophète ﷺ à Abu Bakr : à dire le matin, le soir et au coucher.", en: "Taught by the Prophet ﷺ to Abu Bakr: to say in the morning, evening and at bedtime.", ar: "عَلَّمَهُ النَّبِيُّ ﷺ أَبَا بَكْرٍ: «قُلْهُ إِذَا أَصْبَحْتَ وَإِذَا أَمْسَيْتَ وَإِذَا أَخَذْتَ مَضْجَعَكَ»." },
    src: "الترمذي 3392، أبو داود 5067",
  },
  {
    id: "fitra",
    sabah: "أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ",
    masa: "أَمْسَيْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ",
    count: 1,
    tr: { fr: "Nous voici au matin sur la nature saine de l'Islam, sur la parole de l'unicité, sur la religion de notre Prophète Muhammad ﷺ et sur la voie de notre père Ibrahim, monothéiste pur, qui n'était pas du nombre des associateurs.", en: "We have reached the morning upon the natural way of Islam, the word of sincerity, the religion of our Prophet Muhammad ﷺ and the way of our father Ibrahim, upright and Muslim, who was not of the polytheists." },
    trMasa: { fr: "Nous voici au soir sur la nature saine de l'Islam, sur la parole de l'unicité, sur la religion de notre Prophète Muhammad ﷺ et sur la voie de notre père Ibrahim, monothéiste pur.", en: "We have reached the evening upon the natural way of Islam, the word of sincerity, the religion of our Prophet Muhammad ﷺ and the way of our father Ibrahim, upright and Muslim." },
    src: "أحمد 15360",
  },
  {
    id: "nima",
    sabah: "اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
    masa: "اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
    count: 1,
    tr: { fr: "Ô Allah, tout bienfait dont moi ou l'une de Tes créatures jouissons ce matin vient de Toi seul, sans associé : à Toi la louange et la gratitude.", en: "O Allah, whatever blessing I or any of Your creation have this morning is from You alone, without partner: Yours is the praise and the thanks." },
    trMasa: { fr: "Ô Allah, tout bienfait dont moi ou l'une de Tes créatures jouissons ce soir vient de Toi seul, sans associé : à Toi la louange et la gratitude.", en: "O Allah, whatever blessing I or any of Your creation have this evening is from You alone, without partner: Yours is the praise and the thanks." },
    fadl: { fr: "Celui qui le dit le matin s'est acquitté de la gratitude de sa journée, et le soir de celle de sa nuit.", en: "Whoever says it in the morning has fulfilled the gratitude due for his day, and in the evening for his night.", ar: "«مَنْ قَالَهَا حِينَ يُصْبِحُ فَقَدْ أَدَّى شُكْرَ يَوْمِهِ، وَمَنْ قَالَهَا حِينَ يُمْسِي فَقَدْ أَدَّى شُكْرَ لَيْلَتِهِ»." },
    src: "أبو داود 5073",
  },
  {
    id: "hasbi", sabah: "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", count: 7,
    tr: { fr: "Allah me suffit, nulle divinité sauf Lui ; en Lui je place ma confiance et Il est le Seigneur du Trône immense.", en: "Allah is sufficient for me; there is no god but Him. In Him I put my trust, and He is the Lord of the Mighty Throne." },
    fadl: { fr: "Allah suffit à celui qui le dit sept fois matin et soir pour ce qui le préoccupe.", en: "Allah suffices whoever says it seven times morning and evening in what concerns him.", ar: "«كَفَاهُ اللَّهُ مَا أَهَمَّهُ»." },
    src: "أبو داود 5081 (موقوف على أبي الدرداء) — التوبة 129",
  },
  {
    id: "kalimat", only: "masa", sabah: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", count: 3,
    tr: { fr: "Je me réfugie dans les paroles parfaites d'Allah contre le mal de ce qu'Il a créé.", en: "I seek refuge in the perfect words of Allah from the evil of what He has created." },
    fadl: { fr: "Celui qui le dit le soir, aucune piqûre (de scorpion) ne lui nuira cette nuit-là.", en: "Whoever says it in the evening, no sting (of a scorpion) will harm him that night.", ar: "«أَمَا لَوْ قُلْتَ حِينَ أَمْسَيْتَ… لَمْ تَضُرَّكَ»." },
    src: "مسلم 2709",
  },
  {
    id: "juwayriya", only: "sabah", sabah: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ", count: 3,
    tr: { fr: "Gloire et louange à Allah, autant que le nombre de Ses créatures, autant qu'Il agrée, autant que le poids de Son Trône et l'encre de Ses paroles.", en: "Glory and praise be to Allah, as many as His creatures, as much as pleases Him, as the weight of His Throne and the ink of His words." },
    fadl: { fr: "Ces quatre paroles dites trois fois pèsent plus que tout ce que Juwayriya avait dit depuis l'aube.", en: "These four phrases said three times outweigh all that Juwayriya had said since dawn.", ar: "«لَقَدْ قُلْتُ بَعْدَكِ أَرْبَعَ كَلِمَاتٍ ثَلَاثَ مَرَّاتٍ لَوْ وُزِنَتْ بِمَا قُلْتِ مُنْذُ الْيَوْمِ لَوَزَنَتْهُنَّ»." },
    src: "مسلم 2726",
  },
  {
    id: "ilm", only: "sabah", sabah: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا", count: 1,
    tr: { fr: "Ô Allah, je Te demande une science utile, une subsistance pure et des œuvres acceptées.", en: "O Allah, I ask You for beneficial knowledge, good provision and accepted deeds." },
    fadl: { fr: "Le Prophète ﷺ le disait après la prière du Fajr.", en: "The Prophet ﷺ said it after the Fajr prayer.", ar: "كَانَ ﷺ يَقُولُهُ إِذَا صَلَّى الصُّبْحَ." },
    src: "ابن ماجه 925",
  },
  {
    id: "tahlil10", sabah: TAHLIL, count: 10, tr: TAHLIL_TR,
    fadl: { fr: "Celui qui le dit dix fois est comme celui qui a affranchi quatre âmes des descendants d'Ismaïl.", en: "Whoever says it ten times is like one who freed four souls from the descendants of Isma'il.", ar: "«مَنْ قَالَهَا عَشْرَ مِرَارٍ كَانَ كَمَنْ أَعْتَقَ أَرْبَعَةَ أَنْفُسٍ مِنْ وَلَدِ إِسْمَاعِيلَ»." },
    src: "مسلم 2693",
  },
  {
    id: "subhan100", sabah: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", count: 100,
    tr: { fr: "Gloire et louange à Allah.", en: "Glory and praise be to Allah." },
    fadl: {
      fr: "Personne ne viendra le Jour de la Résurrection avec mieux que celui qui l'a dit cent fois matin et soir, sauf celui qui en a dit autant ou plus.",
      en: "No one will come on the Day of Resurrection with anything better than one who said it a hundred times morning and evening, except one who said the same or more.",
      ar: "«مَنْ قَالَ حِينَ يُصْبِحُ وَحِينَ يُمْسِي: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ مِائَةَ مَرَّةٍ، لَمْ يَأْتِ أَحَدٌ يَوْمَ الْقِيَامَةِ بِأَفْضَلَ مِمَّا جَاءَ بِهِ، إِلَّا أَحَدٌ قَالَ مِثْلَ مَا قَالَ أَوْ زَادَ عَلَيْهِ»." },
    src: "مسلم 2692",
  },
  {
    id: "istighfar100", sabah: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", count: 100,
    tr: { fr: "Je demande pardon à Allah et je me repens à Lui.", en: "I seek Allah's forgiveness and turn to Him in repentance." },
    fadl: { fr: "Le Prophète ﷺ demandait pardon à Allah cent fois par jour.", en: "The Prophet ﷺ sought Allah's forgiveness a hundred times a day.", ar: "«إِنِّي لَأَسْتَغْفِرُ اللَّهَ فِي الْيَوْمِ مِائَةَ مَرَّةٍ»." },
    src: "مسلم 2702",
  },
  {
    id: "salat10", sabah: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ", count: 10,
    tr: { fr: "Ô Allah, prie sur notre Prophète Muhammad et accorde-lui la paix.", en: "O Allah, send blessings and peace upon our Prophet Muhammad." },
    fadl: { fr: "Celui qui prie sur moi une fois, Allah prie sur lui dix fois.", en: "Whoever sends blessings upon me once, Allah sends blessings upon him tenfold.", ar: "«مَنْ صَلَّى عَلَيَّ وَاحِدَةً صَلَّى اللَّهُ عَلَيْهِ عَشْرًا»." },
    src: "مسلم 408",
  },
];

const fromME = (when: "sabah" | "masa"): Dhikr[] =>
  MORNING_EVENING.filter((e) => !e.only || e.only === when).map((e) => ({
    id: e.id,
    ar: when === "masa" && e.masa ? e.masa : e.sabah,
    count: e.count,
    tr: when === "masa" && e.trMasa ? e.trMasa : e.tr,
    fadl: e.fadl,
    src: e.src,
  }));
  /* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export const ADHKAR: AdhkarCategory[] = [
  {
    id: "sabah", icon: "sunrise", hue: 42,
    title: { fr: "Adhkar du matin", en: "Morning adhkar", ar: "أذكار الصباح" },
    desc: { fr: "De l'aube jusqu'au lever du soleil (et jusqu'au milieu de la matinée).", en: "From dawn until sunrise (and until mid-morning).", ar: "مِنْ طُلُوعِ الْفَجْرِ إِلَى طُلُوعِ الشَّمْسِ." },
    intro: { fr: "« Et glorifie ton Seigneur avant le lever du soleil et avant son coucher. » (Qaf 39)", en: "“And glorify your Lord before the rising of the sun and before its setting.” (Qaf 39)", ar: "﴿وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ الْغُرُوبِ﴾ [ق: 39]" },
    items: fromME("sabah"),
  },
  {
    id: "masa", icon: "sunset", hue: 280,
    title: { fr: "Adhkar du soir", en: "Evening adhkar", ar: "أذكار المساء" },
    desc: { fr: "De l'après-midi ('Asr) jusqu'à la nuit.", en: "From the afternoon ('Asr) until nightfall.", ar: "مِنَ الْعَصْرِ إِلَى اللَّيْلِ." },
    intro: { fr: "« Glorifiez Allah soir et matin. » (Ar-Rum 17)", en: "“So exalt Allah when you reach the evening and when you reach the morning.” (Ar-Rum 17)", ar: "﴿فَسُبْحَانَ اللَّهِ حِينَ تُمْسُونَ وَحِينَ تُصْبِحُونَ﴾ [الروم: 17]" },
    items: fromME("masa"),
  },
  {
    id: "salat", icon: "prayer", hue: 160,
    title: { fr: "Après la prière", en: "After prayer", ar: "أذكار بعد الصلاة" },
    desc: { fr: "À dire après chaque prière obligatoire.", en: "To say after every obligatory prayer.", ar: "تُقَالُ دُبُرَ كُلِّ صَلَاةٍ مَكْتُوبَةٍ." },
    items: [
      { id: "astaghfir3", ar: "أَسْتَغْفِرُ اللَّهَ", count: 3, tr: { fr: "Je demande pardon à Allah.", en: "I seek Allah's forgiveness." }, src: "مسلم 591" },
      {
        id: "salam", ar: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", count: 1,
        tr: { fr: "Ô Allah, Tu es la Paix et de Toi vient la paix ; Béni sois-Tu, ô Plein de majesté et de générosité.", en: "O Allah, You are Peace and from You comes peace; Blessed are You, O Possessor of majesty and honour." },
        fadl: { fr: "Le Prophète ﷺ le disait dès qu'il terminait sa prière, après avoir demandé pardon trois fois.", en: "The Prophet ﷺ said it as soon as he finished his prayer, after seeking forgiveness three times.", ar: "كَانَ ﷺ إِذَا انْصَرَفَ مِنْ صَلَاتِهِ اسْتَغْفَرَ ثَلَاثًا ثُمَّ قَالَهُ." },
        src: "مسلم 591",
      },
      {
        id: "mani", ar: `${TAHLIL}، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ`, count: 1,
        tr: { fr: "…Ô Allah, nul ne peut retenir ce que Tu donnes, ni donner ce que Tu retiens, et la fortune ne sert à rien à son possesseur face à Toi.", en: "…O Allah, none can withhold what You give, nor give what You withhold, and the wealth of the wealthy avails nothing against You." },
        src: "البخاري 844، مسلم 593",
      },
      {
        id: "aini", ar: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", count: 1,
        tr: { fr: "Ô Allah, aide-moi à T'évoquer, à Te remercier et à bien T'adorer.", en: "O Allah, help me to remember You, to thank You and to worship You well." },
        fadl: { fr: "« Ô Mu'adh, par Allah, je t'aime : ne délaisse pas, après chaque prière, de dire… »", en: "“O Mu'adh, by Allah I love you: do not fail to say after every prayer…”", ar: "«يَا مُعَاذُ، وَاللَّهِ إِنِّي لَأُحِبُّكَ، لَا تَدَعَنَّ فِي دُبُرِ كُلِّ صَلَاةٍ تَقُولُ…»." },
        src: "أبو داود 1522، النسائي 1303",
      },
      { id: "tasbih33", ar: "سُبْحَانَ اللَّهِ", count: 33, tr: { fr: "Gloire à Allah.", en: "Glory be to Allah." }, src: "مسلم 597" },
      { id: "tahmid33", ar: "الْحَمْدُ لِلَّهِ", count: 33, tr: { fr: "Louange à Allah.", en: "Praise be to Allah." }, src: "مسلم 597" },
      { id: "takbir33", ar: "اللَّهُ أَكْبَرُ", count: 33, tr: { fr: "Allah est le plus Grand.", en: "Allah is the Greatest." }, src: "مسلم 597" },
      {
        id: "tamam", ar: TAHLIL, count: 1, tr: TAHLIL_TR,
        fadl: { fr: "Celui qui glorifie 33 fois, loue 33 fois, magnifie 33 fois et complète la centaine par cette parole, ses fautes sont pardonnées même si elles étaient comme l'écume de la mer.", en: "Whoever glorifies 33 times, praises 33 times, magnifies 33 times and completes the hundred with this, his sins are forgiven even if they were like the foam of the sea.", ar: "«…وَقَالَ تَمَامَ الْمِائَةِ: لَا إِلَٰهَ إِلَّا اللَّهُ… غُفِرَتْ خَطَايَاهُ وَإِنْ كَانَتْ مِثْلَ زَبَدِ الْبَحْرِ»." },
        src: "مسلم 597",
      },
      {
        id: "kursi", ar: KURSI, count: 1, tr: KURSI_TR,
        fadl: { fr: "Celui qui la récite après chaque prière obligatoire, rien ne l'empêche d'entrer au Paradis sinon la mort.", en: "Whoever recites it after every obligatory prayer, nothing prevents him from entering Paradise except death.", ar: "«مَنْ قَرَأَ آيَةَ الْكُرْسِيِّ فِي دُبُرِ كُلِّ صَلَاةٍ مَكْتُوبَةٍ لَمْ يَمْنَعْهُ مِنْ دُخُولِ الْجَنَّةِ إِلَّا أَنْ يَمُوتَ»." },
        src: "النسائي في الكبرى 9928 — صحّحه الألباني",
      },
      {
        id: "muawwidhat", ar: `${IKHLAS} ۝ ${FALAQ} ۝ ${NAS}`, count: 1,
        tr: { fr: "Al-Ikhlas, Al-Falaq et An-Nas (trois fois après Fajr et Maghrib).", en: "Al-Ikhlas, Al-Falaq and An-Nas (three times after Fajr and Maghrib)." },
        fadl: { fr: "« Le Prophète ﷺ m'a ordonné de réciter les mu'awwidhat après chaque prière. » ('Uqba ibn 'Amir)", en: "“The Prophet ﷺ ordered me to recite the mu'awwidhat after every prayer.” ('Uqba ibn 'Amir)", ar: "«أَمَرَنِي رَسُولُ اللَّهِ ﷺ أَنْ أَقْرَأَ بِالْمُعَوِّذَاتِ دُبُرَ كُلِّ صَلَاةٍ»." },
        src: "أبو داود 1523، الترمذي 2903",
      },
    ],
  },
  {
    id: "nawm", icon: "moon", hue: 230,
    title: { fr: "Avant de dormir", en: "Before sleep", ar: "أذكار النوم" },
    desc: { fr: "Pour une nuit protégée et un cœur apaisé.", en: "For a protected night and a peaceful heart.", ar: "لِلَيْلَةٍ مَحْفُوظَةٍ وَقَلْبٍ مُطْمَئِنٍّ." },
    items: [
      {
        id: "nafth", ar: `${IKHLAS} ۝ ${FALAQ} ۝ ${NAS}`, count: 3,
        tr: { fr: "Joindre les mains, souffler dedans, réciter les trois Qul puis passer les mains sur le corps.", en: "Join the palms, blow into them, recite the three Quls, then wipe over the body." },
        fadl: { fr: "Chaque nuit, le Prophète ﷺ joignait ses mains, y soufflait, les récitait puis s'essuyait le corps, trois fois.", en: "Every night the Prophet ﷺ joined his palms, blew into them, recited them and wiped his body, three times.", ar: "كَانَ ﷺ إِذَا أَوَى إِلَى فِرَاشِهِ كُلَّ لَيْلَةٍ جَمَعَ كَفَّيْهِ ثُمَّ نَفَثَ فِيهِمَا فَقَرَأَ فِيهِمَا… يَفْعَلُ ذَلِكَ ثَلَاثَ مَرَّاتٍ." },
        src: "البخاري 5017",
      },
      {
        id: "kursi", ar: KURSI, count: 1, tr: KURSI_TR,
        fadl: { fr: "Un gardien d'Allah veillera sur toi et aucun diable ne s'approchera de toi jusqu'au matin.", en: "A guardian from Allah will stay with you and no devil will come near you until morning.", ar: "«لَنْ يَزَالَ عَلَيْكَ مِنَ اللَّهِ حَافِظٌ، وَلَا يَقْرَبُكَ شَيْطَانٌ حَتَّى تُصْبِحَ»." },
        src: "البخاري 2311",
      },
      {
        id: "baqara", count: 1,
        ar: "آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ ۝ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
        tr: { fr: "Les deux derniers versets de la sourate Al-Baqara (285-286).", en: "The last two verses of Surah Al-Baqara (285-286)." },
        fadl: { fr: "Celui qui les récite la nuit, ils lui suffiront.", en: "Whoever recites them at night, they will suffice him.", ar: "«مَنْ قَرَأَ بِالْآيَتَيْنِ مِنْ آخِرِ سُورَةِ الْبَقَرَةِ فِي لَيْلَةٍ كَفَتَاهُ»." },
        src: "البخاري 5009، مسلم 807",
      },
      {
        id: "bismika", ar: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ", count: 1,
        tr: { fr: "En Ton nom, mon Seigneur, je pose mon flanc et par Toi je le relève. Si Tu retiens mon âme, fais-lui miséricorde ; si Tu la renvoies, protège-la comme Tu protèges Tes serviteurs vertueux.", en: "In Your name, my Lord, I lay down my side and by You I raise it. If You take my soul, have mercy on it; if You release it, protect it as You protect Your righteous servants." },
        src: "البخاري 6320، مسلم 2714",
      },
      {
        id: "aslamtu", ar: "اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ", count: 1,
        tr: { fr: "Ô Allah, je Te soumets mon âme, je Te confie mes affaires, je tourne mon visage vers Toi et je m'adosse à Toi, par désir et crainte de Toi. Il n'y a de refuge ni de salut contre Toi qu'auprès de Toi. Je crois en Ton Livre que Tu as révélé et en Ton Prophète que Tu as envoyé.", en: "O Allah, I submit my soul to You, entrust my affairs to You, turn my face to You and rely on You, in hope and fear of You. There is no refuge or escape from You except to You. I believe in Your Book which You revealed and Your Prophet whom You sent." },
        fadl: { fr: "Si tu meurs cette nuit-là, tu meurs sur la fitra ; fais-en tes dernières paroles.", en: "If you die that night you die upon the fitra; make these your last words.", ar: "«فَإِنْ مُتَّ مِنْ لَيْلَتِكَ فَأَنْتَ عَلَى الْفِطْرَةِ، وَاجْعَلْهُنَّ آخِرَ مَا تَتَكَلَّمُ بِهِ»." },
        src: "البخاري 6311، مسلم 2710",
      },
      {
        id: "qini", ar: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", count: 3,
        tr: { fr: "Ô Allah, préserve-moi de Ton châtiment le jour où Tu ressusciteras Tes serviteurs.", en: "O Allah, protect me from Your punishment on the Day You resurrect Your servants." },
        fadl: { fr: "Le Prophète ﷺ le disait trois fois en posant sa main droite sous sa joue.", en: "The Prophet ﷺ said it three times, placing his right hand under his cheek.", ar: "كَانَ ﷺ إِذَا أَرَادَ أَنْ يَرْقُدَ وَضَعَ يَدَهُ الْيُمْنَى تَحْتَ خَدِّهِ ثُمَّ يَقُولُهُ ثَلَاثَ مِرَارٍ." },
        src: "أبو داود 5045، الترمذي 3398",
      },
      {
        id: "amutu", ar: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", count: 1,
        tr: { fr: "C'est en Ton nom, ô Allah, que je meurs et que je vis.", en: "In Your name, O Allah, I die and I live." },
        src: "البخاري 6324",
      },
      { id: "nawm-tasbih", ar: "سُبْحَانَ اللَّهِ", count: 33, tr: { fr: "Gloire à Allah.", en: "Glory be to Allah." }, src: "البخاري 3705، مسلم 2727" },
      { id: "nawm-tahmid", ar: "الْحَمْدُ لِلَّهِ", count: 33, tr: { fr: "Louange à Allah.", en: "Praise be to Allah." }, src: "البخاري 3705، مسلم 2727" },
      {
        id: "nawm-takbir", ar: "اللَّهُ أَكْبَرُ", count: 34, tr: { fr: "Allah est le plus Grand.", en: "Allah is the Greatest." },
        fadl: { fr: "Enseigné à Fatima et 'Ali : « C'est meilleur pour vous qu'un serviteur. »", en: "Taught to Fatima and 'Ali: “It is better for you than a servant.”", ar: "«فَهُوَ خَيْرٌ لَكُمَا مِنْ خَادِمٍ»." },
        src: "البخاري 3705، مسلم 2727",
      },
    ],
  },
  {
    id: "istiqadh", icon: "alarm", hue: 28,
    title: { fr: "Au réveil", en: "Upon waking", ar: "أذكار الاستيقاظ" },
    desc: { fr: "Commencer la journée par la louange.", en: "Start the day with praise.", ar: "اِبْدَأْ يَوْمَكَ بِالْحَمْدِ." },
    items: [
      {
        id: "ahyana", ar: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", count: 1,
        tr: { fr: "Louange à Allah qui nous a rendu la vie après nous avoir fait mourir, et vers Lui est la résurrection.", en: "Praise be to Allah who gave us life after causing us to die, and to Him is the resurrection." },
        src: "البخاري 6312",
      },
      {
        id: "afani", ar: "الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي فِي جَسَدِي، وَرَدَّ عَلَيَّ رُوحِي، وَأَذِنَ لِي بِذِكْرِهِ", count: 1,
        tr: { fr: "Louange à Allah qui a préservé mon corps, m'a rendu mon âme et m'a permis de L'évoquer.", en: "Praise be to Allah who kept my body healthy, returned my soul to me and allowed me to remember Him." },
        src: "الترمذي 3401",
      },
      {
        id: "taarra", count: 1,
        ar: `${TAHLIL}، الْحَمْدُ لِلَّهِ، وَسُبْحَانَ اللَّهِ، وَلَا إِلَٰهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ، اللَّهُمَّ اغْفِرْ لِي`,
        tr: { fr: "…Louange à Allah, gloire à Allah, nulle divinité sauf Allah, Allah est le plus Grand, nulle force ni puissance sauf par Allah. Ô Allah, pardonne-moi.", en: "…Praise be to Allah, glory be to Allah, there is no god but Allah, Allah is the Greatest, there is no might nor power except by Allah. O Allah, forgive me." },
        fadl: { fr: "Celui qui se réveille la nuit et dit cela puis invoque, il est exaucé ; s'il fait ses ablutions et prie, sa prière est acceptée.", en: "Whoever wakes at night, says this and then supplicates is answered; if he makes wudu and prays, his prayer is accepted.", ar: "«…ثُمَّ قَالَ: اللَّهُمَّ اغْفِرْ لِي، أَوْ دَعَا، اسْتُجِيبَ لَهُ، فَإِنْ تَوَضَّأَ وَصَلَّى قُبِلَتْ صَلَاتُهُ»." },
        src: "البخاري 1154",
      },
    ],
  },
  {
    id: "istighfar", icon: "repent", hue: 190,
    title: { fr: "Istighfar", en: "Istighfar", ar: "الاستغفار" },
    desc: { fr: "Demander pardon : la clé de la miséricorde et de la subsistance.", en: "Seeking forgiveness: the key to mercy and provision.", ar: "مِفْتَاحُ الرَّحْمَةِ وَالرِّزْقِ." },
    intro: {
      fr: "« Implorez le pardon de votre Seigneur, car Il est grand Pardonneur : Il vous enverra du ciel des pluies abondantes, vous accordera beaucoup de biens et d'enfants. » (Nuh 10-12)",
      en: "“Ask forgiveness of your Lord; indeed He is ever Forgiving. He will send rain from the sky upon you in abundance and give you wealth and children.” (Nuh 10-12)",
      ar: "﴿فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا ۝ يُرْسِلِ السَّمَاءَ عَلَيْكُم مِّدْرَارًا ۝ وَيُمْدِدْكُم بِأَمْوَالٍ وَبَنِينَ﴾ [نوح: 10-12]",
    },
    items: [
      { id: "sayyid", ar: SAYYID, count: 1, tr: SAYYID_TR, fadl: SAYYID_FADL, src: "البخاري 6306" },
      {
        id: "atubu", ar: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", count: 100,
        tr: { fr: "Je demande pardon à Allah et je me repens à Lui.", en: "I seek Allah's forgiveness and repent to Him." },
        fadl: { fr: "« Ô gens, repentez-vous à Allah, car je me repens à Lui cent fois par jour. »", en: "“O people, repent to Allah, for I repent to Him a hundred times a day.”", ar: "«يَا أَيُّهَا النَّاسُ تُوبُوا إِلَى اللَّهِ، فَإِنِّي أَتُوبُ فِي الْيَوْمِ إِلَيْهِ مِائَةَ مَرَّةٍ»." },
        src: "مسلم 2702",
      },
      {
        id: "hayyqayyum", ar: "أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ", count: 3,
        tr: { fr: "Je demande pardon à Allah, nulle divinité sauf Lui, le Vivant, Celui qui subsiste par Lui-même, et je me repens à Lui.", en: "I seek forgiveness from Allah, there is no god but Him, the Ever-Living, the Sustainer, and I repent to Him." },
        fadl: { fr: "Celui qui le dit est pardonné, même s'il avait fui le champ de bataille.", en: "Whoever says it is forgiven, even if he had fled from the battlefield.", ar: "«غُفِرَ لَهُ وَإِنْ كَانَ فَرَّ مِنَ الزَّحْفِ»." },
        src: "أبو داود 1517، الترمذي 3577",
      },
      {
        id: "tawwab", ar: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ", count: 100,
        tr: { fr: "Seigneur, pardonne-moi et accepte mon repentir, Tu es certes Celui qui accueille le repentir, le Très Miséricordieux.", en: "My Lord, forgive me and accept my repentance; You are the Accepter of repentance, the Most Merciful." },
        fadl: { fr: "On comptait au Prophète ﷺ, en une seule assise, cent fois cette parole.", en: "In a single sitting, the Prophet ﷺ was counted saying this a hundred times.", ar: "«إِنْ كُنَّا لَنَعُدُّ لِرَسُولِ اللَّهِ ﷺ فِي الْمَجْلِسِ الْوَاحِدِ مِائَةَ مَرَّةٍ…»." },
        src: "أبو داود 1516، الترمذي 3434",
      },
      {
        id: "zalamtu", ar: "اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا، وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ، وَارْحَمْنِي، إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ", count: 1,
        tr: { fr: "Ô Allah, je me suis fait beaucoup de tort et nul ne pardonne les péchés sauf Toi ; accorde-moi un pardon venant de Toi et fais-moi miséricorde, Tu es le Pardonneur, le Miséricordieux.", en: "O Allah, I have greatly wronged myself and none forgives sins but You; grant me forgiveness from Yourself and have mercy on me, You are the Forgiving, the Merciful." },
        fadl: { fr: "Invocation enseignée par le Prophète ﷺ à Abu Bakr pour sa prière.", en: "Supplication taught by the Prophet ﷺ to Abu Bakr for his prayer.", ar: "عَلَّمَهُ النَّبِيُّ ﷺ أَبَا بَكْرٍ لِيَدْعُوَ بِهِ فِي صَلَاتِهِ." },
        src: "البخاري 834، مسلم 2705",
      },
      {
        id: "adam", ar: "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ", count: 3,
        tr: { fr: "Notre Seigneur, nous nous sommes fait du tort ; si Tu ne nous pardonnes pas et ne nous fais pas miséricorde, nous serons certes parmi les perdants.", en: "Our Lord, we have wronged ourselves; if You do not forgive us and have mercy on us, we will surely be among the losers." },
        fadl: { fr: "Le repentir d'Adam et Hawwa, accepté par Allah.", en: "The repentance of Adam and Hawwa, accepted by Allah.", ar: "تَوْبَةُ آدَمَ وَحَوَّاءَ عَلَيْهِمَا السَّلَامُ." },
        src: "الأعراف 23",
      },
      {
        id: "yunus", ar: YUNUS, count: 3,
        tr: { fr: "Nulle divinité sauf Toi, gloire à Toi, j'ai été du nombre des injustes.", en: "There is no god but You, glory be to You, I have been among the wrongdoers." },
        fadl: { fr: "L'invocation de Yunus : aucun musulman n'invoque par elle sans qu'Allah ne lui réponde.", en: "The supplication of Yunus: no Muslim calls with it without Allah answering him.", ar: "«لَمْ يَدْعُ بِهَا رَجُلٌ مُسْلِمٌ فِي شَيْءٍ قَطُّ إِلَّا اسْتَجَابَ اللَّهُ لَهُ»." },
        src: "الترمذي 3505 — الأنبياء 87",
      },
    ],
  },
    {
    id: "tasbih", icon: "sparkle", hue: 140,
    title: { fr: "Se rapprocher d'Allah", en: "Drawing near to Allah", ar: "التقرب إلى الله" },
    desc: { fr: "Les paroles les plus aimées d'Allah : tasbih, tahmid, tahlil, takbir.", en: "The words most beloved to Allah: tasbih, tahmid, tahlil, takbir.", ar: "أَحَبُّ الْكَلَامِ إِلَى اللَّهِ." },
    intro: {
      fr: "« Je suis tel que Mon serviteur pense de Moi, et Je suis avec lui quand il M'évoque. » (Hadith qudsi)",
      en: "“I am as My servant thinks of Me, and I am with him when he remembers Me.” (Hadith qudsi)",
      ar: "«أَنَا عِنْدَ ظَنِّ عَبْدِي بِي، وَأَنَا مَعَهُ إِذَا ذَكَرَنِي» — البخاري 7405",
    },
    items: [
      {
        id: "baqiyat", ar: "سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَٰهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ", count: 33,
        tr: { fr: "Gloire à Allah, louange à Allah, nulle divinité sauf Allah, Allah est le plus Grand.", en: "Glory be to Allah, praise be to Allah, there is no god but Allah, Allah is the Greatest." },
        fadl: { fr: "Les paroles les plus aimées d'Allah ; les dire m'est plus cher que tout ce sur quoi le soleil se lève.", en: "The words most beloved to Allah; saying them is dearer to me than all the sun rises upon.", ar: "«أَحَبُّ الْكَلَامِ إِلَى اللَّهِ أَرْبَعٌ…»، «لَأَنْ أَقُولَ… أَحَبُّ إِلَيَّ مِمَّا طَلَعَتْ عَلَيْهِ الشَّمْسُ»." },
        src: "مسلم 2137، 2695",
      },
      {
        id: "khafifatan", ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ", count: 33,
        tr: { fr: "Gloire et louange à Allah, gloire à Allah l'Immense.", en: "Glory and praise be to Allah, glory be to Allah the Magnificent." },
        fadl: { fr: "Deux paroles légères sur la langue, lourdes dans la balance, aimées du Tout-Miséricordieux.", en: "Two words light on the tongue, heavy on the scale, beloved to the Most Merciful.", ar: "«كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلَتَانِ فِي الْمِيزَانِ، حَبِيبَتَانِ إِلَى الرَّحْمَٰنِ»." },
        src: "البخاري 6406، مسلم 2694",
      },
      { id: "bihamdih", ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", count: 100, tr: { fr: "Gloire et louange à Allah.", en: "Glory and praise be to Allah." }, fadl: SUBHANA_BIHAMDIH_FADL, src: "البخاري 6405، مسلم 2691" },
      {
        id: "nakhla", ar: "سُبْحَانَ اللَّهِ الْعَظِيمِ وَبِحَمْدِهِ", count: 10,
        tr: { fr: "Gloire à Allah l'Immense et louange à Lui.", en: "Glory be to Allah the Magnificent and praise be to Him." },
        fadl: { fr: "Pour chaque fois, un palmier est planté pour lui au Paradis.", en: "For each time, a palm tree is planted for him in Paradise.", ar: "«مَنْ قَالَ: سُبْحَانَ اللَّهِ الْعَظِيمِ وَبِحَمْدِهِ، غُرِسَتْ لَهُ نَخْلَةٌ فِي الْجَنَّةِ»." },
        src: "الترمذي 3464",
      },
      {
        id: "hawqala", ar: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", count: 33,
        tr: { fr: "Il n'y a de force ni de puissance qu'en Allah.", en: "There is no might nor power except by Allah." },
        fadl: { fr: "Un trésor parmi les trésors du Paradis.", en: "A treasure from the treasures of Paradise.", ar: "«كَنْزٌ مِنْ كُنُوزِ الْجَنَّةِ»." },
        src: "البخاري 4205، مسلم 2704",
      },
      {
        id: "tahlil", ar: "لَا إِلَٰهَ إِلَّا اللَّهُ", count: 100,
        tr: { fr: "Nulle divinité sauf Allah.", en: "There is no god but Allah." },
        fadl: { fr: "La meilleure des évocations est « La ilaha illa Allah ».", en: "The best remembrance is “La ilaha illa Allah”.", ar: "«أَفْضَلُ الذِّكْرِ: لَا إِلَٰهَ إِلَّا اللَّهُ»." },
        src: "الترمذي 3383، ابن ماجه 3800",
      },
      {
        id: "tahlil100", ar: TAHLIL, count: 100, tr: TAHLIL_TR,
        fadl: {
          fr: "Cent fois par jour : la récompense d'affranchir dix esclaves, cent bonnes actions inscrites, cent fautes effacées, et une protection contre Satan jusqu'au soir.",
          en: "A hundred times a day: the reward of freeing ten slaves, a hundred good deeds recorded, a hundred sins erased, and protection from Satan until evening.",
          ar: "«كَانَتْ لَهُ عَدْلَ عَشْرِ رِقَابٍ، وَكُتِبَتْ لَهُ مِائَةُ حَسَنَةٍ، وَمُحِيَتْ عَنْهُ مِائَةُ سَيِّئَةٍ، وَكَانَتْ لَهُ حِرْزًا مِنَ الشَّيْطَانِ يَوْمَهُ ذَلِكَ حَتَّى يُمْسِيَ»." },
        src: "البخاري 3293، مسلم 2691",
      },
      {
        id: "subhan100", ar: "سُبْحَانَ اللَّهِ", count: 100,
        tr: { fr: "Gloire à Allah.", en: "Glory be to Allah." },
        fadl: { fr: "Cent tasbih : mille bonnes actions inscrites ou mille fautes effacées.", en: "A hundred tasbih: a thousand good deeds recorded or a thousand sins erased.", ar: "«يُسَبِّحُ مِائَةَ تَسْبِيحَةٍ فَيُكْتَبُ لَهُ أَلْفُ حَسَنَةٍ أَوْ يُحَطُّ عَنْهُ أَلْفُ خَطِيئَةٍ»." },
        src: "مسلم 2698",
      },
      {
        id: "hamd", ar: "الْحَمْدُ لِلَّهِ", count: 33,
        tr: { fr: "Louange à Allah.", en: "Praise be to Allah." },
        fadl: { fr: "« Al-hamdu lillah » remplit la balance, et « Subhan Allah wal-hamdu lillah » remplissent ce qui est entre les cieux et la terre.", en: "“Al-hamdu lillah” fills the scale, and “Subhan Allah wal-hamdu lillah” fill what is between the heavens and the earth.", ar: "«وَالْحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ، وَسُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ تَمْلَآنِ مَا بَيْنَ السَّمَاوَاتِ وَالْأَرْضِ»." },
        src: "مسلم 223",
      },
      {
        id: "hamdkathir", ar: "الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ", count: 3,
        tr: { fr: "Louange à Allah, une louange abondante, pure et bénie.", en: "Praise be to Allah, abundant, pure and blessed praise." },
        fadl: { fr: "Plus de trente anges se sont précipités pour savoir lequel l'inscrirait le premier.", en: "More than thirty angels rushed to see which of them would record it first.", ar: "«رَأَيْتُ بِضْعَةً وَثَلَاثِينَ مَلَكًا يَبْتَدِرُونَهَا أَيُّهُمْ يَكْتُبُهَا أَوَّلُ»." },
        src: "البخاري 799",
      },
      {
        id: "kabiran", ar: "اللَّهُ أَكْبَرُ كَبِيرًا، وَالْحَمْدُ لِلَّهِ كَثِيرًا، وَسُبْحَانَ اللَّهِ بُكْرَةً وَأَصِيلًا", count: 3,
        tr: { fr: "Allah est le plus Grand, immensément ; louange abondante à Allah ; gloire à Allah matin et soir.", en: "Allah is the Greatest, greatly; much praise be to Allah; glory be to Allah morning and evening." },
        fadl: { fr: "« J'ai été émerveillé : les portes du ciel se sont ouvertes pour elle. »", en: "“I was amazed by it: the gates of heaven were opened for it.”", ar: "«عَجِبْتُ لَهَا، فُتِحَتْ لَهَا أَبْوَابُ السَّمَاءِ»." },
        src: "مسلم 601",
      },
    ],
  },
  {
    id: "salawat", icon: "heart", hue: 345,
    title: { fr: "Salat sur le Prophète ﷺ", en: "Blessings upon the Prophet ﷺ", ar: "الصلاة على النبي ﷺ" },
    desc: { fr: "Surtout le vendredi, et à chaque fois qu'il est mentionné.", en: "Especially on Friday, and whenever he is mentioned.", ar: "وَخَاصَّةً يَوْمَ الْجُمُعَةِ." },
    intro: {
      fr: "« Allah et Ses anges prient sur le Prophète. Ô vous qui croyez, priez sur lui et adressez-lui vos salutations. » (Al-Ahzab 56)",
      en: "“Indeed Allah and His angels send blessings upon the Prophet. O you who believe, send blessings upon him and greet him with peace.” (Al-Ahzab 56)",
      ar: "﴿إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا﴾ [الأحزاب: 56]",
    },
    items: [
      {
        id: "ibrahimiyya", ar: SALAT_IBRAHIMIYYA, count: 10,
        tr: { fr: "Ô Allah, prie sur Muhammad et sur la famille de Muhammad comme Tu as prié sur Ibrahim et sur la famille d'Ibrahim… et bénis Muhammad… Tu es certes Digne de louange et de gloire.", en: "O Allah, send blessings upon Muhammad and the family of Muhammad as You sent blessings upon Ibrahim and the family of Ibrahim… and bless Muhammad… You are Praiseworthy, Glorious." },
        fadl: { fr: "Celui qui prie sur moi une fois, Allah prie sur lui dix fois.", en: "Whoever sends blessings upon me once, Allah sends blessings upon him tenfold.", ar: "«مَنْ صَلَّى عَلَيَّ وَاحِدَةً صَلَّى اللَّهُ عَلَيْهِ عَشْرًا»." },
        src: "البخاري 3370 — مسلم 408",
      },
      {
        id: "short", ar: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ", count: 100,
        tr: { fr: "Ô Allah, prie sur notre Prophète Muhammad et accorde-lui la paix.", en: "O Allah, send blessings and peace upon our Prophet Muhammad." },
        fadl: { fr: "Dix prières d'Allah sur lui, dix fautes effacées et dix degrés d'élévation.", en: "Ten blessings from Allah upon him, ten sins erased and ten ranks raised.", ar: "«صَلَّى اللَّهُ عَلَيْهِ عَشْرَ صَلَوَاتٍ، وَحُطَّتْ عَنْهُ عَشْرُ خَطِيئَاتٍ، وَرُفِعَتْ لَهُ عَشْرُ دَرَجَاتٍ»." },
        src: "النسائي 1297",
      },
      {
        id: "salam", ar: "السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ", count: 10,
        tr: { fr: "Que la paix soit sur toi, ô Prophète, ainsi que la miséricorde d'Allah et Ses bénédictions.", en: "Peace be upon you, O Prophet, and the mercy of Allah and His blessings." },
        fadl: { fr: "Allah a des anges qui parcourent la terre et me transmettent le salut de ma communauté.", en: "Allah has angels who roam the earth conveying to me the greetings of my nation.", ar: "«إِنَّ لِلَّهِ مَلَائِكَةً سَيَّاحِينَ فِي الْأَرْضِ يُبَلِّغُونِي مِنْ أُمَّتِي السَّلَامَ»." },
        src: "النسائي 1282",
      },
      {
        id: "ubayy", ar: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ", count: 33,
        tr: { fr: "Ô Allah, prie sur Muhammad et sur la famille de Muhammad.", en: "O Allah, send blessings upon Muhammad and the family of Muhammad." },
        fadl: { fr: "À Ubayy qui voulait consacrer toute son invocation à la salat : « Alors tes soucis te seront suffis et ton péché pardonné. »", en: "To Ubayy, who wished to devote all his supplication to it: “Then your worries will be taken care of and your sin forgiven.”", ar: "«إِذًا تُكْفَى هَمَّكَ، وَيُغْفَرُ لَكَ ذَنْبُكَ»." },
        src: "الترمذي 2457",
      },
    ],
  },
  {
    id: "qurani", icon: "book", hue: 60,
    title: { fr: "Invocations du Coran", en: "Qur'anic supplications", ar: "أدعية من القرآن" },
    desc: { fr: "Les « Rabbana » des prophètes et des croyants.", en: "The “Rabbana” of the prophets and believers.", ar: "أَدْعِيَةُ الْأَنْبِيَاءِ وَالصَّالِحِينَ." },
    items: [
      {
        id: "hasana", ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", count: 3,
        tr: { fr: "Seigneur, accorde-nous une belle part ici-bas et une belle part dans l'au-delà, et protège-nous du châtiment du Feu.", en: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire." },
        fadl: { fr: "L'invocation que le Prophète ﷺ faisait le plus souvent.", en: "The supplication the Prophet ﷺ made most often.", ar: "«كَانَ أَكْثَرُ دُعَاءِ النَّبِيِّ ﷺ…»." },
        src: "البقرة 201 — البخاري 6389",
      },
      {
        id: "tuzigh", ar: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ", count: 1,
        tr: { fr: "Seigneur, ne laisse pas dévier nos cœurs après nous avoir guidés, et accorde-nous Ta miséricorde : Tu es le Grand Donateur.", en: "Our Lord, let not our hearts deviate after You have guided us, and grant us mercy from Yourself; You are the Bestower." },
        src: "آل عمران 8",
      },
      {
        id: "sharh", ar: "رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي ۝ وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي ۝ يَفْقَهُوا قَوْلِي", count: 1,
        tr: { fr: "Seigneur, ouvre-moi ma poitrine, facilite ma mission, dénoue le nœud de ma langue afin qu'ils comprennent mes paroles.", en: "My Lord, expand my chest, ease my task, and untie the knot from my tongue so they may understand my speech." },
        fadl: { fr: "L'invocation de Musa avant sa mission.", en: "The supplication of Musa before his mission.", ar: "دُعَاءُ مُوسَى عَلَيْهِ السَّلَامُ." },
        src: "طه 25-28",
      },
      {
        id: "ilman", ar: "رَّبِّ زِدْنِي عِلْمًا", count: 3,
        tr: { fr: "Seigneur, accrois ma science.", en: "My Lord, increase me in knowledge." },
        src: "طه 114",
      },
      {
        id: "qurra", ar: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا", count: 1,
        tr: { fr: "Seigneur, fais que nos épouses et nos descendants soient la joie de nos yeux, et fais de nous un modèle pour les pieux.", en: "Our Lord, grant us from our spouses and offspring comfort to our eyes, and make us leaders of the righteous." },
        src: "الفرقان 74",
      },
      {
        id: "muqim", ar: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ", count: 1,
        tr: { fr: "Seigneur, fais que j'accomplisse assidûment la prière, ainsi que ma descendance ; Seigneur, exauce mon invocation.", en: "My Lord, make me steadfast in prayer, and my descendants; our Lord, accept my supplication." },
        src: "إبراهيم 40",
      },
      {
        id: "walidayya", ar: "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ", count: 1,
        tr: { fr: "Seigneur, pardonne-moi, ainsi qu'à mes parents et aux croyants, le jour où se dressera le Jugement.", en: "Our Lord, forgive me, my parents and the believers on the Day the reckoning is established." },
        src: "إبراهيم 41",
      },
      {
        id: "irhamhuma", ar: "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا", count: 3,
        tr: { fr: "Seigneur, fais-leur miséricorde comme ils m'ont élevé tout petit.", en: "My Lord, have mercy on them as they raised me when I was small." },
        src: "الإسراء 24",
      },
      {
        id: "taqabbal", ar: "رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ", count: 1,
        tr: { fr: "Seigneur, accepte cela de notre part, Tu es l'Audient, l'Omniscient.", en: "Our Lord, accept this from us; You are the All-Hearing, the All-Knowing." },
        fadl: { fr: "L'invocation d'Ibrahim et Isma'il en élevant la Ka'ba.", en: "The supplication of Ibrahim and Isma'il while raising the Ka'ba.", ar: "دُعَاءُ إِبْرَاهِيمَ وَإِسْمَاعِيلَ عِنْدَ بِنَاءِ الْكَعْبَةِ." },
        src: "البقرة 127",
      },
      {
        id: "sabr", ar: "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ", count: 1,
        tr: { fr: "Seigneur, déverse sur nous l'endurance, affermis nos pas et donne-nous la victoire sur les mécréants.", en: "Our Lord, pour upon us patience, plant firmly our feet and give us victory over the disbelieving people." },
        src: "البقرة 250",
      },
    ],
  },
  {
    id: "karb", icon: "shield", hue: 205,
    title: { fr: "Soucis & détresse", en: "Worry & distress", ar: "الهم والكرب" },
    desc: { fr: "Quand le cœur est lourd : se tourner vers Allah.", en: "When the heart is heavy: turn to Allah.", ar: "إِذَا ضَاقَ الصَّدْرُ." },
    intro: { fr: "« N'est-ce point par l'évocation d'Allah que se tranquillisent les cœurs ? » (Ar-Ra'd 28)", en: "“Unquestionably, by the remembrance of Allah hearts are assured.” (Ar-Ra'd 28)", ar: "﴿أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾ [الرعد: 28]" },
    items: [
      {
        id: "karb", ar: "لَا إِلَٰهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ", count: 1,
        tr: { fr: "Nulle divinité sauf Allah, l'Immense, le Longanime ; nulle divinité sauf Allah, Seigneur du Trône immense ; nulle divinité sauf Allah, Seigneur des cieux, de la terre et du noble Trône.", en: "There is no god but Allah, the Magnificent, the Forbearing; no god but Allah, Lord of the Mighty Throne; no god but Allah, Lord of the heavens, the earth and the Noble Throne." },
        fadl: { fr: "Le Prophète ﷺ le disait dans les moments de détresse.", en: "The Prophet ﷺ said it in times of distress.", ar: "كَانَ ﷺ يَقُولُهُ عِنْدَ الْكَرْبِ." },
        src: "البخاري 6346، مسلم 2730",
      },
      {
        id: "yunus", ar: YUNUS, count: 7,
        tr: { fr: "Nulle divinité sauf Toi, gloire à Toi, j'ai été du nombre des injustes.", en: "There is no god but You, glory be to You, I have been among the wrongdoers." },
        fadl: { fr: "Aucun musulman n'invoque par elle sans qu'Allah ne lui réponde.", en: "No Muslim calls with it without Allah answering him.", ar: "«لَمْ يَدْعُ بِهَا رَجُلٌ مُسْلِمٌ فِي شَيْءٍ قَطُّ إِلَّا اسْتَجَابَ اللَّهُ لَهُ»." },
        src: "الترمذي 3505",
      },
      {
        id: "naasiyati", count: 1,
        ar: "اللَّهُمَّ إِنِّي عَبْدُكَ، ابْنُ عَبْدِكَ، ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ، أَسْأَلُكَ بِكُلِّ اسْمٍ هُوَ لَكَ سَمَّيْتَ بِهِ نَفْسَكَ، أَوْ أَنْزَلْتَهُ فِي كِتَابِكَ، أَوْ عَلَّمْتَهُ أَحَدًا مِنْ خَلْقِكَ، أَوِ اسْتَأْثَرْتَ بِهِ فِي عِلْمِ الْغَيْبِ عِنْدَكَ، أَنْ تَجْعَلَ الْقُرْآنَ رَبِيعَ قَلْبِي، وَنُورَ صَدْرِي، وَجَلَاءَ حُزْنِي، وَذَهَابَ هَمِّي",
        tr: { fr: "Ô Allah, je suis Ton serviteur, fils de Ton serviteur et de Ta servante ; mon toupet est dans Ta main… Je Te demande par chacun de Tes noms de faire du Coran le printemps de mon cœur, la lumière de ma poitrine, ce qui dissipe ma tristesse et chasse mon souci.", en: "O Allah, I am Your servant, son of Your servant and Your maidservant; my forelock is in Your hand… I ask You by every name of Yours to make the Qur'an the spring of my heart, the light of my chest, the departure of my sorrow and the release of my anxiety." },
        fadl: { fr: "Allah fait disparaître son souci et remplace sa tristesse par la joie.", en: "Allah removes his worry and replaces his sorrow with joy.", ar: "«إِلَّا أَذْهَبَ اللَّهُ هَمَّهُ وَحُزْنَهُ، وَأَبْدَلَهُ مَكَانَهُ فَرَحًا»." },
        src: "أحمد 3712 — صحّحه الألباني",
      },
      {
        id: "hamm", ar: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ", count: 3,
        tr: { fr: "Ô Allah, je me réfugie auprès de Toi contre le souci et la tristesse, l'incapacité et la paresse, l'avarice et la lâcheté, le poids des dettes et la domination des hommes.", en: "O Allah, I seek refuge in You from worry and grief, incapacity and laziness, miserliness and cowardice, the burden of debt and being overpowered by men." },
        src: "البخاري 6369",
      },
      {
        id: "rahmataka", ar: "اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ، لَا إِلَٰهَ إِلَّا أَنْتَ", count: 1,
        tr: { fr: "Ô Allah, c'est Ta miséricorde que j'espère : ne me confie pas à moi-même un clin d'œil, et arrange toutes mes affaires ; nulle divinité sauf Toi.", en: "O Allah, it is Your mercy I hope for, so do not leave me to myself even for the blink of an eye, and set right all my affairs; there is no god but You." },
        fadl: { fr: "Les invocations de celui qui est dans la détresse.", en: "The supplications of the one in distress.", ar: "«دَعَوَاتُ الْمَكْرُوبِ…»." },
        src: "أبو داود 5090",
      },
      {
        id: "rabbi", ar: "اللَّهُ اللَّهُ رَبِّي لَا أُشْرِكُ بِهِ شَيْئًا", count: 3,
        tr: { fr: "Allah, Allah est mon Seigneur, je ne Lui associe rien.", en: "Allah, Allah is my Lord; I associate nothing with Him." },
        fadl: { fr: "Enseigné par le Prophète ﷺ à Asma' pour les moments d'angoisse.", en: "Taught by the Prophet ﷺ to Asma' for moments of anguish.", ar: "«أَلَا أُعَلِّمُكِ كَلِمَاتٍ تَقُولِينَهُنَّ عِنْدَ الْكَرْبِ…»." },
        src: "أبو داود 1525",
      },
      {
        id: "hasbuna", ar: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", count: 7,
        tr: { fr: "Allah nous suffit, et quel excellent Garant !", en: "Allah is sufficient for us, and He is the best Disposer of affairs." },
        fadl: { fr: "Paroles d'Ibrahim lorsqu'il fut jeté dans le feu, et de Muhammad ﷺ quand on lui dit : « Les gens se sont rassemblés contre vous. »", en: "Said by Ibrahim when thrown into the fire, and by Muhammad ﷺ when told: “The people have gathered against you.”", ar: "«قَالَهَا إِبْرَاهِيمُ عَلَيْهِ السَّلَامُ حِينَ أُلْقِيَ فِي النَّارِ، وَقَالَهَا مُحَمَّدٌ ﷺ…»." },
        src: "البخاري 4563 — آل عمران 173",
      },
    ],
  },
  {
    id: "yawmi", icon: "home", hue: 100,
    title: { fr: "Au quotidien", en: "Daily life", ar: "أذكار اليوم والليلة" },
    desc: { fr: "Maison, repas, ablutions, mosquée, voyage…", en: "Home, meals, wudu, mosque, travel…", ar: "الْبَيْتُ، الطَّعَامُ، الْوُضُوءُ، الْمَسْجِدُ، السَّفَرُ…" },
    items: [
      {
        id: "khuruj", ar: "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", count: 1,
        tr: { fr: "En sortant de la maison : Au nom d'Allah, je place ma confiance en Allah, nulle force ni puissance sauf par Allah.", en: "On leaving home: In the name of Allah, I place my trust in Allah, there is no might nor power except by Allah." },
        fadl: { fr: "On lui dit : « Tu es guidé, suffi et protégé », et le diable s'écarte de lui.", en: "It is said to him: “You are guided, sufficed and protected,” and the devil moves away from him.", ar: "«يُقَالُ لَهُ: هُدِيتَ وَكُفِيتَ وَوُقِيتَ، وَتَنَحَّى عَنْهُ الشَّيْطَانُ»." },
        src: "أبو داود 5095، الترمذي 3426",
      },
      {
        id: "dukhul", ar: "بِسْمِ اللَّهِ", count: 1,
        tr: { fr: "En entrant à la maison et avant de manger : Au nom d'Allah.", en: "On entering home and before eating: In the name of Allah." },
        fadl: { fr: "Si l'on mentionne Allah en entrant et en mangeant, Satan dit : « Pas de gîte ni de dîner pour vous. »", en: "If one mentions Allah on entering and when eating, Satan says: “No lodging and no dinner for you.”", ar: "«…قَالَ الشَّيْطَانُ: لَا مَبِيتَ لَكُمْ وَلَا عَشَاءَ»." },
        src: "مسلم 2018",
      },
      {
        id: "akl", ar: "بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ", count: 1,
        tr: { fr: "Si l'on a oublié de dire Bismillah au début du repas : Au nom d'Allah au début et à la fin.", en: "If one forgot to say Bismillah at the start of the meal: In the name of Allah at its beginning and end." },
        src: "أبو داود 3767، الترمذي 1858",
      },
      {
        id: "atamani", ar: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ", count: 1,
        tr: { fr: "Après le repas : Louange à Allah qui m'a nourri de cela et me l'a accordé sans force ni puissance de ma part.", en: "After eating: Praise be to Allah who fed me this and provided it for me without any might or power from me." },
        fadl: { fr: "Ses péchés passés lui sont pardonnés.", en: "His past sins are forgiven.", ar: "«غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ»." },
        src: "أبو داود 4023، الترمذي 3458",
      },
      {
        id: "wudu", ar: "أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ", count: 1,
        tr: { fr: "Après les ablutions : J'atteste qu'il n'y a de divinité qu'Allah, Seul, sans associé, et que Muhammad est Son serviteur et Son messager.", en: "After wudu: I bear witness that there is no god but Allah alone, without partner, and that Muhammad is His servant and Messenger." },
        fadl: { fr: "Les huit portes du Paradis lui sont ouvertes ; il entre par celle qu'il veut.", en: "The eight gates of Paradise are opened for him; he enters by whichever he wishes.", ar: "«إِلَّا فُتِحَتْ لَهُ أَبْوَابُ الْجَنَّةِ الثَّمَانِيَةُ يَدْخُلُ مِنْ أَيِّهَا شَاءَ»." },
        src: "مسلم 234",
      },
      {
        id: "masjid", ar: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", count: 1,
        tr: { fr: "En entrant à la mosquée : Ô Allah, ouvre-moi les portes de Ta miséricorde. (En sortant : « Allahumma inni as'aluka min fadlik »)", en: "On entering the mosque: O Allah, open for me the gates of Your mercy. (On leaving: “Allahumma inni as'aluka min fadlik”)" },
        src: "مسلم 713",
      },
      {
        id: "khala", ar: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ", count: 1,
        tr: { fr: "Avant d'entrer aux toilettes : Ô Allah, je me réfugie auprès de Toi contre les démons mâles et femelles.", en: "Before entering the toilet: O Allah, I seek refuge in You from male and female devils." },
        src: "البخاري 142، مسلم 375",
      },
      {
        id: "safar", ar: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ ۝ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ", count: 1,
        tr: { fr: "En montant dans un véhicule : Gloire à Celui qui nous a soumis ceci alors que nous n'en étions pas capables, et c'est vers notre Seigneur que nous retournerons.", en: "On mounting a vehicle: Glory be to Him who has subjected this to us, for we could not have done it ourselves, and to our Lord we will surely return." },
        src: "الزخرف 13-14 — مسلم 1342",
      },
    ],
  },
];

export const getCategory = (id: string) => ADHKAR.find((c) => c.id === id);

/** Categorie mnasba l l-wa9t (matin / soir / nuit) */
export const suggestedCategory = (date = new Date()): string => {
  const h = date.getHours();
  if (h >= 4 && h < 12) return "sabah";
  if (h >= 15 && h < 21) return "masa";
  if (h >= 21 || h < 4) return "nawm";
  return "tasbih";
};

export const pick = (l: L3, lang: string) => (lang === "ar" ? l.ar : lang === "en" ? l.en : l.fr);
export const pickTr = (d: Dhikr, lang: string) => (lang === "en" ? d.tr.en : d.tr.fr);
export const totalCount = (c: AdhkarCategory) => c.items.reduce((s, d) => s + d.count, 0);

/** Misbaha: kalimat jahzin */
export const MISBAHA_PHRASES = [
  { id: "subhan", ar: "سُبْحَانَ اللَّهِ" },
  { id: "hamd", ar: "الْحَمْدُ لِلَّهِ" },
  { id: "takbir", ar: "اللَّهُ أَكْبَرُ" },
  { id: "tahlil", ar: "لَا إِلَٰهَ إِلَّا اللَّهُ" },
  { id: "istighfar", ar: "أَسْتَغْفِرُ اللَّهَ" },
  { id: "hawqala", ar: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ" },
  { id: "salat", ar: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ" },
  { id: "bihamdih", ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ" },
] as const;