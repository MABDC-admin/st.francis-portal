/**
 * Centralized mapping of school text codes to their database UUIDs.
 * Used during enrollment and other operations that need to resolve
 * the school_id (UUID) from a school code string.
 */
export const SCHOOL_ID_MAP: Record<string, string> = {
  'MABDC': '33333333-3333-3333-3333-333333333333',
  'STFXSA': '22222222-2222-2222-2222-222222222222',
};

/**
 * Resolve a school text code to its database UUID.
 * Returns undefined if the code is not recognized.
 */
export const getSchoolId = (schoolCode: string): string | undefined => {
  return SCHOOL_ID_MAP[schoolCode];
};
