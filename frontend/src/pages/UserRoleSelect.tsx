import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { motion } from "framer-motion";

const UserRoleSelect = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("examora_token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleSelect = (role: string) => {
    localStorage.setItem("examora_role", role);
    if (role === "student") navigate("/student-dashboard");
    else navigate("/professor-dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 relative overflow-hidden">
      <ThemeToggle />

      {/* Animated Glow Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.15)_0%,transparent_70%)] animate-pulse-slow"></div>

      <div className="z-10 text-center space-y-4 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Choose Your Role
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Tell us who you are so Examora can personalize your experience.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-8 mt-12 z-10">
        {/* STUDENT CARD */}
        <motion.div
          whileHover={{ scale: 1.07, rotate: -1 }}
          whileTap={{ scale: 0.97 }}
          className="cursor-pointer transition-all"
          onClick={() => handleSelect("student")}
        >
          <Card className="w-72 h-80 flex flex-col items-center justify-center gap-4 bg-[var(--gradient-card)] border-border/50 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-all duration-300">
            <img
              src="/images/student.png"
              alt="Student illustration"
              className="w-28 h-28 object-contain animate-float"
            />
            <h2 className="text-xl font-semibold text-primary">I’m a Student</h2>
            <p className="text-muted-foreground text-sm text-center px-4">
              Explore AI-driven insights to pick the right professors and courses.
            </p>
            <Button className="mt-2">Continue</Button>
          </Card>
        </motion.div>

        {/* PROFESSOR CARD */}
        <motion.div
          whileHover={{ scale: 1.07, rotate: 1 }}
          whileTap={{ scale: 0.97 }}
          className="cursor-pointer transition-all"
          onClick={() => handleSelect("professor")}
        >
          <Card className="w-72 h-80 flex flex-col items-center justify-center gap-4 bg-[var(--gradient-card)] border-border/50 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-all duration-300">
            <img
              src="/images/professor.png"
              alt="Professor illustration"
              className="w-28 h-28 object-contain animate-float"
            />
            <h2 className="text-xl font-semibold text-secondary">I’m a Professor</h2>
            <p className="text-muted-foreground text-sm text-center px-4">
              Gain insights from student feedback to improve learning outcomes.
            </p>
            <Button className="mt-2" variant="secondary">Continue</Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default UserRoleSelect;
