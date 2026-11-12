import { redirect } from "next/navigation";

// L-blassa l-ra2issiya hiya l-home (AppShell kayredd l /auth ila makaynch token)
export default function Home() {
  redirect("/home");
}