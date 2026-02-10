/**
 * Centralized mapping of school text codes to their database UUIDs.
 */
export const SCHOOL_ID_MAP: Record<string, string> = {
  'STFXSA': '22222222-2222-2222-2222-222222222222',
};

/**
 * Resolve a school text code to its database UUID.
 */
export const getSchoolId = (schoolCode: string): string | undefined => {
  return SCHOOL_ID_MAP[schoolCode];
};
