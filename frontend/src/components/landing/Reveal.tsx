"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

import { cx } from "@/lib/cx";

type Props = {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  id?: string;
};

// Fades its children up once they scroll into view.
export default function Reveal({ children, as: Tag = "div", delay = 0, className, id }: Props) {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref);

  return (
    <Tag ref={ref} id={id} className={cx("vl-reveal", visible && "is-visible", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

export function useInView(ref: React.RefObject<HTMLElement>) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.05, rootMargin: "0px 0px 8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return visible;
}
