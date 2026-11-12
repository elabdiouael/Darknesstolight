"use client";

import React from "react";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ToastProvider } from "@/components/common/Toast/Toast";
import { CelebrationProvider } from "@/components/common/Celebration/Celebration";
import { CursorGlow, Splash } from "@/components/common/Ambient/Ambient";
import { PerfRoot } from "@/components/common/Perf/Perf";
import { FxPointer } from "@/components/common/Ambient/FxPointer";
import { NourBackground } from "@/components/three/NourBackground";

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <PerfRoot>
    <I18nProvider>
      <ToastProvider>
        <CelebrationProvider>
          {/* Background 3D: mount wa7ed l-app kamla -> ma kayt3awdch yt-bna f kol navigation */}
          <NourBackground />
          {children}
          <CursorGlow />
          <FxPointer />
          <Splash />
        </CelebrationProvider>
      </ToastProvider>
    </I18nProvider>
  </PerfRoot>
);