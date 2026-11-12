"use client";

// Catégories dyal l-adhkar dyal l-user (localStorage): ysawb, ybeddel, ymsa7, w yzid adhkar mn l-bibliothèque
import { useLocalState } from "./localStore";
import { ADHKAR, AdhkarCategory, CategoryIcon, Dhikr, getCategory } from "./adhkar";

export interface CustomCategory extends AdhkarCategory { custom: true; createdAt: number }

const KEY = "ltd.adhkar.custom";

export const CUSTOM_ICONS: CategoryIcon[] = ["sparkle", "heart", "sunrise", "sunset", "moon", "prayer", "repent", "book", "shield", "home", "alarm"];
export const CUSTOM_HUES = [42, 140, 160, 190, 205, 230, 280, 345, 20, 100];

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const blankCategory = (title = ""): CustomCategory => ({
  id: newId("c"),
  custom: true,
  createdAt: Date.now(),
  icon: "sparkle",
  hue: CUSTOM_HUES[Math.floor(Math.random() * CUSTOM_HUES.length)],
  title: { fr: title, en: title, ar: title },
  desc: { fr: "", en: "", ar: "" },
  items: [],
});

export const blankDhikr = (): Dhikr => ({ id: newId("d"), ar: "", count: 1, tr: { fr: "", en: "" }, src: "" });

/** Nsekha dyal dhikr mn l-bibliothèque (b id jdid bach ykoun unique f l-catégorie) */
export const copyDhikr = (d: Dhikr): Dhikr => ({ ...d, id: newId("d"), tr: { ...d.tr } });

export const useCustomAdhkar = () => {
  const [list, setList] = useLocalState<CustomCategory[]>(KEY, []);

  const save = (cat: CustomCategory) =>
    setList((l) => (l.some((c) => c.id === cat.id) ? l.map((c) => (c.id === cat.id ? cat : c)) : [...l, cat]));

  const remove = (id: string) => setList((l) => l.filter((c) => c.id !== id));

  const addItem = (catId: string, d: Dhikr) =>
    setList((l) => l.map((c) => (c.id === catId ? { ...c, items: [...c.items, copyDhikr(d)] } : c)));

  return { list, save, remove, addItem };
};

/** Catégorie (dyal l-app wla dyal l-user) */
export const useCategory = (id: string): AdhkarCategory | undefined => {
  const { list } = useCustomAdhkar();
  return getCategory(id) ?? list.find((c) => c.id === id);
};

export const useAllCategories = (): AdhkarCategory[] => {
  const { list } = useCustomAdhkar();
  return [...ADHKAR, ...list];
};

export const isCustom = (c: AdhkarCategory): c is CustomCategory => (c as CustomCategory).custom === true;