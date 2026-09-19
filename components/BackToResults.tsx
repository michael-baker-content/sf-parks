"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { validResultReturnPath } from "../src/lib/result-focus.js";

export function BackToResults() {
  const params = useSearchParams(); const candidate = params.get("return");
  const destination = validResultReturnPath(candidate);
  if (!destination) return null;
  return <Link className="usa-back-link" href={destination}>Back to results</Link>;
}
