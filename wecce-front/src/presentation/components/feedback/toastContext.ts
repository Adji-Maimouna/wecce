import { createContext, useContext } from "react";

export const ToastContext = createContext<(message: string) => void>(() => {});

/** `const toast = useToast(); toast("Dépôt annulé.")` */
export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}
