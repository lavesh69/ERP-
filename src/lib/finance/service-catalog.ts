export interface CampusServiceFeePayload {
  studentId: string;
  serviceType: "HOSTEL_FEE" | "HOSTEL_CAUTION_DEPOSIT" | "TRANSPORT_BUS_PASS" | "MEAL_PLAN" | "LAB_BREAKAGE";
  amount: number;
  description: string;
  semester?: number;
  academicYear?: string;
}

export const CAMPUS_SERVICE_CATALOG = [
  { type: "HOSTEL_FEE", title: "Residential Hostel Accommodation (Single Room)", defaultAmount: 45000, billingFrequency: "PER_SEMESTER" },
  { type: "HOSTEL_CAUTION_DEPOSIT", title: "Hostel Refundable Caution Deposit", defaultAmount: 10000, billingFrequency: "ONE_TIME" },
  { type: "TRANSPORT_BUS_PASS", title: "Annual Campus Transit Bus Pass (Zone A)", defaultAmount: 18000, billingFrequency: "ANNUAL" },
  { type: "MEAL_PLAN", title: "Cafeteria Unlimited Meal Plan Pass", defaultAmount: 22000, billingFrequency: "PER_SEMESTER" },
  { type: "LAB_BREAKAGE", title: "Chemistry & Physics Laboratory Equipment Security", defaultAmount: 3500, billingFrequency: "ANNUAL" },
];
