"use client";

import React, { useMemo } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { getSurah } from "@/lib/quran";
import { HifdSurah } from "@/services/api/khatmaService";
import { TasmiaModal } from "@/components/features/hifd/TasmiaModal/TasmiaModal";

/** Mouraja3a dyal sourate kamla mn l-profil — b tasmi3 (s-sawt) awla auto-évaluation */
export const HifdReviewModal = ({ item, onClose, onDone }: {
  item: HifdSurah | null; onClose: () => void; onDone: () => void;
}) => {
  const { t, surahName } = useI18n();
  const items = useMemo(
    () => (item ? Array.from({ length: item.toAyah - item.fromAyah + 1 }, (_, i) => ({ surah: item.surah, ayah: item.fromAyah + i })) : []),
    [item],
  );
  return (
    <TasmiaModal
      open={!!item}
      items={items}
      title={item ? t("review.title", { surah: surahName(getSurah(item.surah)) }) : ""}
      onClose={onClose}
      onDone={onDone}
    />
  );
};