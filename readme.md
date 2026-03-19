# 🧊 STL Price Calculator

A fast, privacy-first price calculator for 3D-printable models. Upload an `.stl` file and instantly get an accurate quote for 3D printing, without ever exposing the original 3D geometry to a remote server.

## ✨ Features

* **Privacy-First Local Processing:** The STL file is parsed directly in the user's browser. The file never leaves their computer, ensuring zero upload wait times and total IP protection.
* **Secure Trade Secrets:** Business logic, hourly rates, and profit margins are safely hidden away in the server-side backend. 
* **Accurate Instant Quotes:** Generates itemized pricing based on material weight, estimated print time, labor, and failure buffers.

## 🏗 Architecture

This app uses a hybrid approach to maximize both speed and security:
1. **Client-Side:** Reads the uploaded STL file locally and extracts the raw geometric data (volume, bounding box).
2. **Server-Side API:** Receives only the numeric data, applies the hidden pricing formula using protected environment variables, and returns the final quote to the UI.

## 💻 Tech Stack

* **Framework:** Next.js (Full-stack App Router)
* **Frontend:** React, HTML5 FileReader API
* **Backend:** Next.js Serverless API Routes

## 🧮 The Pricing Formula

The calculator uses a comprehensive formula to ensure profitable and realistic quotes. 

* **Material Cost:** Weight of the print (grams) × Cost of filament per gram
* **Machine/Energy Cost:** Print time (hours) × Hourly rate for electricity & machine depreciation
* **Labor Cost:** Hands-on time spent slicing, prepping, and cleaning × Hourly wage
* **Failure Buffer:** A flat percentage (e.g., 5% to 10%) added to the base cost to cover eventual failed prints
* **Profit Margin:** The final markup multiplier (e.g., 1.5x or 2.0x)

**Total Price = (Material + Machine + Labor + Buffer) × Profit Margin**

## 🚀 Getting Started

To run this project locally, you will need Node.js installed on your machine.

1. Clone the repository to your local machine.
2. Install the project dependencies by running `npm install` in your terminal.
3. Create a `.env.local` file in the root directory and add your secret pricing variables (see `.env.example` if available).
4. Start the development server by running `npm run dev`.
5. Open `http://localhost:3000` in your browser to view the app.