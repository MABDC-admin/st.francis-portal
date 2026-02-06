import { motion } from 'framer-motion';
import { BookOpen, Loader2, MoreVertical, Pencil, Trash2, Eye, EyeOff, Sparkles, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { BookIndexStatus } from '@/hooks/useBookIndexing';

interface Book {
  id: string;
  title: string;
  grade_level: number;
  subject: string | null;
  cover_url: string | null;
  page_count: number;
  status: string;
  school: string | null;
  is_active: boolean;
}

interface BookCardProps {
  book: Book;
  index: number;
  onClick: () => void;
  onEdit?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
  onStartIndexing?: () => void;
  canManage?: boolean;
  indexStatus?: BookIndexStatus;
  isIndexing?: boolean;
}

export const BookCard = ({ 
  book, 
  index, 
  onClick, 
  onEdit,
  onToggleActive,
  onDelete,
  onStartIndexing,
  canManage = false,
  indexStatus,
  isIndexing = false,
}: BookCardProps) => {
  const isProcessing = book.status === 'processing';
  const hasError = book.status === 'error';

  const getIndexBadge = () => {
    if (!indexStatus) return null;

    const { index_status, indexed_pages, total_pages } = indexStatus;

    if (index_status === 'indexed') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="secondary" 
                className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary gap-1"
              >
                <Sparkles className="h-2.5 w-2.5" />
                AI
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>AI indexed - {indexed_pages} pages searchable</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (index_status === 'indexing' || isIndexing) {
      const progress = total_pages > 0 ? Math.round((indexed_pages / total_pages) * 100) : 0;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="secondary" 
                className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground gap-1"
              >
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                {progress}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Indexing... {indexed_pages}/{total_pages} pages</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (index_status === 'error') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="secondary" 
                className="text-[10px] px-1.5 py-0.5 bg-destructive/20 text-destructive gap-1"
              >
                <Sparkles className="h-2.5 w-2.5" />
                Error
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Indexing failed - click to retry</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          'group cursor-pointer overflow-hidden transition-all duration-300',
          'hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1',
          'bg-card border-border',
          isProcessing && 'opacity-70',
          hasError && 'border-destructive/50',
          !book.is_active && 'opacity-60'
        )}
        onClick={isProcessing ? undefined : onClick}
      >
        {/* Cover Image */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              style={{ imageRendering: 'auto' }}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {isProcessing ? (
                <Loader2 className="h-12 w-12 text-muted-foreground/50 animate-spin" />
              ) : (
                <BookOpen className="h-12 w-12 text-muted-foreground/30" />
              )}
            </div>
          )}

          {/* Status Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">Processing...</p>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center">
              <p className="text-xs text-destructive font-medium">Error</p>
            </div>
          )}

          {/* Inactive Overlay */}
          {!book.is_active && !isProcessing && !hasError && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Badge variant="secondary" className="bg-muted">
                <EyeOff className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            </div>
          )}

          {/* Hover Overlay */}
          {!isProcessing && !hasError && book.is_active && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 text-white bg-primary/90 px-3 py-2 rounded-lg">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm font-medium">Read</span>
              </div>
            </div>
          )}

          {/* Badges Row */}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6 bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onToggleActive}>
                    {book.is_active ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {onStartIndexing && (
                    <DropdownMenuItem 
                      onClick={onStartIndexing}
                      disabled={isIndexing || indexStatus?.index_status === 'indexing'}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", isIndexing && "animate-spin")} />
                      {indexStatus?.index_status === 'indexed' ? 'Re-index for AI' : 'Index for AI Search'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5 bg-background/90 backdrop-blur-sm"
            >
              Grade {book.grade_level}
            </Badge>
          </div>

          {/* AI Index Status Badge - Bottom Left */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1">
            {book.page_count > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0.5 bg-background/90 backdrop-blur-sm"
              >
                {book.page_count} pages
              </Badge>
            )}
            {getIndexBadge()}
          </div>
        </div>

        {/* Title */}
        <CardContent className="p-3">
          <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          {book.subject && (
            <p className="text-xs text-muted-foreground mt-1">{book.subject}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
