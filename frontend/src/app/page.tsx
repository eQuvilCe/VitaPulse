import "@/components/landing/landing.css";

import Closing from "@/components/landing/Closing";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Process from "@/components/landing/Process";
import Quiz from "@/components/landing/Quiz";
import Statement from "@/components/landing/Statement";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-canvas text-fg">
      <Header />
      <main className="overflow-x-clip">
        <Hero />
        <Statement />
        <Process />
        <Quiz />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}
