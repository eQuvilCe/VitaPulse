"use client";

import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button, Card } from "@/components/ui";
import { cx } from "@/lib/cx";

import { useAppT } from "./i18n";

// Loads `fn` on mount and whenever `deps` change; `reload` reruns it.
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const run = useRef(0);

  const reload = useCallback(async () => {
    const id = ++run.current;
    setLoading(true);
    setError(null);
    try {
      const value = await fn();
      if (id === run.current) setData(value);
    } catch (err) {
      if (id === run.current) setError(err);
    } finally {
      if (id === run.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, error, loading, reload };
}

export function PageHeader({ title, lead, actions }: { title: string; lead?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-title font-semibold text-fg">{title}</h1>
        {lead && <p className="mt-1.5 max-w-xl text-body text-fg-muted">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-card bg-subtle", className)} aria-hidden="true" />;
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  const { t } = useAppT();
  return (
    <div className="space-y-4" aria-busy="true" aria-label={t.common.loading}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={i === 0 ? "h-40" : "h-24"} />
      ))}
    </div>
  );
}

export function ErrorBlock({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const { t } = useAppT();
  return (
    <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between" role="alert">
      <div className="flex items-center gap-3 text-body text-fg">
        <AlertCircle className="h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
        {message ?? t.common.error}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t.common.retry}
        </Button>
      )}
    </Card>
  );
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-heading">{children}</h2>
      {aside}
    </div>
  );
}
