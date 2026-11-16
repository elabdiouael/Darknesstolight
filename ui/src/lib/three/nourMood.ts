// "Mood" dyal l-background 3D. L-background kay-b9a 7ay bin les pages (mount wa7ed f Providers),
// w kol page kat-goul lih ghir chno bghat: calm (lecture) / star (najma kbira).
export interface NourMoodState { calm: boolean; star: boolean }

let mood: NourMoodState = { calm: false, star: true };

export const getNourMood = () => mood;
export const setNourMood = (m: NourMoodState) => { mood = m; };

// "Warp": daf3a dyal sor3a f l-background mli kat-tbeddel l-page (template.tsx kay-3iyet liha)
let warp = 0;
export const triggerWarp = (power = 1) => { warp = Math.max(warp, power); };
/** L-background kay-khod l-daf3a merra we7da */
export const consumeWarp = () => { const w = warp; warp = 0; return w; };

// Hook sghir l l-outillage dyal l-vidéo promo (promo/montage.mjs): kay-t7ekkem f l-background mn berra
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__nourCtl = { warp: triggerWarp, mood: setNourMood };
}
