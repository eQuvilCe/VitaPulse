// Small hexagon outline used as an indicator; `filled` marks the active state.
export default function Hex({ filled = false, className = "" }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={`h-3 w-3 shrink-0 ${className}`} aria-hidden="true">
      <polygon
        points="6,0.75 10.55,3.375 10.55,8.625 6,11.25 1.45,8.625 1.45,3.375"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
