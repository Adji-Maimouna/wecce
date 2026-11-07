import { createContext, useContext } from "react";

type SearchCtx = { query: string; setQuery: (q: string) => void };

export const SearchContext = createContext<SearchCtx>({ query: "", setQuery: () => {} });

/** Recherche de la barre haute, lue par le marché. */
export function useSearch(): SearchCtx {
  return useContext(SearchContext);
}
