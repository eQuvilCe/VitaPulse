import { Suspense } from "react";

import AuthForm from "@/components/app/AuthForm";

// Accepts questionnaire answers in the query, e.g. /signup?height=172&weight=80&goal=lose&kg=6
export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
