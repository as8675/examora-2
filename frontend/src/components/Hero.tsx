import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ParticleBackground from "./ParticleBackground";
import aiIllustration from "@/assets/ai-illustration.png";
import ThemeToggle from "./ThemeToggle";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-[var(--gradient-hero)] z-0" />
      
      {/* Theme Toggle */}
      <ThemeToggle />
      
      {/* Content */}
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left space-y-8">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="inline-block animate-glow">Examora</span>
                <span className="block mt-2 text-3xl sm:text-4xl lg:text-5xl bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient">
                  AI-Driven Insights for Smarter Learning
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Analyze real student reviews and AI-powered sentiment to understand professors 
                and course difficulty before enrolling.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="text-lg px-8 py-6 shadow-lg hover:shadow-[var(--shadow-hover)] transition-all duration-300 group hover:scale-105 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  <Link to="/login">
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* AI Illustration */}
            <div className="relative hidden lg:block">
              {/* Animated pulse effect behind image */}
              <div className="absolute inset-0 animate-pulse-slow opacity-30">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-full blur-3xl" />
              </div>
              
              <div className="relative animate-float">
                <img 
                  src={aiIllustration} 
                  alt="AI Data Analysis and Insights Visualization" 
                  className="w-full h-auto drop-shadow-[0_0_50px_rgba(168,85,247,0.5)] dark:drop-shadow-[0_0_80px_rgba(168,85,247,0.8)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
