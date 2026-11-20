import { MotionProvider } from "@/components/motion/Reveal";
import { Header } from "@/components/marketing/Header";
import { Hero } from "@/components/marketing/Hero";
import { TrustStrip } from "@/components/marketing/TrustStrip";
import { Features } from "@/components/marketing/Features";
import { ZeroKnowledge } from "@/components/marketing/ZeroKnowledge";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Cta, Footer } from "@/components/marketing/CtaFooter";

export default function Home() {
  return (
    <MotionProvider>
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <Features />
        <ZeroKnowledge />
        <HowItWorks />
        <Cta />
      </main>
      <Footer />
    </MotionProvider>
  );
}
