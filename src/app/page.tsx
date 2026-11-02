import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import PainPoints from "@/components/landing/PainPoints";
import HowItWorks from "@/components/landing/HowItWorks";
import LiveDemo from "@/components/landing/LiveDemo";
import Pricing from "@/components/landing/Pricing";
import TrustSection from "@/components/landing/TrustSection";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-dark-900 overflow-x-clip">
      <Navbar />
      <Hero />
      <PainPoints />
      <HowItWorks />
      <LiveDemo />
      <Pricing />
      <TrustSection />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
