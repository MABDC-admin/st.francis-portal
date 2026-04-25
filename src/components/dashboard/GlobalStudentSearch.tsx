import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, User, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { getSchoolId } from "@/utils/schoolIdMap";
import { AnimatedStudentAvatar } from "@/components/students/AnimatedStudentAvatar";

interface Student {
  id: string;
  student_name: string;
  lrn: string;
  level: string;
  photo_url: string | null;
  gender: string | null;
}

export const GlobalStudentSearch = () => {
  const navigate = useNavigate();
  const { selectedSchool, schoolTheme } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const schoolId = getSchoolId(selectedSchool);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchStudents = async () => {
      if (query.length < 2 || !schoolId || !selectedYearId) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("students")
          .select("id, student_name, lrn, level, photo_url, gender")
          .eq("school_id", schoolId)
          .eq("academic_year_id", selectedYearId)
          .or(`student_name.ilike.%${query}%,lrn.ilike.%${query}%`)
          .limit(8);

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error("Error searching students:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchStudents, 300);
    return () => clearTimeout(debounce);
  }, [query, schoolId, selectedYearId]);

  const handleSelect = (student: Student) => {
    setQuery("");
    setIsOpen(false);
    navigate(`/student/${student.id}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search learner by name or LRN..."
          className="h-11 rounded-full border-border bg-card pl-10 pr-11 shadow-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-full z-50 mt-3 overflow-hidden rounded-2xl border bg-card shadow-soft"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-80 overflow-y-auto p-2">
                {results.map((student) => (
                  <motion.button
                    key={student.id}
                    onClick={() => handleSelect(student)}
                    whileHover={{ x: 2 }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-accent"
                  >
                    <AnimatedStudentAvatar
                      photoUrl={student.photo_url}
                      name={student.student_name}
                      size="sm"
                      borderColor={schoolTheme.accentColor}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{student.student_name}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="tabular font-mono">{student.lrn}</span>
                        <Badge variant="outline" className="px-2 py-0.5 text-[10px]">
                          {student.level}
                        </Badge>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <User className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-medium text-foreground">No learners found</p>
                <p className="text-xs text-muted-foreground">Try another name or LRN</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
