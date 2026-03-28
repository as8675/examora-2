import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import UserRoleSelect from "./pages/UserRoleSelect";
import ProfessorScrapeSetup from "./pages/ProfessorScrapeSetup";
import ProfessorDashboard from "./pages/ProfessorAssistant";
import ProfessorAssistant from "./pages/ProfessorAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/role" element={<UserRoleSelect />} />
          <Route path="/professor-dashboard" element={<ProfessorScrapeSetup />} />
          <Route path="/professor-assistant" element={<ProfessorAssistant />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
