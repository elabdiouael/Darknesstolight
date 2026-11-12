// "Mood" dyal l-background 3D. L-background kay-b9a 7ay bin les pages (mount wa7ed f Providers),
// w kol page kat-goul lih ghir chno bghat: calm (lecture) / star (najma kbira).
export interface NourMoodState { calm: boolean; star: boolean }

let mood: NourMoodState = { calm: false, star: true };

export const getNourMood = () => mood;
export const setNourMood = (m: NourMoodState) => { mood = m; };
