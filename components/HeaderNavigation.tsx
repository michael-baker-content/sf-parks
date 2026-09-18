"use client";

import Link from "next/link";
import { useRef } from "react";

const links = [
  { href: "/explore/", label: "Explore" },
  { href: "/programs-and-reservations/", label: "Programs & reservations" },
  { href: "/#activities", label: "Activities" },
  { href: "/blog/", label: "Blog" },
  { href: "/about/", label: "About the data" },
];

export function HeaderNavigation({ open, onOpenChange: setOpen }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const toggle = useRef<HTMLButtonElement>(null);
  return <nav className="app-header-navigation" aria-label="Primary" data-open={open} onKeyDown={(event) => {
    if (event.key === "Escape" && open) { setOpen(false); toggle.current?.focus(); }
  }}>
    <button ref={toggle} type="button" className="app-menu-toggle" aria-expanded={open} aria-controls="header-navigation-links" onClick={() => setOpen(!open)}>
      <span aria-hidden="true">{open ? "×" : "☰"}</span> {open ? "Close menu" : "Menu"}
    </button>
    <ul id="header-navigation-links" className="app-nav">{links.map((link) =>
      <li key={link.href}><Link href={link.href} onClick={() => { setOpen(false); toggle.current?.focus(); }}>{link.label}</Link></li>
    )}</ul>
  </nav>;
}
