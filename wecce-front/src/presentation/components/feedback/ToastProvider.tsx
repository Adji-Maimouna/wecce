import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/presentation/lib/cn";
import { Icon } from "@/presentation/components/ui/Icon";
import { ToastContext } from "./toastContext";

type ToastItem = { id: number; message: string };

let nextId = 1;

/** Notifications courtes en bas d'écran, annoncées aux lecteurs d'écran (role="status"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string) => {
    const id = nextId++;
    setItems((list) => [...list, { id, message }]);
  }, []);

  const remove = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <Toast key={t.id} message={t.message} onDone={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => (raf2 = requestAnimationFrame(() => setShown(true))));
    const hide = window.setTimeout(() => setShown(false), 3400);
    const done = window.setTimeout(onDone, 3660);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(hide);
      clearTimeout(done);
    };
  }, [onDone]);
  return (
    <div className={cn("toast", shown && "in")}>
      <Icon name="check-circle" />
      <span>{message}</span>
    </div>
  );
}
