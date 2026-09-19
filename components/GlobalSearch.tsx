"use client";

import { FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchBox } from "./SearchBox";
import { searchUrl } from "../src/lib/search-url.js";

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const container = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (!open && container.current?.contains(document.activeElement)) {
      (document.activeElement as HTMLElement).blur();
    }
  }, [open]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("q");
    router.push(searchUrl(query));
    onOpenChange(false);
  }
  return <details ref={container} className="app-global-search" open={open}>
    <summary onClick={(event) => { event.preventDefault(); if (open) event.currentTarget.focus(); onOpenChange(!open); }}>
      <span className="app-global-search__icon app-global-search__icon--closed" aria-hidden="true">⌕</span>
      <span className="app-global-search__icon app-global-search__icon--open" aria-hidden="true">×</span>
      <span className="app-global-search__label--closed">Search</span>
      <span className="app-global-search__label--open">Close<span className="usa-sr-only"> search</span></span>
      <span className="app-global-search__icon app-global-search__close-context" aria-hidden="true">⌕</span>
    </summary>
    <SearchBox id="global-site-search" label="Search parks and recreation" onSubmit={submit} />
  </details>;
}
