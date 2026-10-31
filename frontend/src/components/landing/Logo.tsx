// Wordmark with a soft drawn beat as its mark.
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 font-serif text-[19px] tracking-tight text-fg ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-300 to-brand-600 shadow-card">
        <svg viewBox="0 0 28 16" className="h-3 w-5 text-white" aria-hidden="true">
          <path d="M1 9h6.5l2-3 2.5 7.5 3.5-12 2.5 7.5H27" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>
        Vita <span className="italic text-brand-700">Health</span>
      </span>
    </span>
  );
}
