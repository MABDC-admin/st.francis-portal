import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Pencil, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  X,
  LayoutGrid,
  List,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Student } from '@/types/student';
import { StudentCard } from './StudentCard';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StudentTableProps {
  students: Student[];
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  isLoading?: boolean;
}

type SortField = 'student_name' | 'level' | 'age' | 'gender';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'cards' | 'table';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const SCHOOLS = [
  { id: 'all', name: 'All Schools', acronym: 'ALL' },
  { id: 'mabdc', name: 'M.A Brain Development Center', acronym: 'MABDC' },
  { id: 'stfxsa', name: 'St. Francis Xavier Smart Academy Inc', acronym: 'STFXSA' },
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

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
    return students
      .filter(student => {
        const matchesSearch = 
          student.student_name.toLowerCase().includes(search.toLowerCase()) ||
          student.lrn.toLowerCase().includes(search.toLowerCase());
        const matchesLevel = levelFilter === 'all' || student.level === levelFilter;
        const matchesGender = genderFilter === 'all' || student.gender === genderFilter;
        return matchesSearch && matchesLevel && matchesGender;
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
  }, [students, search, levelFilter, genderFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    setCurrentPage(1);
  };

  const hasActiveFilters = search || schoolFilter !== 'all' || levelFilter !== 'all' || genderFilter !== 'all';

  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-border space-y-4">
        {/* School Selector & View Toggle Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* School Dropdown */}
          <Select value={schoolFilter} onValueChange={(v) => { setSchoolFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[280px] bg-card border-2 border-stat-purple/20 hover:border-stat-purple/40">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-stat-purple" />
                <SelectValue>
                  {SCHOOLS.find(s => s.id === schoolFilter)?.acronym || 'Select School'}
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
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'cards' 
                  ? "bg-stat-purple text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'table' 
                  ? "bg-stat-purple text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search and Level Filter Row */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or LRN..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          
          {/* Level Filter - Always Visible */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Level:</label>
            <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {levels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 w-full lg:w-auto">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "bg-secondary")}
            >
              <Filter className="h-4 w-4 mr-2" />
              More
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear all filters">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
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
              <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Gender</label>
                  <Select value={genderFilter} onValueChange={(v) => { setGenderFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[180px]">
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
      </div>

      {/* Content */}
      <div className="p-4 lg:p-6">
        {viewMode === 'cards' ? (
          /* Card View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-secondary/50 rounded-2xl h-72 animate-pulse" />
              ))
            ) : paginatedStudents.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No students found. {hasActiveFilters && 'Try adjusting your filters.'}
              </div>
            ) : (
              paginatedStudents.map((student, index) => (
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
        ) : (
          /* Table View */
          <div className="overflow-x-auto -mx-4 lg:-mx-6">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
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
                    LRN
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
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-32" /></td>
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-20" /></td>
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-10" /></td>
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-16" /></td>
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-24" /></td>
                      <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-muted rounded w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 lg:px-6 py-12 text-center text-muted-foreground">
                      No students found. {hasActiveFilters && 'Try adjusting your filters.'}
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-secondary/30 transition-colors"
                    >
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
                          <p className="font-medium text-foreground">{student.student_name}</p>
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
                      <td className="px-4 lg:px-6 py-4 font-mono text-sm text-muted-foreground">
                        {student.lrn}
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

      {/* Pagination */}
      {!isLoading && filteredStudents.length > 0 && (
        <div className="px-4 lg:px-6 py-4 border-t border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}
            </span>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <SelectItem key={option} value={option.toString()}>{option} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-9",
                      currentPage === pageNum && "bg-stat-purple hover:bg-stat-purple"
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
