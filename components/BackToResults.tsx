"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function BackToResults() {
  const params = useSearchParams(); const candidate = params.get("return");
  const destination = candidate?.startsWith("/explore/") ? candidate : "/explore/";
  return <Link className="usa-back-link" href={destination}>Back to results</Link>;
}
