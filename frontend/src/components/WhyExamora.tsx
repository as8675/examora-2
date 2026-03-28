import { Brain, Clock, Scale, Cloud } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "Adaptive Difficulty",
    description: "Questions automatically adjust based on real student sentiment and feedback, ensuring fair and appropriate challenge levels.",
  },
  {
    icon: Clock,
    title: "Time Saved",
    description: "Reduce exam creation time by up to 80%. Focus on teaching while AI handles the heavy lifting of question generation.",
  },
  {
    icon: Scale,
    title: "Fairness & Transparency",
    description: "Data-driven approach ensures balanced assessments that reflect true learning outcomes, not guesswork or bias.",
  },
  {
    icon: Cloud,
    title: "Seamless Integration",
    description: "Built on AWS services including S3, Comprehend, and SageMaker for enterprise-grade reliability and security.",
  },
];

const WhyExamora = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Why Examora?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Intelligent assessment creation powered by cutting-edge AI technology
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-8 hover:shadow-[var(--shadow-hover)] transition-all duration-300 bg-[var(--gradient-card)] border-border/50 animate-slide-up group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                
                <div className="space-y-2 flex-1">
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyExamora;
