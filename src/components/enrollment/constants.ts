// DepEd-compliant grade levels
export const GRADE_LEVELS = [
    'Kindergarten',
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', // Elementary
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', // Junior High School
    'Grade 11', 'Grade 12' // Senior High School (requires strand selection)
];

// Legacy support for existing data
export const LEGACY_GRADE_LEVELS = [
    'Kinder 1', 'Kinder 2',
    'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5',
    'Level 6', 'Level 7', 'Level 8', 'Level 9', 'Level 10',
    'Level 11', 'Level 12'
];

// Senior High School strands (DepEd K-12 curriculum)
export const SHS_STRANDS = [
    { value: 'ABM', label: 'ABM (Accountancy, Business and Management)' },
    { value: 'STEM', label: 'STEM (Science, Technology, Engineering and Mathematics)' },
    { value: 'HUMSS', label: 'HUMSS (Humanities and Social Sciences)' },
    { value: 'GAS', label: 'GAS (General Academic Strand)' },
    { value: 'TVL-HE', label: 'TVL-HE (Home Economics)' },
    { value: 'TVL-ICT', label: 'TVL-ICT (Information and Communications Technology)' },
    { value: 'TVL-IA', label: 'TVL-IA (Industrial Arts)' },
    { value: 'TVL-Agri-Fishery', label: 'TVL-Agri-Fishery' },
    { value: 'SPORTS', label: 'Sports Track' },
    { value: 'ARTS-DESIGN', label: 'Arts and Design Track' }
];

export const SCHOOL_YEARS = Array.from({ length: 15 }, (_, i) => {
    const startYear = 2025 + i;
    return `${startYear}-${startYear + 1}`;
});

export const SCHOOLS = [
    { id: 'STFXSA', name: 'St. Francis Xavier Smart Academy Inc', acronym: 'STFXSA' },
];

export const GENDERS = ['Male', 'Female'];

export const KINDER_LEVELS = ['Kindergarten', 'Kinder 1', 'Kinder 2']; // Support both formats

// Helper function to check if grade level requires strand
export const requiresStrand = (gradeLevel: string): boolean => {
    return gradeLevel === 'Grade 11' || gradeLevel === 'Grade 12';
};

// Helper function to check if kindergarten level
export const isKindergartenLevel = (gradeLevel: string): boolean => {
    return KINDER_LEVELS.includes(gradeLevel);
};
