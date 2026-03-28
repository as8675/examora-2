import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/auth";

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "verify">("login");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Helper to call API
  const callApi = async (endpoint: string, body: any) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong");
    return data;
  };

  // ✅ Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await callApi("/login", { email, password });
      localStorage.setItem("examora_token", data.token);
      setMessage("✅ Login successful! Redirecting...");
      setTimeout(() => navigate("/role"), 1500);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await callApi("/signup", { email, password, name });
      setMessage("✅ Signup successful! Check your email for a verification code.");
      setMode("verify");
    } catch (err: any) {
      setError(err.message || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await callApi("/confirm", { email, code });
      setMessage("🎉 Account verified! You can now log in.");
      setTimeout(() => {
        setMode("login");
        setMessage("");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Dynamic UI ---
  const renderForm = () => {
    switch (mode) {
      case "signup":
        return (
          <form className="space-y-4" onSubmit={handleSignup}>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="professor@university.edu"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {message && <p className="text-green-500 text-sm text-center">{message}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing Up..." : "Sign Up"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <span
                className="text-primary cursor-pointer hover:underline"
                onClick={() => setMode("login")}
              >
                Log In
              </span>
            </p>
          </form>
        );

      case "verify":
        return (
          <div className="space-y-4 text-center">
            <div className="bg-background/50 p-6 rounded-lg border border-border/50 shadow-md">
              <h2 className="text-lg font-semibold text-primary mb-2">
                Verify Your Account
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Enter the 6-digit verification code sent to your email.
              </p>
              <form onSubmit={handleVerify} className="space-y-3">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                />
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Verification Code"
                  required
                />

                {error && <p className="text-red-500 text-sm">{error}</p>}
                {message && <p className="text-green-500 text-sm">{message}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify Account"}
                </Button>
              </form>
            </div>

            <p className="text-sm text-muted-foreground">
              Already verified?{" "}
              <span
                className="text-primary cursor-pointer hover:underline"
                onClick={() => setMode("login")}
              >
                Log In
              </span>
            </p>
          </div>
        );

      default:
        return (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="professor@university.edu"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {message && <p className="text-green-500 text-sm text-center">{message}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <p className="text-sm text-center text-muted-foreground mt-2">
              Don’t have an account?{" "}
              <span
                className="text-primary cursor-pointer hover:underline"
                onClick={() => setMode("signup")}
              >
                Sign Up
              </span>
            </p>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-md p-8 space-y-6 animate-fade-in bg-[var(--gradient-card)] border-border/50 shadow-[var(--shadow-card)]">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {mode === "login"
              ? "Welcome to Examora"
              : mode === "signup"
              ? "Create Your Account"
              : "Verify Your Account"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "login"
              ? "Sign in to access AI-powered course insights"
              : mode === "signup"
              ? "Join Examora and unlock smarter learning insights"
              : "Complete your registration below"}
          </p>
        </div>

        {renderForm()}

        {mode === "login" && (
          <div className="text-center mt-6">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/role")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuthPage;
