/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp, usePage } from "@inertiajs/react";
import { ToastProvider } from "@/presentation/components/feedback/ToastProvider";
import { useGlobalRipple } from "@/presentation/hooks/useGlobalRipple";
import { SessionContext, type Session } from "@/presentation/hooks/session";
import { UseCasesContext } from "@/presentation/hooks/useUseCases";
import { makeUseCases } from "@/application";
import { httpPorts } from "@/infrastructure/http/gateways";

// Polices auto-hébergées (mêmes familles que la maquette : Figtree et Bricolage Grotesque).
import "@fontsource-variable/figtree";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
// Toutes les feuilles de style, dans l'ordre de la maquette.
import "@/presentation/styles/index.css";

// Les sections « se posent » à l'arrivée seulement quand le JavaScript tourne.
document.documentElement.classList.add("js");

const useCases = makeUseCases(httpPorts);

function InertiaPageLayout({ children }: { children: ReactNode }) {
  useGlobalRipple();
  const page = usePage();
  const rawAuth = page.props.auth;
  const session = (Array.isArray(rawAuth) || !rawAuth ? {} : rawAuth) as Session;

  useEffect(() => {
    const hash = window.location.hash;
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo({ top: 0 });
  }, [page.url]);

  return (
    <SessionContext value={session}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionContext>
  );
}

const inertiaEl = document.getElementById("app");
if (inertiaEl) {
  createInertiaApp({
    resolve: (name) => {
      const pages = import.meta.glob("../presentation/pages/**/*.tsx", { eager: true });
      const target = `../presentation/pages/${name}.tsx`;
      const mod = pages[target] as { default?: React.ComponentType; layout?: (page: ReactNode) => ReactNode } | undefined;
      if (!mod) {
        throw new Error(`Page Inertia introuvable : ${name} (${target})`);
      }
      const page = (mod.default || mod) as React.ComponentType & { layout?: (page: ReactNode) => ReactNode };
      page.layout = page.layout || ((children: ReactNode) => <InertiaPageLayout>{children}</InertiaPageLayout>);
      return page;
    },
    setup({ el, App, props }) {
      createRoot(el).render(
        <StrictMode>
          <UseCasesContext value={useCases}>
            <App {...props} />
          </UseCasesContext>
        </StrictMode>
      );
    },
  });
} else {
  const rootEl = document.getElementById("root");
  if (rootEl) {
    import("react-router").then(({ BrowserRouter }) => {
      import("./App").then(({ App }) => {
        createRoot(rootEl).render(
          <StrictMode>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </StrictMode>
        );
      });
    });
  }
}
