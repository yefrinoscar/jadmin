import { redirect } from "next/navigation";

export default function HomePage() {
  // This will redirect to the dashboard if authenticated, or login if not
  redirect("/dashboard");
}
