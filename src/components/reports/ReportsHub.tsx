import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useSchoolId } from '@/hooks/useSchoolId';
import { ReportFilters } from './ReportFilters';
import { ReportCategoryCard } from './ReportCategoryCard';
import { ReportPreview } from './ReportPreview';
import { ReportCharts } from './ReportCharts';
import { SavedTemplates } from './SavedTemplates';
import {
  ReportFiltersState,
  ReportData,
  DEFAULT_FILTERS,
  REPORT_CATEGORIES,
} from './reportTypes';
import {
  generateReport,
  exportToPDF,
  exportToExcel,
  exportToCSV,
  logExport,
} from './reportGenerators';

export const ReportsHub = () => {
  const { user, role } = useAuth();
  const { schoolTheme } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { data: schoolId } = useSchoolId();

  const [filters, setFilters] = useState<ReportFiltersState>({ ...DEFAULT_FILTERS, schoolYearId: selectedYearId });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubTypeId, setSelectedSubTypeId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Chart data derived from report data
  const enrollmentChart = reportData && selectedSubTypeId?.startsWith('enrollment')
    ? reportData.rows.map(r => ({ grade: r.level, count: r.total || 1 }))
    : undefined;

  const gradeDistChart = reportData && (selectedSubTypeId === 'class-grade-summary' || selectedSubTypeId === 'at-risk-learners')
    ? (() => {
        const passing = reportData.rows.filter(r => r.status === 'Passing').length;
        const atRisk = reportData.rows.length - passing;
        return [{ name: 'Passing', value: passing }, { name: 'At Risk', value: atRisk }];
      })()
    : undefined;

  const attendanceChart = reportData && selectedSubTypeId?.includes('attendance')
    ? (() => {
        const byDate: Record<string, { present: number; absent: number }> = {};
        reportData.rows.forEach(r => {
          const d = r.date;
          if (!byDate[d]) byDate[d] = { present: 0, absent: 0 };
          if (r.status === 'present') byDate[d].present++;
          else byDate[d].absent++;
        });
        return Object.entries(byDate).slice(0, 30).map(([date, v]) => ({ date, ...v }));
      })()
    : undefined;

  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategoryId(prev => prev === categoryId ? null : categoryId);
    setSelectedSubTypeId(null);
    setReportData(null);
  }, []);

  const handleSelectSubType = useCallback((categoryId: string, subTypeId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubTypeId(subTypeId);
    setReportData(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedSubTypeId || !schoolId) {
      toast.error('Please select a report type');
      return;
    }
    if (!filters.schoolYearId) {
      toast.error('Please select a school year');
      return;
    }
    setIsLoading(true);
    try {
      const data = await generateReport(selectedSubTypeId, schoolId, filters);
      setReportData(data);
      if (data.rows.length === 0) toast.info('No records found for the selected filters');
    } catch (err) {
      console.error('Report generation error:', err);
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubTypeId, schoolId, filters]);

  const getReportTitle = () => {
    const cat = REPORT_CATEGORIES.find(c => c.id === selectedCategoryId);
    const st = cat?.subTypes.find(s => s.id === selectedSubTypeId);
    return st?.label || 'Report';
  };

  const handleExportPDF = useCallback(async () => {
    if (!reportData) return;
    const title = getReportTitle();
    exportToPDF(reportData, title, schoolTheme.fullName);
    if (user && schoolId) {
      await logExport(user.id, schoolId, filters.schoolYearId, 'pdf', selectedSubTypeId || '', `${title}.pdf`, reportData.rows.length);
    }
    toast.success('PDF exported');
  }, [reportData, selectedSubTypeId, user, schoolId, filters.schoolYearId]);

  const handleExportExcel = useCallback(async () => {
    if (!reportData) return;
    const title = getReportTitle();
    exportToExcel(reportData, title);
    if (user && schoolId) {
      await logExport(user.id, schoolId, filters.schoolYearId, 'excel', selectedSubTypeId || '', `${title}.xlsx`, reportData.rows.length);
    }
    toast.success('Excel exported');
  }, [reportData, selectedSubTypeId, user, schoolId, filters.schoolYearId]);

  const handleExportCSV = useCallback(async () => {
    if (!reportData) return;
    const title = getReportTitle();
    exportToCSV(reportData, title);
    if (user && schoolId) {
      await logExport(user.id, schoolId, filters.schoolYearId, 'csv', selectedSubTypeId || '', `${title}.csv`, reportData.rows.length);
    }
    toast.success('CSV exported');
  }, [reportData, selectedSubTypeId, user, schoolId, filters.schoolYearId]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleLoadTemplate = useCallback((categoryId: string, subTypeId: string, templateFilters: ReportFiltersState) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubTypeId(subTypeId);
    setFilters(templateFilters);
    setReportData(null);
    toast.success('Template loaded — click Generate');
  }, []);

  // Filter categories based on role
  const accessibleCategories = REPORT_CATEGORIES.filter(cat =>
    cat.subTypes.some(st => role && st.requiredRoles.includes(role))
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: schoolTheme.accentColor }}>
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground">Generate summaries and official printable reports</p>
          </div>
        </div>
        <SavedTemplates
          currentCategoryId={selectedCategoryId}
          currentSubTypeId={selectedSubTypeId}
          currentFilters={filters}
          onLoadTemplate={handleLoadTemplate}
        />
      </motion.div>

      {/* Filters */}
      <ReportFilters filters={filters} onChange={setFilters} />

      {/* Charts */}
      <ReportCharts
        enrollmentData={enrollmentChart}
        attendanceData={attendanceChart}
        gradeDistribution={gradeDistChart}
      />

      {/* Main Content: Categories + Preview */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Category Cards */}
        <div className="w-full lg:w-80 shrink-0 space-y-3">
          {accessibleCategories.map(cat => (
            <ReportCategoryCard
              key={cat.id}
              category={cat}
              isSelected={selectedCategoryId === cat.id}
              selectedSubTypeId={selectedSubTypeId}
              userRole={role}
              onSelectCategory={handleSelectCategory}
              onSelectSubType={handleSelectSubType}
            />
          ))}
        </div>

        {/* Right: Preview */}
        <ReportPreview
          categoryId={selectedCategoryId}
          subTypeId={selectedSubTypeId}
          data={reportData}
          isLoading={isLoading}
          onGenerate={handleGenerate}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          onExportCSV={handleExportCSV}
          onPrint={handlePrint}
        />
      </div>
    </div>
  );
};
