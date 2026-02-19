import { useState } from 'react';
import { Save, Play, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SavedTemplate, ReportFiltersState } from './reportTypes';

const STORAGE_KEY = 'reports-hub-templates';

const loadTemplates = (): SavedTemplate[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
};

const saveTemplates = (templates: SavedTemplate[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
};

interface SavedTemplatesProps {
  currentCategoryId: string | null;
  currentSubTypeId: string | null;
  currentFilters: ReportFiltersState;
  onLoadTemplate: (categoryId: string, subTypeId: string, filters: ReportFiltersState) => void;
}

export const SavedTemplates = ({ currentCategoryId, currentSubTypeId, currentFilters, onLoadTemplate }: SavedTemplatesProps) => {
  const [templates, setTemplates] = useState<SavedTemplate[]>(loadTemplates);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const handleSave = () => {
    if (!templateName.trim() || !currentCategoryId || !currentSubTypeId) {
      toast.error('Select a report type and enter a template name');
      return;
    }
    const newTemplate: SavedTemplate = {
      id: crypto.randomUUID(),
      name: templateName.trim(),
      categoryId: currentCategoryId,
      subTypeId: currentSubTypeId,
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTemplate, ...templates];
    setTemplates(updated);
    saveTemplates(updated);
    setIsSaveOpen(false);
    setTemplateName('');
    toast.success('Template saved');
  };

  const handleDelete = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
    toast.success('Template deleted');
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsSaveOpen(true)} disabled={!currentSubTypeId}>
          <Save className="h-3.5 w-3.5 mr-1" />
          Save Template
        </Button>

        {templates.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Saved ({templates.length})
                <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Saved Templates</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {templates.map(t => (
                <DropdownMenuItem key={t.id} className="flex items-center justify-between gap-2">
                  <button
                    className="flex-1 text-left text-sm truncate"
                    onClick={() => onLoadTemplate(t.categoryId, t.subTypeId, t.filters)}
                  >
                    <Play className="h-3 w-3 inline mr-1.5" />
                    {t.name}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Report Template</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="e.g., Q2 Grade 7 Attendance"
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
