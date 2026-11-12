import { AppShell } from "@/components/layout/AppShell/AppShell";
import { HomeView } from "@/components/features/home/HomeView/HomeView";

export default function HomePage() {
  return (
    // L-home fiha l-astrolabe dyalha: l-background bla najma kbira
    <AppShell star={false}>
      <HomeView />
    </AppShell>
  );
}
