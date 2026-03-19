"use client";

import { useState } from "react";
import FileUploader from "@/components/FileUploader";
import { parseSTLAndGetVolume } from "@/lib/stlParser";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [material, setMaterial] = useState("PLA");
  const [infill, setInfill] = useState(15);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const processFile = async () => {
    if (!file) return;
    setIsCalculating(true);
    try {
      const volumeCm3 = await parseSTLAndGetVolume(file);
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volumeCm3, material, infillPercent: infill }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      alert("Error calculating price");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8 space-y-6">
        <h1 className="text-2xl font-black text-center text-gray-800">3D Print Quote</h1>

        <FileUploader onFileSelect={setFile} selectedFile={file} />

        {/* Material Selection */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-600 uppercase">Material</label>
          <div className="grid grid-cols-3 gap-2">
            {["PLA", "ABS", "PETG"].map((m) => (
              <button
                key={m}
                onClick={() => setMaterial(m)}
                className={`py-2 rounded-lg border-2 font-bold transition-all ${
                  material === m ? "border-blue-600 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-400"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Infill Selection */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-600 uppercase">Infill Density (Gyroid)</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Minimal", val: 5 },
              { label: "Normal", val: 15 },
              { label: "Hard", val: 40 },
            ].map((i) => (
              <button
                key={i.val}
                onClick={() => setInfill(i.val)}
                className={`py-2 flex flex-col items-center rounded-lg border-2 transition-all ${
                  infill === i.val ? "border-blue-600 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-400"
                }`}
              >
                <span className="text-xs">{i.label}</span>
                <span className="font-bold">{i.val}%</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={processFile}
          disabled={!file || isCalculating}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 disabled:bg-gray-300 transition-all shadow-lg"
        >
          {isCalculating ? "Calculating..." : "Get Price"}
        </button>

        {/* Results Block */}
        {result && (
          <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-2xl animate-in fade-in slide-in-from-bottom-4 space-y-3 text-blue-900">
            
            <div className="flex justify-between text-sm text-blue-700 border-b border-blue-200 pb-3">
              <span>Est. Weight: <span className="font-bold">{result.weightGrams.toFixed(1)}g</span></span>
              <span>Est. Time: <span className="font-bold">
                {result.estimatedHours < 1 
                  ? `${Math.round(result.estimatedHours * 60)} min` 
                  : `${result.estimatedHours.toFixed(1)} hrs`}
              </span></span>
            </div>

            <div className="space-y-1 pt-2">
              <div className="flex justify-between">
                <span>Price:</span>
                <span>{result.netPrice.toFixed(2)}€</span>
              </div>

              {/* Conditionally show VAT Breakdown */}
              {result.hasVat && (
                <>
                  <div className="flex justify-between text-sm text-blue-700">
                    <span>VAT ({result.vatPercentage}%):</span>
                    <span>{result.vatAmount.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-2xl font-black pt-3 mt-2 border-t border-blue-200">
                    <span>Total (Inc. VAT):</span>
                    <span>{result.totalPriceWithVat.toFixed(2)}€</span>
                  </div>
                </>
              )}

              {/* Show simple total if no VAT */}
              {!result.hasVat && (
                <div className="flex justify-between text-2xl font-black pt-3 mt-2 border-t border-blue-200">
                  <span>Estimated Total:</span>
                  <span>{result.netPrice.toFixed(2)}€</span>
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </main>
  );
}