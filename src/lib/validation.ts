/**
 * Input Validation Schemas using Zod
 * 
 * Centralized validation schemas for all form inputs and API requests
 * to ensure data integrity and type safety.
 */

import { z } from 'zod';

// ============================================================================
// Student Validation Schemas
// ============================================================================

export const studentSchema = z.object({
  id: z.string().uuid().optional(),
  lrn: z.string()
    .min(1, "LRN is required")
    .max(20, "LRN must be 20 characters or less")
    .regex(/^[0-9-]+$/, "LRN must contain only numbers and hyphens"),
  student_name: z.string()
    .min(2, "Student name must be at least 2 characters")
    .max(100, "Student name must be 100 characters or less")
    .regex(/^[a-zA-Z\s.'-]+$/, "Student name contains invalid characters"),
  level: z.string()
    .min(1, "Grade level is required")
    .max(20, "Grade level must be 20 characters or less"),
  school: z.string()
    .min(1, "School is required")
    .max(50, "School name must be 50 characters or less")
    .optional()
    .nullable(),
  school_id: z.string().uuid().optional(),
  academic_year_id: z.string().uuid().optional(),
  birth_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Birth date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
  age: z.number()
    .int("Age must be a whole number")
    .min(0, "Age cannot be negative")
    .max(100, "Age seems too high")
    .optional()
    .nullable(),
  gender: z.enum(['Male', 'Female', 'Other', ''])
    .optional()
    .nullable(),
  mother_contact: z.string()
    .max(20, "Contact number too long")
    .regex(/^[0-9+\s-]*$/, "Invalid contact number format")
    .optional()
    .nullable(),
  mother_maiden_name: z.string()
    .max(100, "Name must be 100 characters or less")
    .optional()
    .nullable(),
  father_contact: z.string()
    .max(20, "Contact number too long")
    .regex(/^[0-9+\s-]*$/, "Invalid contact number format")
    .optional()
    .nullable(),
  father_name: z.string()
    .max(100, "Name must be 100 characters or less")
    .optional()
    .nullable(),
  phil_address: z.string()
    .max(255, "Address must be 255 characters or less")
    .optional()
    .nullable(),
  uae_address: z.string()
    .max(255, "Address must be 255 characters or less")
    .optional()
    .nullable(),
  previous_school: z.string()
    .max(100, "School name must be 100 characters or less")
    .optional()
    .nullable(),
  religion: z.string()
    .max(50, "Religion must be 50 characters or less")
    .optional()
    .nullable(),
  mother_tongue: z.string()
    .max(50, "Mother tongue must be 50 characters or less")
    .optional()
    .nullable(),
  dialects: z.string()
    .max(100, "Dialects must be 100 characters or less")
    .optional()
    .nullable(),
  photo_url: z.string()
    .url("Invalid URL format")
    .max(500, "URL too long")
    .optional()
    .nullable(),
});

export type StudentSchema = z.infer<typeof studentSchema>;

// ============================================================================
// User Authentication Schemas
// ============================================================================

export const loginSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password too long"),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be 100 characters or less")
    .regex(/^[a-zA-Z\s.'-]+$/, "Full name contains invalid characters"),
});

export type SignupSchema = z.infer<typeof signupSchema>;

// ============================================================================
// Academic Year Schemas
// ============================================================================

export const academicYearSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(1, "Academic year name is required")
    .max(50, "Name must be 50 characters or less")
    .regex(/^\d{4}-\d{4}$/, "Name must be in YYYY-YYYY format"),
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
  is_current: z.boolean().default(false),
  school_id: z.string().uuid(),
});

export type AcademicYearSchema = z.infer<typeof academicYearSchema>;

// ============================================================================
// Finance Schemas
// ============================================================================

export const feeItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(1, "Fee name is required")
    .max(100, "Name must be 100 characters or less"),
  amount: z.number()
    .min(0, "Amount cannot be negative")
    .max(999999.99, "Amount too high"),
  description: z.string()
    .max(255, "Description must be 255 characters or less")
    .optional()
    .nullable(),
});

export type FeeItemSchema = z.infer<typeof feeItemSchema>;

export const paymentSchema = z.object({
  id: z.string().uuid().optional(),
  student_id: z.string().uuid(),
  amount: z.number()
    .min(0.01, "Amount must be greater than 0")
    .max(999999.99, "Amount too high"),
  payment_method: z.enum(['cash', 'check', 'bank_transfer', 'online']),
  reference_number: z.string()
    .max(50, "Reference number too long")
    .optional()
    .nullable(),
  notes: z.string()
    .max(500, "Notes must be 500 characters or less")
    .optional()
    .nullable(),
});

export type PaymentSchema = z.infer<typeof paymentSchema>;

// ============================================================================
// Grade Schemas
// ============================================================================

export const gradeSchema = z.object({
  id: z.string().uuid().optional(),
  student_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  q1_grade: z.number()
    .min(0, "Grade cannot be negative")
    .max(100, "Grade cannot exceed 100")
    .optional()
    .nullable(),
  q2_grade: z.number()
    .min(0, "Grade cannot be negative")
    .max(100, "Grade cannot exceed 100")
    .optional()
    .nullable(),
  q3_grade: z.number()
    .min(0, "Grade cannot be negative")
    .max(100, "Grade cannot exceed 100")
    .optional()
    .nullable(),
  q4_grade: z.number()
    .min(0, "Grade cannot be negative")
    .max(100, "Grade cannot exceed 100")
    .optional()
    .nullable(),
});

export type GradeSchema = z.infer<typeof gradeSchema>;

// ============================================================================
// Message Schemas
// ============================================================================

export const messageSchema = z.object({
  id: z.string().uuid().optional(),
  conversation_id: z.string().uuid(),
  content: z.string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message too long (max 4000 characters)"),
  message_type: z.enum(['text', 'image', 'file']).default('text'),
  file_url: z.string().url().optional().nullable(),
  file_name: z.string().max(255).optional().nullable(),
});

export type MessageSchema = z.infer<typeof messageSchema>;

// ============================================================================
// UUID Validation Helper
// ============================================================================

export const uuidSchema = z.string().uuid("Invalid UUID format");

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates data against a schema and returns the result
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: true; 
  data: T; 
} | { 
  success: false; 
  errors: z.ZodError; 
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validates partial data (for updates) against a schema
 */
export function validatePartialData<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: true; 
  data: Partial<T>; 
} | { 
  success: false; 
  errors: z.ZodError; 
} {
  const partialSchema = (schema as any).partial();
  const result = partialSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Formats Zod errors into a user-friendly string
 */
export function formatValidationErrors(error: z.ZodError): string {
  return error.errors
    .map((err: { path: (string | number)[]; message: string }) => `${err.path.join('.')}: ${err.message}`)
    .join(', ');
}
