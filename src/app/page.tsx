import { MotionProvider } from "@/components/motion/Reveal";
import { Header } from "@/components/marketing/Header";
import { HomeBody } from "@/components/marketing/HomeBody";
import { Footer } from "@/components/marketing/CtaFooter";

export default function Home() {
  return (
    <MotionProvider>
      <Header />
      <main>
        <HomeBody />
      </main>
      <Footer />
    </MotionProvider>
  );
}
