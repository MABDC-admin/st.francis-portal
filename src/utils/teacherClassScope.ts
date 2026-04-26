export interface TeacherClassSlot {
  level: string | null;
  section?: string | null;
}

export const normalizeGradeLevel = (value: string | null | undefined) => {
  if (!value) return '';

  const normalized = value.toLowerCase().replace(/\s+/g, ' ').trim();
  if (normalized.includes('kinder')) {
    return normalized.replace(/\s+/g, '');
  }

  const stripped = normalized.replace(/^grade\s*/i, '').replace(/^g\s*/i, '').trim();
  if (/^\d{1,2}$/.test(stripped)) {
    return `grade-${stripped}`;
  }

  return stripped.replace(/\s+/g, '');
};

export const normalizeSection = (value: string | null | undefined) =>
  value?.toLowerCase().replace(/\s+/g, ' ').trim() || '';

export const matchesTeacherClassSlot = (
  level: string | null | undefined,
  section: string | null | undefined,
  classSlots: TeacherClassSlot[],
) => {
  const normalizedLevel = normalizeGradeLevel(level);
  const matchingLevelSlots = classSlots.filter(
    (slot) => normalizeGradeLevel(slot.level) === normalizedLevel,
  );

  if (matchingLevelSlots.length === 0) {
    return false;
  }

  const hasSectionScopedSlot = matchingLevelSlots.some((slot) => !!normalizeSection(slot.section));
  if (!hasSectionScopedSlot) {
    return true;
  }

  const normalizedStudentSection = normalizeSection(section);
  if (!normalizedStudentSection) {
    return false;
  }

  return matchingLevelSlots.some((slot) => normalizeSection(slot.section) === normalizedStudentSection);
};
