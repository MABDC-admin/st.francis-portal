import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StudentIncident {
  id: string;
  incident_date: string;
  category: string;
  title: string;
  description: string | null;
  action_taken: string | null;
  reported_by: string | null;
  status: string;
}

const INCIDENT_CATEGORIES = [
  { value: 'bullying', label: 'Bullying', color: 'bg-red-100 text-red-700' },
  { value: 'bad_attitude', label: 'Bad Attitude', color: 'bg-orange-100 text-orange-700' },
  { value: 'tardiness', label: 'Tardiness', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'misconduct', label: 'Misconduct', color: 'bg-purple-100 text-purple-700' },
  { value: 'positive', label: 'Positive Behavior', color: 'bg-green-100 text-green-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
];

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getCategoryInfo = (category: string) =>
  INCIDENT_CATEGORIES.find(c => c.value === category) || INCIDENT_CATEGORIES[5];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'resolved': return <Badge className="bg-green-100 text-green-700">Resolved</Badge>;
    case 'monitoring': return <Badge className="bg-yellow-100 text-yellow-700">Monitoring</Badge>;
    default: return <Badge className="bg-red-100 text-red-700">Open</Badge>;
  }
};

interface AnecdotalBehaviorTabProps {
  studentId: string;
}

export const AnecdotalBehaviorTab = ({ studentId }: AnecdotalBehaviorTabProps) => {
  const [incidents, setIncidents] = useState<StudentIncident[]>([]);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isEditingIncident, setIsEditingIncident] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<StudentIncident | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    incident_date: new Date().toISOString().split('T')[0],
    category: '',
    title: '',
    description: '',
    action_taken: '',
    reported_by: '',
    status: 'open'
  });

  const fetchIncidents = useCallback(async () => {
    const { data, error } = await supabase
      .from('student_incidents')
      .select('*')
      .eq('student_id', studentId)
      .order('incident_date', { ascending: false });
    if (!error && data) setIncidents(data as any);
  }, [studentId]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const handleOpenModal = (incident?: StudentIncident) => {
    if (incident) {
      setIsEditingIncident(true);
      setSelectedIncident(incident);
      setIncidentForm({
        incident_date: incident.incident_date,
        category: incident.category,
        title: incident.title,
        description: incident.description || '',
        action_taken: incident.action_taken || '',
        reported_by: incident.reported_by || '',
        status: incident.status
      });
    } else {
      setIsEditingIncident(false);
      setSelectedIncident(null);
      setIncidentForm({
        incident_date: new Date().toISOString().split('T')[0],
        category: '', title: '', description: '', action_taken: '', reported_by: '', status: 'open'
      });
    }
    setIsIncidentModalOpen(true);
  };

  const handleSave = async () => {
    if (!incidentForm.category || !incidentForm.title) {
      toast.error('Please fill in required fields');
      return;
    }
    setIsSaving(true);
    try {
      if (isEditingIncident && selectedIncident) {
        const { error } = await supabase.from('student_incidents').update(incidentForm).eq('id', selectedIncident.id);
        if (error) throw error;
        toast.success('Incident updated');
      } else {
        const { error } = await supabase.from('student_incidents').insert({ student_id: studentId, ...incidentForm });
        if (error) throw error;
        toast.success('Incident recorded');
      }
      setIsIncidentModalOpen(false);
      fetchIncidents();
    } catch {
      toast.error('Failed to save incident');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedIncident) return;
    try {
      const { error } = await supabase.from('student_incidents').delete().eq('id', selectedIncident.id);
      if (error) throw error;
      toast.success('Incident deleted');
      setIsDeleteOpen(false);
      setSelectedIncident(null);
      fetchIncidents();
    } catch {
      toast.error('Failed to delete incident');
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
        style={{ borderTopColor: '#f97316' }}
      >
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)' }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-white" />
            <div>
              <h3 className="font-semibold text-white">Anecdotal Records / Behavior Incidents</h3>
              <p className="text-xs text-white/70">Track and manage student behavior incidents</p>
            </div>
          </div>
          <Button onClick={() => handleOpenModal()} className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2">
            <Plus className="h-4 w-4" />
            Add Incident
          </Button>
        </div>
        <div className="p-5 bg-gradient-to-br from-orange-50/50 to-white dark:from-slate-800/50 dark:to-slate-900">
          {incidents.length > 0 ? (
            <div className="space-y-4">
              {incidents.map(incident => {
                const categoryInfo = getCategoryInfo(incident.category);
                return (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-orange-200 dark:border-slate-700 rounded-lg p-4 hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
                          {getStatusBadge(incident.status)}
                          <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(incident.incident_date)}
                          </span>
                        </div>
                        <h4 className="font-medium text-slate-800 dark:text-slate-200">{incident.title}</h4>
                        {incident.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{incident.description}</p>
                        )}
                        {incident.action_taken && (
                          <div className="mt-2 pt-2 border-t border-orange-200 dark:border-slate-700">
                            <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Action Taken:</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{incident.action_taken}</p>
                          </div>
                        )}
                        {incident.reported_by && (
                          <p className="text-xs text-orange-500 dark:text-orange-400 mt-2">Reported by: {incident.reported_by}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-orange-100 dark:hover:bg-slate-700" onClick={() => handleOpenModal(incident)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-red-100 dark:hover:bg-red-900/30" onClick={() => { setSelectedIncident(incident); setIsDeleteOpen(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-orange-300 mx-auto mb-4" />
              <p className="text-orange-600 dark:text-orange-400">No incidents recorded</p>
              <p className="text-sm text-orange-500/70 mt-1">Click "Add Incident" to record a new incident</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add/Edit Incident Modal */}
      <Dialog open={isIncidentModalOpen} onOpenChange={setIsIncidentModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditingIncident ? 'Edit Incident' : 'Record New Incident'}</DialogTitle>
            <DialogDescription>Document a behavior incident or notable event for this student.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={incidentForm.incident_date} onChange={(e) => setIncidentForm({ ...incidentForm, incident_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={incidentForm.category} onValueChange={(v) => setIncidentForm({ ...incidentForm, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {INCIDENT_CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={incidentForm.title} onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })} placeholder="Brief title of the incident" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })} placeholder="Detailed description..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Action Taken</Label>
              <Textarea value={incidentForm.action_taken} onChange={(e) => setIncidentForm({ ...incidentForm, action_taken: e.target.value })} placeholder="What action was taken..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reported By</Label>
                <Input value={incidentForm.reported_by} onChange={(e) => setIncidentForm({ ...incidentForm, reported_by: e.target.value })} placeholder="Teacher/Staff name" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={incidentForm.status} onValueChange={(v) => setIncidentForm({ ...incidentForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIncidentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditingIncident ? 'Update Incident' : 'Save Incident'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Incident</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
