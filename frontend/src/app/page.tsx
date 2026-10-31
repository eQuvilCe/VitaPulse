import "@/components/landing/landing.css";

import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-canvas text-fg">
      <Header />
      <main className="overflow-x-clip pt-20" />
      <Footer />
    </div>
  );
}
