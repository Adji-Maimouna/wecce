import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

/**
 * Règle des dépendances de la Clean Architecture, vérifiée à chaque lint :
 *   domain ← application ← (infrastructure, presentation) ← app
 * Une couche n'importe jamais une couche plus externe.
 */
const layer = (name, forbidden, extra = []) => ({
  files: [`src/${name}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          ...forbidden.map((f) => ({
            group: [`@/${f}`, `@/${f}/*`],
            message: `Clean Architecture : la couche « ${name} » ne doit pas dépendre de « ${f} ».`,
          })),
          ...extra,
        ],
      },
    ],
  },
});

const noReact = {
  group: ["react", "react-dom", "react-dom/*", "react-router", "react-router/*"],
  message: "Clean Architecture : le domaine et l'application ne connaissent pas React.",
};

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  layer("domain", ["application", "infrastructure", "presentation", "app"], [noReact]),
  layer("application", ["infrastructure", "presentation", "app"], [noReact]),
  layer("infrastructure", ["presentation", "app"], [{ group: ["react", "react-dom"], message: "Les adaptateurs n'affichent rien." }]),
  layer("presentation", ["infrastructure", "app"]),
);
