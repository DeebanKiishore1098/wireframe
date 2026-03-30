"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${darkMode
      ? "bg-[#0a192f] text-white"
      : "bg-[#f0f4f8] text-gray-900"
      }`}>
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] transition-colors duration-700 ${darkMode ? "bg-blue-900/40" : "bg-blue-200"}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-colors duration-700 ${darkMode ? "bg-indigo-900/30" : "bg-indigo-100"}`} />
      </div>

      <header className="flex justify-between items-center p-8 relative z-10 w-full">
        <h1 className="text-3xl tracking-tight font-medium flex items-center">
          <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Intelli</span>
          <span className={`ml-1 px-3 py-1 rounded-lg text-white font-medium bg-indigo-600 shadow-lg shadow-indigo-500/20`}>
            frame
          </span>
        </h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg ${darkMode ? "bg-yellow-400 text-gray-900" : "bg-indigo-600 text-white"}`}
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          )}
        </button>
      </header>

      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 relative z-10">
        <div className="text-center mb-16 max-w-2xl">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">Select Generator Path</h2>
          <p className={`text-lg transition-colors ${darkMode ? "text-blue-300" : "text-gray-500"}`}>Choose the type of wireframe journey you want to embark on today.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full">
          {/* Dashboard Path */}
          <Link href="/dashboard" className="group">
            <div className={`h-full p-10 rounded-3xl border transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl flex flex-col items-center text-center ${darkMode
              ? "bg-[#112240]/80 border-blue-900/50 backdrop-blur-md group-hover:border-blue-400"
              : "bg-white/90 border-gray-100 backdrop-blur-md group-hover:border-indigo-400"
              }`}>
              <div className={`p-6 rounded-2xl mb-8 transition-colors ${darkMode ? "bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Dashboard Wireframe</h3>
              <p className={`text-sm leading-relaxed ${darkMode ? "text-blue-300/80" : "text-gray-500"}`}>Generate interactive, high-fidelity business dashboards and analytical visual mockups from your requirements.</p>
            </div>
          </Link>

          {/* Application Path */}
          <Link href="/wireframe" className="group">
            <div className={`h-full p-10 rounded-3xl border transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl flex flex-col items-center text-center ${darkMode
              ? "bg-[#112240]/80 border-blue-900/50 backdrop-blur-md group-hover:border-blue-400"
              : "bg-white/90 border-gray-100 backdrop-blur-md group-hover:border-indigo-400"
              }`}>
              <div className={`p-6 rounded-2xl mb-8 transition-colors ${darkMode ? "bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><circle cx="12" cy="12" r="3" /></svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Application Wireframe</h3>
              <p className={`text-sm leading-relaxed ${darkMode ? "text-blue-300/80" : "text-gray-500"}`}>Create professional multi-page application mockups in PDF format, focusing on user journeys and business impact.</p>
            </div>
          </Link>
        </div>
      </main>

      <footer className={`absolute bottom-6 w-full text-center text-xs uppercase tracking-[0.2em] font-medium transition-colors duration-500 ${darkMode ? "text-blue-900/60" : "text-gray-400"}`}>
        systech intelligent systems &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
