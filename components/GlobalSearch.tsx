"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SearchBox } from "./SearchBox";
import { searchUrl } from "../src/lib/search-url.js";

export function GlobalSearch() {
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("q");
    router.push(searchUrl(query));
  }
  return <details className="app-global-search">
    <summary>
      <span className="app-global-search__icon app-global-search__icon--closed" aria-hidden="true">⌕</span>
      <span className="app-global-search__icon app-global-search__icon--open" aria-hidden="true">×</span>
      <span className="app-global-search__label--closed">Search</span>
      <span className="app-global-search__label--open">Close search</span>
    </summary>
    <SearchBox id="global-site-search" label="Search parks and recreation" onSubmit={submit} />
  </details>;
}
