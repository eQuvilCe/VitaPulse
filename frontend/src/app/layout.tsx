import type { Metadata } from "next";
import { Anton, Inter, Oswald } from "next/font/google";
import "./globals.css";
import I18nProvider from "@/i18n/I18nProvider";

const sans = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });
// No metric fallback: it would cover Cyrillic before Oswald gets the chance.
const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display", adjustFontFallback: false });
// Anton has no Cyrillic glyphs; Oswald fills them in for Russian headlines.
const displayCyr = Oswald({ weight: "700", subsets: ["cyrillic"], variable: "--font-display-cyr" });

export const metadata: Metadata = {
  title: "Vita Health",
  description: "Healthy eating, workouts and a free AI coach for losing or gaining weight.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${displayCyr.variable}`}>
      <body className="font-sans">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
