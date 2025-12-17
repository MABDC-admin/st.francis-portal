import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, Search, Edit, Trash2, BookOpen, Filter, Users, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSchool } from '@/contexts/SchoolContext';

interface Subject {
  id: string;
  code: string;
  name: string;
  description: string | null;
  grade_levels: string[];
  department: string | null;
  units: number;
  is_active: boolean;
  created_at: string;
}

const GRADE_LEVELS = [
  'Kinder 1', 'Kinder 2',
  'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6',
  'Level 7', 'Level 8', 'Level 9', 'Level 10', 'Level 11', 'Level 12'
];

const initialFormState = {
  code: '',
  name: '',
  description: '',
  grade_levels: [] as string[],
  department: '',
  units: 1,
  is_active: true,
};

export const SubjectManagement = () => {
  const { selectedSchool } = useSchool();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [levelsWithStudents, setLevelsWithStudents] = useState<string[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(false);

  const fetchSubjects = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('code');
    
    if (!error && data) {
      setSubjects(data as Subject[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
    fetchLevelsWithStudents();
  }, [selectedSchool]);

  const fetchLevelsWithStudents = async () => {
    setIsLoadingLevels(true);
    const { data } = await supabase
      .from('students')
      .select('level')
      .eq('school', selectedSchool);
    
    if (data) {
      const levels = [...new Set(data.map((s: { level: string }) => s.level))];
      setLevelsWithStudents(levels);
    }
    setIsLoadingLevels(false);
  };

  const handleAutoSelectLevelsWithStudents = () => {
    setFormData(prev => ({
      ...prev,
      grade_levels: [...new Set([...prev.grade_levels, ...levelsWithStudents])],
    }));
  };

  const handleSelectAllLevels = () => {
    setFormData(prev => ({
      ...prev,
      grade_levels: [...GRADE_LEVELS],
    }));
  };

  const handleClearLevels = () => {
    setFormData(prev => ({
      ...prev,
      grade_levels: [],
    }));
  };

  const handleOpenModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        code: subject.code,
        name: subject.name,
        description: subject.description || '',
        grade_levels: subject.grade_levels || [],
        department: subject.department || '',
        units: subject.units,
        is_active: subject.is_active,
      });
    } else {
      setEditingSubject(null);
      // Pre-select the filtered grade level if one is selected
      setFormData({
        ...initialFormState,
        grade_levels: gradeFilter !== 'all' ? [gradeFilter] : [],
      });
    }
    setIsModalOpen(true);
  };

  const handleGradeLevelToggle = (level: string) => {
    setFormData(prev => ({
      ...prev,
      grade_levels: prev.grade_levels.includes(level)
        ? prev.grade_levels.filter(l => l !== level)
        : [...prev.grade_levels, level]
    }));
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || formData.grade_levels.length === 0) {
      toast.error('Please fill in code, name, and select at least one grade level');
      return;
    }

    setIsSaving(true);
    try {
      if (editingSubject) {
        const { error } = await supabase
          .from('subjects')
          .update({
            code: formData.code,
            name: formData.name,
            description: formData.description || null,
            grade_levels: formData.grade_levels,
            department: formData.department || null,
            units: formData.units,
            is_active: formData.is_active,
          })
          .eq('id', editingSubject.id);

        if (error) throw error;
        toast.success('Subject updated successfully');
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert({
            code: formData.code,
            name: formData.name,
            description: formData.description || null,
            grade_levels: formData.grade_levels,
            department: formData.department || null,
            units: formData.units,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast.success('Subject added successfully');
      }

      setIsModalOpen(false);
      fetchSubjects();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to save subject');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`Are you sure you want to delete "${subject.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subject.id);

      if (error) throw error;
      toast.success('Subject deleted');
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete subject');
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || s.grade_levels.includes(gradeFilter);
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Subjects</h1>
          <p className="text-muted-foreground mt-1">Manage course catalog and subjects</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </motion.div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Grade Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {GRADE_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Subject List
          </CardTitle>
          <CardDescription>{subjects.length} subjects in catalog</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSubjects.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Grade Levels</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-mono text-sm font-medium">{subject.code}</TableCell>
                      <TableCell>{subject.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {subject.grade_levels.slice(0, 3).map(level => (
                            <Badge key={level} variant="outline" className="text-xs">
                              {level}
                            </Badge>
                          ))}
                          {subject.grade_levels.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{subject.grade_levels.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{subject.department || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={subject.is_active ? 'default' : 'secondary'}>
                          {subject.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(subject)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(subject)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No subjects found</p>
              <p className="text-sm">Add a subject to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
            <DialogDescription>
              {editingSubject ? 'Update subject information' : 'Create a new subject in the course catalog'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subject Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="MATH101"
                />
              </div>
              <div>
                <Label>Units</Label>
                <Input
                  type="number"
                  value={formData.units}
                  onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
            </div>
            <div>
              <Label>Subject Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Mathematics"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the subject"
              />
            </div>
            <div>
              <Label>Department</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Science, Mathematics, etc."
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Grade Levels *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoSelectLevelsWithStudents}
                    disabled={isLoadingLevels}
                    className="text-xs h-7"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Levels with Students ({levelsWithStudents.length})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllLevels}
                    className="text-xs h-7"
                  >
                    <CheckSquare className="h-3 w-3 mr-1" />
                    All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearLevels}
                    className="text-xs h-7"
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {GRADE_LEVELS.map(level => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={level}
                      checked={formData.grade_levels.includes(level)}
                      onCheckedChange={() => handleGradeLevelToggle(level)}
                    />
                    <label htmlFor={level} className="text-sm cursor-pointer flex items-center gap-1">
                      {level}
                      {levelsWithStudents.includes(level) && (
                        <Users className="h-3 w-3 text-muted-foreground" />
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingSubject ? 'Update' : 'Add Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
