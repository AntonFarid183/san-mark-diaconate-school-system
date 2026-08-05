import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../landing/Landing.css';
import LandingNavbar from '../landing/sections/LandingNavbar';
import HeroSection from '../landing/sections/HeroSection';
import SynaxariumSection from '../landing/sections/SynaxariumSection';
import GallerySection from '../landing/sections/GallerySection';
import AboutSection from '../landing/sections/AboutSection';
import OrdinationSection from '../landing/sections/OrdinationSection';
import BylawsSection from '../landing/sections/BylawsSection';
import LeadersSection from '../landing/sections/LeadersSection';
import StatisticsSection from '../landing/sections/StatisticsSection';
import ContactSection from '../landing/sections/ContactSection';
import FeedbackSection from '../landing/sections/FeedbackSection';
import ScrollToTopButton from '../landing/components/ScrollToTopButton';

export default function LandingPage() {
  const location = useLocation();

  // Supports navbar links that navigate here from another page with a hash
  // (e.g. /curriculum/rites -> "عن المدرسة" -> "/#about").
  useEffect(() => {
    if (!location.hash) return;
    const el = document.querySelector(location.hash);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [location.hash]);

  return (
    <div className="landing-page">
      <LandingNavbar />
      <HeroSection />
      <SynaxariumSection />
      <GallerySection />
      <AboutSection />
      <OrdinationSection />
      <BylawsSection />
      <LeadersSection />
      <StatisticsSection />
      <ContactSection />
      <FeedbackSection />
      <ScrollToTopButton />
    </div>
  );
}
