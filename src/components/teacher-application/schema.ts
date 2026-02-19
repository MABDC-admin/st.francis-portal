import { z } from 'zod';

// Helper for empty strings to null or optional
const optionalString = z.string().optional().or(z.literal(''));
const requiredString = z.string().min(1, 'This field is required');

export const educationSchema = z.object({
    level: requiredString,
    course: optionalString,
    major: optionalString,
    school: requiredString,
    year_graduated: requiredString,
    honors: optionalString,
});

export const experienceSchema = z.object({
    school: requiredString,
    position: requiredString,
    subjects: requiredString,
    start_date: requiredString,
    end_date: requiredString,
    status: requiredString,
});

export const teacherApplicationSchema = z.object({
    // Personal
    first_name: requiredString.max(100),
    middle_name: optionalString,
    last_name: requiredString.max(100),
    suffix: optionalString,
    gender: requiredString,
    date_of_birth: requiredString.refine((dob) => {
        const date = new Date(dob);
        return !isNaN(date.getTime()) && date < new Date();
    }, 'Invalid date of birth'),
    place_of_birth: optionalString,
    civil_status: requiredString,
    nationality: requiredString,
    photo_url: optionalString, // Optional because it might be uploaded later or handled separately

    // Contact
    mobile_number: requiredString.regex(/^(09|\+639)\d{9}$/, 'Invalid PH mobile number'),
    alternate_mobile: optionalString.refine(val => !val || /^(09|\+639)\d{9}$/.test(val), 'Invalid PH mobile number'),
    email: z.string().email('Invalid email address'),
    house_street: requiredString,
    barangay: requiredString,
    city_municipality: requiredString,
    province: requiredString,
    zip_code: requiredString.regex(/^\d{4}$/, 'Invalid Zip Code'),
    country: requiredString,

    // Position
    position_applied: requiredString,
    subject_specialization: z.array(z.string()).min(1, 'Select at least one subject'),
    preferred_level: optionalString,

    // PRC
    has_prc_license: z.boolean(),
    prc_license_number: z.string().optional(), // validated conditionally in refine
    prc_expiration_date: z.string().optional(),
    prc_license_url: z.string().optional(),

    // Education
    education: z.array(educationSchema).min(1, 'At least one education entry is required'),

    // Experience
    has_experience: z.boolean(),
    experience: z.array(experienceSchema),

    // Documents (URLs)
    resume_url: requiredString, // Must allow upload
    transcript_url: optionalString,
    diploma_url: optionalString,
    valid_id_url: requiredString,
    certificates_url: z.array(z.string()),

    // Additional
    why_join: optionalString,
    teaching_philosophy: optionalString,
    expected_salary: optionalString,
    available_start_date: optionalString,
}).superRefine((data, ctx) => {
    if (data.has_prc_license) {
        if (!data.prc_license_number) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'License number is required',
                path: ['prc_license_number'],
            });
        }
        if (!data.prc_expiration_date) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Expiration date is required',
                path: ['prc_expiration_date'],
            });
        }
    }

    if (data.has_experience && (!data.experience || data.experience.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Please add your teaching experience',
            path: ['experience'],
        });
    }
});

export type TeacherApplicationFormValues = z.infer<typeof teacherApplicationSchema>;
