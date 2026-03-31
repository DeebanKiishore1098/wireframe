"use client";

import { useState, useEffect } from "react";

const STAGES = [
  "Analyzing Requirement Document...",
  "Extracting UI/UX Patterns...",
  "Generating Wireframe Components...",
  "Structuring Dashboard Layout...",
  "Finalizing Code Output..."
];

export default function Home() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [format, setFormat] = useState("dashboard-wireframe");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setCurrentStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
      }, 3000); // Change stage every 3 seconds
    } else {
      setCurrentStageIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setLoading(false);
      setAbortController(null);
      setStatus({ type: "info", message: "Execution stopped by user." });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setStatus({ type: "", message: "" });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      const fileExt = selectedFile.name.split('.').pop().toLowerCase();
      if (['pdf', 'docx'].includes(fileExt)) {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setStatus({ type: "", message: "" });
      } else {
        setStatus({ type: "error", message: "Only .pdf and .docx files are allowed." });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setStatus({ type: "error", message: "Please select a file first." });
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    setStatus({ type: "info", message: "" });

    try {
      const formData = new FormData();
      formData.append("BRD", file);
      formData.append("generatorType", format);

      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || "/api/webhook";

      const response = await fetch(webhookUrl, {
        method: "POST",
        body: formData,
        signal: controller.signal
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          // Handle JSON (Dashboard HTML)
          const data = await response.json();
          const htmlContent = data[0]?.html || data?.html;

          if (htmlContent) {
            const blob = new Blob([htmlContent], { type: "text/html" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "generated-dashboard.html";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setStatus({ type: "success", message: "Dashboard generated and downloaded successfully!" });
          } else {
            setStatus({ type: "error", message: "No HTML content found in the response." });
          }
        } else {
          // Handle Binary (PDF/PPTX)
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          
          // Determine filename based on generator type
          const filename = format === "application-wireframe" ? "wireframe.pptx" : 
                          format === "dashboard-pptx" ? "dashboard.pptx" : 
                          format === "application-pptx" ? "presentation.pptx" : 
                          "output.html";
                          
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          const typeLabel = (format === "application-wireframe" || format === "dashboard-pptx" || format === "application-pptx") 
                          ? "PPTX" : "File";
          setStatus({ type: "success", message: `${typeLabel} generated and downloaded successfully!` });
        }
      } else {
        const errorData = await response.text();
        setStatus({ type: "error", message: `Error: ${response.status} - ${errorData}` });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error("Submission error:", error);
        setStatus({ type: "error", message: "Failed to connect to the generation engine. Please try again." });
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${darkMode
      ? "bg-[#0a192f] text-white"
      : "bg-[#f0f4f8] text-gray-900"
      }`}>
      {/* Background Orbs/Glows (Vibrant & Professional) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] transition-colors duration-700 ${darkMode ? "bg-blue-900/40" : "bg-blue-200"}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-colors duration-700 ${darkMode ? "bg-indigo-900/30" : "bg-indigo-100"}`} />
        <div className={`absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full blur-[100px] transition-colors duration-700 ${darkMode ? "bg-purple-900/20" : "bg-purple-50"}`} />

        {/* High-Contrast Full Background Chart Doodles */}
        <div className={`absolute inset-0 transition-opacity duration-700 ${darkMode ? "opacity-40" : "opacity-30"}`}>
          {/* Top Center - Network Graph */}
          <div className="absolute top-[2%] left-[45%] animate-pulse delay-700 mix-blend-normal blur-[0.5px]">
            <svg width="200" height="120" viewBox="0 0 100 60" fill="none" stroke={darkMode ? "#38bdf8" : "#2563eb"} strokeWidth="1.5">
              <circle cx="20" cy="30" r="3" fill="currentColor" />
              <circle cx="50" cy="15" r="3" fill="currentColor" />
              <circle cx="50" cy="45" r="3" fill="currentColor" />
              <circle cx="80" cy="30" r="3" fill="currentColor" />
              <line x1="20" y1="30" x2="50" y2="15" />
              <line x1="20" y1="30" x2="50" y2="45" />
              <line x1="50" y1="15" x2="80" y2="30" />
              <line x1="50" y1="45" x2="80" y2="30" />
              <line x1="50" y1="15" x2="50" y2="45" />
            </svg>
          </div>

          {/* Top Leftish - Pulse Waveform */}
          <div className="absolute top-[12%] left-[15%] opacity-60 rotate-[-10deg]">
            <svg width="250" height="60" viewBox="0 0 120 30" fill="none" stroke={darkMode ? "#fb7185" : "#e11d48"} strokeWidth="2" strokeLinecap="round">
              <path d="M0 15 H20 L25 5 L35 25 L40 15 H60 L65 10 L75 20 L80 15 H120" />
            </svg>
          </div>

          {/* Top Rightish - Geometric Blueprint */}
          <div className="absolute top-[15%] right-[20%] opacity-50 rotate-[5deg]">
            <svg width="150" height="150" viewBox="0 0 100 100" fill="none" stroke={darkMode ? "#94a3b8" : "#475569"} strokeWidth="1">
              <rect x="10" y="10" width="80" height="80" />
              <circle cx="50" cy="50" r="40" />
              <line x1="10" y1="10" x2="90" y2="90" />
              <line x1="90" y1="10" x2="10" y2="90" />
            </svg>
          </div>

          {/* Top Left - Bar Chart */}
          <div className="absolute top-[5%] left-[2%] animate-pulse mix-blend-normal blur-[0.5px] rotate-[-5deg]">
            <svg width="180" height="180" viewBox="0 0 120 120" fill="none" stroke={darkMode ? "#38bdf8" : "#2563eb"} strokeWidth="3" strokeLinecap="round">
              <path d="M10 110 H110 M10 110 V10" />
              <rect x="25" y="50" width="20" height="60" rx="3" fill={darkMode ? "#3b82f633" : "#2563eb1a"} />
              <rect x="55" y="30" width="20" height="80" rx="3" fill={darkMode ? "#3b82f633" : "#2563eb1a"} />
              <rect x="85" y="70" width="20" height="40" rx="3" fill={darkMode ? "#3b82f633" : "#2563eb1a"} />
            </svg>
          </div>

          {/* Top Right - Line Chart */}
          <div className="absolute top-[8%] right-[5%] animate-pulse delay-500 mix-blend-normal blur-[0.5px] rotate-[10deg]">
            <svg width="220" height="150" viewBox="0 0 140 100" fill="none" stroke={darkMode ? "#818cf8" : "#4f46e5"} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 80 L40 40 L70 60 L100 10 L130 30" />
              <circle cx="40" cy="40" r="5" fill={darkMode ? "#818cf8" : "#4f46e5"} />
              <circle cx="100" cy="10" r="5" fill={darkMode ? "#818cf8" : "#4f46e5"} />
            </svg>
          </div>

          {/* Center Left - Pie Chart */}
          <div className="absolute top-[45%] left-[-2%] animate-bounce [animation-duration:15s] mix-blend-normal blur-[0.5px] rotate-[20deg]">
            <svg width="140" height="140" viewBox="0 0 80 80" fill="none" stroke={darkMode ? "#c084fc" : "#9333ea"} strokeWidth="3">
              <circle cx="40" cy="40" r="35" fill={darkMode ? "#a855f722" : "#9333ea11"} />
              <path d="M40 40 L40 5 M40 40 L70 55" />
            </svg>
          </div>

          {/* Center Right - Scatter Plot */}
          <div className="absolute top-[40%] right-[-3%] animate-pulse delay-1000 mix-blend-normal blur-[0.5px]">
            <svg width="180" height="180" viewBox="0 0 100 100" stroke={darkMode ? "#f472b6" : "#db2777"} strokeWidth="5">
              <circle cx="20" cy="20" r="4" fill="currentColor" />
              <circle cx="50" cy="50" r="4" fill="currentColor" />
              <circle cx="80" cy="80" r="4" fill="currentColor" />
              <circle cx="20" cy="80" r="4" fill="currentColor" />
              <circle cx="80" cy="20" r="4" fill="currentColor" />
            </svg>
          </div>

          {/* Bottom Left - Flowchart */}
          <div className="absolute bottom-[5%] left-[10%] animate-pulse delay-200 mix-blend-normal blur-[0.5px] rotate-[-15deg]">
            <svg width="160" height="120" viewBox="0 0 120 80" fill="none" stroke={darkMode ? "#fbbf24" : "#d97706"} strokeWidth="3">
              <rect x="10" y="10" width="30" height="20" rx="4" />
              <path d="M40 20 H60" markerEnd="url(#arrow)" />
              <rect x="60" y="10" width="30" height="20" rx="4" />
              <path d="M75 30 V50" />
              <rect x="60" y="50" width="30" height="20" rx="4" />
            </svg>
          </div>

          {/* Bottom Right - Donut Chart */}
          <div className="absolute bottom-[8%] right-[8%] animate-spin [animation-duration:20s] mix-blend-normal blur-[0.5px]">
            <svg width="120" height="120" viewBox="0 0 100 100" fill="none" stroke={darkMode ? "#2dd4bf" : "#0d9488"} strokeWidth="10">
              <circle cx="50" cy="50" r="40" strokeDasharray="180 100" />
            </svg>
          </div>

          {/* Additional Floating Elements for "Full Coverage" */}
          <div className="absolute top-[25%] left-[30%] opacity-40">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className={darkMode ? "text-blue-500" : "text-blue-600"}><path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7z" /></svg>
          </div>
          <div className="absolute bottom-[30%] right-[35%] opacity-40">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor" className={darkMode ? "text-purple-500" : "text-purple-600"}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4.1h-2v-5.4h2v5.4z" /></svg>
          </div>
        </div>
      </div>

      {/* Header with Theme Toggle */}
      <header className="flex justify-end items-center p-6 relative z-10 w-full">

        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg ${darkMode ? "bg-yellow-400 text-gray-900" : "bg-indigo-600 text-white"
            }`}
          aria-label="Toggle Theme"
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          )}
        </button>
      </header>

      <main className="flex min-h-[calc(100vh-100px)] items-center justify-center p-4 lg:p-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl">
          {/* Main Generator Card */}
          <div className={`flex-1 rounded-2xl border transition-all duration-500 shadow-2xl p-8 md:p-12 ${darkMode
            ? "bg-[#112240]/80 border-blue-900/50 backdrop-blur-md"
            : "bg-white/90 border-gray-100 backdrop-blur-md"
            }`}>
            <div className="mb-10 text-left">
              <h1 className="text-4xl md:text-5xl tracking-tight font-medium flex items-center">
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Intelli</span>
                <span className={`ml-1 px-3 py-1 rounded-lg text-white font-medium bg-indigo-600 shadow-lg shadow-indigo-500/20`}>
                  frame
                </span>
              </h1>
              <p className={`mt-4 text-sm md:text-base font-light ${darkMode ? "text-blue-300" : "text-gray-500"}`}>
                Engineered for generating premium interactive High-Fidelity Visual Mockups
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className={`block text-sm font-semibold uppercase tracking-wider ${darkMode ? "text-blue-300" : "text-gray-500"}`}>
                  </label>
                <div className="flex gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormat("dashboard-wireframe")}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${format === "dashboard-wireframe" 
                      ? (darkMode ? "bg-blue-600 border-blue-400 text-white" : "bg-indigo-600 border-indigo-500 text-white")
                      : (darkMode ? "bg-transparent border-blue-900/30 text-blue-300" : "bg-white border-gray-200 text-gray-600")
                    }`}
                  >
                    HTML Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("application-wireframe")}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${format === "application-wireframe" 
                      ? (darkMode ? "bg-blue-600 border-blue-400 text-white" : "bg-indigo-600 border-indigo-500 text-white")
                      : (darkMode ? "bg-transparent border-blue-900/30 text-blue-300" : "bg-white border-gray-200 text-gray-600")
                    }`}
                  >
                    PDF Wireframe
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("dashboard-pptx")}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${format === "dashboard-pptx" 
                      ? (darkMode ? "bg-blue-600 border-blue-400 text-white" : "bg-indigo-600 border-indigo-500 text-white")
                      : (darkMode ? "bg-transparent border-blue-900/30 text-blue-300" : "bg-white border-gray-200 text-gray-600")
                    }`}
                  >
                    PPTX Slide Deck
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <label className={`block text-sm font-semibold uppercase tracking-wider ${darkMode ? "text-blue-300" : "text-gray-500"}`}>
                  YOUR DOCUMENT HERE 👇 <span className="text-red-500">*</span>
                </label>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative group flex items-center w-full border rounded-xl overflow-hidden transition-all duration-300 ${isDragging
                    ? (darkMode ? "bg-blue-900/40 border-blue-400 scale-[1.02]" : "bg-indigo-50 border-indigo-500 scale-[1.02]")
                    : (darkMode
                      ? "bg-[#1d3557]/50 border-blue-800 group-hover:border-blue-500"
                      : "bg-gray-50 border-gray-200 group-hover:border-indigo-400")
                    }`}
                >
                  <label className="flex items-center w-full cursor-pointer p-4">
                    <span className={`px-4 py-2 rounded-lg text-sm font-bold mr-4 transition-colors ${darkMode
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}>
                      {isDragging ? "Drop Here" : "Choose File"}
                    </span>
                    <span className={`text-sm truncate flex-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {mounted ? (fileName || "Allowed: .pdf, .docx") : "Allowed: .pdf, .docx"}
                    </span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.docx"
                      className="hidden"
                    />
                  </label>
                  {file && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                        setFileName("");
                      }}
                      className={`p-2 mr-2 rounded-full transition-all duration-200 hover:scale-110 ${darkMode
                        ? "text-red-400 hover:bg-red-400/20"
                        : "text-red-500 hover:bg-red-50"
                        }`}
                      aria-label="Remove File"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 px-6 text-white text-lg font-bold rounded-xl transition-all duration-300 shadow-lg transform hover:-translate-y-1 ${loading
                    ? "bg-gray-500 cursor-not-allowed opacity-70"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    "Generate Wireframe"
                  )}
                </button>

                {loading && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${darkMode ? "text-blue-400" : "text-indigo-600"}`}>
                        {STAGES[currentStageIndex]}
                      </p>
                      <button
                        type="button"
                        onClick={handleStop}
                        className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md border transition-all ${
                          darkMode 
                          ? "border-red-500/50 text-red-400 hover:bg-red-500/20" 
                          : "border-red-200 text-red-600 hover:bg-red-50"
                        }`}
                      >
                        Stop Execution
                      </button>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${((currentStageIndex + 1) / STAGES.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {status.message && !loading && (
                  <div className={`p-4 rounded-lg text-center text-sm font-semibold ${status.type === "error"
                    ? "bg-red-100 text-red-600 border border-red-200"
                    : "bg-green-100 text-green-600 border border-green-200"
                    }`}>
                    {status.message}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Instructions Sidebar */}
          <div className={`w-full lg:w-80 rounded-2xl border transition-all duration-500 p-8 shadow-xl flex flex-col justify-center ${darkMode
            ? "bg-[#112240]/60 border-blue-900/30 backdrop-blur-sm"
            : "bg-white/70 border-gray-100 backdrop-blur-sm"
            }`}>
            <div className="space-y-8">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-indigo-100 text-indigo-600"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <h2 className={`font-bold uppercase tracking-[0.1em] text-sm ${darkMode ? "text-blue-200" : "text-gray-700"}`}>Note:</h2>
              </div>

              <div className="space-y-6">
                <div className="flex space-x-4">
                  <div className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full ${darkMode ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" : "bg-indigo-500"}`} />
                  <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Upload your document with Lead / Prospect / Client details like website information, Scope of the initiative, Objective of the Dashboard, KPI list (If identified) or a Project Business Requirement Document.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <div className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full ${darkMode ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" : "bg-indigo-500"}`} />
                  <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Your final design will be delivered as an interactive visual mockup in .HTML format and will be auto-downloaded.
                  </p>
                </div>
              </div>

              <div className={`pt-6 border-t ${darkMode ? "border-blue-900/40" : "border-gray-100"}`}>
                <div className={`flex items-center text-xs font-medium space-x-2 ${darkMode ? "text-blue-400/70" : "text-gray-400"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <span>Secure Processing Ensured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className={`absolute bottom-6 w-full text-center text-xs uppercase tracking-[0.2em] font-medium transition-colors duration-500 ${darkMode ? "text-blue-900/60" : "text-gray-400"
        }`}>
        systech intelligent systems &copy; {mounted ? new Date().getFullYear() : "2026"}
      </footer>
    </div>
  );
}




