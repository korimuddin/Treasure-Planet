import { Wix_Madefor_Text } from "next/font/google";
import { SignIn1 } from "@/components/ui/modern-stunning-sign-in";

// Same sans as the landing page, so sign-in matches the Dusk front door.
const wixText = Wix_Madefor_Text({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

export default function LoginPage() {
  return (
    <div className={wixText.className}>
      <SignIn1 />
    </div>
  );
}
