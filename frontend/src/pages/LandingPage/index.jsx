import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/hooks";
import { Header, Footer } from "@/components/layout";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { ComparisonSection } from "./ComparisonSection";
import { CTASection } from "./CTASection";

export function LandingPage() {
  const { goToRegister } = useNavigation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div>
      <Header />
      <HeroSection onStartTracking={goToRegister} />
      <FeaturesSection />
      <ComparisonSection />
      <CTASection onGetStarted={goToRegister} />
      <Footer />
    </div>
  );
}

export default LandingPage;
