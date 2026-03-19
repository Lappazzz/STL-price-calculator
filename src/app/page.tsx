"use client";

import { useState, DragEvent, ChangeEvent } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<{ volume: number; price?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- UI Handlers ---
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setError(null);
    setResult(null);
    if (!selectedFile.name.toLowerCase().endsWith(".stl")) {
      setError("Please upload a valid .stl file.");
      return;
    }
    setFile(selectedFile);
  };

  // --- The Core Math: Calculate Volume Locally ---
  const calculateVolume = (geometry: THREE.BufferGeometry) => {
    let sum = 0;
    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();
    const p3 = new THREE.Vector3();
    const position = geometry.attributes.position;
    const faces = position.count / 3;

    for (let i = 0; i < faces; i++) {
      p1.fromBufferAttribute(position, i * 3 + 0);
      p2.fromBufferAttribute(position, i * 3 + 1);
      p3.fromBufferAttribute(position, i * 3 + 2);
      sum += p1.dot(p2.cross(p3)) / 6.0;
    }
    return Math.abs(sum); // Volume in mm³
  };

  // --- Processing the File ---
  const processFile = async () => {
    if (!file) return;
    setIsCalculating(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loader = new STLLoader();
      const geometry = loader.parse(arrayBuffer);
      
      const volumeMm3 = calculateVolume(geometry);
      const volumeCm3 = volumeMm3 / 1000; // Convert mm³ to cm³

      setResult({ volume: volumeCm3 });

      // TODO: Send this volumeCm3 to our secure backend API route!
      // const response = await fetch('/api/calculate', { ... })
      
    } catch (err) {
      console.error(err);
      setError("Failed to parse the STL file. It might be corrupted.");
    } finally {
      setIsCalculating(false);
    }
  };

  // --- Render UI ---
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-900">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">STL Price Calculator</h1>
          <p className="text-gray-500">Upload your 3D model for an instant, private quote.</p>
        </div>

        {/* Drag & Drop Zone */}
        <div 
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
            ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 bg-gray-50"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <input 
            type="file" 
            id="fileInput" 
            accept=".stl" 
            className="hidden" 
            onChange={handleFileChange} 
          />
          <div className="text-gray-600">
            {file ? (
              <p className="font-semibold text-blue-600">{file.name}</p>
            ) : (
              <p>Drag and drop your <span className="font-semibold">.stl</span> file here, or click to browse</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={processFile}
          disabled={!file || isCalculating}
          className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all
            ${!file || isCalculating ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"}`}
        >
          {isCalculating ? "Processing..." : "Calculate Price"}
        </button>

        {/* Error Messages */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="p-6 bg-green-50 border border-green-200 rounded-xl space-y-2">
            <h2 className="text-xl font-bold text-green-800">Local Geometry Parsed!</h2>
            <p className="text-green-700"><strong>Estimated Volume:</strong> {result.volume.toFixed(2)} cm³</p>
            <p className="text-sm text-green-600 italic">
              (Backend API connection coming next to calculate the actual price!)
            </p>
          </div>
        )}

      </div>
    </main>
  );
}