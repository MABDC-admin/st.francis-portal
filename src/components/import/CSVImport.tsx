import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBulkCreateStudents } from '@/hooks/useStudents';
import { CSVStudent, StudentFormData } from '@/types/student';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';

export const CSVImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<StudentFormData[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const bulkCreate = useBulkCreateStudents();

  const parseDate = (dateStr: string): string | undefined => {
    if (!dateStr) return undefined;
    
    // Try to parse common date formats
    const formats = [
      /^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/, // 28-Oct-19
      /^(\d{4})-(\d{2})-(\d{2})$/, // 2019-10-28
      /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, // 10/28/19
    ];

    const monthMap: Record<string, string> = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };

    // Try DD-MMM-YY format
    const match = dateStr.match(formats[0]);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = monthMap[match[2].toLowerCase()];
      let year = match[3];
      if (year.length === 2) {
        year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      }
      return `${year}-${month}-${day}`;
    }

    return undefined;
  };

  // Generate a temporary LRN for students without one
  const generateTempLRN = (index: number): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TEMP-${timestamp}-${index.toString().padStart(4, '0')}-${random}`;
  };

  const processCSV = useCallback((results: Papa.ParseResult<CSVStudent>) => {
    setParseError(null);
    
    if (results.errors.length > 0) {
      setParseError(`CSV parsing error: ${results.errors[0].message}`);
      return;
    }

    let tempLRNCount = 0;
    const students: StudentFormData[] = results.data
      .filter(row => row.student_name?.trim()) // Only require student name, not LRN
      .map((row, index) => {
        const hasLRN = row.lrn?.trim();
        if (!hasLRN) tempLRNCount++;
        
        return {
          lrn: hasLRN || generateTempLRN(index),
          student_name: row.student_name?.trim(),
          level: row.level?.trim() || 'Level 1',
          school: 'MABDC', // Default to MABDC for CSV imports
          birth_date: parseDate(row.birth_date),
          age: row.age ? parseInt(row.age) : undefined,
          gender: row.gender?.trim().toUpperCase(),
          mother_contact: row.mother_contact?.trim(),
          mother_maiden_name: row.mother_maiden_name?.trim(),
          father_contact: row.father_contact?.trim(),
          father_name: row.father_name?.trim(),
          phil_address: row.phil_address?.trim(),
          uae_address: row.uae_address?.trim(),
          previous_school: row.previous_school?.trim(),
          religion: row.religion?.trim(),
        };
      });

    if (students.length === 0) {
      setParseError('No valid student records found in CSV');
      return;
    }

    if (tempLRNCount > 0) {
      console.log(`Generated temporary LRNs for ${tempLRNCount} students without LRN`);
    }

    setParsedData(students);
  }, []);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setParseError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setParsedData([]);
    setParseError(null);

    Papa.parse<CSVStudent>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: processCSV,
      error: (error) => {
        setParseError(`Failed to parse CSV: ${error.message}`);
      }
    });
  }, [processCSV]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    
    await bulkCreate.mutateAsync(parsedData);
    setFile(null);
    setParsedData([]);
  };

  const clearFile = () => {
    setFile(null);
    setParsedData([]);
    setParseError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl shadow-card p-6"
    >
      <h2 className="text-xl font-bold text-foreground mb-6">Import Students from CSV</h2>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 text-center",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-secondary/30",
          file && !parseError && "border-success bg-success/5"
        )}
      >
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload CSV file"
        />

        {!file ? (
          <div className="space-y-4">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">
                Drop your CSV file here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse from your computer
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Supported format: CSV with headers (lrn, student_name, level, birth_date, age, gender, etc.)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <FileText className={cn(
                "h-8 w-8",
                parseError ? "text-destructive" : "text-success"
              )} />
              <div className="text-left">
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.preventDefault(); clearFile(); }}
                className="ml-4"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {parseError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-destructive/10 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Import Error</p>
            <p className="text-sm text-destructive/80">{parseError}</p>
          </div>
        </motion.div>
      )}

      {/* Preview */}
      {parsedData.length > 0 && !parseError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="font-medium text-foreground">
                  {parsedData.length} students ready to import
                </span>
              </div>
              {parsedData.filter(s => s.lrn.startsWith('TEMP-')).length > 0 && (
                <p className="text-sm text-warning flex items-center gap-1.5 ml-7">
                  <AlertCircle className="h-4 w-4" />
                  {parsedData.filter(s => s.lrn.startsWith('TEMP-')).length} students with temporary LRN (highlighted in orange)
                </p>
              )}
            </div>
            <Button onClick={handleImport} disabled={bulkCreate.isPending}>
              {bulkCreate.isPending ? (
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

          {/* Preview Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-teal-600 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-white">LRN</th>
                    <th className="px-4 py-2 text-left font-semibold text-white">Name</th>
                    <th className="px-4 py-2 text-left font-semibold text-white">Level</th>
                    <th className="px-4 py-2 text-left font-semibold text-white">Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border [&>tr:nth-child(even)]:bg-gray-50 dark:[&>tr:nth-child(even)]:bg-gray-800/30">
                  {parsedData.slice(0, 10).map((student, i) => {
                    const isTempLRN = student.lrn.startsWith('TEMP-');
                    return (
                      <tr key={i} className={cn(
                        "hover:bg-secondary/30",
                        isTempLRN && "bg-warning/10"
                      )}>
                        <td className="px-4 py-2 font-mono text-foreground">
                          {isTempLRN ? (
                            <span className="text-warning font-semibold">TEMP</span>
                          ) : (
                            student.lrn
                          )}
                        </td>
                        <td className="px-4 py-2 text-foreground">{student.student_name}</td>
                        <td className="px-4 py-2 text-muted-foreground">{student.level}</td>
                        <td className="px-4 py-2 text-muted-foreground">{student.gender || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {parsedData.length > 10 && (
              <div className="px-4 py-2 bg-secondary/30 text-center text-sm text-muted-foreground">
                ... and {parsedData.length - 10} more students
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Expected Format */}
      <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
        <h3 className="font-medium text-foreground mb-2">Expected CSV Format</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Your CSV file should have the following headers:
        </p>
        <code className="text-xs bg-secondary px-2 py-1 rounded text-foreground font-mono block overflow-x-auto">
          level, lrn, student_name, birth_date, age, gender, religion, mother_contact, mother_maiden_name, father_contact, father_name, phil_address, uae_address, previous_school
        </code>
      </div>
    </motion.div>
  );
};
