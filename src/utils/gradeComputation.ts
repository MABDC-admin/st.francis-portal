/**
 * DepEd K-12 Grade Computation and Transmutation Utility
 * Based on DepEd Order No. 8, s. 2015
 */

export type SubjectCategory = 'Languages/AP/EsP' | 'Science/Math' | 'MAPEH/EPP/TLE' | 'CoreSHS' | 'AcademicTrackSHS' | 'TVL/Sports/ArtsSHS';

interface ComponentWeights {
    ww: number;
    pt: number;
    qa: number;
}

export const CATEGORY_WEIGHTS: Record<SubjectCategory, ComponentWeights> = {
    'Languages/AP/EsP': { ww: 0.3, pt: 0.5, qa: 0.2 },
    'Science/Math': { ww: 0.4, pt: 0.4, qa: 0.2 },
    'MAPEH/EPP/TLE': { ww: 0.2, pt: 0.6, qa: 0.2 },
    'CoreSHS': { ww: 0.25, pt: 0.5, qa: 0.25 },
    'AcademicTrackSHS': { ww: 0.25, pt: 0.45, qa: 0.3 },
    'TVL/Sports/ArtsSHS': { ww: 0.2, pt: 0.6, qa: 0.2 },
};

/**
 * Transmutation Table
 * Maps Initial Grade (key) to Transmuted Grade (value)
 * Initial Grade range is [Key, NextKey)
 */
const TRANSMUTATION_TABLE: Record<number, number> = {
    100: 100,
    98.40: 99,
    96.80: 98,
    95.20: 97,
    93.60: 96,
    92.00: 95,
    90.40: 94,
    88.80: 93,
    87.20: 92,
    85.60: 91,
    84.00: 90,
    82.40: 89,
    80.80: 88,
    79.20: 87,
    77.60: 86,
    76.00: 85,
    74.40: 84,
    72.80: 83,
    71.20: 82,
    69.60: 81,
    68.00: 80,
    66.40: 79,
    64.80: 78,
    63.20: 77,
    61.60: 76,
    60.00: 75,
    56.00: 74,
    52.00: 73,
    48.00: 72,
    44.00: 71,
    40.00: 70,
    36.00: 69,
    32.00: 68,
    28.00: 67,
    24.00: 66,
    20.00: 65,
    16.00: 64,
    12.00: 63,
    8.00: 62,
    4.00: 61,
    0: 60,
};

/**
 * Transmutes an initial grade to its final rating
 */
export const transmuteGrade = (initialGrade: number): number => {
    const sortedKeys = Object.keys(TRANSMUTATION_TABLE)
        .map(Number)
        .sort((a, b) => b - a);

    for (const key of sortedKeys) {
        if (initialGrade >= key) {
            return TRANSMUTATION_TABLE[key];
        }
    }
    return 60; // Default minimum
};

/**
 * Computes Weighted Score for a component
 */
export const computeWeightedScore = (
    rawScores: number[],
    maxScores: number[],
    weight: number
): number => {
    if (maxScores.length === 0 || rawScores.length === 0) return 0;

    const totalRaw = rawScores.reduce((sum, s) => sum + s, 0);
    const totalMax = maxScores.reduce((sum, s) => sum + s, 0);

    if (totalMax === 0) return 0;

    const percentageScore = (totalRaw / totalMax) * 100;
    return percentageScore * weight;
};

/**
 * Full Quarterly Grade Computation
 */
export const computeQuarterlyGrade = (
    category: SubjectCategory,
    data: {
        wwRaw: number[];
        wwMax: number[];
        ptRaw: number[];
        ptMax: number[];
        qaRaw: number;
        qaMax: number;
    }
): {
    wwWS: number;
    ptWS: number;
    qaWS: number;
    initialGrade: number;
    transmutedGrade: number;
} => {
    const weights = CATEGORY_WEIGHTS[category];

    const wwWS = computeWeightedScore(data.wwRaw, data.wwMax, weights.ww);
    const ptWS = computeWeightedScore(data.ptRaw, data.ptMax, weights.pt);
    const qaWS = (data.qaRaw / data.qaMax) * 100 * weights.qa;

    const initialGrade = wwWS + ptWS + qaWS;
    const transmutedGrade = transmuteGrade(initialGrade);

    return {
        wwWS: Number(wwWS.toFixed(2)),
        ptWS: Number(ptWS.toFixed(2)),
        qaWS: Number(qaWS.toFixed(2)),
        initialGrade: Number(initialGrade.toFixed(2)),
        transmutedGrade
    };
};

/**
 * Helper to get subject category from subject name/grade level
 */
export const getSubjectCategory = (subjectCode: string, level: string): SubjectCategory => {
    const isSHS = level.toLowerCase().includes('grade 11') || level.toLowerCase().includes('grade 12');
    const code = subjectCode.toUpperCase();

    if (isSHS) {
        // Basic SHS category mapping - can be refined
        if (['CORE', 'GENMATH', 'STATS'].some(kw => code.includes(kw))) return 'CoreSHS';
        if (['TVL', 'TLE', 'IA', 'ICT'].some(kw => code.includes(kw))) return 'TVL/Sports/ArtsSHS';
        return 'AcademicTrackSHS';
    }

    if (['SCI', 'MATH'].some(kw => code.includes(kw))) return 'Science/Math';
    if (['MAPEH', 'TLE', 'EPP', 'MUS', 'ART', 'PE', 'HEALTH'].some(kw => code.includes(kw))) return 'MAPEH/EPP/TLE';
    return 'Languages/AP/EsP';
};

/**
 * DepEd Passing Grade Threshold
 */
export const PASSING_GRADE = 75;

/**
 * Grade type for quarterly/annual calculations
 */
export interface GradeRecord {
    q1_grade?: number | null;
    q2_grade?: number | null;
    q3_grade?: number | null;
    q4_grade?: number | null;
    final_grade?: number | null;
}

/**
 * Computes General Average for a single quarter across all subjects
 * DepEd: GA = Sum of all subject grades / Number of subjects
 */
export const computeQuarterlyGeneralAverage = (
    grades: GradeRecord[],
    quarter: 'q1' | 'q2' | 'q3' | 'q4'
): number | null => {
    const key = `${quarter}_grade` as keyof GradeRecord;
    const validGrades = grades
        .filter(g => g[key] != null)
        .map(g => g[key] as number);
    if (validGrades.length === 0) return null;
    return validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length;
};

/**
 * Computes Annual General Average (average of final grades across all subjects)
 * DepEd: Annual GA = Sum of all final grades / Number of subjects
 */
export const computeAnnualGeneralAverage = (
    grades: GradeRecord[]
): number | null => {
    const validGrades = grades
        .filter(g => g.final_grade != null)
        .map(g => g.final_grade as number);
    if (validGrades.length === 0) return null;
    return validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length;
};

/**
 * Check if a grade is passing based on DepEd standards
 */
export const isPassing = (grade: number | null): boolean => {
    return grade !== null && grade >= PASSING_GRADE;
};

/**
 * Get grade descriptor based on DepEd standards
 */
export const getGradeDescriptor = (grade: number | null): string => {
    if (grade === null) return 'No Grade';
    if (grade >= 90) return 'Outstanding';
    if (grade >= 85) return 'Very Satisfactory';
    if (grade >= 80) return 'Satisfactory';
    if (grade >= 75) return 'Fairly Satisfactory';
    return 'Did Not Meet Expectations';
};

/**
 * Get color class for grade display based on DepEd thresholds
 */
export const getGradeColorClass = (grade: number | null): string => {
    if (grade === null) return 'text-muted-foreground';
    if (grade >= 90) return 'text-green-600 font-medium';    // Outstanding
    if (grade >= 85) return 'text-blue-600';                  // Very Satisfactory
    if (grade >= 80) return 'text-cyan-600';                  // Satisfactory
    if (grade >= 75) return 'text-yellow-600';                // Fairly Satisfactory
    return 'text-red-600 font-medium';                        // Did Not Meet Expectations
};
