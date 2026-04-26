import { normalizeGradeLevel as normalizeEnrollmentGradeLevel } from '@/components/enrollment/constants';

export const normalizeLibraryGradeLevel = (value: string | null | undefined) => {
  if (!value) return '';

  const raw = String(value).trim();
  if (!raw) return '';

  const enrollmentNormalized = normalizeEnrollmentGradeLevel(raw);
  const lower = enrollmentNormalized.toLowerCase().replace(/\s+/g, ' ').trim();

  if (lower === '0' || lower === 'kinder' || lower === 'kindergarten' || lower.startsWith('kinder ')) {
    return 'kindergarten';
  }

  const digitMatch = lower.match(/\d{1,2}/);
  if (digitMatch) {
    return `grade${digitMatch[0]}`;
  }

  return lower.replace(/\s+/g, '');
};

export const displayLibraryGradeLabel = (value: string | null | undefined) => {
  if (!value) return '';

  const raw = String(value).trim();
  if (!raw) return '';

  const normalizedKey = normalizeLibraryGradeLevel(raw);
  if (normalizedKey === 'kindergarten') {
    return 'Kindergarten';
  }

  const digitMatch = normalizedKey.match(/^grade(\d{1,2})$/);
  if (digitMatch) {
    return `Grade ${digitMatch[1]}`;
  }

  return normalizeEnrollmentGradeLevel(raw);
};

export const buildLibraryGradeVariants = (value: string | null | undefined) => {
  const variants = new Set<string>();
  const raw = String(value || '').trim();
  const display = displayLibraryGradeLabel(raw);
  const normalizedKey = normalizeLibraryGradeLevel(raw);

  if (raw) {
    variants.add(raw);
  }

  if (display) {
    variants.add(display);
  }

  if (normalizedKey === 'kindergarten') {
    variants.add('Kindergarten');
    variants.add('Kinder');
    variants.add('0');
  }

  const digitMatch = normalizedKey.match(/^grade(\d{1,2})$/);
  if (digitMatch) {
    const digits = digitMatch[1];
    variants.add(digits);
    variants.add(`Grade ${digits}`);
    variants.add(`G${digits}`);
  }

  return Array.from(variants).filter(Boolean);
};

export const gradeMatchesLibraryLevel = (
  left: string | null | undefined,
  right: string | null | undefined,
) => normalizeLibraryGradeLevel(left) !== '' && normalizeLibraryGradeLevel(left) === normalizeLibraryGradeLevel(right);
