import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ThemeToggle from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import ParticleBackground from "@/components/ParticleBackground";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const ProfessorScrapeSetup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepMsg, setStepMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Ensure user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("examora_token");
    if (!token) navigate("/login");
  }, [navigate]);

  const startScrape = async () => {
    const token = localStorage.getItem("examora_token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!name.trim()) {
      setError("Please enter the full name of the professor.");
      return;
    }

    setError(null);
    setLoading(true);
    setStepMsg("Queuing your scrape job…");

    try {
      // 🔐 Protected endpoint (your backend mounts scrape routes under `/scrape`)
      // Adjust the path below if your route is different, e.g. `/scrape/professors` or `/scrape/start`
      const res = await fetch(`${API_BASE_URL}/scrape/professor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // authMiddleware expects this
        },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start scraping");
      }

      setStepMsg("Scraping reviews and saving to DynamoDB…");

      // If your endpoint responds immediately after scheduling,
      // we simply show the loader until it returns, then move on.
      // Optionally navigate to a dashboard or results page:
      const data = await res.json().catch(() => ({}));
      // data could hold { jobId, professor_id, ... } depending on your scraper
      setStepMsg("Wrapping up…");
      // Small beat so the user sees the final message, then view insights
      setTimeout(() => {
        navigate(`/professor-assistant?name=${encodeURIComponent(name)}`);
      }, 800);
    } catch (e: any) {
      setError(e.message || "Something went wrong while scraping.");
    } finally {
      // Keep loader visible just a moment to avoid abrupt flash
      setTimeout(() => setLoading(false), 300);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Particles + Theme Toggle */}
      <ParticleBackground />
      <ThemeToggle />

      {/* Subtle center glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,hsl(var(--primary)/0.20)_0%,transparent_55%)]" />

      <Card className="relative z-10 w-full max-w-xl px-8 py-10 space-y-8 animate-fade-in bg-[var(--gradient-card)] border-border/50 shadow-[var(--shadow-card)]">
        <div className="text-center space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient"
          >
            Welcome to Your Review Insights
          </motion.h1>
          <p className="text-muted-foreground">
            This tool helps you view and analyze your public student feedback securely in one place.
            Please confirm your full name so we can gather the latest data for your profile.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prof-name">Your Full Name</Label>
            <Input
              id="prof-name"
              placeholder="e.g., Dr. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background/50"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button
            onClick={startScrape}
            disabled={loading || !name.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? "Preparing your insights…" : "View My Insights"}
          </Button>
        </div>
      </Card>


      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 backdrop-blur-md bg-background/50 flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-6">
              {/* Neon ring spinner */}
              <motion.div
                className="relative w-28 h-28"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
              >
                <svg
                  viewBox="0 0 120 120"
                  className="w-28 h-28 drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
                >
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--secondary))" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="hsl(var(--muted-foreground)/0.15)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="url(#grad)"
                    strokeLinecap="round"
                    strokeDasharray="220"
                    strokeDashoffset="140"
                    strokeWidth="10"
                  />
                </svg>
                <div className="absolute inset-0 rounded-full blur-2xl bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.25),transparent_60%)]" />
              </motion.div>

              <div className="text-center space-y-2">
                <p className="text-sm font-medium">
                  {stepMsg || "Preparing…"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Please keep this tab open while we fetch and process data.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfessorScrapeSetup;
