"use client";

import { useState, useEffect } from "react";

const STAGES = [
  "Analyzing Requirement Document...",
  "Creating Application Brief...",
  "Designing User Journeys...",
  "Generating PPTX Wireframes...",
  "Finalizing Presentation Output..."
];

export default function ApplicationWireframe() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [abortController, setAbortController] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setCurrentStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
      }, 3000);
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
      setStatus({ type: "info", message: "Generation stopped by user." });
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
      formData.append("generatorType", "application-wireframe");

      const webhookUrl = "/api/webhook";

      const response = await fetch(webhookUrl, {
        method: "POST",
        body: formData,
        signal: controller.signal
      });

      if (response.ok) {
        // PPTX Handling
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `wireframe_${Date.now()}.pptx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setStatus({ type: "success", message: "Application wireframe generated and downloaded successfully!" });
      } else {
        const errorData = await response.text();
        setStatus({ type: "error", message: `Error: ${response.status} - ${errorData}` });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error("Submission error:", error);
        setStatus({ type: "error", message: "Failed to connect to the generator service." });
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${darkMode
      ? "bg-[#0a192f] text-white"
      : "bg-[#f0f4f8] text-gray-900"
      }`}>
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] transition-colors duration-700 ${darkMode ? "bg-indigo-900/40" : "bg-blue-200"}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-colors duration-700 ${darkMode ? "bg-blue-900/30" : "bg-indigo-100"}`} />
      </div>

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
          <div className={`flex-1 rounded-2xl border transition-all duration-500 shadow-2xl p-8 md:p-12 ${darkMode
            ? "bg-[#112240]/80 border-blue-900/50 backdrop-blur-md"
            : "bg-white/90 border-gray-100 backdrop-blur-md"
            }`}>
            <div className="mb-10 text-left">
              <h1 className="text-4xl md:text-5xl tracking-tight font-medium flex items-center">
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">App</span>
                <span className={`ml-1 px-3 py-1 rounded-lg text-white font-medium bg-indigo-600 shadow-lg shadow-indigo-500/20`}>
                  Wireframe
                </span>
              </h1>
              <p className={`mt-4 text-sm md:text-base font-light ${darkMode ? "text-blue-300" : "text-gray-500"}`}>
                High-fidelity multi-slide application mockups exported as editable PPTX presentations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className={`block text-sm font-semibold uppercase tracking-wider ${darkMode ? "text-blue-300" : "text-gray-500"}`}>
                  APPLICATION SPECIFICATION 👇 <span className="text-red-500">*</span>
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
                      {fileName || "Accepted formats: .pdf, .docx"}
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
                      onClick={() => { setFile(null); setFileName(""); }}
                      className={`p-2 mr-2 rounded-full transition-all duration-200 hover:scale-110 ${darkMode ? "text-red-400 hover:bg-red-400/20" : "text-red-500 hover:bg-red-50"}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      <span>{STAGES[currentStageIndex]}</span>
                    </div>
                  ) : (
                    "Generate Application PPTX"
                  )}
                </button>

                {loading && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${darkMode ? "text-blue-300" : "text-indigo-600"}`}>
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

          <div className={`w-full lg:w-80 rounded-2xl border transition-all duration-500 p-8 shadow-xl flex flex-col justify-center ${darkMode
            ? "bg-[#112240]/60 border-blue-900/30 backdrop-blur-sm"
            : "bg-white/70 border-gray-100 backdrop-blur-sm"
            }`}>
            <div className="space-y-8">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-blue-100 text-blue-600"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <h2 className={`font-bold uppercase tracking-[0.1em] text-sm ${darkMode ? "text-indigo-200" : "text-gray-700"}`}>PPTX Generator Note:</h2>
              </div>

              <div className="space-y-6">
                <div className="flex space-x-4">
                  <div className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full ${darkMode ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]" : "bg-blue-500"}`} />
                  <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Please upload the requirement document in **.pdf** or **.docx** format. Ensure it contains the application features and business goals.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <div className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full ${darkMode ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]" : "bg-blue-500"}`} />
                  <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    The wireframe output will be generated as a multi-slide high-fidelity presentation and will be **autodownloaded in .pptx format**.
                  </p>
                </div>
              </div>

              <div className={`pt-6 border-t ${darkMode ? "border-indigo-900/40" : "border-gray-100"}`}>
                <div className={`flex items-center text-xs font-medium space-x-2 ${darkMode ? "text-indigo-400/70" : "text-blue-400"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <span>Premium PPTX Generation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className={`absolute bottom-6 w-full text-center text-xs uppercase tracking-[0.2em] font-medium transition-colors duration-500 ${darkMode ? "text-indigo-900/60" : "text-gray-400"}`}>
        systech intelligent systems &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
