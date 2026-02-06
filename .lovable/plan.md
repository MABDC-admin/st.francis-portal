
# DepEd-Compliant General Average Implementation

## Summary

This plan replaces the non-standard "GPA" calculation with DepEd-compliant "General Average" calculations following DepEd Order No. 8, s. 2015. The changes will properly integrate the existing `gradeComputation.ts` utility and add per-quarter averages with visual indicators.

## What's Wrong Currently

| Issue | Current State | DepEd Standard |
|-------|---------------|----------------|
| Terminology | "GPA" | "General Average" (GA) |
| Calculation | Simple arithmetic average of `final_grade` | Average of transmuted quarterly grades |
| Passing Mark | Not shown | 75 is the passing threshold |
| Quarterly View | No per-quarter averages | Q1, Q2, Q3, Q4 General Averages |
| Visual Feedback | None | Color-coded passing/failing indicators |

## Implementation Overview

```text
+------------------------------------------------------------------+
|                     STUDENT PORTAL - GRADES                       |
+------------------------------------------------------------------+
|                                                                   |
|  Quick Stats Cards:                                               |
|  +-----------+ +-----------+ +-----------+ +-----------+         |
|  | Level     | | Subjects  | | Gen. Avg. | | Events    |         |
|  | Level 3   | | 8         | | 87.50     | | 2         |         |
|  +-----------+ +-----------+ +-----------+ +-----------+         |
|                                                                   |
|  Quarterly General Averages:                                      |
|  +-------+ +-------+ +-------+ +-------+ +----------+            |
|  |  Q1   | |  Q2   | |  Q3   | |  Q4   | |  Final   |            |
|  | 88.25 | | 87.00 | | 86.50 | | 88.00 | |  87.44   |            |
|  +-------+ +-------+ +-------+ +-------+ +----------+            |
|                                                                   |
|  Grades Table with Pass/Fail Indicators:                          |
|  +----------+----+----+----+----+-------+--------+               |
|  | Subject  | Q1 | Q2 | Q3 | Q4 | Final | Status |               |
|  +----------+----+----+----+----+-------+--------+               |
|  | English  | 90 | 88 | 85 | 87 |  87.5 | PASSED |               |
|  | Math     | 72 | 74 | 73 | 71 |  72.5 | FAILED |               |
|  +----------+----+----+----+----+-------+--------+               |
+------------------------------------------------------------------+
```

## Technical Changes

### 1. Add New Utility Functions (src/utils/gradeComputation.ts)

Add helper functions for computing General Averages:

```typescript
/**
 * Computes General Average for a single quarter across all subjects
 * DepEd: GA = Sum of all subject grades / Number of subjects
 */
export const computeQuarterlyGeneralAverage = (
  grades: { q1_grade?: number | null; q2_grade?: number | null; 
            q3_grade?: number | null; q4_grade?: number | null }[],
  quarter: 'q1' | 'q2' | 'q3' | 'q4'
): number | null => {
  const key = `${quarter}_grade` as keyof typeof grades[0];
  const validGrades = grades.filter(g => g[key] != null).map(g => g[key] as number);
  if (validGrades.length === 0) return null;
  return validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length;
};

/**
 * Computes Annual General Average (average of Q1-Q4 GAs)
 */
export const computeAnnualGeneralAverage = (
  grades: { final_grade?: number | null }[]
): number | null => {
  const validGrades = grades.filter(g => g.final_grade != null).map(g => g.final_grade as number);
  if (validGrades.length === 0) return null;
  return validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length;
};

/**
 * DepEd passing threshold
 */
export const PASSING_GRADE = 75;

/**
 * Check if a grade is passing
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
```

### 2. Update StudentPortal.tsx

#### 2a. Import the utility functions

```typescript
import {
  computeQuarterlyGeneralAverage,
  computeAnnualGeneralAverage,
  isPassing,
  getGradeDescriptor,
  PASSING_GRADE
} from '@/utils/gradeComputation';
```

#### 2b. Replace GPA calculation with General Average (lines 173-180)

```typescript
// Compute General Averages per quarter and annual
const generalAverages = useMemo(() => {
  if (!grades || grades.length === 0) return null;
  
  return {
    q1: computeQuarterlyGeneralAverage(grades, 'q1'),
    q2: computeQuarterlyGeneralAverage(grades, 'q2'),
    q3: computeQuarterlyGeneralAverage(grades, 'q3'),
    q4: computeQuarterlyGeneralAverage(grades, 'q4'),
    annual: computeAnnualGeneralAverage(grades)
  };
}, [grades]);
```

#### 2c. Update Quick Stats Card (lines 252-265)

Change "GPA" label to "Gen. Average" and add color-coding:

```typescript
<Card className={`bg-gradient-to-br ${
  generalAverages?.annual && isPassing(generalAverages.annual)
    ? 'from-purple-500/10 to-purple-600/5 border-purple-200/50'
    : generalAverages?.annual
      ? 'from-red-500/10 to-red-600/5 border-red-200/50'
      : 'from-gray-500/10 to-gray-600/5 border-gray-200/50'
}`}>
  <CardContent className="p-4">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full ${
        generalAverages?.annual && isPassing(generalAverages.annual)
          ? 'bg-purple-500/20'
          : 'bg-red-500/20'
      }`}>
        <Award className={`h-5 w-5 ${
          generalAverages?.annual && isPassing(generalAverages.annual)
            ? 'text-purple-600'
            : 'text-red-600'
        }`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Gen. Average</p>
        <p className={`font-semibold ${
          generalAverages?.annual && isPassing(generalAverages.annual)
            ? 'text-purple-600'
            : generalAverages?.annual
              ? 'text-red-600'
              : ''
        }`}>
          {generalAverages?.annual?.toFixed(2) || 'N/A'}
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

#### 2d. Add Quarterly General Averages Section (after Quick Stats)

```typescript
{/* Quarterly General Averages - DepEd Compliant */}
{generalAverages && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 }}
  >
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5" />
          Quarterly General Averages
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-3">
          {(['q1', 'q2', 'q3', 'q4'] as const).map((quarter) => {
            const avg = generalAverages[quarter];
            const passing = isPassing(avg);
            return (
              <div
                key={quarter}
                className={`p-4 rounded-lg text-center ${
                  avg === null
                    ? 'bg-muted/50'
                    : passing
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                }`}
              >
                <p className="text-xs text-muted-foreground uppercase font-medium">
                  {quarter.toUpperCase()}
                </p>
                <p className={`text-xl font-bold ${
                  avg === null
                    ? 'text-muted-foreground'
                    : passing
                      ? 'text-green-600'
                      : 'text-red-600'
                }`}>
                  {avg?.toFixed(2) || '-'}
                </p>
                {avg !== null && (
                  <Badge variant={passing ? 'default' : 'destructive'} className="mt-1 text-xs">
                    {passing ? 'Passed' : 'Failed'}
                  </Badge>
                )}
              </div>
            );
          })}
          {/* Annual/Final Average */}
          <div
            className={`p-4 rounded-lg text-center ${
              generalAverages.annual === null
                ? 'bg-muted/50'
                : isPassing(generalAverages.annual)
                  ? 'bg-purple-50 border-2 border-purple-300'
                  : 'bg-red-50 border-2 border-red-300'
            }`}
          >
            <p className="text-xs text-muted-foreground uppercase font-medium">
              Final
            </p>
            <p className={`text-xl font-bold ${
              generalAverages.annual === null
                ? 'text-muted-foreground'
                : isPassing(generalAverages.annual)
                  ? 'text-purple-600'
                  : 'text-red-600'
            }`}>
              {generalAverages.annual?.toFixed(2) || '-'}
            </p>
            {generalAverages.annual !== null && (
              <Badge 
                variant={isPassing(generalAverages.annual) ? 'default' : 'destructive'} 
                className="mt-1 text-xs"
              >
                {getGradeDescriptor(generalAverages.annual)}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)}
```

#### 2e. Update Grades Table with Pass/Fail Indicators (lines 326-356)

Add a Status column and color-code individual grades:

```typescript
<thead>
  <tr className="border-b">
    <th className="text-left py-3 px-2 font-medium">Subject</th>
    <th className="text-center py-3 px-2 font-medium">Q1</th>
    <th className="text-center py-3 px-2 font-medium">Q2</th>
    <th className="text-center py-3 px-2 font-medium">Q3</th>
    <th className="text-center py-3 px-2 font-medium">Q4</th>
    <th className="text-center py-3 px-2 font-medium">Final</th>
    <th className="text-center py-3 px-2 font-medium">Status</th>
  </tr>
</thead>
<tbody>
  {grades.map((grade: any) => {
    const finalGrade = grade.final_grade;
    const passing = isPassing(finalGrade);
    return (
      <tr key={grade.id} className="border-b hover:bg-muted/50">
        <td className="py-3 px-2">
          <div>
            <p className="font-medium">{grade.subjects?.name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{grade.subjects?.code}</p>
          </div>
        </td>
        <td className={`text-center py-3 px-2 ${getGradeColorClass(grade.q1_grade)}`}>
          {grade.q1_grade ?? '-'}
        </td>
        <td className={`text-center py-3 px-2 ${getGradeColorClass(grade.q2_grade)}`}>
          {grade.q2_grade ?? '-'}
        </td>
        <td className={`text-center py-3 px-2 ${getGradeColorClass(grade.q3_grade)}`}>
          {grade.q3_grade ?? '-'}
        </td>
        <td className={`text-center py-3 px-2 ${getGradeColorClass(grade.q4_grade)}`}>
          {grade.q4_grade ?? '-'}
        </td>
        <td className={`text-center py-3 px-2 font-semibold ${getGradeColorClass(finalGrade)}`}>
          {finalGrade ?? '-'}
        </td>
        <td className="text-center py-3 px-2">
          {finalGrade !== null && (
            <Badge variant={passing ? 'default' : 'destructive'}>
              {passing ? 'PASSED' : 'FAILED'}
            </Badge>
          )}
        </td>
      </tr>
    );
  })}
</tbody>
```

#### 2f. Add helper function for grade colors

```typescript
// Helper for grade color classes based on DepEd thresholds
const getGradeColorClass = (grade: number | null): string => {
  if (grade === null) return 'text-muted-foreground';
  if (grade >= 90) return 'text-green-600 font-medium';    // Outstanding
  if (grade >= 85) return 'text-blue-600';                  // Very Satisfactory
  if (grade >= 80) return 'text-cyan-600';                  // Satisfactory
  if (grade >= 75) return 'text-yellow-600';                // Fairly Satisfactory
  return 'text-red-600 font-medium';                        // Did Not Meet Expectations
};
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/utils/gradeComputation.ts` | Add quarterly/annual GA functions, isPassing, getGradeDescriptor |
| `src/components/portals/StudentPortal.tsx` | Replace GPA with GA, add quarterly averages section, enhance grades table |

## DepEd Compliance Summary

| Standard | Implementation |
|----------|----------------|
| **General Average** | Sum of final grades / Number of subjects |
| **Quarterly GA** | Computed per quarter (Q1, Q2, Q3, Q4) |
| **Passing Grade** | 75 (constant `PASSING_GRADE`) |
| **Descriptors** | Outstanding (90+), Very Satisfactory (85-89), Satisfactory (80-84), Fairly Satisfactory (75-79), Did Not Meet Expectations (<75) |
| **Visual Indicators** | Green = passing, Red = failing |
| **Terminology** | "General Average" instead of "GPA" |

## Data Flow

```text
student_grades table (Q1, Q2, Q3, Q4, final_grade)
         │
         ▼
useStudentGrades hook (fetches all grades for student)
         │
         ▼
computeQuarterlyGeneralAverage() ─────► Q1 GA, Q2 GA, Q3 GA, Q4 GA
         │
         ▼
computeAnnualGeneralAverage() ────────► Final Annual GA
         │
         ▼
StudentPortal UI (Quick Stats + Quarterly Cards + Table)
```

## No Database Changes Required

The existing `student_grades` table already has all necessary columns:
- `q1_grade`, `q2_grade`, `q3_grade`, `q4_grade` - quarterly grades
- `final_grade` - annual final grade per subject
- `school_id`, `academic_year_id` - for proper school/year segregation

The calculation logic will use the existing data structure.
