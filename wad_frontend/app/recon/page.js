"use client";

import { useState } from "react";

const reconTools = {
  passive: [
    "Subfinder",
    "Amass (Passive Mode)",
    "Assetfinder",
    "Findomain",
    "Chaos Search",
    "DNSDumpster",
  ],
  active: [
    "FFUF",
    "Nmap",
    "Amass (Active Mode)",
    "HTTPX",
    "Naabu",
    "Dirsearch",
    "Gobuster",
  ],
};

export default function ReconDashboard() {
  const [mode, setMode] = useState(null);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold">Recon Dashboard</h1>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => setMode("passive")}
          className={`
            px-4 py-2 rounded-lg border transition
            ${mode === "passive" ? "bg-green-600 text-white" : "hover:bg-muted"}
          `}
        >
          Passive Recon
        </button>

        <button
          onClick={() => setMode("active")}
          className={`
            px-4 py-2 rounded-lg border transition
            ${mode === "active" ? "bg-red-600 text-white" : "hover:bg-muted"}
          `}
        >
          Active Recon
        </button>
      </div>

      {/* Tools List */}
      <div className="mt-6">
        {!mode && (
          <p className="text-muted-foreground">
            Select a recon mode to view tools.
          </p>
        )}

        {mode && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold capitalize">
              {mode} Recon Tools
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {reconTools[mode].map((tool) => (
                <div
                  key={tool}
                  className="border rounded-lg p-3 hover:shadow-sm transition bg-background"
                >
                  {tool}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
