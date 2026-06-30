import { useEffect } from "react";
import { useNavigation } from "@/hooks";
import { Navbar, Footer } from "@/components/layout";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { ComparisonSection } from "./ComparisonSection";
import { CTASection } from "./CTASection";

export function LandingPage() {
  const { goToRegister } = useNavigation();

  return (
    <div>
      <Navbar />
      <HeroSection onStartTracking={goToRegister} />
      <FeaturesSection />
      <ComparisonSection />
      <CTASection onGetStarted={goToRegister} />
      <Footer />
    </div>
  );
}

export default LandingPage;
