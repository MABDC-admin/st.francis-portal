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
import { ReportFiltersState, DEFAULT_FILTERS, GRADE_LEVELS } from './reportTypes';

interface ReportFiltersProps {
  filters: ReportFiltersState;
  onChange: (filters: ReportFiltersState) => void;
}

export const ReportFilters = ({ filters, onChange }: ReportFiltersProps) => {
  const { academicYears, selectedYearId } = useAcademicYear();
  const [studentSearch, setStudentSearch] = useState(filters.studentSearch);

  // Set default school year from context on mount
  useEffect(() => {
    if (!filters.schoolYearId && selectedYearId) {
      onChange({ ...filters, schoolYearId: selectedYearId });
    }
  }, [selectedYearId]);

  // Debounce student search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (studentSearch !== filters.studentSearch) {
        onChange({ ...filters, studentSearch });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

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
