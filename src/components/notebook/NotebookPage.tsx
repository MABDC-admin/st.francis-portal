import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotebookList } from './NotebookList';
import { NotebookEditor } from './NotebookEditor';
import { CreateNotebookDialog } from './CreateNotebookDialog';

export function NotebookPage() {
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleBack = () => {
    setSelectedNotebookId(null);
  };

  const handleNotebookCreated = (notebookId: string) => {
    setSelectedNotebookId(notebookId);
    setIsCreateDialogOpen(false);
  };

  if (selectedNotebookId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notebooks
          </Button>
        </div>
        <NotebookEditor notebookId={selectedNotebookId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Notebook LLM</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage interactive notebooks with AI assistance
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Notebook
        </Button>
      </motion.div>

      <NotebookList onSelectNotebook={setSelectedNotebookId} />

      <CreateNotebookDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreated={handleNotebookCreated}
      />
    </div>
  );
}
