"use client";

import { useRef, type ElementType } from "react";
import { useInView } from "./Reveal";

type Props = { text: string; as?: ElementType; className?: string };

// Heading that reveals letter by letter when scrolled into view.
export default function SplitHeading({ text, as: Tag = "h2", className = "" }: Props) {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref);

  let i = 0;
  const words = text.split(" ").map((word) => Array.from(word).map((c) => ({ c, i: i++ })));

  return (
    <Tag ref={ref} aria-label={text} className={`split ${visible ? "is-in" : ""} ${className}`}>
      {words.map((chars, w) => (
        <span key={w}>
          <span className="split-word" aria-hidden="true">
            {chars.map(({ c, i }) => (
              <span key={i} className="split-char" style={{ "--i": i } as React.CSSProperties}>
                {c}
              </span>
            ))}
          </span>
          {w < words.length - 1 && " "}
        </span>
      ))}
    </Tag>
  );
}
