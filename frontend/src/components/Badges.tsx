import { Lock, Trophy } from "lucide-react";

import { badgeText, type Achievements } from "@/lib/achievements";

export default function Badges({ unlocked, locked }: Achievements) {
  return (
    <div className="rounded-2xl border border-white/10 bg-plum-2 p-5">
      <h2 className="text-sm text-mist">
        Achievements · {unlocked.length}/{unlocked.length + locked.length}
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {unlocked.map((code) => (
          <li key={code} className="flex items-center gap-2 text-glow">
            <Trophy className="h-4 w-4 text-mint" /> {badgeText(code)}
          </li>
        ))}
        {locked.map((code) => (
          <li key={code} className="flex items-center gap-2 text-mist/60">
            <Lock className="h-4 w-4" /> {badgeText(code)}
          </li>
        ))}
      </ul>
    </div>
  );
}
