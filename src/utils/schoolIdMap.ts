/**
 * Centralized mapping of school text codes to their database UUIDs.
 */
export const SCHOOL_ID_MAP: Record<string, string> = {
  'SFXSAI': '11111111-1111-1111-1111-111111111111',
};

/**
 * Resolve a school text code to its database UUID.
 */
export const getSchoolId = (schoolCode: string): string | undefined => {
  return SCHOOL_ID_MAP[schoolCode];
};
