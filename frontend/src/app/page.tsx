import FAQ from "@/components/landing/FAQ";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import IntroLoader from "@/components/landing/IntroLoader";

export default function Home() {
  return (
    <div className="landing">
      <IntroLoader />
      <Header />
      <main className="overflow-x-clip">
        <Hero />
        <Features />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
