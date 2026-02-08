import { useState, useMemo, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  Trash2,
  Filter,
  Download,
  X,
  LayoutGrid,
  List,
  GraduationCap,
  Rows3,
  PanelLeftClose,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Student } from '@/types/student';
import { StudentCard } from './StudentCard';
import { StudentHoverPreview } from './StudentHoverPreview';
import { StudentDetailPanel } from './StudentDetailPanel';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatName } from '@/utils/textFormatting';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface StudentTableProps {
  students: Student[];
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  isLoading?: boolean;
}

type SortField = 'student_name' | 'level' | 'age' | 'gender';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'cards' | 'table' | 'compact' | 'split';

const ITEMS_PER_PAGE = 18;

const SCHOOLS = [
  { id: 'all', name: 'All Schools', acronym: 'ALL', dbValue: '' },
  { id: 'mabdc', name: 'M.A Brain Development Center', acronym: 'MABDC', dbValue: 'MABDC' },
  { id: 'stfxsa', name: 'St. Francis Xavier Smart Academy Inc', acronym: 'STFXSA', dbValue: 'STFXSA' },
];

export const StudentTable = ({
  students,
  onView,
  onEdit,
  onDelete,
  isLoading
}: StudentTableProps) => {
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('student_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  // Get unique levels and genders for filters
  const levels = useMemo(() => {
    const uniqueLevels = [...new Set(students.map(s => s.level))].filter(Boolean).sort();
    return uniqueLevels;
  }, [students]);

  const genders = useMemo(() => {
    const uniqueGenders = [...new Set(students.map(s => s.gender))].filter(Boolean);
    return uniqueGenders;
  }, [students]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    const selectedSchool = SCHOOLS.find(s => s.id === schoolFilter);
    return students
      .filter(student => {
        const matchesSearch =
          student.student_name.toLowerCase().includes(search.toLowerCase()) ||
          student.lrn.toLowerCase().includes(search.toLowerCase());
        const matchesLevel = levelFilter === 'all' || student.level === levelFilter;
        const matchesGender = genderFilter === 'all' || student.gender === genderFilter;
        const matchesSchool = schoolFilter === 'all' || student.school === selectedSchool?.dbValue;
        return matchesSearch && matchesLevel && matchesGender && matchesSchool;
      })
      .sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

        if (typeof aVal === 'string') {
          const comparison = aVal.localeCompare(bVal as string);
          return sortDirection === 'asc' ? comparison : -comparison;
        }

        const comparison = (aVal as number) - (bVal as number);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [students, search, schoolFilter, levelFilter, genderFilter, sortField, sortDirection]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, schoolFilter, levelFilter, genderFilter, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <ChevronUp className="h-4 w-4" /> :
      <ChevronDown className="h-4 w-4" />;
  };

  const exportToCSV = () => {
    const headers = ['LRN', 'Name', 'Level', 'Age', 'Gender', 'Mother Contact', 'Father Contact'];
    const csvData = filteredStudents.map(s => [
      s.lrn,
      s.student_name,
      s.level,
      s.age || '',
      s.gender || '',
      s.mother_contact || '',
      s.father_contact || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch('');
    setSchoolFilter('all');
    setLevelFilter('all');
    setGenderFilter('all');
  };

  const hasActiveFilters = search || schoolFilter !== 'all' || levelFilter !== 'all' || genderFilter !== 'all';

  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden">
      {/* Header - hidden in split mode */}
      {viewMode as string !== 'split' && (
      <div className="p-4 lg:p-6 border-b border-border space-y-3">
        {/* Single Row: All Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* School Dropdown - Compact */}
          <Select value={schoolFilter} onValueChange={(v) => setSchoolFilter(v)}>
            <SelectTrigger className="w-[110px] bg-card border-2 border-stat-purple/20 hover:border-stat-purple/40">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-stat-purple" />
                <SelectValue>
                  {SCHOOLS.find(s => s.id === schoolFilter)?.acronym || 'ALL'}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {SCHOOLS.map((school) => (
                <SelectItem key={school.id} value={school.id}>
                  <div className="flex flex-col">
                    <span className="font-semibold">{school.acronym}</span>
                    <span className="text-xs text-muted-foreground">{school.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search Input - Flexible width */}
          <div className="relative flex-1 min-w-[160px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or LRN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          {/* Level Filter - Compact, no label */}
          <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v)}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {levels.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle - Compact */}
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'cards'
                  ? "bg-stat-purple text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Card View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'compact'
                  ? "bg-stat-purple text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Compact View"
            >
              <Rows3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'table'
                  ? "bg-stat-purple text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'split'
                  ? "bg-stat-purple text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Split Panel View"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("h-9", showFilters && "bg-secondary")}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            More
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="h-9">
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear all filters" className="h-9 w-9">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Additional Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-4 pt-3 border-t border-border">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Gender</label>
                  <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v)}>
                    <SelectTrigger className="w-[150px] h-9">
                      <SelectValue placeholder="All Genders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      {genders.map(gender => (
                        <SelectItem key={gender} value={gender!}>{gender}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          {viewMode === 'cards' && totalPages > 1 ? (
            <>Page {currentPage} of {totalPages} ({filteredStudents.length} students)</>
          ) : (
            <>Showing {displayedStudents.length} of {filteredStudents.length} students</>
          )}
        </div>
      </div>
      )}

      {/* Content */}
      <div className={cn(viewMode === 'split' ? 'p-2' : 'p-4 lg:p-6')}>
        {viewMode === 'split' ? (
          /* Split Panel View */
          <div className="flex gap-3 h-[calc(100vh-160px)] min-h-[500px]">
            {/* Left Panel - Student List */}
            <div className="w-[35%] min-w-[280px] flex flex-col border rounded-xl overflow-hidden">
              {/* Search + Filter Row */}
              <div className="p-2.5 border-b bg-secondary/30 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 h-7 text-xs"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn("h-7 w-7 shrink-0", showFilters && "bg-primary/10 border-primary/30")}
                    onClick={() => setShowFilters(!showFilters)}
                    title="Filters"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={exportToCSV}
                    title="Export CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {/* Inline Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Select value={schoolFilter} onValueChange={(v) => setSchoolFilter(v)}>
                          <SelectTrigger className="h-7 text-xs w-[90px]">
                            <GraduationCap className="h-3 w-3 mr-1 text-primary" />
                            <SelectValue>{SCHOOLS.find(s => s.id === schoolFilter)?.acronym || 'ALL'}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {SCHOOLS.map((school) => (
                              <SelectItem key={school.id} value={school.id}>
                                {school.acronym}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v)}>
                          <SelectTrigger className="h-7 text-xs w-[100px]">
                            <SelectValue placeholder="All Levels" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            {levels.map(level => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v)}>
                          <SelectTrigger className="h-7 text-xs w-[90px]">
                            <SelectValue placeholder="Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {genders.map(gender => (
                              <SelectItem key={gender} value={gender!}>{gender}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {hasActiveFilters && (
                          <Button variant="ghost" size="icon" onClick={clearFilters} className="h-7 w-7" title="Clear filters">
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <ScrollArea className="flex-1">
                <div className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="p-3 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 bg-muted rounded w-3/4" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No students found.
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-secondary/50",
                          selectedStudent?.id === student.id && "bg-primary/5 border-l-2 border-l-primary"
                        )}
                      >
                        {student.photo_url ? (
                          <img
                            src={student.photo_url}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {student.student_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {formatName(student.student_name)}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] px-1.5 py-px rounded bg-primary/10 text-primary font-medium">
                              {student.level}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground truncate">
                              {student.lrn}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="p-2 border-t text-xs text-muted-foreground text-center bg-secondary/20">
                {filteredStudents.length} students
              </div>
            </div>

            {/* Right Panel - Student Detail */}
            <div className="flex-1 min-w-0">
              {selectedStudent ? (
                <StudentDetailPanel student={selectedStudent} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground rounded-xl border border-dashed">
                  <Eye className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Select a student</p>
                  <p className="text-xs mt-1">Click on a student from the list to view details</p>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          /* Card View */
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {isLoading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-secondary/50 rounded-xl h-48 animate-pulse" />
                ))
              ) : displayedStudents.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  No students found. {hasActiveFilters && 'Try adjusting your filters.'}
                </div>
              ) : (
                displayedStudents.map((student, index) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    index={index}
                  />
                ))
              )}
            </div>

            {/* Pagination for Card View */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={cn(
                          "cursor-pointer",
                          currentPage === 1 && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, idx, arr) => (
                        <Fragment key={page}>
                          {idx > 0 && page - arr[idx - 1] > 1 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </Fragment>
                      ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={cn(
                          "cursor-pointer",
                          currentPage === totalPages && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : viewMode === 'compact' ? (
          /* Compact List View */
          <div className="space-y-1">
            {isLoading ? (
              Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="bg-secondary/50 rounded h-10 animate-pulse" />
              ))
            ) : displayedStudents.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No students found. {hasActiveFilters && 'Try adjusting your filters.'}
              </div>
            ) : (
              displayedStudents.map((student, index) => (
                <StudentHoverPreview key={student.id} student={student}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(index * 0.01, 0.3) }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
                    onClick={() => onView(student)}
                  >
                    {student.photo_url ? (
                      <img
                        src={student.photo_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-stat-purple/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-stat-purple">
                          {student.student_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="font-medium text-sm flex-1 truncate min-w-0">
                      {formatName(student.student_name)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stat-purple/10 text-stat-purple flex-shrink-0">
                      {student.level}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground hidden sm:block flex-shrink-0 w-28 truncate">
                      {student.lrn}
                    </span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); onEdit(student); }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onDelete(student); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                </StudentHoverPreview>
              ))
            )}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto -mx-4 lg:-mx-6">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    LRN
                  </th>
                  {[
                    { field: 'student_name' as SortField, label: 'Name' },
                    { field: 'level' as SortField, label: 'Level' },
                    { field: 'age' as SortField, label: 'Age' },
                    { field: 'gender' as SortField, label: 'Gender' },
                  ].map(({ field, label }) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
                      className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        <SortIcon field={field} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Birthdate
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Mother
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-24" /></td>
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-32" /></td>
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-20" /></td>
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-10" /></td>
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-16" /></td>
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-24" /></td>
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-28" /></td>
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-24" /></td>
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 lg:px-6 py-12 text-center text-muted-foreground">
                      No students found. {hasActiveFilters && 'Try adjusting your filters.'}
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(index * 0.01, 0.3) }}
                      className="hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => onView(student)}
                    >
                      <td className="px-4 lg:px-6 py-4 font-mono text-sm text-muted-foreground">
                        {student.lrn}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-stat-purple/20 flex items-center justify-center">
                              <span className="text-sm font-bold text-stat-purple">
                                {student.student_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <p className="font-medium text-foreground">{formatName(student.student_name)}</p>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stat-purple/10 text-stat-purple">
                          {student.level}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-muted-foreground">
                        {student.age || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-muted-foreground">
                        {student.gender || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-muted-foreground text-sm">
                        {student.birth_date || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-muted-foreground text-sm">
                        {student.mother_maiden_name || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-muted-foreground text-sm">
                        {student.mother_contact || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(student)}
                            aria-label="View student"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(student)}
                            aria-label="Edit student"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(student)}
                            className="text-destructive hover:text-destructive"
                            aria-label="Delete student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};
