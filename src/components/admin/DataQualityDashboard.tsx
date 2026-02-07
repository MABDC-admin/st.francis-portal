import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Search, RefreshCcw, Loader2, User, Phone, Users, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useSchoolId } from '@/hooks/useSchoolId';
import { toast } from 'sonner';

interface ValidationIssue {
  id: string;
  student_id: string;
  issue_type: string;
  description: string;
  severity: string;
  field_name: string | null;
  is_resolved: boolean;
  created_at: string;
  student_name?: string;
  student_lrn?: string;
  student_level?: string;
}

const ISSUE_TYPE_LABELS: Record<string, { label: string; icon: typeof AlertTriangle; color: string }> = {
  missing_birthdate: { label: 'Missing Birthdate', icon: User, color: 'text-amber-600' },
  invalid_contact: { label: 'Invalid Contact', icon: Phone, color: 'text-orange-600' },
  duplicate_student: { label: 'Duplicate Student', icon: Users, color: 'text-red-600' },
  incomplete_requirements: { label: 'Incomplete Info', icon: FileText, color: 'text-blue-600' },
};

export const DataQualityDashboard = () => {
  const { selectedSchool } = useSchool();
  const { data: schoolUuid } = useSchoolId();

  // Students table uses text 'school' column, not UUID school_id
  const getStudentSchoolFilter = (query: any) => {
    if (selectedSchool === 'STFXSA') {
      return query.or('school.ilike.%stfxsa%,school.ilike.%st. francis%');
    }
    return query.or('school.ilike.%mabdc%,school.is.null,school.eq.');
  };
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('unresolved');

  useEffect(() => {
    if (schoolUuid) fetchIssues();
  }, [schoolUuid]);

  const fetchIssues = async () => {
    if (!schoolUuid) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_validation_issues')
        .select('*')
        .eq('school_id', schoolUuid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch student names for issues
      const studentIds = [...new Set((data || []).map(d => d.student_id))];
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from('students')
          .select('id, student_name, lrn, level')
          .in('id', studentIds);

        const studentMap = new Map((students || []).map(s => [s.id, s]));
        const enriched = (data || []).map(issue => ({
          ...issue,
          student_name: studentMap.get(issue.student_id)?.student_name,
          student_lrn: studentMap.get(issue.student_id)?.lrn,
          student_level: studentMap.get(issue.student_id)?.level,
        }));
        setIssues(enriched);
      } else {
        setIssues(data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load validation issues');
    } finally {
      setIsLoading(false);
    }
  };

  const runScan = async () => {
    if (!schoolUuid) return;
    setIsScanning(true);
    try {
      // Fetch all students for this school (students table uses text 'school' column)
      let studentsQuery = supabase
        .from('students')
        .select('id, student_name, lrn, level, birth_date, gender, mother_contact, father_contact, mother_maiden_name, father_name, phil_address, uae_address');
      studentsQuery = getStudentSchoolFilter(studentsQuery);
      const { data: students, error: studentsError } = await studentsQuery;

      if (studentsError) throw studentsError;
      if (!students || students.length === 0) {
        toast.info('No students found to scan');
        setIsScanning(false);
        return;
      }

      const newIssues: Array<{
        student_id: string;
        school_id: string;
        issue_type: string;
        description: string;
        severity: string;
        field_name: string;
      }> = [];

      // Clear old unresolved issues first
      await supabase
        .from('data_validation_issues')
        .delete()
        .eq('school_id', schoolUuid)
        .eq('is_resolved', false);

      for (const student of students) {
        // Rule 1: Missing birthdate
        if (!student.birth_date) {
          newIssues.push({
            student_id: student.id,
            school_id: schoolUuid,
            issue_type: 'missing_birthdate',
            description: `${student.student_name} has no birthdate recorded`,
            severity: 'error',
            field_name: 'birth_date',
          });
        }

        // Rule 2: Invalid guardian contact numbers
        const contacts = [
          { field: 'mother_contact', value: student.mother_contact, label: 'Mother contact' },
          { field: 'father_contact', value: student.father_contact, label: 'Father contact' },
        ];
        for (const contact of contacts) {
          if (contact.value && (contact.value.length < 7 || !/^\+?[\d\s\-()]+$/.test(contact.value))) {
            newIssues.push({
              student_id: student.id,
              school_id: schoolUuid,
              issue_type: 'invalid_contact',
              description: `${student.student_name}: ${contact.label} "${contact.value}" appears invalid`,
              severity: 'warning',
              field_name: contact.field,
            });
          }
        }

        // Rule 3: Incomplete requirements
        const missingFields: string[] = [];
        if (!student.gender) missingFields.push('gender');
        if (!student.mother_maiden_name && !student.father_name) missingFields.push('guardian name');
        if (!student.phil_address && !student.uae_address) missingFields.push('address');
        if (!student.mother_contact && !student.father_contact) missingFields.push('guardian contact');

        if (missingFields.length > 0) {
          newIssues.push({
            student_id: student.id,
            school_id: schoolUuid,
            issue_type: 'incomplete_requirements',
            description: `${student.student_name}: Missing ${missingFields.join(', ')}`,
            severity: missingFields.length >= 3 ? 'error' : 'warning',
            field_name: missingFields[0],
          });
        }
      }

      // Rule 4: Duplicate students (same LRN)
      const lrnMap = new Map<string, typeof students>();
      for (const student of students) {
        if (!student.lrn) continue;
        const existing = lrnMap.get(student.lrn);
        if (existing) {
          existing.push(student);
        } else {
          lrnMap.set(student.lrn, [student]);
        }
      }
      for (const [lrn, dupes] of lrnMap) {
        if (dupes.length > 1) {
          for (const dupe of dupes) {
            newIssues.push({
              student_id: dupe.id,
              school_id: schoolUuid,
              issue_type: 'duplicate_student',
              description: `LRN "${lrn}" shared by ${dupes.length} students: ${dupes.map(d => d.student_name).join(', ')}`,
              severity: 'error',
              field_name: 'lrn',
            });
          }
        }
      }

      // Insert new issues
      if (newIssues.length > 0) {
        const { error: insertError } = await (supabase.from('data_validation_issues') as any).insert(newIssues);
        if (insertError) throw insertError;
      }

      toast.success(`Scan complete: ${newIssues.length} issue(s) found`);
      fetchIssues();
    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error('Scan failed: ' + error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const resolveIssue = async (issueId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('data_validation_issues')
      .update({ is_resolved: true, resolved_by: user?.id, resolved_at: new Date().toISOString() })
      .eq('id', issueId);

    if (error) {
      toast.error('Failed to resolve issue');
    } else {
      toast.success('Issue marked as resolved');
      fetchIssues();
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (filterType !== 'all' && issue.issue_type !== filterType) return false;
    if (filterStatus === 'unresolved' && issue.is_resolved) return false;
    if (filterStatus === 'resolved' && !issue.is_resolved) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        issue.student_name?.toLowerCase().includes(q) ||
        issue.student_lrn?.toLowerCase().includes(q) ||
        issue.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unresolvedCount = issues.filter(i => !i.is_resolved).length;
  const countByType = (type: string) => issues.filter(i => i.issue_type === type && !i.is_resolved).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(ISSUE_TYPE_LABELS).map(([type, config]) => {
          const Icon = config.icon;
          const count = countByType(type);
          return (
            <Card key={type} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterType(type)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name or LRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Issue type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(ISSUE_TYPE_LABELS).map(([type, config]) => (
                <SelectItem key={type} value={type}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={runScan} disabled={isScanning || !schoolUuid}>
          {isScanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
          Run Scan
        </Button>
      </div>

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Data Quality Issues
            {unresolvedCount > 0 && (
              <Badge variant="destructive">{unresolvedCount} unresolved</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredIssues.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>LRN</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue) => {
                    const typeConfig = ISSUE_TYPE_LABELS[issue.issue_type];
                    return (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">{issue.student_name || 'Unknown'}</TableCell>
                        <TableCell className="font-mono text-sm">{issue.student_lrn || '-'}</TableCell>
                        <TableCell>{issue.student_level || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {typeConfig?.label || issue.issue_type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{issue.description}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'}>
                            {issue.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {issue.is_resolved ? (
                            <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Resolved</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">Open</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {!issue.is_resolved && (
                              <Button variant="ghost" size="sm" onClick={() => resolveIssue(issue.id)}>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No issues found</p>
              <p className="text-sm">Run a scan to check for data quality issues</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
