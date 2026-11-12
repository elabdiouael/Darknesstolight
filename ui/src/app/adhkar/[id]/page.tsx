"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import { AdhkarSession } from "@/components/features/adhkar/AdhkarSession/AdhkarSession";

// useParams / useSearchParams khasshom Suspense
const Session = () => {
  const { id } = useParams<{ id: string }>();
  const i = useSearchParams().get("i");
  return <AdhkarSession key={`${id}:${i ?? ""}`} id={id} start={i != null ? Number(i) : null} />;
};

export default function AdhkarSessionPage() {
  return (
    <AppShell calm>
      <Suspense fallback={null}>
        <Session />
      </Suspense>
    </AppShell>
  );
}