import DashboardPreview from "@/components/landing/DashboardPreview";
import FAQ from "@/components/landing/FAQ";
import Features from "@/components/landing/features/Features";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/hero/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import IntroLoader from "@/components/landing/intro/IntroLoader";
import SmoothScroll from "@/components/landing/SmoothScroll";

export default function Home() {
  return (
    <div className="landing">
      <SmoothScroll />
      <IntroLoader />
      <Header />
      <main className="overflow-x-clip">
        <Hero />
        <Features />
        <HowItWorks />
        <DashboardPreview />
        <FAQ />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
