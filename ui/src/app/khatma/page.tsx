import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import { KhatmaHome } from "@/components/features/khatma/KhatmaHome/KhatmaHome";

export default function KhatmaPage() {
  return (
    // L-home fiha l-orb 3D dyalha, donc l-background bla najma kbira
    <AppShell star={false}>
      {/* Suspense 7it KhatmaHome kayst3ml useSearchParams (?join=CODE) */}
      <Suspense fallback={null}>
        <KhatmaHome />
      </Suspense>
    </AppShell>
  );
}