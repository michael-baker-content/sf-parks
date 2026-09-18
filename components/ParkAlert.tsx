"use client";
import { useEffect, useState } from "react";
import { getActiveParkNotice } from "../src/lib/park-notices.js";
type ParkNotice = { title: string; body: string; destinationId: string; active: boolean; expiresOn?: string; url?: string; urlText?: string };

export function ParkAlert({ notice }: { notice: ParkNotice }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const check = () => setVisible(Boolean(getActiveParkNotice({ alerts: [notice] }, notice.destinationId)));
    check();
    const timer = setInterval(check, 60_000);
    return () => clearInterval(timer);
  }, [notice]);
  if (!visible) return null;
  return <section className="app-park-alert" id="park-notice" aria-labelledby="park-notice-title">
    <span className="app-park-alert__icon" aria-hidden="true">⚠</span>
    <div><h2 id="park-notice-title">{notice.title}</h2><p>{notice.body}</p>{notice.url && <div className="app-park-alert__information"><h3>More Information</h3><p><a href={notice.url} rel="external">{notice.urlText || notice.url} <span aria-hidden="true">↗</span></a></p></div>}</div>
  </section>;
}
