import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ParsedTeacher {
  employee_id: string;
  full_name: string;
  email: string;
  phone?: string;
  department?: string;
  grade_level?: string;
  subjects?: string[];
}

export const TeacherCSVImport = () => {
  const { selectedSchool } = useSchool();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTeacher[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [createAccounts, setCreateAccounts] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // Map school context to school code for the teachers table
  const getSchoolCode = () => {
    return selectedSchool || 'MABDC';
  };

  const normalizeHeaders = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    const headerMap: Record<string, string> = {
      'employee_id': 'employee_id',
      'employeeid': 'employee_id',
      'emp_id': 'employee_id',
      'id_number': 'employee_id',
      'full_name': 'full_name',
      'fullname': 'full_name',
      'name': 'full_name',
      'teacher_name': 'full_name',
      'email': 'email',
      'email_address': 'email',
      'phone': 'phone',
      'phone_number': 'phone',
      'contact': 'phone',
      'contact_number': 'phone',
      'department': 'department',
      'dept': 'department',
      'grade_level': 'grade_level',
      'gradelevel': 'grade_level',
      'grade': 'grade_level',
      'level': 'grade_level',
      'subjects': 'subjects',
      'subject': 'subjects',
    };

    headers.forEach(h => {
      const normalized = h.toLowerCase().trim().replace(/\s+/g, '_');
      if (headerMap[normalized]) {
        mapping[h] = headerMap[normalized];
      }
    });

    return mapping;
  };

  const processRows = (rows: Record<string, string>[]) => {
    setParseError(null);
    setImportResult(null);

    if (rows.length === 0) {
      setParseError('No data found in file');
      return;
    }

    const headers = Object.keys(rows[0]);
    const headerMapping = normalizeHeaders(headers);

    const getMapped = (row: Record<string, string>, field: string): string => {
      for (const [original, mapped] of Object.entries(headerMapping)) {
        if (mapped === field && row[original]) return row[original].trim();
      }
      return '';
    };

    const teachers: ParsedTeacher[] = [];
    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();
    const errors: string[] = [];

    rows.forEach((row, index) => {
      const fullName = getMapped(row, 'full_name');
      const employeeId = getMapped(row, 'employee_id');
      const email = getMapped(row, 'email');

      if (!fullName) return; // Skip empty rows

      if (!employeeId) {
        errors.push(`Row ${index + 2}: Missing employee ID for "${fullName}"`);
        return;
      }

      if (!email) {
        errors.push(`Row ${index + 2}: Missing email for "${fullName}"`);
        return;
      }

      if (seenIds.has(employeeId)) {
        errors.push(`Row ${index + 2}: Duplicate employee ID "${employeeId}"`);
        return;
      }

      if (seenEmails.has(email.toLowerCase())) {
        errors.push(`Row ${index + 2}: Duplicate email "${email}"`);
        return;
      }

      seenIds.add(employeeId);
      seenEmails.add(email.toLowerCase());

      const subjectsStr = getMapped(row, 'subjects');
      const subjects = subjectsStr
        ? subjectsStr.split(/[,;|]/).map(s => s.trim()).filter(Boolean)
        : undefined;

      teachers.push({
        employee_id: employeeId,
        full_name: fullName,
        email: email,
        phone: getMapped(row, 'phone') || undefined,
        department: getMapped(row, 'department') || undefined,
        grade_level: getMapped(row, 'grade_level') || undefined,
        subjects,
      });
    });

    if (errors.length > 0 && teachers.length === 0) {
      setParseError(`Validation errors:\n${errors.slice(0, 5).join('\n')}`);
      return;
    }

    if (teachers.length === 0) {
      setParseError('No valid teacher records found. Ensure your file has columns: employee_id, full_name, email');
      return;
    }

    setParsedData(teachers);
    if (errors.length > 0) {
      toast.warning(`${errors.length} rows skipped due to validation errors`);
    }
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setParsedData([]);
    setParseError(null);
    setImportResult(null);

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processRows(results.data as Record<string, string>[]),
        error: (error) => setParseError(`Failed to parse CSV: ${error.message}`),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: '' });
          processRows(rows);
        } catch (err) {
          setParseError('Failed to parse Excel file. Ensure it is a valid .xlsx file.');
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      setParseError('Unsupported file format. Please use .csv or .xlsx files.');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsImporting(true);
    const result = { success: 0, failed: 0, errors: [] as string[] };

    try {
      // Batch insert teachers
      const teacherRows = parsedData.map(t => ({
        employee_id: t.employee_id,
        full_name: t.full_name,
        email: t.email,
        phone: t.phone || null,
        department: t.department || null,
        grade_level: t.grade_level || null,
        subjects: t.subjects || null,
        school: getSchoolCode(),
        status: 'active',
      }));

      // Insert in batches of 50
      for (let i = 0; i < teacherRows.length; i += 50) {
        const batch = teacherRows.slice(i, i + 50);
        const { data, error } = await supabase
          .from('teachers')
          .upsert(batch, { onConflict: 'employee_id' })
          .select();

        if (error) {
          result.failed += batch.length;
          result.errors.push(`Batch ${Math.floor(i / 50) + 1}: ${error.message}`);
        } else {
          result.success += data?.length || 0;
        }
      }

      // Optionally create user accounts
      if (createAccounts && result.success > 0) {
        try {
          const { error: createError } = await supabase.functions.invoke('create-users', {
            body: {
              users: parsedData.map(t => ({
                email: t.email,
                full_name: t.full_name,
                role: 'teacher',
                employee_id: t.employee_id,
              })),
            },
          });

          if (createError) {
            toast.warning('Teachers imported but account creation failed: ' + createError.message);
          } else {
            toast.success('User accounts created successfully');
          }
        } catch (err) {
          toast.warning('Teachers imported but account creation encountered an error');
        }
      }

      setImportResult(result);

      if (result.success > 0) {
        toast.success(`Successfully imported ${result.success} teachers`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} teachers failed to import`);
      }
    } catch (err) {
      toast.error('Import failed unexpectedly');
    } finally {
      setIsImporting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setParsedData([]);
    setParseError(null);
    setImportResult(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Import Teachers from DepEd Files</h1>
        <p className="text-muted-foreground mt-1">Bulk import teacher data from CSV or Excel files</p>
      </div>

      <div className="bg-card rounded-2xl shadow-card p-6">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 text-center",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/30",
            file && !parseError && "border-emerald-500 bg-emerald-500/5"
          )}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Upload teacher data file"
          />

          {!file ? (
            <div className="space-y-4">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">Drop your DepEd teacher file here</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse — accepts .csv and .xlsx files</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <FileText className={cn("h-8 w-8", parseError ? "text-destructive" : "text-emerald-500")} />
              <div className="text-left">
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); clearFile(); }} className="ml-4">
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Error */}
        {parseError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-destructive/10 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Import Error</p>
              <p className="text-sm text-destructive/80 whitespace-pre-line">{parseError}</p>
            </div>
          </motion.div>
        )}

        {/* Preview */}
        {parsedData.length > 0 && !parseError && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="font-medium text-foreground">{parsedData.length} teachers ready to import</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="create-accounts" checked={createAccounts} onCheckedChange={setCreateAccounts} />
                  <Label htmlFor="create-accounts" className="text-sm">
                    <UserPlus className="h-4 w-4 inline mr-1" />
                    Create login accounts
                  </Label>
                </div>

                <Button onClick={handleImport} disabled={isImporting}>
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import All
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Preview Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Employee ID</th>
                      <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Name</th>
                      <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Email</th>
                      <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Department</th>
                      <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Subjects</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedData.slice(0, 10).map((teacher, i) => (
                      <tr key={i} className="hover:bg-secondary/30">
                        <td className="px-4 py-2 font-mono text-foreground">{teacher.employee_id}</td>
                        <td className="px-4 py-2 text-foreground">{teacher.full_name}</td>
                        <td className="px-4 py-2 text-muted-foreground">{teacher.email}</td>
                        <td className="px-4 py-2 text-muted-foreground">{teacher.department || '-'}</td>
                        <td className="px-4 py-2">
                          {teacher.subjects?.map((s, idx) => (
                            <Badge key={idx} variant="secondary" className="mr-1 mb-1 text-xs">{s}</Badge>
                          )) || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 10 && (
                <div className="px-4 py-2 bg-secondary/30 text-center text-sm text-muted-foreground">
                  ... and {parsedData.length - 10} more teachers
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Import Result */}
        {importResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-secondary/30 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Import Results</h4>
            <div className="flex gap-4">
              <Badge variant="default" className="bg-emerald-500">{importResult.success} imported</Badge>
              {importResult.failed > 0 && <Badge variant="destructive">{importResult.failed} failed</Badge>}
            </div>
            {importResult.errors.length > 0 && (
              <div className="mt-2 text-sm text-destructive">
                {importResult.errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
          </motion.div>
        )}

        {/* Expected Format */}
        <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-medium text-foreground mb-2">Expected CSV/Excel Format</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Your file should have columns matching these headers (flexible naming supported):
          </p>
          <code className="text-xs bg-secondary px-2 py-1 rounded text-foreground font-mono block overflow-x-auto">
            employee_id, full_name, email, phone, department, grade_level, subjects
          </code>
          <p className="text-xs text-muted-foreground mt-2">
            Subjects can be separated by commas, semicolons, or pipes (e.g., "Math, Science, English")
          </p>
        </div>
      </div>
    </motion.div>
  );
};
