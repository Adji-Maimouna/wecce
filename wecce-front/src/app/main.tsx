import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

// Polices auto-hébergées (mêmes familles que la maquette : Figtree et Bricolage Grotesque).
import "@fontsource-variable/figtree";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
// Toutes les feuilles de style, dans l'ordre de la maquette.
import "@/presentation/styles/index.css";

import { App } from "@/app/App";

// Les sections « se posent » à l'arrivée seulement quand le JavaScript tourne (voir styles/motion.css).
document.documentElement.classList.add("js");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
