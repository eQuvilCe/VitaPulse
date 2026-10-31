import { redirect } from "next/navigation";

// Old sign-up path.
export default function RegisterPage() {
  redirect("/signup");
}
