import FocusFrame from "@/components/app/FocusFrame";

// Login, sign-up and the questionnaire: one calm column, no cabinet navigation.
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return <FocusFrame>{children}</FocusFrame>;
}
