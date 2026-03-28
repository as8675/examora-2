import { Quote } from "lucide-react";
import { Card } from "@/components/ui/card";

const Testimonial = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto">
        <Card className="max-w-4xl mx-auto p-12 bg-[var(--gradient-card)] border-border/50 shadow-[var(--shadow-card)] animate-fade-in">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Quote className="h-8 w-8 text-primary-foreground" />
            </div>
            
            <blockquote className="text-2xl sm:text-3xl font-medium leading-relaxed text-foreground">
              "Examora helps professors focus on teaching — while AI handles 
              the hard part of exam creation."
            </blockquote>
            
            <div className="pt-4">
              <p className="text-muted-foreground">
                Transform your assessment workflow today
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default Testimonial;
