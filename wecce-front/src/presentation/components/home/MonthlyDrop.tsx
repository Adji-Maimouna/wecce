import { FonteSimulator } from "@/presentation/components/points/FonteSimulator";
import { Reveal } from "@/presentation/components/ui/Reveal";

/** La baisse mensuelle de 5 %, expliquée par un curseur. */
export function MonthlyDrop() {
  return (
    <section className="lsec lsec--tint" id="baisse">
      <div className="wrap">
        <div className="cols cols--even" style={{ gap: 48, alignItems: "center" }}>
          <Reveal className="lsec__head" style={{ marginBottom: 0 }}>
            <h2>Vos points baissent de 5&nbsp;% par mois. Les prix aussi.</h2>
            <p>
              Le 1<sup>er</sup> de chaque mois, au même taux. Ce que vos points permettent de prendre ne change pas, et ils n'expirent pas.
            </p>
          </Reveal>
          <Reveal>
            <FonteSimulator
              balance={30000}
              itemName="Tecno Spark 4"
              itemPrice={24500}
              conclusion="Le Tecno coûte toujours 82 % de vos points, aujourd'hui comme dans 6 mois."
              style={{ background: "var(--surface)" }}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
