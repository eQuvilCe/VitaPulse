import { Suspense } from "react";

import Onboarding from "@/components/app/Onboarding";

// Open without an account: answers are kept and the plan is built after sign-up.
export default function OnboardingPage() {
  return (
    <Suspense>
      <Onboarding />
    </Suspense>
  );
}
