import { AppShell } from "@/components/layout/AppShell/AppShell";
import { ProfileView } from "@/components/features/profile/ProfileView/ProfileView";

export default function ProfilePage() {
  return (
    <AppShell calm>
      <ProfileView />
    </AppShell>
  );
}