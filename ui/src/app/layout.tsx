import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
// Fonts self-hosted (ma kay7tajouch Google Fonts — khdamin 7ta offline)
import "@fontsource/amiri-quran/400.css";
import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/noto-kufi-arabic/400.css";
import "@fontsource/noto-kufi-arabic/600.css";
import "@fontsource/noto-kufi-arabic/700.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "From Darknesses to Light",
  description: "Lisez, mémorisez et terminez vos khatmas du Coran — seul ou ensemble.",
};

export const viewport: Viewport = {
  themeColor: "#030a07",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <body>
        <Providers>
          {/* Suspense global: l-app kamla client-side (token, params, pathname) */}
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
      </body>
    </html>
  );
}