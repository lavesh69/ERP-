import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Valid email address is required" }),
  password: z.string().min(1).optional(),
  role: z.string().optional(),
});

export const enrollStudentSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Valid student email address is required" }),
  departmentCode: z.string().min(2).default("CSE"),
  programName: z.string().optional(),
  semester: z.union([z.string(), z.number()]).default(1),
});

export const processPaymentSchema = z.object({
  studentFeeId: z.string().min(1, { message: "studentFeeId is required" }),
  amount: z.number().positive({ message: "Payment amount must be greater than 0" }),
  paymentMethod: z.string().default("University Card Gateway (Sandbox)"),
});

export const documentUploadSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  category: z.string().min(2, { message: "Category is required" }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, { message: "Valid reset token is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
});
