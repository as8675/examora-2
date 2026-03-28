import { useLocation } from "react-router-dom";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; // Ensure this component exists
import { 
  Edit, 
  Download, 
  FileUp, 
  BarChart, 
  ListChecks, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// --- TYPES & HELPER COMPONENTS ---

type Question = {
  id: number;
  text: string;
};

// Component for in-place editing of a single question
const EditableQuestionRow = ({ question, onEdit }: { question: Question; onEdit: (id: number, newText: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(question.text);

  const handleSave = () => {
    onEdit(question.id, currentText);
    setIsEditing(false);
  };

  return (
    <TableRow className="group hover:bg-muted/40 transition-colors">
      <TableCell className="w-12 font-mono text-muted-foreground font-medium">{question.id}.</TableCell>
      <TableCell 
        className="cursor-text p-4"
        onClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <Textarea 
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSave()}
            autoFocus
            className="min-h-[60px] resize-none shadow-sm"
          />
        ) : (
          <div className="flex items-start justify-between gap-4">
            <span className="leading-relaxed whitespace-pre-wrap">{currentText}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};

// --- MAIN COMPONENT ---

export default function ProfessorAssistant() {
  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const name = query.get("name") || "Professor";

  const [activeTab, setActiveTab] = useState("material");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [editableQuestions, setEditableQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [sentiment, setSentiment] = useState({ negPct: 0, totalReviews: 0 });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("examora_token");

  // Fetch sentiment & auto-detected tier on load
  useEffect(() => {
    async function fetchSentimentAndTier() {
      const professorName = query.get("name");
      if (!professorName || !token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/professors/sentiment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: professorName }),
        });

        const data = await res.json().catch(() => ({}));
        
        if (res.ok && data.difficultyTier) {
          setTier(data.difficultyTier);
          const negCount = data.sentimentBreakdown?.NEGATIVE || 0;
          const total = data.totalReviews || 0;
          setSentiment({ 
              negPct: total > 0 ? (negCount / total) * 100 : 0, 
              totalReviews: total 
          });
        }
      } catch (err) {
        console.error("Sentiment fetch failed:", err);
      }
    }
    fetchSentimentAndTier();
  }, [query, token]);

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    setFile(uploadedFile);
    setLoading(true);
    setError(null);
    setTopics([]);

    const fd = new FormData();
    fd.append("file", uploadedFile);

    try {
      const res = await fetch(`${API_BASE_URL}/api/syllabus/topics`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to extract topics");

      setTopics(data.topics || []);
      if (data.topics && data.topics.length > 0) {
        setTimeout(() => setActiveTab("difficulty"), 500); // Small delay for UX
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong during topic extraction.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setEditableQuestions([]);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("tier", tier);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/assistant/questions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to generate questions");

      const newQuestions: Question[] = (data.questions || []).map((q: string, i: number) => ({ id: i + 1, text: q }));
      setEditableQuestions(newQuestions);
      setActiveTab("review"); 
    } catch (err: any) {
      setError(err.message || "Question generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionEdit = useCallback((id: number, newText: string) => {
    setEditableQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, text: newText } : q))
    );
  }, []);

  const handleDownload = () => {
    const output = editableQuestions.map((q, i) => `${i + 1}. ${q.text}`).join("\n\n");
    const blob = new Blob([output], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Examora_Exam_${tier}_${file?.name.split('.')[0] || "Questions"}.txt`;
    link.click();
  };

  // UI Helpers
  const getTierColor = (t: string) => {
    if (t === "Hard") return "bg-red-500/10 text-red-500 border-red-500/20";
    if (t === "Medium") return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    return "bg-green-500/10 text-green-500 border-green-500/20";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4 md:p-8">
      <Card className="max-w-5xl w-full shadow-2xl border-border/50 bg-card/80 backdrop-blur-xl">
        <CardHeader className="border-b border-border/50 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Examora AI Assistant
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Drafting exams for <span className="font-medium text-foreground">Prof. {name}</span>
              </CardDescription>
            </div>
            {sentiment.totalReviews > 0 && (
               <Badge variant="outline" className="w-fit gap-1.5 px-3 py-1.5 text-sm font-normal">
                 <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                 {sentiment.totalReviews} Reviews Analyzed
               </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            
            {/* Custom Styled Tab List */}
            <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl mb-8">
              <TabsTrigger 
                value="material" 
                className="py-3 flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">1. Material & Topics</span>
                <span className="sm:hidden">1. Upload</span>
              </TabsTrigger>
              <TabsTrigger 
                value="difficulty" 
                disabled={!file && editableQuestions.length === 0}
                className="py-3 flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <BarChart className="h-4 w-4" />
                <span className="hidden sm:inline">2. Calibrate Difficulty</span>
                <span className="sm:hidden">2. Difficulty</span>
              </TabsTrigger>
              <TabsTrigger 
                value="review" 
                disabled={editableQuestions.length === 0}
                className="py-3 flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <ListChecks className="h-4 w-4" />
                <span className="hidden sm:inline">3. Review & Download</span>
                <span className="sm:hidden">3. Review</span>
              </TabsTrigger>
            </TabsList>
            
            <AnimatePresence mode="wait">
              
              {/* Tab 1: Material */}
              {activeTab === "material" && (
                <motion.div
                  key="material"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div 
                    className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${file ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50 cursor-pointer'}`}
                    onClick={() => !loading && fileInputRef.current?.click()}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden" 
                      accept="application/pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    />
                    
                    {loading ? (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">Analyzing syllabus contents...</p>
                      </div>
                    ) : file ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-lg">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB • Click to replace</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileUp className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-lg">Upload Course Syllabus</p>
                          <p className="text-sm text-muted-foreground">Drag and drop or click to browse (PDF only)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {topics.length > 0 && (
                    <div className="space-y-3 animate-slide-up">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                          <BarChart className="h-4 w-4 text-primary" /> 
                          Detected Key Topics
                        </h3>
                        <Badge variant="outline" className="text-xs font-normal">
                          {topics.length} topics found
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-xl border border-border/50">
                        {topics.map((t, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="px-3 py-1.5 bg-background border border-border/50 hover:border-primary/50 text-foreground transition-colors"
                          >
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tab 2: Difficulty */}
              {activeTab === "difficulty" && (
                <motion.div
                  key="difficulty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Sentiment Card */}
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2 text-muted-foreground">
                          <AlertCircle className="h-4 w-4" />
                          Sentiment Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-end justify-between">
                          <span className="text-4xl font-bold tracking-tight">
                            {sentiment.negPct.toFixed(1)}%
                          </span>
                          <span className="text-sm text-muted-foreground mb-1">Negative Sentiment</span>
                        </div>
                        <Progress 
                          value={sentiment.negPct} 
                          className="h-2.5" 
                          // Simple dynamic color class logic for the bar indicator would go here if extending Progress
                        />
                        <p className="text-xs text-muted-foreground">
                          Based on {sentiment.totalReviews} student reviews. {sentiment.negPct > 30 ? "High negativity suggests maintaining rigor but ensuring clarity." : "Low negativity suggests room for increased difficulty."}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Tier Selection Card */}
                    <Card className="border-border/50 shadow-sm flex flex-col justify-center">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-base">Target Difficulty</Label>
                          <Badge className={getTierColor(tier)} variant="outline">
                            {tier}
                          </Badge>
                        </div>
                        <ToggleGroup 
                          type="single" 
                          value={tier} 
                          onValueChange={(val: "Easy" | "Medium" | "Hard") => val && setTier(val)}
                          className="w-full justify-start gap-2"
                        >
                          {["Easy", "Medium", "Hard"].map((lvl) => (
                            <ToggleGroupItem 
                              key={lvl} 
                              value={lvl}
                              className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border border-input"
                            >
                              {lvl}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </CardContent>
                    </Card>
                  </div>

                  <Button 
                    onClick={handleGenerate}
                    disabled={!file || loading}
                    size="lg"
                    className="w-full text-base h-12 shadow-lg hover:shadow-primary/25 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-5 w-5" /> 
                        Generate Exam Questions
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Tab 3: Review */}
              {activeTab === "review" && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-primary" />
                      Exam Preview
                    </h2>
                    <Badge variant="secondary">{editableQuestions.length} Questions</Badge>
                  </div>
                  
                  <div className="border rounded-xl overflow-hidden bg-background shadow-sm">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead>Question (Click text to edit)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editableQuestions.map((q) => (
                          <EditableQuestionRow 
                            key={q.id}
                            question={q}
                            onEdit={handleQuestionEdit}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleDownload} size="lg" className="w-full md:w-auto min-w-[200px] shadow-md">
                      <Download className="h-4 w-4 mr-2" /> 
                      Download Final Exam
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </Tabs>
          
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center animate-shake">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}