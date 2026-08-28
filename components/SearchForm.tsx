"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SearchBox } from "./SearchBox";
import { searchUrl } from "../src/lib/search-url.js";

export function SearchForm({ label, defaultValue = "" }: { label: string; defaultValue?: string }) {
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    router.push(searchUrl(query));
  }
  return <SearchBox id="site-search" label={label} defaultValue={defaultValue} onSubmit={submit} />;
}
