"use client";

import React, { useState } from "react";
import { SOPResult } from "@/types/sop";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

/* Landing / Input Section */
function LandingSection({
  onSubmit,
}: {
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [".txt", ".pdf", ".docx", ".doc"];
    if (!allowed.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      alert("Please upload a .pdf, .docx, .doc, or .txt file");
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      alert("File is too large. Please upload a file under 5MB.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".txt")) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/extract-pdf", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Failed to extract file text.");
          return;
        }
        setText(data.text);
      } catch {
        alert("Failed to extract text from file. Please paste the SOP text manually.");
        return;
      }
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setText((ev.target?.result as string) || "");
      };
      reader.readAsText(file);
    }
    setFileName(file.name);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-zinc-500">
            AI-Powered Training Generator
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight bg-gradient-to-r from-violet-500 via-fuchsia-400 to-violet-500 bg-[length:200%_auto] animate-text-wave bg-clip-text text-transparent pb-1">
            SOP Trainer
          </h1>
          <p className="text-zinc-400 text-base max-w-lg mx-auto leading-relaxed">
            Transform your Standard Operating Procedures into interactive,
            structured training modules instantly.
          </p>
        </div>

        {/* Input Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
          <div>
            <h2 className="text-sm font-medium text-zinc-200 mb-1">Paste or Upload SOP</h2>
            <p className="text-xs text-zinc-500">Supports .pdf, .docx, .doc and .txt files</p>
          </div>

          <Textarea
            placeholder="Paste your SOP document here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 resize-none focus-visible:ring-1 focus-visible:ring-zinc-600 rounded-lg text-sm"
          />

          <div className="flex items-center gap-3">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept=".txt,.pdf,.docx,.doc"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 text-xs text-zinc-400 hover:text-zinc-300 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {fileName ? fileName : "Upload file"}
              </div>
            </label>

            <Button
              size="lg"
              disabled={text.trim().length < 20}
              onClick={() => onSubmit(text.trim())}
              className="bg-white text-zinc-900 hover:bg-zinc-200 font-medium text-sm rounded-lg px-6 disabled:opacity-30 transition-all"
            >
              Analyze SOP
            </Button>
          </div>

          {text.length > 0 && text.length < 20 && (
            <p className="text-xs text-amber-400/80">Minimum 20 characters required</p>
          )}
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {["Training Modules", "Decision Scenarios", "Interactive Quiz", "Export to Slides"].map((f) => (
            <span key={f} className="px-3 py-1 rounded-full border border-zinc-800 text-xs text-zinc-500 bg-zinc-900/30">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Loading State */
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border border-zinc-700"></div>
          <div className="absolute inset-0 rounded-full border border-transparent border-t-white animate-spin"></div>
        </div>
        <div>
          <h2 className="text-lg font-medium text-zinc-100">Analyzing SOP...</h2>
          <p className="text-zinc-500 text-sm mt-1">Generating and refining training modules, scenarios and quiz</p>
        </div>
      </div>
    </div>
  );
}

/* Error State */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="rounded-xl border border-red-500/20 bg-zinc-900/60 max-w-md w-full p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full border border-red-500/30 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <div>
          <h3 className="text-base font-medium text-zinc-100">Something went wrong</h3>
          <p className="text-sm text-zinc-400 mt-1">{message}</p>
        </div>
        <Button onClick={onRetry} variant="outline" className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-sm">
          Try Again
        </Button>
      </div>
    </div>
  );
}

/* Results Display */
function ResultsSection({ data, onReset, onUpdateData }: { data: SOPResult; onReset: () => void; onUpdateData: (d: SOPResult) => void }) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [regeneratingQuiz, setRegeneratingQuiz] = useState(false);

  const handleAnswer = (qIdx: number, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: option }));
    setShowExplanation((prev) => ({ ...prev, [qIdx]: true }));
  };

  const handleRegenerateQuiz = async () => {
    setRegeneratingQuiz(true);
    try {
      const res = await fetch("/api/regenerate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ training_modules: data.training_modules, previous_quiz: data.quiz }),
      });
      const newQuiz = await res.json();
      if (!res.ok) throw new Error(newQuiz.error || "Failed to regenerate quiz.");
      onUpdateData({ ...data, quiz: newQuiz.quiz });
      setSelectedAnswers({});
      setShowExplanation({});
    } catch {
      alert("Failed to regenerate quiz. Please try again.");
    } finally {
      setRegeneratingQuiz(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sop-training-manual.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportSlides = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to generate slides");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sop-training-slides.html";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export slides. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const badgeStyle: Record<string, string> = {
    process: "border-blue-500/30 text-blue-400",
    policy: "border-amber-500/30 text-amber-400",
    safety: "border-red-500/30 text-red-400",
    low: "border-green-500/30 text-green-400",
    medium: "border-amber-500/30 text-amber-400",
    high: "border-red-500/30 text-red-400",
    beginner: "border-sky-500/30 text-sky-400",
    intermediate: "border-purple-500/30 text-purple-400",
  };

  const getBadge = (val: string) => {
    const key = val.toLowerCase();
    const cls = badgeStyle[key] || "border-zinc-600 text-zinc-400";
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${cls}`}>
        {val}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Training Results</h1>
            <div className="flex items-center gap-2 mt-2">
              {getBadge(data.analysis.sop_type)}
              {getBadge(data.analysis.audience)}
              {getBadge(data.analysis.complexity)}
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-sm gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              {exportingPdf ? "Exporting..." : "Export PDF"}
            </Button>
            <Button
              onClick={handleExportSlides}
              disabled={exporting}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-sm gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {exporting ? "Exporting..." : "Export Slides"}
            </Button>
            <Button onClick={onReset} variant="outline" className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-sm">
              New SOP
            </Button>
          </div>
        </div>

        <Separator className="bg-zinc-800/50" />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-transparent border border-zinc-800 p-1 h-auto rounded-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 text-sm px-4 rounded-md">Overview</TabsTrigger>
            <TabsTrigger value="modules" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 text-sm px-4 rounded-md">Modules</TabsTrigger>
            <TabsTrigger value="scenarios" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 text-sm px-4 rounded-md">Scenarios</TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 text-sm px-4 rounded-md">Quiz</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">SOP Overview</h3>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{data.overview}</p>
            </div>
          </TabsContent>

          {/* Training Modules */}
          <TabsContent value="modules">
            <div className="space-y-3">
              {data.training_modules.map((mod, i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                  <div className="p-5 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">
                        {i + 1}
                      </span>
                      <h4 className="text-sm font-medium text-zinc-200">{mod.learning_objective}</h4>
                    </div>
                  </div>
                  <div className="px-5 pb-4">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="details" className="border-zinc-800/50">
                        <AccordionTrigger className="text-xs text-zinc-500 hover:text-zinc-300 py-2">
                          View details
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-1">
                            <DetailRow label="What to Do" value={mod.what_to_do} />
                            <DetailRow label="Why It Matters" value={mod.why_it_matters} />
                            <DetailRow label="Example" value={mod.example} />
                            <DetailRow label="Common Mistake" value={mod.common_mistake} variant="warn" />
                            {mod.prerequisite && (
                              <DetailRow label="Prerequisite" value={mod.prerequisite} variant="info" />
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Decision Scenarios */}
          <TabsContent value="scenarios">
            <div className="space-y-3">
              {data.decision_scenarios.map((ds, i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
                  <h4 className="text-sm font-medium text-zinc-200">{ds.situation}</h4>
                  <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
                    <p className="text-xs text-zinc-500 mb-1">Decision</p>
                    <p className="text-sm text-zinc-300">{ds.decision}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Reasoning</p>
                    <p className="text-sm text-zinc-400">{ds.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Quiz */}
          <TabsContent value="quiz">
            <div className="flex justify-end mb-3">
              <Button
                onClick={handleRegenerateQuiz}
                disabled={regeneratingQuiz}
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-sm gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                {regeneratingQuiz ? "Regenerating..." : "Regenerate Quiz"}
              </Button>
            </div>
            <div className="space-y-3">
              {data.quiz.map((q, i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium border border-zinc-700 text-zinc-400">{q.type}</span>
                    <span className="text-[11px] text-zinc-600">Question {i + 1}</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-200">{q.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => {
                      const selected = selectedAnswers[i] === opt;
                      const isCorrect = opt === q.answer;
                      const revealed = showExplanation[i];

                      let optClass = "border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200";
                      if (revealed && selected && isCorrect) optClass = "border-green-500/40 bg-green-500/5 text-green-400";
                      else if (revealed && selected && !isCorrect) optClass = "border-red-500/40 bg-red-500/5 text-red-400";
                      else if (revealed && isCorrect) optClass = "border-green-500/20 text-green-400/50";

                      return (
                        <button
                          key={oi}
                          disabled={!!revealed}
                          onClick={() => handleAnswer(i, opt)}
                          className={`text-left p-3 rounded-lg border text-sm transition-all ${optClass} ${!revealed ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <span className="font-mono text-[11px] mr-2 opacity-40">{String.fromCharCode(65 + oi)}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {showExplanation[i] && (
                    <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 text-sm text-zinc-400">
                      <p className="font-medium text-zinc-300 mb-1 text-xs">
                        {selectedAnswers[i] === q.answer ? "Correct" : "Incorrect"}
                      </p>
                      <p className="text-xs">{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* Detail Row Helper */
function DetailRow({ label, value, variant }: { label: string; value: string; variant?: string }) {
  const borderColor =
    variant === "warn" ? "border-amber-500/10 bg-amber-500/5" :
    variant === "info" ? "border-sky-500/10 bg-sky-500/5" :
    "border-zinc-800 bg-zinc-950/30";
  return (
    <div className={`p-3 rounded-lg border ${borderColor}`}>
      <p className="text-[11px] font-medium text-zinc-500 mb-1 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-zinc-300">{value}</p>
    </div>
  );
}

/* Main Page */
export default function Home() {
  const [state, setState] = useState<"input" | "loading" | "results" | "error">("input");
  const [result, setResult] = useState<SOPResult | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (sopText: string) => {
    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/process-sop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sopText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process SOP.");
      }

      setResult(data);
      setState("results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("input");
    setResult(null);
    setError("");
  };

  return (
    <main className="min-h-screen bg-zinc-950">
      {state === "input" && <LandingSection onSubmit={handleSubmit} />}
      {state === "loading" && <LoadingState />}
      {state === "error" && <ErrorState message={error} onRetry={handleReset} />}
      {state === "results" && result && <ResultsSection data={result} onReset={handleReset} onUpdateData={setResult} />}
    </main>
  );
}
