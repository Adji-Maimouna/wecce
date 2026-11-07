import { Reveal } from "@/presentation/components/ui/Reveal";
import { faq } from "@/presentation/content/faq";
import { HomeSection } from "./HomeSection";

/** Questions fréquentes, en deux colonnes. « 1er » s'écrit avec l'exposant. */
export function Faq() {
  return (
    <HomeSection id="questions" tone="tint" title="Questions fréquentes">
      <div className="faq">
        {faq.map((f) => (
          <Reveal key={f.q} className="faq__item">
            <h3>{f.q}</h3>
            <p>{withOrdinal(f.a)}</p>
          </Reveal>
        ))}
      </div>
    </HomeSection>
  );
}

function withOrdinal(text: string) {
  const [before, after] = text.split("1er");
  if (after === undefined) return text.replace("5 %", "5 %");
  return (
    <>
      {before.replace("5 %", "5 %")}1<sup>er</sup>
      {after}
    </>
  );
}
