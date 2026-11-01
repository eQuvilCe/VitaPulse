"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { fetchMe, type User } from "@/lib/auth";

// Loads the signed-in user and sends visitors without a valid token to /login.
export function useRequireUser(): User | null {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => router.replace("/login"));
  }, [router]);

  return user;
}
