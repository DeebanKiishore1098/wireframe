"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus({ type: "", message: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setStatus({ type: "error", message: "Please select a file first." });
      return;
    }

    setLoading(true);
    setStatus({ type: "info", message: "Uploading and processing..." });

    try {
      const formData = new FormData();
      formData.append("BRD", file);

      const response = await fetch("http://localhost:5678/webhook/generate-dashboard", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        console.log("Response Content-Type:", contentType);

        let htmlContent = null;

        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          htmlContent = data[0]?.html || data?.html;
        } else {
          // If it's not JSON, it might be the HTML directly
          const text = await response.text();
          if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
            htmlContent = text;
          } else {
            console.error("Unexpected response format:", text);
            throw new Error("Received unexpected response format from server.");
          }
        }

        if (htmlContent) {
          // Create a blob from the HTML content
          const blob = new Blob([htmlContent], { type: "text/html" });
          const url = window.URL.createObjectURL(blob);

          // Create a temporary link and trigger download
          const link = document.createElement("a");
          link.href = url;
          link.download = "generated-dashboard.html";
          document.body.appendChild(link);
          link.click();

          // Cleanup
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          setStatus({ type: "success", message: "Dashboard generated and downloaded successfully!" });
        } else {
          setStatus({ type: "error", message: "No HTML content found in the response." });
        }
      } else {
        const errorData = await response.text();
        setStatus({ type: "error", message: `Error: ${response.status} - ${errorData}` });
      }
    } catch (error) {
      console.error("Submission error:", error);
      setStatus({ type: "error", message: "Failed to connect to n8n webhook. Make sure n8n is running." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-xl bg-white rounded-xl border border-gray-200 shadow-sm p-8 md:p-12">
        <h1 className="text-2xl md:text-3xl text-[#5F6368] text-center mb-10 font-medium">
          AI Wireframe Generator
        </h1>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-[#5F6368]">
              BRD <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center w-full border border-[#D1D5DB] rounded-md p-2 bg-white">
              <input
                type="file"
                onChange={handleFileChange}
                required
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-1 file:px-3
                  file:rounded file:border file:border-gray-600
                  file:text-sm file:font-normal
                  file:bg-[#EFEFEF] file:text-black
                  hover:file:bg-gray-200
                  cursor-pointer
                  focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 text-white text-lg font-bold rounded-lg transition-colors ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#FF6A5A] hover:bg-[#FF5A4A]"
                }`}
            >
              {loading ? "Processing..." : "Submit"}
            </button>

            {status.message && (
              <p
                className={`text-center text-sm font-medium ${status.type === "error" ? "text-red-500" : status.type === "success" ? "text-green-500" : "text-blue-500"
                  }`}
              >
                {status.message}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}



