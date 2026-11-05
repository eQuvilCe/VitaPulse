import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";
import I18nProvider from "@/i18n/I18nProvider";

// One family for everything: a clean grotesque with real Cyrillic. Headlines are
// the same face at a medium weight and tight tracking.
const sans = Onest({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });

// Applies a saved theme before first paint so the page never flashes. With no
// saved choice the CSS follows the system theme. Key: THEME_STORAGE_KEY.
const themeScript = `try{var t=localStorage.getItem("vh-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export const metadata: Metadata = {
  title: "Vita Health",
  description: "Healthy eating, workouts and a free AI coach for losing or gaining weight.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script sets data-theme before React hydrates.
    <html lang="en" suppressHydrationWarning className={sans.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
