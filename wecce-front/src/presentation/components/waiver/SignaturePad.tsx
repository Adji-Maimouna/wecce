import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

export type SignaturePadHandle = { clear: () => void; toDataURL: () => string };

type SignaturePadProps = {
  onDrawnChange: (drawn: boolean) => void;
  ref?: Ref<SignaturePadHandle>;
};

/** Zone de signature au doigt ou à la souris (canvas net sur écrans haute densité). */
export function SignaturePad({ onDrawnChange, ref }: SignaturePadProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const size = () => {
      const r = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = r.width * dpr;
      c.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--ink") || "#1c1a14";
    };
    size();
    window.addEventListener("resize", size);
    return () => window.removeEventListener("resize", size);
  }, []);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const c = canvas.current;
      c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
      onDrawnChange(false);
    },
    toDataURL: () => canvas.current?.toDataURL("image/png") ?? "",
  }));

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <canvas
      ref={canvas}
      className="sigpad"
      aria-label="Zone de signature : signez au doigt ou à la souris"
      onPointerDown={(e) => {
        drawing.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        const p = pos(e);
        const ctx = e.currentTarget.getContext("2d");
        ctx?.beginPath();
        ctx?.moveTo(p.x, p.y);
      }}
      onPointerMove={(e) => {
        if (!drawing.current) return;
        const p = pos(e);
        const ctx = e.currentTarget.getContext("2d");
        ctx?.lineTo(p.x, p.y);
        ctx?.stroke();
        onDrawnChange(true);
      }}
      onPointerUp={() => (drawing.current = false)}
    />
  );
}
