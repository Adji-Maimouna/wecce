import { useState, useEffect } from "react";

export function useSearchParams(): [URLSearchParams, (params: Record<string, string>) => void] {
  const [searchParams, setSearchParams] = useState(
    () => new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
  );

  useEffect(() => {
    const handler = () => {
      setSearchParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const update = (params: Record<string, string>) => {
    const sp = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    const newUrl = `${window.location.pathname}?${sp.toString()}`;
    window.history.pushState(null, "", newUrl);
    setSearchParams(sp);
  };

  return [searchParams, update];
}
