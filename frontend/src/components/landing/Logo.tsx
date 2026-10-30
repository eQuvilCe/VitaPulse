// Wordmark with a single drawn beat as its mark.
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 font-display text-[17px] font-semibold tracking-tight text-bone ${className}`}>
      <svg viewBox="0 0 28 16" className="h-4 w-7 text-mint" aria-hidden="true">
        <path
          d="M1 9.5h7l2-3 2.5 8L16 1.5l2.5 8H27"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      VitaPulse
    </span>
  );
}
