import { useState, useEffect, useCallback } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useSchoolId } from '@/hooks/useSchoolId';
import { supabase } from '@/integrations/supabase/client';
import { ReportFiltersState, DEFAULT_FILTERS, GRADE_LEVELS } from './reportTypes';

interface ReportFiltersProps {
  filters: ReportFiltersState;
  onChange: (filters: ReportFiltersState) => void;
  userRole: string | null;
}

interface TeacherOption {
  id: string;
  full_name: string;
  status: string | null;
}

export const ReportFilters = ({ filters, onChange, userRole }: ReportFiltersProps) => {
  const { academicYears, selectedYearId } = useAcademicYear();
  const { data: schoolId } = useSchoolId();
  const [studentSearch, setStudentSearch] = useState(filters.studentSearch);
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);

  // Set default school year from context on mount
  useEffect(() => {
    if (!filters.schoolYearId && selectedYearId) {
      onChange({ ...filters, schoolYearId: selectedYearId });
    }
  }, [filters, onChange, selectedYearId]);

  // Debounce student search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (studentSearch !== filters.studentSearch) {
        onChange({ ...filters, studentSearch });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch, filters, onChange]);

  useEffect(() => {
    let cancelled = false;

    const loadFilterOptions = async () => {
      if (!schoolId) {
        if (!cancelled) {
          setSectionOptions([]);
          setTeacherOptions([]);
        }
        return;
      }

      const { data: teachersData } = await supabase
        .from('teachers')
        .select('id, full_name, status')
        .order('full_name', { ascending: true });

      if (!cancelled) {
        const activeTeachers = ((teachersData || []) as TeacherOption[])
          .filter((teacher) => !teacher.status || teacher.status.toLowerCase() === 'active');
        setTeacherOptions(activeTeachers);
      }

      const sectionSet = new Set<string>();

      let sectionsQuery = supabase
        .from('sections')
        .select('name')
        .eq('school_id', schoolId)
        .eq('is_active', true) as any;
      if (filters.schoolYearId) {
        sectionsQuery = sectionsQuery.eq('academic_year_id', filters.schoolYearId);
      }

      const { data: sectionsData, error: sectionsError } = await sectionsQuery;
      if (!sectionsError) {
        (sectionsData || []).forEach((row: { name: string | null }) => {
          const value = (row.name || '').trim();
          if (value) sectionSet.add(value);
        });
      }

      if (sectionSet.size === 0) {
        let studentSectionsQuery = supabase
          .from('students')
          .select('section')
          .eq('school_id', schoolId) as any;
        if (filters.schoolYearId) {
          studentSectionsQuery = studentSectionsQuery.eq('academic_year_id', filters.schoolYearId);
        }

        const { data: studentSections } = await studentSectionsQuery.limit(2000);
        (studentSections || []).forEach((row: { section: string | null }) => {
          const value = (row.section || '').trim();
          if (value) sectionSet.add(value);
        });
      }

      if (!cancelled) {
        setSectionOptions(Array.from(sectionSet).sort((a, b) => a.localeCompare(b)));
      }
    };

    loadFilterOptions();
    return () => {
      cancelled = true;
    };
  }, [filters.schoolYearId, schoolId]);

  const update = useCallback(
    (partial: Partial<ReportFiltersState>) => onChange({ ...filters, ...partial }),
    [filters, onChange]
  );

  const handleReset = () => {
    setStudentSearch('');
    onChange({ ...DEFAULT_FILTERS, schoolYearId: selectedYearId });
  };

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b pb-4 mb-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* School Year */}
        <div className="w-40">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">School Year *</label>
          <Select value={filters.schoolYearId || ''} onValueChange={v => update({ schoolYearId: v })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map(y => (
                <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quarter */}
        <div className="w-32">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Quarter</label>
          <Select value={filters.quarter?.toString() || 'all'} onValueChange={v => update({ quarter: v === 'all' ? null : Number(v) })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quarters</SelectItem>
              <SelectItem value="1">Q1</SelectItem>
              <SelectItem value="2">Q2</SelectItem>
              <SelectItem value="3">Q3</SelectItem>
              <SelectItem value="4">Q4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grade Level */}
        <div className="w-36">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Grade Level</label>
          <Select value={filters.gradeLevel || 'all'} onValueChange={v => update({ gradeLevel: v === 'all' ? null : v })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {GRADE_LEVELS.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Section */}
        <div className="w-36">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Section</label>
          <Select value={filters.section || 'all'} onValueChange={(v) => update({ section: v === 'all' ? null : v })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sectionOptions.map((section) => (
                <SelectItem key={section} value={section}>{section}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Teacher */}
        {(userRole === 'admin' || userRole === 'registrar') && (
          <div className="w-44">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Teacher</label>
            <Select value={filters.teacherId || 'all'} onValueChange={(v) => update({ teacherId: v === 'all' ? null : v })}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                {teacherOptions.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Student Search */}
        <div className="w-48">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Student</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="h-9 pl-8 text-sm"
              placeholder="Search by name/LRN"
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Date From */}
        <div className="w-36">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Date From</label>
          <Input
            type="date"
            className="h-9 text-sm"
            value={filters.dateFrom || ''}
            onChange={e => update({ dateFrom: e.target.value || null })}
          />
        </div>

        {/* Date To */}
        <div className="w-36">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Date To</label>
          <Input
            type="date"
            className="h-9 text-sm"
            value={filters.dateTo || ''}
            onChange={e => update({ dateTo: e.target.value || null })}
          />
        </div>

        {/* Status */}
        <div className="w-28">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
          <Select value={filters.status} onValueChange={(v: any) => update({ status: v })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset */}
        <Button variant="ghost" size="sm" className="h-9" onClick={handleReset}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  );
};
