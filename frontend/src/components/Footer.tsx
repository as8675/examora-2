import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to Transform Your Assessments?
          </h2>
          
          <p className="text-lg text-muted-foreground">
            Join educators who are already using AI to create better, fairer exams.
          </p>
          
          <Button 
            asChild 
            size="lg" 
            className="text-lg px-8 py-6 shadow-lg hover:shadow-[var(--shadow-hover)] transition-all duration-300 group"
          >
            <Link to="/login">
              Sign In to Get Started
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          
          <div className="pt-12 border-t border-border/50 mt-12">
            <p className="text-sm text-muted-foreground">
              © 2025 Examora. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
