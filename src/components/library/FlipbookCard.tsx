import { motion } from 'framer-motion';
import { ExternalLink, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Flipbook {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  flipbook_url: string;
  grade_levels: string[];
  school: string | null;
  is_active: boolean;
}

interface FlipbookCardProps {
  flipbook: Flipbook;
  index: number;
}

export const FlipbookCard = ({ flipbook, index }: FlipbookCardProps) => {
  const handleClick = () => {
    // Open flipbook URL in a new tab
    window.open(flipbook.flipbook_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          "group cursor-pointer overflow-hidden transition-all duration-300",
          "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1",
          "bg-card border-border"
        )}
        onClick={handleClick}
      >
        {/* Cover Image */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
          {flipbook.cover_image_url ? (
            <img
              src={flipbook.cover_image_url}
              alt={flipbook.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 text-white bg-primary/90 px-3 py-2 rounded-lg">
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm font-medium">Open</span>
            </div>
          </div>

          {/* Grade Level Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {flipbook.grade_levels.slice(0, 2).map((level) => (
              <Badge
                key={level}
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5 bg-background/90 backdrop-blur-sm"
              >
                {level}
              </Badge>
            ))}
            {flipbook.grade_levels.length > 2 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5 bg-background/90 backdrop-blur-sm"
              >
                +{flipbook.grade_levels.length - 2}
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <CardContent className="p-3">
          <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {flipbook.title}
          </h3>
          {flipbook.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {flipbook.description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
