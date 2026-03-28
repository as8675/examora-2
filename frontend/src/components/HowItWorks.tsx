import { FileText, MessageSquare, Sliders, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: FileText,
    title: "Upload Course Material",
    description: "Professors upload PDFs like syllabi or past exams. Our AI uses AWS Textract to extract and understand your course content.",
    color: "text-primary",
  },
  {
    icon: MessageSquare,
    title: "Understand Student Feedback",
    description: "The system analyzes reviews (e.g., from Rate My Professor) using sentiment analysis to understand student perspectives.",
    color: "text-secondary",
  },
  {
    icon: Sliders,
    title: "Calibrate Difficulty",
    description: "AI uses sentiment data to intelligently adjust question difficulty levels (Easy, Medium, Hard) for optimal assessment.",
    color: "text-primary",
  },
  {
    icon: Sparkles,
    title: "Generate and Review Exams",
    description: "Examora's AI creates new exam questions using LLMs. Professors can review, edit, and approve before publishing.",
    color: "text-secondary",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            How Examora Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to transform your assessment creation process
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card 
              key={index}
              className="p-8 hover:shadow-[var(--shadow-hover)] transition-all duration-300 bg-[var(--gradient-card)] border-border/50 animate-slide-up group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className={`h-8 w-8 ${step.color}`} />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-muted-foreground/30">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
