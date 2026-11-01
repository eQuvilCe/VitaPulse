"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { fetchMe, type User } from "@/lib/auth";

// Loads the signed-in user and sends visitors without a valid token to /login.
export function useRequireUser(): User | null {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch((e) => {
        // only an auth failure means "signed out"; a network error should not bounce the user
        if (e instanceof ApiError && e.status === 401) router.replace("/login");
      });
  }, [router]);

  return user;
}
