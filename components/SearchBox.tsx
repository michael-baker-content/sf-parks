"use client";

import type { FormEventHandler } from "react";

type SearchBoxProps = {
  id: string;
  label: string;
  defaultValue?: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function SearchBox({ id, label, defaultValue = "", onSubmit }: SearchBoxProps) {
  return <form className="app-search" role="search" onSubmit={onSubmit}>
    <label className="usa-label app-search__label" htmlFor={id}>{label}</label>
    <div className="app-search__controls">
      <input className="usa-input app-search__input" id={id} name="q" type="search" defaultValue={defaultValue} autoComplete="off" placeholder="Try “tennis,” “Dolores,” or “94131”" />
      <button className="usa-button app-search__button" type="submit">Search</button>
    </div>
    <p className="usa-hint app-search__hint">Search by place, neighborhood, activity, or amenity.</p>
  </form>;
}
