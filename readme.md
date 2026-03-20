# 🧊 STL Price Calculator & 3D Viewer

A fast, privacy-first price calculator and interactive 3D viewer for printable models. Upload an `.stl` file and instantly get an accurate, itemized quote for 3D printing, without ever exposing the original 3D geometry to a remote server.

## 🌐 Live Demo
Check out the live application here: **[https://stl-price-calculator.netlify.app/](https://stl-price-calculator.netlify.app/)**

---

## ✨ Features

* **🔒 Privacy-First Local Processing:** The STL file is parsed and rendered directly in the user's browser. The file never leaves their computer, ensuring zero upload wait times and total IP protection.
* **🎮 Interactive 3D Preview:** A built-in, slicer-style 3D viewer powered by Three.js. Features pan/zoom controls, realistic studio lighting, and a virtual print bed to inspect the model before quoting.
* **⚙️ Advanced Slicer Math:** Calculates print time and material usage based on real-world constraints:
  * Material selection (PLA, ABS, PETG) with specific densities and pre-heat times.
  * Infill density adjustments (Minimal, Normal, Hard) using Gyroid approximations.
  * Max volumetric speed limits (mm³/s) for highly accurate time estimations.
* **📏 Build Volume Constraints:** Automatically checks the model's physical bounding box against your printer's max dimensions (e.g., Bambu Lab P1S) and rejects oversized prints.
* **💰 Secure & Itemized Quotes:** Business logic, hourly rates, VAT, and profit margins are safely hidden in the server-side backend. Returns a clean breakdown of net price, taxes, and estimated time.

## 🏗 Architecture

This app uses a hybrid approach to maximize both speed and security:
1. **Client-Side (React/Three.js):** Reads the uploaded STL file locally, renders the 3D geometry, and extracts the raw numeric data (volume in cm³, bounding box dimensions).
2. **Server-Side (Next.js API):** Receives only the numeric data and user selections (material, infill). It applies the hidden pricing formulas using protected environment variables and returns the final quote to the UI.

## 💻 Tech Stack

* **Framework:** Next.js (App Router)
* **Frontend:** React, Tailwind CSS
* **3D Rendering:** Three.js, OrbitControls
* **Backend:** Next.js Serverless API Routes

## 🧮 The Pricing Formula

The calculator uses a comprehensive, slicer-accurate formula to ensure profitable quotes:

* **Material Cost:** Calculated by multiplying the infill-adjusted volume by the specific material's density (g/cm³) and cost per kg.
* **Print Time Estimate:** Calculated using the material's Max Volumetric Speed (mm³/s) and printer efficiency, plus material-specific pre-heat/prep times.
* **Machine/Energy Cost:** Total estimated time (hours) × Hourly machine rate.
* **Labor Cost:** Fixed hands-on prep time × Hourly labor wage.
* **Failure Buffer & Profit:** A flat percentage buffer is added to cover failed prints, followed by a final profit margin multiplier.

## 🚀 Getting Started

To run this project locally, you will need Node.js installed on your machine.

1. Clone the repository to your local machine.
2. Install the project dependencies by running `npm install` in your terminal.
3. Create a `.env.local` file in the root directory by copying the example file: `cp .env.example .env.local`.
4. Fill in your `.env.local` with your specific pricing variables, printer dimensions, and VAT rates.
5. Start the development server by running `npm run dev`.
6. Open `http://localhost:3000` in your browser to view the app.