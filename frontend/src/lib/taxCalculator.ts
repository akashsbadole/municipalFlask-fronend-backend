// Property Tax Calculation Engine
export interface PropertyDetails {
  id: string;
  area_sqft: number;
  property_type: string;
  usage_type: string;
  construction_year: number;
  ward: string;
  zone: string;
  age_factor?: number;
  location_factor?: number;
  amenities_factor?: number;
}

export interface TaxCalculationResult {
  property_id: string;
  assessment_year: string;
  base_tax: number;
  education_cess: number;
  health_cess: number;
  water_cess: number;
  penalty: number;
  rebate: number;
  total_tax: number;
  due_date: string;
  calculation_breakdown: {
    unit_rate: number;
    area_rate: number;
    type_multiplier: number;
    usage_multiplier: number;
    age_depreciation: number;
    location_adjustment: number;
    amenities_adjustment: number;
  };
}

// Tax rates based on property type and usage
const TAX_RATES = {
  residential: {
    self_occupied: 5, // ₹ per sq.ft
    rented: 7,
    vacant: 3,
  },
  commercial: {
    office: 12,
    retail: 15,
    industrial: 10,
    warehouse: 8,
  },
  institutional: {
    educational: 4,
    healthcare: 4,
    religious: 2,
    government: 3,
  },
};

// Zone-based multipliers
const ZONE_MULTIPLIERS = {
  'North Zone': 1.0,
  'South Zone': 1.1,
  'East Zone': 1.2,
  'West Zone': 0.9,
  'Central Zone': 1.5,
};

// Ward-based adjustments
const WARD_ADJUSTMENTS: { [key: string]: number } = {
  'Ward 1': 1.0, 'Ward 2': 1.05, 'Ward 3': 1.1, 'Ward 4': 1.15, 'Ward 5': 1.2,
  'Ward 6': 1.0, 'Ward 7': 1.05, 'Ward 8': 1.1, 'Ward 9': 1.15, 'Ward 10': 1.2,
  'Ward 11': 0.95, 'Ward 12': 1.0, 'Ward 13': 1.05, 'Ward 14': 1.1, 'Ward 15': 1.15,
  'Ward 16': 0.95, 'Ward 17': 1.0, 'Ward 18': 1.05, 'Ward 19': 1.1, 'Ward 20': 1.15,
  'Ward 21': 0.9, 'Ward 22': 0.95, 'Ward 23': 1.0, 'Ward 24': 1.05, 'Ward 25': 1.1,
  'Ward 26': 0.9, 'Ward 27': 0.95, 'Ward 28': 1.0, 'Ward 29': 1.05, 'Ward 30': 1.1,
  'Ward 31': 0.85, 'Ward 32': 0.9, 'Ward 33': 0.95, 'Ward 34': 1.0, 'Ward 35': 1.05,
  'Ward 36': 0.85, 'Ward 37': 0.9, 'Ward 38': 0.95, 'Ward 39': 1.0, 'Ward 40': 1.05,
  'Ward 41': 0.8, 'Ward 42': 0.85, 'Ward 43': 0.9, 'Ward 44': 0.95, 'Ward 45': 1.0,
  'Ward 46': 0.8, 'Ward 47': 0.85, 'Ward 48': 0.9, 'Ward 49': 0.95, 'Ward 50': 1.0,
};

// Cess percentages
const EDUCATION_CESS_PERCENTAGE = 0.15; // 15%
const HEALTH_CESS_PERCENTAGE = 0.10; // 10%
const WATER_CESS_PERCENTAGE = 0.05; // 5%

// Penalty rates
const PENALTY_RATES = {
  '0-30': 0.05, // 5% for 0-30 days delay
  '31-60': 0.10, // 10% for 31-60 days delay
  '61-90': 0.15, // 15% for 61-90 days delay
  '90+': 0.20, // 20% for 90+ days delay
};

// Rebate rates
const REBATE_RATES = {
  '0-30': 0.10, // 10% rebate for payment within 30 days
  '31-60': 0.05, // 5% rebate for payment within 60 days
  '60+': 0, // No rebate after 60 days
};

/**
 * Calculate property tax based on property details
 */
export const calculatePropertyTax = (
  property: PropertyDetails,
  assessmentYear: string,
  paymentDate?: Date
): TaxCalculationResult => {
  const currentYear = new Date().getFullYear();
  const propertyAge = currentYear - property.construction_year;
  
  // Determine base rate based on property type and usage
  let baseRate = 5; // Default rate
  if (property.property_type === 'residential') {
    baseRate = TAX_RATES.residential[property.usage_type as keyof typeof TAX_RATES.residential] || 5;
  } else if (property.property_type === 'commercial') {
    baseRate = TAX_RATES.commercial[property.usage_type as keyof typeof TAX_RATES.commercial] || 10;
  } else if (property.property_type === 'institutional') {
    baseRate = TAX_RATES.institutional[property.usage_type as keyof typeof TAX_RATES.institutional] || 4;
  }
  
  // Calculate area rate
  const areaRate = baseRate * property.area_sqft;
  
  // Apply zone multiplier
  const zoneMultiplier = ZONE_MULTIPLERS[property.zone as keyof typeof ZONE_MULTIPLIERS] || 1.0;
  
  // Apply ward adjustment
  const wardAdjustment = WARD_ADJUSTMENTS[property.ward] || 1.0;
  
  // Calculate age depreciation (older properties get discount)
  let ageDepreciation = 0;
  if (propertyAge > 20) {
    ageDepreciation = Math.min(0.3, (propertyAge - 20) * 0.01); // Max 30% discount
  }
  
  // Apply location factor if provided
  const locationFactor = property.location_factor || 1.0;
  
  // Apply amenities factor if provided
  const amenitiesFactor = property.amenities_factor || 1.0;
  
  // Calculate base tax
  const baseTax = areaRate * zoneMultiplier * wardAdjustment * (1 - ageDepreciation) * locationFactor * amenitiesFactor;
  
  // Calculate cess amounts
  const educationCess = baseTax * EDUCATION_CESS_PERCENTAGE;
  const healthCess = baseTax * HEALTH_CESS_PERCENTAGE;
  const waterCess = baseTax * WATER_CESS_PERCENTAGE;
  
  // Calculate subtotal before penalty and rebate
  const subtotal = baseTax + educationCess + healthCess + waterCess;
  
  // Calculate penalty if payment date is provided and after due date
  let penalty = 0;
  let rebate = 0;
  
  if (paymentDate) {
    const dueDate = new Date(`${assessmentYear}-03-31`); // Assuming fiscal year ends March 31
    const daysDifference = Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > 0) {
      // Payment is after due date, calculate penalty
      if (daysDifference <= 30) {
        penalty = subtotal * PENALTY_RATES['0-30'];
      } else if (daysDifference <= 60) {
        penalty = subtotal * PENALTY_RATES['31-60'];
      } else if (daysDifference <= 90) {
        penalty = subtotal * PENALTY_RATES['61-90'];
      } else {
        penalty = subtotal * PENALTY_RATES['90+'];
      }
    } else {
      // Payment is before or on due date, calculate rebate
      const daysEarly = Math.abs(daysDifference);
      if (daysEarly <= 30) {
        rebate = subtotal * REBATE_RATES['0-30'];
      } else if (daysEarly <= 60) {
        rebate = subtotal * REBATE_RATES['31-60'];
      }
    }
  }
  
  // Calculate total tax
  const totalTax = subtotal + penalty - rebate;
  
  return {
    property_id: property.id,
    assessment_year: assessmentYear,
    base_tax: Math.round(baseTax),
    education_cess: Math.round(educationCess),
    health_cess: Math.round(healthCess),
    water_cess: Math.round(waterCess),
    penalty: Math.round(penalty),
    rebate: Math.round(rebate),
    total_tax: Math.round(totalTax),
    due_date: `${assessmentYear}-03-31`,
    calculation_breakdown: {
      unit_rate: baseRate,
      area_rate: Math.round(areaRate),
      type_multiplier: zoneMultiplier,
      usage_multiplier: wardAdjustment,
      age_depreciation: ageDepreciation,
      location_adjustment: locationFactor,
      amenities_adjustment: amenitiesFactor,
    },
  };
};

/**
 * Generate tax demand notice
 */
export const generateTaxDemandNotice = (
  property: PropertyDetails,
  taxCalculation: TaxCalculationResult
): string => {
  const notice = `
MUNICIPAL CORPORATION OF [CITY NAME]
PROPERTY TAX DEMAND NOTICE - ${taxCalculation.assessment_year}

Property ID: ${property.id}
Property Address: [Full Address from property details]
Ward: ${property.ward}, Zone: ${property.zone}
Property Type: ${property.property_type}
Usage Type: ${property.usage_type}
Area: ${property.area_sqft} sq.ft.

TAX DETAILS:
Base Tax: ₹${taxCalculation.base_tax.toLocaleString('en-IN')}
Education Cess (15%): ₹${taxCalculation.education_cess.toLocaleString('en-IN')}
Health Cess (10%): ₹${taxCalculation.health_cess.toLocaleString('en-IN')}
Water Cess (5%): ₹${taxCalculation.water_cess.toLocaleString('en-IN')}
Subtotal: ₹${(taxCalculation.base_tax + taxCalculation.education_cess + taxCalculation.health_cess + taxCalculation.water_cess).toLocaleString('en-IN')}
${taxCalculation.penalty > 0 ? `Penalty: ₹${taxCalculation.penalty.toLocaleString('en-IN')}` : ''}
${taxCalculation.rebate > 0 ? `Rebate: -₹${taxCalculation.rebate.toLocaleString('en-IN')}` : ''}
Total Amount Due: ₹${taxCalculation.total_tax.toLocaleString('en-IN')}

Due Date: ${new Date(taxCalculation.due_date).toLocaleDateString('en-IN')}

Please pay the amount before the due date to avoid penalty.
This notice is computer generated and does not require signature.
  `.trim();
  
  return notice;
};

/**
 * Calculate penalty for late payment
 */
export const calculateLatePaymentPenalty = (
  originalAmount: number,
  dueDate: Date,
  paymentDate: Date
): number => {
  const daysDifference = Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDifference <= 0) {
    return 0; // No penalty for on-time payment
  }
  
  if (daysDifference <= 30) {
    return Math.round(originalAmount * PENALTY_RATES['0-30']);
  } else if (daysDifference <= 60) {
    return Math.round(originalAmount * PENALTY_RATES['31-60']);
  } else if (daysDifference <= 90) {
    return Math.round(originalAmount * PENALTY_RATES['61-90']);
  } else {
    return Math.round(originalAmount * PENALTY_RATES['90+']);
  }
};

/**
 * Calculate rebate for early payment
 */
export const calculateEarlyPaymentRebate = (
  originalAmount: number,
  dueDate: Date,
  paymentDate: Date
): number => {
  const daysDifference = Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDifference >= 0) {
    return 0; // No rebate for on-time or late payment
  }
  
  const daysEarly = Math.abs(daysDifference);
  
  if (daysEarly <= 30) {
    return Math.round(originalAmount * REBATE_RATES['0-30']);
  } else if (daysEarly <= 60) {
    return Math.round(originalAmount * REBATE_RATES['31-60']);
  } else {
    return 0; // No rebate after 60 days
  }
};