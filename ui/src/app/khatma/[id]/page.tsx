"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import { MushafReader } from "@/components/features/reader/MushafReader/MushafReader";

// useParams khasso Suspense m3a cacheComponents
const Reader = () => {
  const { id } = useParams<{ id: string }>();
  return <MushafReader khatmaId={id} />;
};

export default function KhatmaReaderPage() {
  return (
    <AppShell calm>
      <Suspense fallback={null}>
        <Reader />
      </Suspense>
    </AppShell>
  );
}