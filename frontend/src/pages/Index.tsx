import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import WhyExamora from "@/components/WhyExamora";
import Testimonial from "@/components/Testimonial";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <HowItWorks />
      <WhyExamora />
      <Testimonial />
      <Footer />
    </div>
  );
};

export default Index;
