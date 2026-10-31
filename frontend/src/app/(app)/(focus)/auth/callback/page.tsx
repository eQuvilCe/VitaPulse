import { Suspense } from "react";

import OAuthCallback from "@/components/app/OAuthCallback";

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallback />
    </Suspense>
  );
}
