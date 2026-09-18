"use client";

import { useState } from "react";
import { GlobalSearch } from "./GlobalSearch";
import { HeaderNavigation } from "./HeaderNavigation";

export function HeaderControls() {
  const [expanded, setExpanded] = useState<"menu" | "search" | null>(null);
  return <>
    <HeaderNavigation open={expanded === "menu"} onOpenChange={(open) => setExpanded(open ? "menu" : null)} />
    <GlobalSearch open={expanded === "search"} onOpenChange={(open) => setExpanded(open ? "search" : null)} />
  </>;
}
