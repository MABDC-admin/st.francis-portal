export const GRADE_LEVELS = [
    'Kinder 1', 'Kinder 2',
    'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5',
    'Level 6', 'Level 7', 'Level 8', 'Level 9', 'Level 10',
    'Level 11', 'Level 12'
];

export const SCHOOL_YEARS = Array.from({ length: 15 }, (_, i) => {
    const startYear = 2025 + i;
    return `${startYear}-${startYear + 1}`;
});

export const SCHOOLS = [
    { id: 'MABDC', name: 'M.A Brain Development Center', acronym: 'MABDC' },
    { id: 'STFXSA', name: 'St. Francis Xavier Smart Academy Inc', acronym: 'STFXSA' },
];

export const GENDERS = ['Male', 'Female'];

export const KINDER_LEVELS = ['Kinder 1', 'Kinder 2'];
