import { supabase } from '@/integrations/supabase/client';
import { ReportFiltersState, ReportData } from './reportTypes';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ─── Data Fetchers ──────────────────────────────────────────

export async function fetchEnrollmentSummary(schoolId: string, filters: ReportFiltersState): Promise<ReportData> {
  let query = supabase.from('students').select('id, student_name, level, section, gender, status, lrn', { count: 'exact' }).eq('school_id', schoolId) as any;
  if (filters.schoolYearId) query = query.eq('academic_year_id', filters.schoolYearId);
  if (filters.gradeLevel) query = query.eq('level', filters.gradeLevel);
  if (filters.section) query = query.eq('section', filters.section);
  if (filters.status === 'active') query = query.eq('status', 'active');
  if (filters.status === 'inactive') query = query.eq('status', 'inactive');
  if (filters.studentSearch) query = query.or(`student_name.ilike.%${filters.studentSearch}%,lrn.ilike.%${filters.studentSearch}%`);
  query = query.order('level').order('student_name').limit(500);

  const { data, count, error } = await query;
  if (error) throw error;

  // Summarize by grade level
  const levelMap: Record<string, { total: number; male: number; female: number }> = {};
  (data || []).forEach((s: any) => {
    const lvl = s.level || 'Unknown';
    if (!levelMap[lvl]) levelMap[lvl] = { total: 0, male: 0, female: 0 };
    levelMap[lvl].total++;
    if (s.gender?.toUpperCase() === 'MALE') levelMap[lvl].male++;
    else if (s.gender?.toUpperCase() === 'FEMALE') levelMap[lvl].female++;
  });

  const rows = Object.entries(levelMap).map(([level, d]) => ({ level, total: d.total, male: d.male, female: d.female }));

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
  let query = supabase.from('students').select('id, lrn, student_name, level, section, gender, birth_date, status, contact_number, address', { count: 'exact' }).eq('school_id', schoolId) as any;
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

export async function fetchClassGradeSummary(schoolId: string, filters: ReportFiltersState): Promise<ReportData> {
  let query = supabase.from('student_grades').select(`
    id, quarter, grade, student_id, subject_id,
    students!inner(student_name, level, section, school_id),
    subjects!inner(name)
  `).eq('students.school_id', schoolId) as any;

  if (filters.schoolYearId) query = query.eq('academic_year_id', filters.schoolYearId);
  if (filters.quarter) query = query.eq('quarter', filters.quarter);
  query = query.limit(500);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data || []).map((g: any) => ({
    student_name: g.students?.student_name,
    level: g.students?.level,
    section: g.students?.section,
    subject: g.subjects?.name,
    quarter: g.quarter,
    grade: g.grade,
    status: (g.grade ?? 0) >= 75 ? 'Passing' : 'At Risk',
  }));

  return {
    columns: [
      { key: 'student_name', label: 'Student' },
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

export async function fetchDailyAttendance(schoolId: string, filters: ReportFiltersState): Promise<ReportData> {
  let query = supabase.from('student_attendance').select(`
    id, date, status, student_id,
    students!inner(student_name, level, section, school_id)
  `).eq('students.school_id', schoolId) as any;

  if (filters.schoolYearId) query = query.eq('academic_year_id', filters.schoolYearId);
  if (filters.dateFrom) query = query.gte('date', filters.dateFrom);
  if (filters.dateTo) query = query.lte('date', filters.dateTo);
  query = query.order('date', { ascending: false }).limit(500);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data || []).map((a: any) => ({
    date: a.date,
    student_name: a.students?.student_name,
    level: a.students?.level,
    section: a.students?.section,
    status: a.status,
  }));

  return {
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'student_name', label: 'Student' },
      { key: 'level', label: 'Grade' },
      { key: 'section', label: 'Section' },
      { key: 'status', label: 'Status' },
    ],
    rows,
    totalCount: rows.length,
  };
}

export async function fetchTeacherLoad(schoolId: string, _filters: ReportFiltersState): Promise<ReportData> {
  const query = supabase.from('teachers').select('id, name, email, specialization, employment_status') as any;
  const { data, error } = await query.eq('school_id', schoolId).order('name').limit(200);
  if (error) throw error;

  return {
    columns: [
      { key: 'name', label: 'Teacher' },
      { key: 'email', label: 'Email' },
      { key: 'specialization', label: 'Specialization' },
      { key: 'employment_status', label: 'Status' },
    ],
    rows: data || [],
    totalCount: (data || []).length,
  };
}

export async function fetchDataCompleteness(schoolId: string, filters: ReportFiltersState): Promise<ReportData> {
  let query = supabase.from('students').select('id, lrn, student_name, level, section, gender, birth_date, address, contact_number, mother_name, father_name').eq('school_id', schoolId);
  if (filters.schoolYearId) query = query.eq('academic_year_id', filters.schoolYearId);
  query = query.limit(500);

  const { data, error } = await query;
  if (error) throw error;

  const fields = ['lrn', 'gender', 'birth_date', 'address', 'contact_number', 'mother_name', 'father_name'];
  const rows = (data || []).filter((s: any) => fields.some(f => !s[f])).map((s: any) => ({
    student_name: s.student_name,
    level: s.level,
    section: s.section,
    missing: fields.filter(f => !s[f]).join(', '),
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
  const { data, error } = await supabase.from('data_exports').select('*').eq('school_id', schoolId).order('exported_at', { ascending: false }).limit(100);
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

export async function generateReport(subTypeId: string, schoolId: string, filters: ReportFiltersState): Promise<ReportData> {
  switch (subTypeId) {
    case 'enrollment-summary': return fetchEnrollmentSummary(schoolId, filters);
    case 'student-masterlist': return fetchStudentMasterlist(schoolId, filters);
    case 'student-profile': return fetchStudentMasterlist(schoolId, filters);
    case 'drop-transfer': return fetchStudentMasterlist(schoolId, { ...filters, status: 'inactive' });
    case 'class-grade-summary': return fetchClassGradeSummary(schoolId, filters);
    case 'student-report-card': return fetchClassGradeSummary(schoolId, filters);
    case 'at-risk-learners': return fetchClassGradeSummary(schoolId, filters);
    case 'daily-attendance': return fetchDailyAttendance(schoolId, filters);
    case 'student-attendance-detail': return fetchDailyAttendance(schoolId, filters);
    case 'tardiness-leaderboard': return fetchDailyAttendance(schoolId, filters);
    case 'teacher-load': return fetchTeacherLoad(schoolId, filters);
    case 'class-list': return fetchTeacherLoad(schoolId, filters);
    case 'data-completeness': return fetchDataCompleteness(schoolId, filters);
    case 'export-audit-log': return fetchExportAuditLog(schoolId, filters);
    default: return { columns: [], rows: [], totalCount: 0 };
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
    head: [reportData.columns.map(c => c.label)],
    body: reportData.rows.map(row => reportData.columns.map(c => String(row[c.key] ?? ''))),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

export function exportToExcel(reportData: ReportData, title: string) {
  const wsData = [
    reportData.columns.map(c => c.label),
    ...reportData.rows.map(row => reportData.columns.map(c => row[c.key] ?? '')),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}.xlsx`);
}

export function exportToCSV(reportData: ReportData, title: string) {
  const header = reportData.columns.map(c => c.label).join(',');
  const body = reportData.rows.map(row => reportData.columns.map(c => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Audit Logger ───────────────────────────────────────────

export async function logExport(userId: string, schoolId: string, academicYearId: string | null, exportType: string, tableName: string, fileName: string, recordCount: number) {
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
