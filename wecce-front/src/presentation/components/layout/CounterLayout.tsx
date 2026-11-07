import type { ReactNode } from "react";
import { Brand } from "./Brand";

/** Coque de la tablette du comptoir LBC : l'étudiant y signe, sans la navigation du site. */
export function CounterLayout({ initials, children }: { initials: string; children: ReactNode }) {
  return (
    <>
      <header className="top">
        <div className="wrap top__in">
          <Brand />
          <span className="small muted">LBC · Leye Business Company · campus de l'UGB</span>
          <div className="top__end">
            <span className="avatar">{initials}</span>
          </div>
        </div>
      </header>
      <main className="page">{children}</main>
    </>
  );
}
