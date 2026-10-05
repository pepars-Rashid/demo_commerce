"use client";

import { useEffect, useRef, useState } from "react";

// Client-only date formatting. Values are absolute UTC instants (`timestamptz`);
// we format them in the viewer's local timezone — never on the server.

const DATE_ONLY_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

const DATE_TIME_OPTS: Intl.DateTimeFormatOptions = {
  ...DATE_ONLY_OPTS,
  hour: "2-digit",
  minute: "2-digit",
};

// Format an ISO string / Date (UTC instant) in the viewer's local tz, Arabic
// locale with Latin numerals (matches admin-format). Usable in client handlers.
export function formatClientDateTime(value: string | Date, time = true): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ar-SA-u-nu-latn", time ? DATE_TIME_OPTS : DATE_ONLY_OPTS);
}

interface ClientDateTimeProps {
  value: string | Date;
  /** Show time-of-day in addition to the date (default true). */
  time?: boolean;
  /** Shown before mount so SSR and client agree (avoids hydration mismatch). */
  fallback?: string;
}

// Renders the local string only AFTER mount (SSR renders `fallback`, so the
// server never emits tz-dependent text). Formatting happens in render from a
// captured value; the effect just syncs the prop via a ref guard (admin pattern).
export function ClientDateTime({
  value,
  time = true,
  fallback = "…",
}: ClientDateTimeProps) {
  const [live, setLive] = useState<Date | string | null>(null);
  const lastValueRef = useRef<Date | string | null>(null);

  useEffect(() => {
    if (lastValueRef.current !== value) {
      lastValueRef.current = value;
      setLive(value);
    }
  }, [value]);

  return <>{live == null ? fallback : formatClientDateTime(live, time)}</>;
}