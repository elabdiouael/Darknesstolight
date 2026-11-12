// Templates dyal l-khatma — kol wa7ed 3ando hwiyya visuelle dyalo
export type TemplateId = "fajr" | "ramadan" | "usra" | "sakina";

export interface KhatmaTemplate {
  id: TemplateId;
  glyph: string;      // motif 3arabi sghir
  from: string;       // gradient start
  to: string;         // gradient end
  accent: string;     // couleur dyal l-highlight
  glow: string;       // rgba l-glow
  defaultDays: number;
}

export const TEMPLATES: Record<TemplateId, KhatmaTemplate> = {
  fajr: {
    id: "fajr", glyph: "۞",
    from: "#0d3b2c", to: "#1f6b4a", accent: "#e8c766", glow: "rgba(232, 199, 102, 0.45)", defaultDays: 30,
  },
  ramadan: {
    id: "ramadan", glyph: "☾",
    from: "#0a1f2e", to: "#123f3a", accent: "#f2d892", glow: "rgba(242, 216, 146, 0.5)", defaultDays: 29,
  },
  usra: {
    id: "usra", glyph: "✦",
    from: "#2a1d0f", to: "#5b3f16", accent: "#f0c879", glow: "rgba(240, 200, 121, 0.45)", defaultDays: 60,
  },
  sakina: {
    id: "sakina", glyph: "❋",
    from: "#14302a", to: "#3d6b5c", accent: "#c9f2dc", glow: "rgba(170, 240, 205, 0.4)", defaultDays: 90,
  },
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);

export const getTemplate = (id?: string | null): KhatmaTemplate =>
  TEMPLATES[(id as TemplateId) ?? "fajr"] ?? TEMPLATES.fajr;