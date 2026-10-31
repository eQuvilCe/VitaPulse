import "@/components/landing/landing.css";

import FAQ from "@/components/landing/FAQ";
import Features from "@/components/landing/Features";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Library from "@/components/landing/Library";
import PlanQuiz from "@/components/landing/quiz/PlanQuiz";
import Reviews from "@/components/landing/Reviews";

export default function Home() {
  return (
    <div className="vh-landing min-h-screen bg-canvas text-fg">
      <Header />
      <main className="overflow-x-clip">
        <Hero />
        <PlanQuiz />
        <HowItWorks />
        <Features />
        <Library />
        <Reviews />
        <FAQ />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
