import { redirect } from "next/navigation";

// The old dashboard became the Vita Health cabinet.
export default function DashboardPage() {
  redirect("/plan");
}
