import { apiClient } from "./axiosConfig";
import { TemplateId } from "@/lib/templates";

export interface Member { id: number; username: string; owner: boolean }

export interface Khatma {
  id: number;
  title: string;
  template: TemplateId;
  targetDays: number;
  currentSurah: number;
  currentAyah: number;
  completed: boolean;
  inviteCode: string | null;
  owner: boolean;
  members: Member[];
  lastReadBy: string | null;
  startedAt: string;
  lastReadAt: string;
}

export interface Activity {
  id: number;
  username: string;
  type: "CREATE" | "JOIN" | "CHECKPOINT" | "COMPLETE";
  surah: number;
  ayah: number;
  createdAt: string;
}

export interface HifdSurah { surah: number; fromAyah: number; toAyah: number; count: number; due: number; avgScore: number | null }

export type HifdMethod = "SM2" | "MANZIL";
export type HifdPreset = "INTENSIVE" | "BALANCED" | "LIGHT" | "CUSTOM";

export interface HifdPlan {
  method: HifdMethod;
  preset: HifdPreset;
  dailyNew: number;
  dailyReview: number;
  intervalFactor: number;
  maxInterval: number;
  passThreshold: number;
  manzilDays: number;
  recentDays: number;
  hintWords: number;
}

export type ReviewGroup = "SABQI" | "MANZIL" | "WEAK" | "DUE";
export interface ReviewItem { surah: number; ayah: number; lastScore: number | null; intervalDays: number; group: ReviewGroup }
export interface Sabaq { surah: number; fromAyah: number; toAyah: number }
export interface HifdToday { plan: HifdPlan; items: ReviewItem[]; sabaq: Sabaq | null; dueTotal: number; doneToday: number; memorized: number }

export interface ReviewResult {
  surah: number; ayah: number; quality: number; passed: boolean;
  intervalDays: number; nextReviewDate: string; points: number; totalPoints: number;
}

export interface Me { id: number; username: string; email: string; nourPoints: number; currentStreak: number; createdAt: string }

export const khatmaService = {
  list: async () => (await apiClient.get<Khatma[]>("/khatma")).data,
  get: async (id: number | string) => (await apiClient.get<Khatma>(`/khatma/${id}`)).data,
  create: async (body: { title: string; template: TemplateId; targetDays: number }) =>
    (await apiClient.post<Khatma>("/khatma", body)).data,
  checkpoint: async (id: number, surah: number, ayah: number, ayahsRead: number) =>
    (await apiClient.put<Khatma>(`/khatma/${id}/checkpoint`, { surah, ayah, ayahsRead })).data,
  share: async (id: number) => (await apiClient.post<Khatma>(`/khatma/${id}/share`)).data,
  join: async (code: string) => (await apiClient.post<Khatma>("/khatma/join", { code })).data,
  activity: async (id: number) => (await apiClient.get<Activity[]>(`/khatma/${id}/activity`)).data,
  remove: async (id: number) => { await apiClient.delete(`/khatma/${id}`); },
};

export const hifdService = {
  summary: async () => (await apiClient.get<HifdSurah[]>("/hifd")).data,
  start: async (surah: number, toAyah: number) =>
    (await apiClient.post<HifdSurah>("/hifd/start", { surah, toAyah })).data,
  review: async (surah: number, ayah: number, quality: number) =>
    (await apiClient.post<ReviewResult>("/hifd/review", { surah, ayah, quality })).data,
  tasmia: async (surah: number, ayah: number, accuracy: number, mistakes: number) =>
    (await apiClient.post<ReviewResult>("/hifd/tasmia", { surah, ayah, accuracy, mistakes })).data,
  today: async () => (await apiClient.get<HifdToday>("/hifd/today")).data,
  plan: async () => (await apiClient.get<HifdPlan>("/hifd/plan")).data,
  updatePlan: async (plan: HifdPlan) => (await apiClient.put<HifdPlan>("/hifd/plan", plan)).data,
};

export interface Khatira { id: number; surah: number; ayah: number; content: string; createdAt: string }

export const khawatirService = {
  list: async () => (await apiClient.get<Khatira[]>("/khawatir")).data,
  add: async (surah: number, ayah: number, content: string) =>
    (await apiClient.post<Khatira>("/khawatir", { surah, ayah, content })).data,
  remove: async (id: number) => { await apiClient.delete(`/khawatir/${id}`); },
};

export const userService = {
  me: async () => (await apiClient.get<Me>("/me")).data,
};