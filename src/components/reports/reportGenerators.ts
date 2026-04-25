import { supabase } from '@/integrations/supabase/client';
import { ReportData, ReportFiltersState } from './reportTypes';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type RoleName = string | null;

interface ReportQueryContext {
  role: RoleName;
  userId: string | null;
}

interface TeacherScope {
  teacherId: string | null;
  allowedClassKeys: Set<string>;
  allowedSubjectIds: Set<string>;
}

interface GradeEntry {
  student_id: string;
  student_name: string;
  lrn: string | null;
  level: string | null;
  section: string | null;
  student_status: string | null;
  subject_id: string;
  subject: string | null;
  q1_grade: number | null;
  q2_grade: number | null;
  q3_grade: number | null;
  q4_grade: number | null;
  final_grade: number | null;
  remarks: string | null;
}

const normalize = (value: string | null | undefined) => (value || '').trim().toLowerCase();
const classKey = (gradeLevel: string | null | undefined, section: string | null | undefined) =>
  `${normalize(gradeLevel)}::${normalize(section)}`;

const matchesSearch = (filters: ReportFiltersState, values: Array<string | null | undefined>) => {
  if (!filters.studentSearch.trim()) return true;
  const term = filters.studentSearch.trim().toLowerCase();
  return values.some((value) => (value || '').toLowerCase().includes(term));
};

const gradeFromQuarter = (
  quarter: number | null,
  grades: Pick<GradeEntry, 'q1_grade' | 'q2_grade' | 'q3_grade' | 'q4_grade' | 'final_grade'>
) => {
  switch (quarter) {
    case 1:
      return grades.q1_grade;
    case 2:
      return grades.q2_grade;
    case 3:
      return grades.q3_grade;
    case 4:
      return grades.q4_grade;
    default:
      return grades.final_grade;
  }
};

async function resolveTeacherId(userId: string | null): Promise<string | null> {
  if (!userId) return null;

  const { data: teacherByUser } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (teacherByUser?.id) return teacherByUser.id;

  const { data: credential } = await supabase
    .from('user_credentials')
    .select('teacher_id')
    .eq('user_id', userId)
    .maybeSingle();

  return credential?.teacher_id || null;
}

async function buildTeacherScope(
  schoolId: string,
  filters: ReportFiltersState,
  context?: ReportQueryContext
): Promise<TeacherScope | null> {
  if (context?.role !== 'teacher') return null;

  const teacherId = await resolveTeacherId(context.userId);
  if (!teacherId) {
    return { teacherId: null, allowedClassKeys: new Set<string>(), allowedSubjectIds: new Set<string>() };
  }

  let scopeQuery = supabase
    .from('class_schedules')
    .select('subject_id, grade_level, section')
    .eq('school_id', schoolId)
    .eq('teacher_id', teacherId);

  if (filters.schoolYearId) {
    scopeQuery = scopeQuery.eq('academic_year_id', filters.schoolYearId);
  }

  const { data: schedules, error } = await scopeQuery;
  if (error) throw error;

  const allowedClassKeys = new Set<string>();
  const allowedSubjectIds = new Set<string>();
  (schedules || []).forEach((record) => {
    if (record.subject_id) allowedSubjectIds.add(record.subject_id);
    allowedClassKeys.add(classKey(record.grade_level, record.section));
  });

  return { teacherId, allowedClassKeys, allowedSubjectIds };
}

async function buildClassScopeForTeacherId(
  schoolId: string,
  filters: ReportFiltersState,
  teacherId: string | null
): Promise<TeacherScope | null> {
  if (!teacherId) return null;

  let scopeQuery = supabase
    .from('class_schedules')
    .select('subject_id, grade_level, section')
    .eq('school_id', schoolId)
    .eq('teacher_id', teacherId);

  if (filters.schoolYearId) {
    scopeQuery = scopeQuery.eq('academic_year_id', filters.schoolYearId);
  }

  const { data: schedules, error } = await scopeQuery;
  if (error) throw error;

  const allowedClassKeys = new Set<string>();
  const allowedSubjectIds = new Set<string>();
  (schedules || []).forEach((record) => {
    if (record.subject_id) allowedSubjectIds.add(record.subject_id);
    allowedClassKeys.add(classKey(record.grade_level, record.section));
  });

  return { teacherId, allowedClassKeys, allowedSubjectIds };
}

async function fetchGradeEntries(
  schoolId: string,
  filters: ReportFiltersState,
  context?: ReportQueryContext
): Promise<GradeEntry[]> {
  let query = supabase
    .from('student_grades')
    .select(`
      student_id, subject_id, q1_grade, q2_grade, q3_grade, q4_grade, final_grade, remarks,
      students!inner(id, student_name, lrn, level, section, status, school_id),
      subjects!inner(name)
    `)
    .eq('students.school_id', schoolId) as any;

  if (filters.schoolYearId) query = query.eq('academic_year_id', filters.schoolYearId);
  query = query.limit(2000);

  const { data, error } = await query;
  if (error) throw error;

  const teacherScope = await buildTeacherScope(schoolId, filters, context);
  const explicitTeacherScope = !teacherScope && filters.teacherId
    ? await buildClassScopeForTeacherId(schoolId, filters, filters.teacherId)
    : null;
  const activeScope = teacherScope || explicitTeacherScope;

  const rows = ((data || []) as any[])
    .map((record) => ({
      student_id: record.student_id,
      student_name: record.students?.student_name || '',
      lrn: record.students?.lrn || null,
      level: record.students?.level || null,
      section: record.students?.section || null,
      student_status: record.students?.status || null,
      subject_id: record.subject_id,
      subject: record.subjects?.name || null,
      q1_grade: record.q1_grade,
      q2_grade: record.q2_grade,
      q3_grade: record.q3_grade,
      q4_grade: record.q4_grade,
      final_grade: record.final_grade,
      remarks: record.remarks || null,
    }))
    .filter((row) => {
      if (activeScope) {
        if (!activeScope.teacherId) return false;
        const key = classKey(row.level, row.section);
        const classAllowed = activeScope.allowedClassKeys.has(key);
        const subjectAllowed = activeScope.allowedSubjectIds.has(row.subject_id);
        if (!classAllowed || !subjectAllowed) return false;
      }

      if (filters.gradeLevel && row.level !== filters.gradeLevel) return false;
      if (filters.section && normalize(row.section) !== normalize(filters.section)) return false;
      if (filters.status === 'active' && normalize(row.student_status) !== 'active') return false;
      if (filters.status === 'inactive' && normalize(row.student_status) !== 'inactive') return false;
      return matchesSearch(filters, [row.student_name, row.lrn]);
    });

  return rows;
}

// ─── Data Fetchers ──────────────────────────────────────────

export async function fetchEnrollmentSummary(schoolId: string, filters: ReportFiltersState): Promise<ReportData> {
  let query = supabase
    .from('students')
    .select('id, student_name, level, section, gender, status, lrn', { count: 'exact' })
    .eq('school_id', schoolId) as any;
  if (filters.schoolYearId) query = query.eq('academic_year_id', filters.schoolYearId);
  if (filters.gradeLevel) query = query.eq('level', filters.gradeLevel);
  if (filters.section) query = query.eq('section', filters.section);
  if (filters.status === 'active') query = query.eq('status', 'active');
  if (filters.status === 'inactive') query = query.eq('status', 'inactive');
  if (filters.studentSearch) query = query.or(`student_name.ilike.%${filters.studentSearch}%,lrn.ilike.%${filters.studentSearch}%`);
  query = query.order('level').order('student_name').limit(500);

  const { data, count, error } = await query;
  if (error) throw error;

  const levelMap: Record<string, { total: number; male: number; female: number }> = {};
  (data || []).forEach((student: any) => {
    const level = student.level || 'Unknown';
    if (!levelMap[level]) levelMap[level] = { total: 0, male: 0, female: 0 };
    levelMap[level].total++;
    if (student.gender?.toUpperCase() === 'MALE') levelMap[level].male++;
    else if (student.gender?.toUpperCase() === 'FEMALE') levelMap[level].female++;
  });

  const rows = Object.entries(levelMap).map(([level, metrics]) => ({
    level,
    total: metrics.total,
    male: metrics.male,
    female: metrics.female,
  }));

  return {
    columns: [
      { key: 'level', label: 'Grade Level' },
      { key: 'total', label: 'Total' },
      { key: 'male', label: 'Male' },
      { key: 'female', label: 'Female' },
    ],
    rows,
    totalCount: count || 0,
    summary: { totalStudents: count || 0 },
  };
}

export async function fetchStudentMasterlist(schoolId: string, filters: ReportFiltersState): Promise<ReportData> {
  let query = supabase
    .from('students')
    .select('id, lrn, student_name, level, section, gender, birth_date, status, contact_number, address', { count: 'exact' })
    .eq('school_id', schoolId) as any;
  if (filters.schoolYearId) query = query.eq('academic_year_id', filters.schoolYearId);
  if (filters.gradeLevel) query = query.eq('level', filters.gradeLevel);
  if (filters.section) query = query.eq('section', filters.section);
  if (filters.status === 'active') query = query.eq('status', 'active');
  if (filters.status === 'inactive') query = query.eq('status', 'inactive');
  if (filters.studentSearch) query = query.or(`student_name.ilike.%${filters.studentSearch}%,lrn.ilike.%${filters.studentSearch}%`);
  query = query.order('level').order('student_name').limit(500);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    columns: [
      { key: 'lrn', label: 'LRN' },
      { key: 'student_name', label: 'Name' },
      { key: 'level', label: 'Grade' },
      { key: 'section', label: 'Section' },
      { key: 'gender', label: 'Gender' },
      { key: 'birth_date', label: 'Birth Date' },
      { key: 'status', label: 'Status' },
    ],
    rows: data || [],
    totalCount: count || 0,
  };
}

export async function fetchClassGradeSummary(
  schoolId: string,
  filters: ReportFiltersState,
  context?: ReportQueryContext
): Promise<ReportData> {
  const entries = await fetchGradeEntries(schoolId, filters, context);
  const quarterLabel = filters.quarter ? `Q${filters.quarter}` : 'Final';

  const rows = entries.map((entry) => {
    const gradeValue = gradeFromQuarter(filters.quarter, entry);
    return {
      student_name: entry.student_name,
      lrn: entry.lrn,
      level: entry.level,
      section: entry.section,
      subject: entry.subject,
      quarter: quarterLabel,
      grade: gradeValue,
      status: gradeValue === null ? 'No Grade' : gradeValue >= 75 ? 'Passing' : 'At Risk',
    };
  });

  return {
    columns: [
      { key: 'student_name', label: 'Student' },
      { key: 'lrn', label: 'LRN' },
      { key: 'level', label: 'Grade' },
      { key: 'section', label: 'Section' },
      { key: 'subject', label: 'Subject' },
      { key: 'quarter', label: 'Quarter' },
      { key: 'grade', label: 'Grade' },
      { key: 'status', label: 'Status' },
    ],
    rows,
    totalCount: rows.length,
  };
}

export async function fetchStudentReportCard(
  schoolId: string,
  filters: ReportFiltersState,
  context?: ReportQueryContext
): Promise<ReportData> {
  const entries = await fetchGradeEntries(schoolId, filters, context);

  const rows = entries.map((entry) => {
    const basis = gradeFromQuarter(filters.quarter, entry);
    return {
      student_name: entry.student_name,
      lrn: entry.lrn,
      level: entry.level,
      section: entry.section,
      subject: entry.subject,
      q1: entry.q1_grade,
      q2: entry.q2_grade,
      q3: entry.q3_grade,
      q4: entry.q4_grade,
      final: entry.final_grade,
      remarks: entry.remarks,
      status: basis === null ? 'No Grade' : basis >= 75 ? 'Passing' : 'At Risk',
    };
  });

  return {
    columns: [
      { key: 'student_name', label: 'Student' },
      { key: 'lrn', label: 'LRN' },
      { key: 'level', label: 'Grade' },
      { key: 'section', label: 'Section' },
      { key: 'subject', label: 'Subject' },
      { key: 'q1', label: 'Q1' },
      { key: 'q2', label: 'Q2' },
      { key: 'q3', label: 'Q3' },
      { key: 'q4', label: 'Q4' },
      { key: 'final', label: 'Final' },
      { key: 'remarks', label: 'Remarks' },
      { key: 'status', label: 'Status' },
    ],
    rows,
    totalCount: rows.length,
  };
}

export async function fetchAtRiskLearners(
  schoolId: string,
  filters: ReportFiltersState,
  context?: ReportQueryContext
): Promise<ReportData> {
  const base = await fetchClassGradeSummary(schoolId, filters, context);
  const rows = base.rows.filter((row) => typeof row.grade === 'number' && row.grade < 75);

  return {
    ...base,
    rows,
    totalCount: rows.length,
    summary: { atRiskCount: rows.length },
  };
}

export async function fetchDailyAttendance(
  schoolId: string,
  filters: ReportFiltersState,
  context?: ReportQueryContext
): Promise<ReportData> {
  let query = supabase
    .from('student_attendance')
    .select(`
      id, date, status, student_id,
      students!inner(student_name, lrn, level, section, status, school_id)
    `)
    .eq('students.school_id', schoolId) as any;

  if (filters.schoolYearId) query = query.eq('academic_year_id', filters.schoolYearId);
  if (filters.dateFrom) query = query.gte('date', filters.dateFrom);
  if (filters.dateTo) query = query.lte('date', filters.dateTo);
  if (filters.gradeLevel) query = query.eq('students.level', filters.gradeLevel);
  if (filters.section) query = query.eq('students.section', filters.section);
  query = query.order('date', { ascending: false }).limit(2000);

  const { data, error } = await query;
  if (error) throw error;

  const teacherScope = await buildTeacherScope(schoolId, filters, context);
  const explicitTeacherScope = !teacherScope && filters.teacherId
    ? await buildClassScopeForTeacherId(schoolId, filters, filters.teacherId)
    : null;
  const activeScope = teacherScope || explicitTeacherScope;

  const rows = ((data || []) as any[])
    .map((record) => ({
      date: record.date,
      student_name: record.students?.student_name || '',
      lrn: record.students?.lrn || null,
      level: record.students?.level || null,
      section: record.students?.section || null,
      status: record.status,
      student_status: record.students?.status || null,
    }))
    .filter((row) => {
      if (activeScope) {
        if (!activeScope.teacherId) return false;
        if (!activeScope.allowedClassKeys.has(classKey(row.level, row.section))) return false;
      }
      if (filters.status === 'active' && normalize(row.student_status) !== 'active') return false;
      if (filters.status === 'inactive' && normalize(row.student_status) !== 'inactive') return false;
      return matchesSearch(filters, [row.student_name, row.lrn]);
    });

  return {
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'student_name', label: 'Student' },
      { key: 'lrn', label: 'LRN' },
      { key: 'level', label: 'Grade' },
      { key: 'section', label: 'Section' },
      { key: 'status', label: 'Attendance Status' },
    ],
    rows,
    totalCount: rows.length,
  };
}

export async function fetchTeacherLoad(
  schoolId: string,
  filters: ReportFiltersState,
  context?: ReportQueryContext
): Promise<ReportData> {
  const teacherScope = await buildTeacherScope(schoolId, filters, context);
  if (teacherScope && !teacherScope.teacherId) {
    return { columns: [], rows: [], totalCount: 0 };
  }

  let query = supabase
    .from('class_schedules')
    .select(`
      id, teacher_id, grade_level, section, subject_id,
      teachers:teacher_id(full_name, email, status),
      subjects:subject_id(name, code)
    `)
    .eq('school_id', schoolId) as any;

  if (filters.schoolYearId) query = query.eq('academic_year_id', filters.schoolYearId);
  if (filters.gradeLevel) query = query.eq('grade_level', filters.gradeLevel);
  if (filters.section) query = query.eq('section', filters.section);

  if (teacherScope) query = query.eq('teacher_id', teacherScope.teacherId);
  else if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId);

  const { data, error } = await query.limit(2000);
  if (error) throw error;

  const grouped = new Map<string, any>();
  (data || []).forEach((record: any) => {
    const teacherId = record.teacher_id || 'unassigned';
    if (!grouped.has(teacherId)) {
      grouped.set(teacherId, {
        teacher_name: record.teachers?.full_name || 'Unassigned',
        email: record.teachers?.email || '',
        status: record.teachers?.status || 'unknown',
        class_count: 0,
        subjects: new Set<string>(),
        grade_levels: new Set<string>(),
        sections: new Set<string>(),
      });
    }

    const entry = grouped.get(teacherId);
    entry.class_count += 1;
    entry.grade_levels.add(record.grade_level || 'Unknown');
    entry.sections.add(record.section ? `${record.grade_level} - ${record.section}` : `${record.grade_level}`);
    if (record.subjects?.name) {
      entry.subjects.add(record.subjects.code ? `${record.subjects.code} (${record.subjects.name})` : record.subjects.name);
    }
  });

  const rows = Array.from(grouped.values())
    .map((entry) => ({
      teacher_name: entry.teacher_name,
      email: entry.email,
      status: entry.status,
      class_count: entry.class_count,
      subject_count: entry.subjects.size,
      grade_levels: Array.from(entry.grade_levels).sort().join(', '),
      sections: Array.from(entry.sections).sort().join(', '),
    }))
    .filter((row) => !filters.studentSearch || row.teacher_name.toLowerCase().includes(filters.studentSearch.toLowerCase()))
    .sort((a, b) => a.teacher_name.localeCompare(b.teacher_name));

  return {
    columns: [
      { key: 'teacher_name', label: 'Teacher' },
      { key: 'email', label: 'Email' },
      { key: 'status', label: 'Status' },
      { key: 'class_count', label: 'Classes' },
      { key: 'subject_count', label: 'Subjects' },
      { key: 'grade_levels', label: 'Grade Levels' },
      { key: 'sections', label: 'Sections' },
    ],
    rows,
    totalCount: rows.length,
  };
}

export async function fetchClassList(
  schoolId: string,
  filters: ReportFiltersState,
  context?: ReportQueryContext
): Promise<ReportData> {
  const teacherScope = await buildTeacherScope(schoolId, filters, context);
  if (teacherScope && !teacherScope.teacherId) {
    return { columns: [], rows: [], totalCount: 0 };
  }

  let schedulesQuery = supabase
    .from('class_schedules')
    .select(`
      teacher_id, grade_level, section,
      teachers:teacher_id(full_name, email)
    `)
    .eq('school_id', schoolId) as any;

  if (filters.schoolYearId) schedulesQuery = schedulesQuery.eq('academic_year_id', filters.schoolYearId);
  if (filters.gradeLevel) schedulesQuery = schedulesQuery.eq('grade_level', filters.gradeLevel);
  if (filters.section) schedulesQuery = schedulesQuery.eq('section', filters.section);

  if (teacherScope) schedulesQuery = schedulesQuery.eq('teacher_id', teacherScope.teacherId);
  else if (filters.teacherId) schedulesQuery = schedulesQuery.eq('teacher_id', filters.teacherId);

  const { data: schedules, error: schedulesError } = await schedulesQuery.limit(2000);
  if (schedulesError) throw schedulesError;
  if (!schedules?.length) return { columns: [], rows: [], totalCount: 0 };

  const uniqueClasses = new Map<string, { teacher_name: string; teacher_email: string | null; level: string; section: string | null }>();
  schedules.forEach((schedule: any) => {
    const key = `${schedule.teacher_id || 'none'}::${classKey(schedule.grade_level, schedule.section)}`;
    if (!uniqueClasses.has(key)) {
      uniqueClasses.set(key, {
        teacher_name: schedule.teachers?.full_name || 'Unassigned',
        teacher_email: schedule.teachers?.email || null,
        level: schedule.grade_level,
        section: schedule.section || null,
      });
    }
  });

  let studentsQuery = supabase
    .from('students')
    .select('id, lrn, student_name, level, section, status')
    .eq('school_id', schoolId) as any;

  if (filters.schoolYearId) studentsQuery = studentsQuery.eq('academic_year_id', filters.schoolYearId);
  if (filters.gradeLevel) studentsQuery = studentsQuery.eq('level', filters.gradeLevel);
  if (filters.section) studentsQuery = studentsQuery.eq('section', filters.section);
  if (filters.status === 'active') studentsQuery = studentsQuery.eq('status', 'active');
  if (filters.status === 'inactive') studentsQuery = studentsQuery.eq('status', 'inactive');
  if (filters.studentSearch) {
    studentsQuery = studentsQuery.or(`student_name.ilike.%${filters.studentSearch}%,lrn.ilike.%${filters.studentSearch}%`);
  }

  const { data: students, error: studentsError } = await studentsQuery.limit(2000);
  if (studentsError) throw studentsError;

  const rows: Record<string, any>[] = [];
  const dedupe = new Set<string>();

  (students || []).forEach((student: any) => {
    uniqueClasses.forEach((classDef) => {
      const sameLevel = normalize(classDef.level) === normalize(student.level);
      const sameSection = classDef.section ? normalize(classDef.section) === normalize(student.section) : true;
      if (!sameLevel || !sameSection) return;

      const key = `${classDef.teacher_name}::${classDef.level}::${classDef.section || ''}::${student.id}`;
      if (dedupe.has(key)) return;
      dedupe.add(key);

      rows.push({
        teacher_name: classDef.teacher_name,
        teacher_email: classDef.teacher_email,
        level: classDef.level,
        section: classDef.section || student.section || '-',
        student_name: student.student_name,
        lrn: student.lrn,
        student_status: student.status,
      });
    });
  });

  rows.sort((a, b) => {
    const byTeacher = a.teacher_name.localeCompare(b.teacher_name);
    if (byTeacher !== 0) return byTeacher;
    const byLevel = (a.level || '').localeCompare(b.level || '');
    if (byLevel !== 0) return byLevel;
    const bySection = (a.section || '').localeCompare(b.section || '');
    if (bySection !== 0) return bySection;
    return (a.student_name || '').localeCompare(b.student_name || '');
  });

  return {
    columns: [
      { key: 'teacher_name', label: 'Teacher' },
      { key: 'teacher_email', label: 'Teacher Email' },
      { key: 'level', label: 'Grade' },
      { key: 'section', label: 'Section' },
      { key: 'student_name', label: 'Student' },
      { key: 'lrn', label: 'LRN' },
      { key: 'student_status', label: 'Status' },
    ],
    rows,
    totalCount: rows.length,
  };
}

export async function fetchDataCompleteness(schoolId: string, filters: ReportFiltersState): Promise<ReportData> {
  let query = supabase
    .from('students')
    .select('id, lrn, student_name, level, section, gender, birth_date, address, contact_number, mother_name, father_name')
    .eq('school_id', schoolId) as any;
  if (filters.schoolYearId) query = query.eq('academic_year_id', filters.schoolYearId);
  if (filters.gradeLevel) query = query.eq('level', filters.gradeLevel);
  if (filters.section) query = query.eq('section', filters.section);
  if (filters.status === 'active') query = query.eq('status', 'active');
  if (filters.status === 'inactive') query = query.eq('status', 'inactive');
  if (filters.studentSearch) query = query.or(`student_name.ilike.%${filters.studentSearch}%,lrn.ilike.%${filters.studentSearch}%`);
  query = query.limit(1000);

  const { data, error } = await query;
  if (error) throw error;

  const fields = ['lrn', 'gender', 'birth_date', 'address', 'contact_number', 'mother_name', 'father_name'];
  const rows = (data || [])
    .filter((student: any) => fields.some((field) => !student[field]))
    .map((student: any) => ({
      student_name: student.student_name,
      level: student.level,
      section: student.section,
      missing: fields.filter((field) => !student[field]).join(', '),
    }));

  return {
    columns: [
      { key: 'student_name', label: 'Student' },
      { key: 'level', label: 'Grade' },
      { key: 'section', label: 'Section' },
      { key: 'missing', label: 'Missing Fields' },
    ],
    rows,
    totalCount: rows.length,
    summary: { totalIncomplete: rows.length, totalChecked: (data || []).length },
  };
}

export async function fetchExportAuditLog(schoolId: string, _filters: ReportFiltersState): Promise<ReportData> {
  const { data, error } = await supabase
    .from('data_exports')
    .select('*')
    .eq('school_id', schoolId)
    .order('exported_at', { ascending: false })
    .limit(100);
  if (error) throw error;

  return {
    columns: [
      { key: 'exported_at', label: 'Date' },
      { key: 'export_type', label: 'Type' },
      { key: 'table_name', label: 'Report' },
      { key: 'file_name', label: 'File' },
      { key: 'record_count', label: 'Records' },
    ],
    rows: data || [],
    totalCount: (data || []).length,
  };
}

// ─── Report Router ──────────────────────────────────────────

export async function generateReport(
  subTypeId: string,
  schoolId: string,
  filters: ReportFiltersState,
  context?: ReportQueryContext
): Promise<ReportData> {
  switch (subTypeId) {
    case 'enrollment-summary':
      return fetchEnrollmentSummary(schoolId, filters);
    case 'student-masterlist':
      return fetchStudentMasterlist(schoolId, filters);
    case 'student-profile':
      return fetchStudentMasterlist(schoolId, filters);
    case 'drop-transfer':
      return fetchStudentMasterlist(schoolId, { ...filters, status: 'inactive' });
    case 'class-grade-summary':
      return fetchClassGradeSummary(schoolId, filters, context);
    case 'student-report-card':
      return fetchStudentReportCard(schoolId, filters, context);
    case 'at-risk-learners':
      return fetchAtRiskLearners(schoolId, filters, context);
    case 'daily-attendance':
      return fetchDailyAttendance(schoolId, filters, context);
    case 'student-attendance-detail':
      return fetchDailyAttendance(schoolId, filters, context);
    case 'tardiness-leaderboard':
      return fetchDailyAttendance(schoolId, filters, context);
    case 'teacher-load':
      return fetchTeacherLoad(schoolId, filters, context);
    case 'class-list':
      return fetchClassList(schoolId, filters, context);
    case 'data-completeness':
      return fetchDataCompleteness(schoolId, filters);
    case 'export-audit-log':
      return fetchExportAuditLog(schoolId, filters);
    default:
      return { columns: [], rows: [], totalCount: 0 };
  }
}

// ─── Export Utilities ───────────────────────────────────────

export function exportToPDF(reportData: ReportData, title: string, schoolName: string) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(schoolName, 14, 15);
  doc.setFontSize(11);
  doc.text(title, 14, 22);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  autoTable(doc, {
    startY: 34,
    head: [reportData.columns.map((column) => column.label)],
    body: reportData.rows.map((row) => reportData.columns.map((column) => String(row[column.key] ?? ''))),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

export function exportToExcel(reportData: ReportData, title: string) {
  const wsData = [
    reportData.columns.map((column) => column.label),
    ...reportData.rows.map((row) => reportData.columns.map((column) => row[column.key] ?? '')),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}.xlsx`);
}

export function exportToCSV(reportData: ReportData, title: string) {
  const header = reportData.columns.map((column) => column.label).join(',');
  const body = reportData.rows
    .map((row) => reportData.columns.map((column) => `"${String(row[column.key] ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${title.replace(/\s+/g, '_')}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ─── Audit Logger ───────────────────────────────────────────

export async function logExport(
  userId: string,
  schoolId: string,
  academicYearId: string | null,
  exportType: string,
  tableName: string,
  fileName: string,
  recordCount: number
) {
  await supabase.from('data_exports').insert({
    user_id: userId,
    school_id: schoolId,
    academic_year_id: academicYearId,
    export_type: exportType,
    table_name: tableName,
    file_name: fileName,
    record_count: recordCount,
  });
}
