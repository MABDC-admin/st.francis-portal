import { useState } from 'react';
import { Plus, Presentation, FileText, Layout, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DesignType {
  id: string;
  name: string;
  icon: React.ReactNode;
  width: number;
  height: number;
}

const designTypes: DesignType[] = [
  { id: 'presentation', name: 'Presentation', icon: <Presentation className="h-5 w-5" />, width: 1920, height: 1080 },
  { id: 'document', name: 'Document', icon: <FileText className="h-5 w-5" />, width: 816, height: 1056 },
  { id: 'whiteboard', name: 'Whiteboard', icon: <Layout className="h-5 w-5" />, width: 1920, height: 1080 },
];

interface CreateDesignDialogProps {
  onDesignCreated?: () => void;
}

export const CreateDesignDialog = ({ onDesignCreated }: CreateDesignDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DesignType | null>(designTypes[0]);
  const [title, setTitle] = useState('');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!selectedType && !useCustomSize) {
      toast.error('Please select a design type');
      return;
    }

    const width = useCustomSize ? parseInt(customWidth) : selectedType?.width;
    const height = useCustomSize ? parseInt(customHeight) : selectedType?.height;

    if (!width || !height || width < 40 || height < 40) {
      toast.error('Please enter valid dimensions (minimum 40px)');
      return;
    }

    setIsCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/canva-api?endpoint=/designs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            design_type: {
              type: 'custom',
              width: width,
              height: height,
            },
            title: title || `New ${selectedType?.name || 'Design'}`,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          toast.error('Write permission required. Please disconnect and reconnect your Canva account.');
          return;
        }
        throw new Error(errorData.error || 'Failed to create design');
      }

      const data = await response.json();
      
      // Open the design in a new tab
      if (data.design?.urls?.edit_url) {
        window.open(data.design.urls.edit_url, '_blank');
        toast.success('Design created! Opening in Canva...');
      } else {
        toast.success('Design created successfully');
      }

      setOpen(false);
      setTitle('');
      onDesignCreated?.();
    } catch (err) {
      console.error('Error creating design:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create design');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Design
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Design</DialogTitle>
          <DialogDescription>
            Choose a design type or enter custom dimensions to create a new design in Canva.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Design Type Selection */}
          <div className="space-y-2">
            <Label>Design Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {designTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setSelectedType(type);
                    setUseCustomSize(false);
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                    selectedType?.id === type.id && !useCustomSize
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {type.icon}
                  <span className="text-xs font-medium">{type.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Size Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUseCustomSize(!useCustomSize)}
              className={`text-sm ${useCustomSize ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            >
              Use custom size
            </button>
          </div>

          {/* Custom Dimensions */}
          {useCustomSize && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Width (px)</Label>
                <Input
                  id="width"
                  type="number"
                  min="40"
                  placeholder="1920"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (px)</Label>
                <Input
                  id="height"
                  type="number"
                  min="40"
                  placeholder="1080"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="My New Design"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create & Open'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
