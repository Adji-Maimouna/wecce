import type { MarketItem, RecentTakeBack } from "@/domain/entities";
import type { FaqItem } from "@/presentation/content/faq";
import { Faq } from "@/presentation/components/home/Faq";
import { Hero } from "@/presentation/components/home/Hero";
import { HowItWorks } from "@/presentation/components/home/HowItWorks";
import { MarketPreview } from "@/presentation/components/home/MarketPreview";
import { MonthlyDrop } from "@/presentation/components/home/MonthlyDrop";
import { PublicTopBar } from "@/presentation/components/home/PublicTopBar";
import { ShopSection } from "@/presentation/components/home/ShopSection";
import { TwoPrices } from "@/presentation/components/home/TwoPrices";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { SiteFooter } from "@/presentation/components/layout/SiteFooter";
import { TabBar } from "@/presentation/components/layout/TabBar";
import { useSessionRole } from "@/presentation/hooks/session";
import { HOME_BY_ROLE, paths } from "@/presentation/lib/paths";

export type AccueilProps = {
  recentTakeBacks: RecentTakeBack[];
  takenBackCount: number;
  previewItems: MarketItem[];
  previewBalance: number;
  marketTotal: number;
  faq?: FaqItem[];
};

/** Accueil public « Videz votre tiroir ». */
export default function Accueil({ recentTakeBacks, takenBackCount, previewItems, previewBalance, marketTotal, faq }: AccueilProps) {
  const role = useSessionRole();
  return (
    <>
      <PageTitle>Échange d'électronique à l'UGB</PageTitle>
      <PublicTopBar />
      <main>
        <Hero recentTakeBacks={recentTakeBacks} takenBackCount={takenBackCount} />
        <HowItWorks />
        <MarketPreview items={previewItems} balance={previewBalance} total={marketTotal} />
        <TwoPrices />
        <MonthlyDrop />
        <ShopSection />
        <Faq items={faq} />
      </main>
      <SiteFooter space="public" />
      <TabBar
        items={[
          { href: paths.accueil, label: "Accueil", icon: "grid", current: true },
          { href: paths.marche, label: "Marché", icon: "store" },
          { href: paths.deposer, label: "Déposer", icon: "upload" },
          role === "ETUDIANT"
            ? { href: paths.solde, label: "Solde", icon: "points" }
            : role
              ? { href: HOME_BY_ROLE[role], label: "Mon espace", icon: "user" }
              : { href: paths.connexion, label: "Connexion", icon: "log-in" },
        ]}
      />
    </>
  );
}
