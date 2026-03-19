import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { volumeCm3, material, infillPercent } = await req.json();

    // 1. Pull Material Data
    const materialCost = parseFloat(process.env[`COST_${material}`] || "22.00");
    const materialDensity = parseFloat(process.env[`DENSITY_${material}`] || "1.24");
    const maxVolumetricSpeed = parseFloat(process.env[`VOLUMETRIC_SPEED_${material}`] || "12");
    const prepMinutes = parseFloat(process.env[`PREP_${material}`] || "7");
    
    // 2. Pricing/Machine Constants
    const machineRate = parseFloat(process.env.MACHINE_HOURLY_RATE || "0.50");
    const laborRate = parseFloat(process.env.LABOR_HOURLY_RATE || "25.00");
    const laborHours = parseFloat(process.env.DEFAULT_LABOR_HOURS || "0.25");
    const margin = parseFloat(process.env.PROFIT_MARGIN_MULTIPLIER || "1.5");

    // 3. Conversion to mm³ (Crucial for Volumetric Speed)
    const totalVolumeMm3 = volumeCm3 * 1000; 
    const infillDecimal = infillPercent / 100;
    
    // Calculate actual plastic volume
    const shellVolumeMm3 = totalVolumeMm3 * 0.20;
    const internalVolumeMm3 = totalVolumeMm3 * 0.80;
    const plasticVolumeMm3 = shellVolumeMm3 + (internalVolumeMm3 * infillDecimal);

    // 4. Printing Time Calculation (Seconds)
    // Efficiency (0.4 - 0.6) is low for small parts because they spend 
    // more time on walls/travel than hitting max speed.
    const printerEfficiency = 0.5; 
    const printSeconds = plasticVolumeMm3 / (maxVolumetricSpeed * printerEfficiency);
    
    // 5. Total Time (Printing + Prep)
    const prepSeconds = prepMinutes * 60;
    const totalSeconds = printSeconds + prepSeconds;
    const estimatedHours = totalSeconds / 3600;

    // 6. Base Cost Calculation (Net Price)
    const weightGrams = (plasticVolumeMm3 / 1000) * materialDensity;
    const totalMaterialCost = (weightGrams / 1000) * materialCost;
    
    const baseCost = totalMaterialCost + (estimatedHours * machineRate) + (laborHours * laborRate);
    const netPrice = baseCost * (1 + parseFloat(process.env.FAILURE_BUFFER_PCT || "0.1")) * margin;

    // 7. VAT Calculation
    const vatEnv = process.env.VAT_PERCENTAGE;
    const vatRate = vatEnv ? parseFloat(vatEnv) / 100 : 0;
    const vatAmount = netPrice * vatRate;
    const totalPriceWithVat = netPrice + vatAmount;

    return NextResponse.json({
      weightGrams,
      estimatedHours, 
      netPrice,         
      vatAmount,        
      vatPercentage: vatEnv ? parseFloat(vatEnv) : 0,
      totalPriceWithVat, 
      hasVat: !!vatEnv,  // Sends 'true' if VAT_PERCENTAGE exists in .env
      currency: "EUR"
    });
  } catch (error) {
    return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
  }
}