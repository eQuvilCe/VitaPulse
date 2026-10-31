import "@/components/landing/landing.css";

import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-canvas text-fg">
      <Header />
      <main className="overflow-x-clip">
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
