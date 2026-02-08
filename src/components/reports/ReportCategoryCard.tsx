import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ReportCategory } from './reportTypes';

interface ReportCategoryCardProps {
  category: ReportCategory;
  isSelected: boolean;
  selectedSubTypeId: string | null;
  userRole: string | null;
  onSelectCategory: (categoryId: string) => void;
  onSelectSubType: (categoryId: string, subTypeId: string) => void;
}

export const ReportCategoryCard = ({
  category,
  isSelected,
  selectedSubTypeId,
  userRole,
  onSelectCategory,
  onSelectSubType,
}: ReportCategoryCardProps) => {
  const Icon = category.icon;
  const accessibleSubTypes = category.subTypes.filter(
    st => userRole && st.requiredRoles.includes(userRole)
  );

  if (accessibleSubTypes.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
      <Card
        className={cn(
          'cursor-pointer transition-all border-2',
          isSelected ? 'border-primary shadow-md' : 'border-transparent hover:border-muted-foreground/20'
        )}
        onClick={() => onSelectCategory(category.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: category.color }}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-foreground truncate">{category.label}</h3>
              <p className="text-xs text-muted-foreground truncate">{category.description}</p>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">{accessibleSubTypes.length}</Badge>
          </div>

          {isSelected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-3 space-y-1 border-t pt-3"
            >
              {accessibleSubTypes.map(st => {
                const SubIcon = st.icon;
                return (
                  <button
                    key={st.id}
                    onClick={(e) => { e.stopPropagation(); onSelectSubType(category.id, st.id); }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors',
                      selectedSubTypeId === st.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    )}
                  >
                    <SubIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate flex-1">{st.label}</span>
                    <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                  </button>
                );
              })}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
