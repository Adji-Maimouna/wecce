import { router } from "@inertiajs/react";

/**
 * Point unique de navigation Wecce.
 */
export function useCurrentPath(): string {
  if (typeof window !== "undefined") {
    return window.location.pathname;
  }
  return "/";
}

export function useGo(): (href: string) => void {
  return (href: string) => {
    router.visit(href);
  };
}
