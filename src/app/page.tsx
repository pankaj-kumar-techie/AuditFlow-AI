"use client";

import { useState, useEffect } from "react";
import { Search, Download, Mail, CheckCircle2, AlertCircle, Loader2, Zap, Shield, BarChart3, ChevronLeft, ArrowRight, Phone, Globe, Cpu, MapPin, Users, Target, Star, Monitor, Smartphone, TrendingUp, Calendar, Info, CheckSquare, XCircle, Terminal, Map } from "lucide-react";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "results">("idle");
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    "Initiating Revenue-Scan™...",
    "Scanning domain presence...",
    "Analyzing traffic channels...",
    "Mapping local visibility...",
    "Calculating job loss metrics...",
    "Finalizing ARMA diagnosis...",
  ];

  const currentStepIndex = Math.min(
    Math.floor((progress / 100) * steps.length),
    steps.length - 1
  );

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setStatus("loading");
    setProgress(0);
    setReport(null);
    setError(null);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(interval);
          return 98;
        }
        return prev + Math.random() * 2;
      });
    }, 300);

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed.");

      // CRITICAL: BROWSER CONSOLE VERIFICATION
      console.group(`%c[ARMA DIAGNOSTIC: ACTUAL DATA FETCHED]`, "color: #fff; background: #000; padding: 10px; border-radius: 8px; border: 2px solid #D0202E;");
      console.log("%cTARGET DOMAIN:", "font-weight: bold; color: #D0202E;", url);
      console.log("%cSEARCHED BRAND:", "font-weight: bold; color: #3b82f6;", data.report.local_stats?.name);
      console.log("%cRAW REPORT DATA:", "font-weight: bold;", data.report);
      
      if (data.report.metrics?.top_keywords?.length) {
        console.log("%cTOP DISCOVERED KEYWORDS:", "font-weight: bold; color: #10b981;");
        console.table(data.report.metrics.top_keywords);
      } else {
        console.warn("NO ORGANIC KEYWORDS DISCOVERED FOR THIS DOMAIN.");
      }

      console.log("%cAPI SOURCES STATUS:", "font-weight: bold;");
      Object.entries(data.report._sources).forEach(([api, success]) => {
        const color = success ? "#10b981" : "#ef4444";
        console.log(`%c${success ? "✓" : "✗"} ${api.toUpperCase()}`, `color: ${color}; font-weight: bold;`);
      });
      console.groupEnd();

      setReport(data.report || data); // Adjusting for the new API response shape
      setProgress(100);
      setTimeout(() => setStatus("results"), 500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
      toast.error(msg);
      setStatus("idle");
      clearInterval(interval);
    }
  };

  const downloadPdf = () => {
    if (!report) return;
    toast.info("Generating your conversion-led audit PDF...");
    window.open(`/api/download?url=${encodeURIComponent(url)}`, "_blank");
  };

  const copyEmail = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.email_outreach);
    toast.success("Appointment request copied!");
  };

  if (status === "idle") {
    return (
      <div className="min-h-screen bg-black text-white selection:bg-red-500/30 flex flex-col font-sans">
        <header className="p-6 md:p-8 flex justify-between items-center max-w-7xl mx-auto w-full">
          <img src="https://arma-agency.us/wp-content/uploads/2026/02/logo.webp" alt="ARMA" className="h-6 md:h-8 w-auto object-contain" />
          <div className="hidden md:flex items-center gap-4">
            <a href="tel:+13072228373" className="text-xs font-bold tracking-widest hover:text-[#D0202E] transition-colors">+1 307 222 8373</a>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-[#D0202E]/5 blur-[150px] rounded-full -z-10"></div>

          <div className="max-w-4xl w-full text-center space-y-8 md:space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D0202E]/10 border border-[#D0202E]/20">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D0202E]">ARMA: Find Problems → Show Loss → Sell Solution</span>
              </div>
              {/* Reduced heading size for premium feel */}
              <h1 className="font-bebas text-5xl md:text-8xl leading-none tracking-tight uppercase">
                STOP LOSING <br className="hidden md:block" /> <span className="text-[#D0202E]">REAL MONEY</span>
              </h1>
              <p className="text-base md:text-xl text-gray-400 font-medium tracking-tight max-w-xl mx-auto">
                We've analyzed thousands of businesses. We know exactly where your phone isn't ringing. Run the 60-second revenue scan.
              </p>
            </div>

            <div className="max-w-xl mx-auto w-full bg-[#0e121a] p-6 md:p-10 rounded-[2rem] border border-white/5 shadow-2xl relative">
              <form onSubmit={handleAnalyze} className="space-y-6">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-500 pl-1">Target Website URL</label>
                  <input
                    type="url"
                    placeholder="yourbusiness.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 focus:border-[#D0202E] transition-all outline-none text-base placeholder:text-gray-700"
                  />
                </div>
                <button type="submit" className="w-full bg-[#D0202E] hover:bg-[#b01a26] text-white font-black py-5 rounded-2xl uppercase tracking-widest text-base transition-all shadow-xl font-bebas flex items-center justify-center gap-3">
                  RUN REVENUE-SCAN™ <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col font-sans">
        <header className="p-8 border-b border-white/5 flex items-center justify-between">
          <button onClick={() => setStatus("idle")} className="text-[10px] uppercase font-black text-gray-500 hover:text-white transition-colors tracking-widest">← BACK</button>
          <img src="https://arma-agency.us/wp-content/uploads/2026/02/logo.webp" alt="ARMA" className="h-8 w-auto" />
          <div className="w-12"></div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-12">
          <div className="w-20 h-20 rounded-full border-4 border-white/5 border-t-[#D0202E] animate-spin"></div>
          <div className="text-center space-y-6 max-w-lg w-full">
            <h2 className="font-bebas text-5xl md:text-6xl uppercase tracking-tight leading-none">Diagnostic In Progress</h2>
            <div className="space-y-4">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#D0202E] transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-gray-600">
                <span>{Math.round(progress)}% complete</span>
                <span className="text-[#D0202E] animate-pulse">{steps[currentStepIndex]}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#D0202E]/30 pb-20">
      <nav className="border-b border-white/5 p-6 md:p-8 bg-black/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center px-6 md:px-12">
        <button onClick={() => setStatus("idle")} className="text-[10px] uppercase font-black text-gray-500 hover:text-white transition-colors tracking-widest">← BACK</button>
        <img src="https://arma-agency.us/wp-content/uploads/2026/02/logo.webp" alt="ARMA" className="h-6 md:h-8 w-auto" />
        <button onClick={downloadPdf} className="bg-[#D0202E] hover:bg-[#b01a26] text-white px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Download Audit</button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-12 md:py-16 space-y-16 animate-in fade-in duration-700">
        
        {/* Executive Dashboard & Screenshots */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#0e121a] rounded-[2rem] p-8 md:p-12 border-l-[8px] border-[#D0202E] border-t border-b border-r border-white/5 space-y-10">
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-black text-[#D0202E] tracking-[0.5em]">Executive Diagnosis</span>
              <p className="text-xl md:text-2xl font-bold leading-relaxed text-gray-200">{report?.executive_summary}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-white/5">
              <div>
                <span className="text-[10px] uppercase font-black text-gray-500 tracking-[0.3em] block mb-2">Monthly Job Loss</span>
                <p className="font-bebas text-4xl md:text-5xl text-[#D0202E] uppercase leading-none">{report?.total_revenue_leak}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black text-gray-500 tracking-[0.3em] block mb-2">Search Visibility</span>
                <p className="font-bebas text-4xl md:text-5xl text-white uppercase leading-none">{report?.metrics?.organic_traffic?.toLocaleString() || "0"}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black text-gray-500 tracking-[0.3em] block mb-2">Health Index</span>
                <p className="font-bebas text-4xl md:text-5xl text-white uppercase leading-none">{report?.metrics?.performance_score || 0}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#0e121a] rounded-[2rem] p-10 border border-white/5 flex flex-col items-center justify-center space-y-8">
            <div className="relative group w-full">
              <div className="bg-black rounded-2xl overflow-hidden border border-white/10 aspect-[16/9] shadow-2xl">
                {report?.screenshot_url ? <img src={report.screenshot_url} alt="Desktop View" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-800"><Monitor /></div>}
              </div>
              <div className="absolute -bottom-4 -right-4 w-16 md:w-20 aspect-[9/16] bg-black rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                {report?.screenshot_mobile_url ? <img src={report.screenshot_mobile_url} alt="Mobile View" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-800"><Smartphone /></div>}
              </div>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Visual Diagnostic</span>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Multichannel verified</p>
            </div>
          </div>
        </div>

        {/* SEO & Search Performance Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#0e121a] rounded-[2.5rem] p-10 border border-white/5 space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black text-blue-500 tracking-[0.4em]">Search Authority</span>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bebas text-3xl uppercase text-white">Brand Visibility Rank</h4>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Organic position for business name</p>
            </div>
            <div className="flex items-end gap-3">
              <p className="font-bebas text-7xl text-white leading-none tracking-tighter">
                {typeof report?.local_stats?.brand_rank === "number" ? `#${report.local_stats.brand_rank}` : report?.local_stats?.brand_rank || "???"}
              </p>
              <span className={cn("text-[10px] font-black uppercase px-2 py-1 rounded mb-2", report?.local_stats?.brand_rank === 1 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                {report?.local_stats?.brand_rank === 1 ? "Dominating" : "Losing Ground"}
              </span>
            </div>
          </div>

          <div className="bg-[#0e121a] rounded-[2.5rem] p-10 border border-white/5 space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black text-yellow-500 tracking-[0.4em]">Map Pack Status</span>
              <Map className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bebas text-3xl uppercase text-white">Local Pack Presence</h4>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Presence in Google 3-Pack</p>
            </div>
            <div className="flex items-center gap-6">
              <div className={cn("px-6 py-4 rounded-2xl border font-bebas text-3xl uppercase tracking-widest", report?.local_stats?.in_local_pack ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500")}>
                {report?.local_stats?.in_local_pack ? "DETECTED" : "MISSING"}
              </div>
              {!report?.local_stats?.in_local_pack && (
                <p className="text-[10px] text-red-500 font-bold uppercase leading-tight max-w-[150px]">CRITICAL: YOU ARE MISSING FROM THE GOOGLE MAP PACK.</p>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Issue Breakdown */}
        <div className="space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[10px] uppercase font-black text-[#D0202E] tracking-[0.4em]">Proprietary Revenue-Scan™</span>
            <h3 className="font-bebas text-4xl md:text-5xl uppercase tracking-tight">Critical Bottlenecks</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {report?.issues.slice(0, 8).map((issue: any, i: number) => (
              <div key={i} className="bg-[#0e121a] rounded-[2rem] p-8 md:p-10 border border-white/5 hover:border-[#D0202E]/30 transition-all group flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <span className="font-bebas text-2xl text-[#D0202E]">0{i + 1}</span>
                    <h4 className="font-bebas text-xl md:text-2xl uppercase tracking-tight leading-none">{issue.title}</h4>
                  </div>
                  <span className={cn("text-[8px] font-black uppercase px-2 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20")}>{issue.severity}</span>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-black text-gray-600 tracking-widest">The Problem</span>
                    <p className="text-gray-200 text-sm md:text-base font-medium leading-relaxed">{issue.problem}</p>
                  </div>
                  <div className="bg-red-500/[0.03] p-6 rounded-2xl border border-red-500/10">
                    <span className="text-[9px] uppercase font-black text-[#D0202E] tracking-widest mb-2 block">Direct Monthly Loss</span>
                    <p className="text-gray-200 text-sm md:text-base font-bold italic">&quot;{issue.impact}&quot;</p>
                  </div>
                  <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10">
                    <span className="text-[9px] uppercase font-black text-white tracking-widest mb-2 block">ARMA Strategic Solution</span>
                    <p className="text-white text-sm md:text-base font-bold leading-tight">{issue.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA Banner */}
        <div className="bg-[#D0202E] rounded-[2.5rem] p-12 text-center space-y-10 flex flex-col justify-center relative overflow-hidden group">
          <div className="relative z-10 space-y-8">
            <h2 className="font-bebas text-5xl md:text-7xl text-white uppercase tracking-tighter leading-none">Recover Your Market.</h2>
            <p className="text-lg md:text-xl font-medium text-white/90 leading-relaxed max-w-2xl mx-auto">{report?.growth_potential_cta}</p>
            <div className="pt-4">
              <button onClick={downloadPdf} className="bg-white text-[#D0202E] font-black px-12 py-4 rounded-2xl uppercase tracking-widest shadow-2xl hover:scale-105 transition-all text-lg font-bebas">Generate Final Audit</button>
            </div>
          </div>
        </div>

        {/* Outreach / Appointment Section */}
        <div className="bg-[#0e121a] rounded-[3rem] p-8 md:p-16 border border-white/5 space-y-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-4 text-left">
              <span className="text-[10px] uppercase font-black text-[#D0202E] tracking-[0.4em]">Proprietary action plan</span>
              <h3 className="font-bebas text-5xl md:text-7xl uppercase tracking-wider leading-none">Book Strategic <br />Appointment</h3>
              <p className="text-gray-500 text-base md:text-lg max-w-md uppercase font-bold tracking-tight">Send this diagnosis to our strategy team to reclaim your lost revenue.</p>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <button onClick={copyEmail} className="items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black px-10 py-5 rounded-2xl uppercase tracking-widest border border-white/10 transition-all flex w-full">
                <Calendar className="w-4 h-4 text-[#D0202E]" /> Copy Appointment Request
              </button>
              <a href="mailto:contact@arma-agency.us" className="items-center justify-center gap-3 bg-[#D0202E] hover:bg-[#b01a26] text-white text-[10px] font-black px-10 py-5 rounded-2xl uppercase tracking-widest transition-all flex w-full">
                <Mail className="w-4 h-4" /> Direct Email Agency
              </a>
            </div>
          </div>
          <div className="bg-black/40 rounded-[2.5rem] p-10 md:p-12 border border-white/5 relative group">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Target className="w-32 h-32" /></div>
            <pre className="whitespace-pre-wrap text-gray-400 text-base md:text-xl font-sans leading-relaxed italic">{report?.email_outreach}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
