import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// OpenMoji categories with Unicode hex codes
const OPENMOJI_CATEGORIES = {
  popular: {
    name: '⭐ Popular',
    codes: ['2B50', '1F525', '2764-FE0F', '1F4AF', '2728', '1F389', '1F38A', '1F3C6', '1F451', '1F48E', '1F4A5', '1F31F', '1F308', '26A1', '1F680', '1F4A1'],
  },
  smileys: {
    name: '😊 Smileys',
    codes: ['1F600', '1F601', '1F602', '1F923', '1F60A', '1F607', '1F970', '1F60D', '1F929', '1F618', '1F617', '1F619', '1F61A', '1F642', '1F643', '1F609', '1F60B', '1F61B', '1F61C', '1F92A', '1F61D', '1F60E', '1F913', '1F9D0'],
  },
  gestures: {
    name: '👍 Gestures',
    codes: ['1F44D', '1F44E', '1F44F', '1F64C', '1F91D', '1F64F', '270D-FE0F', '1F4AA', '1F91F', '1F918', '1F919', '1F44C', '1F90C', '1F90F', '270C-FE0F', '1F91E', '1F596', '1F44B', '1F91A', '1F590-FE0F', '270B', '1F44A'],
  },
  animals: {
    name: '🐱 Animals',
    codes: ['1F436', '1F431', '1F42D', '1F439', '1F430', '1F98A', '1F43B', '1F43C', '1F428', '1F42F', '1F981', '1F42E', '1F437', '1F438', '1F435', '1F648', '1F649', '1F64A', '1F412', '1F414', '1F427', '1F426', '1F986', '1F985'],
  },
  food: {
    name: '🍔 Food',
    codes: ['1F34E', '1F34F', '1F350', '1F351', '1F352', '1F353', '1FAD0', '1F95D', '1F345', '1F346', '1F951', '1F955', '1F354', '1F355', '1F32D', '1F96A', '1F32E', '1F32F', '1F9C6', '1F35C', '1F35D', '1F35E', '1F9C0', '1F370'],
  },
  activities: {
    name: '⚽ Activities',
    codes: ['26BD', '1F3C0', '1F3C8', '26BE', '1F94E', '1F3BE', '1F3D0', '1F3C9', '1F3B1', '1F3D3', '1F3F8', '1F94A', '1F94B', '1F945', '26F3', '1F3BF', '1F6F7', '1F3AF', '1FA80', '1FA81', '1F3AE', '1F3B2'],
  },
  nature: {
    name: '🌸 Nature',
    codes: ['1F33B', '1F337', '1F339', '1F33A', '1F338', '1F33C', '1F490', '1F940', '1F331', '1FAB4', '1F332', '1F333', '1F334', '1F335', '1F33E', '1F33F', '2618-FE0F', '1F340', '1F341', '1F342', '1F343', '1FAB9', '1FABA', '1FAB7'],
  },
  objects: {
    name: '💡 Objects',
    codes: ['1F4A1', '1F526', '1F56F-FE0F', '1FA94', '1F4D5', '1F4D7', '1F4D8', '1F4D9', '1F4DA', '1F4D6', '1F516', '1F3F7-FE0F', '1F4DD', '270F-FE0F', '1F58A-FE0F', '1F58B-FE0F', '1F4BC', '1F4C1', '1F4C2', '1F5C2-FE0F', '1F4C5', '1F4C6'],
  },
  symbols: {
    name: '❤️ Symbols',
    codes: ['2764-FE0F', '1F9E1', '1F49B', '1F49A', '1F499', '1F49C', '1F5A4', '1F90D', '1F90E', '1F498', '1F49D', '1F496', '1F497', '1F493', '1F49E', '1F495', '1F48C', '1F4AF', '1F4A2', '1F4A5', '1F4AB', '1F4A6', '1F4A8', '1F573-FE0F'],
  },
};

const getOpenMojiUrl = (code: string) =>
  `https://cdn.jsdelivr.net/npm/openmoji@15.1.0/color/svg/${code}.svg`;

interface OpenMojiPickerProps {
  onSelect: (iconUrl: string) => void;
}

export function OpenMojiPicker({ onSelect }: OpenMojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof OPENMOJI_CATEGORIES>('popular');
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (code: string) => {
    setLoadedImages(prev => new Set([...prev, code]));
  };

  const handleImageError = (code: string) => {
    setFailedImages(prev => new Set([...prev, code]));
  };

  const categories = Object.entries(OPENMOJI_CATEGORIES);
  const currentCategory = OPENMOJI_CATEGORIES[activeCategory];

  return (
    <div className="flex flex-col h-[350px]">
      {/* Category tabs */}
      <ScrollArea className="w-full border-b">
        <div className="flex gap-1 p-2">
          {categories.map(([key, category]) => (
            <Button
              key={key}
              variant={activeCategory === key ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-shrink-0 text-xs h-7 px-2"
              onClick={() => setActiveCategory(key as keyof typeof OPENMOJI_CATEGORIES)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Emoji grid */}
      <ScrollArea className="flex-1 p-2">
        <div className="grid grid-cols-8 gap-1">
          {currentCategory.codes.map((code) => {
            const url = getOpenMojiUrl(code);
            const isLoaded = loadedImages.has(code);
            const hasFailed = failedImages.has(code);

            if (hasFailed) return null;

            return (
              <button
                key={code}
                onClick={() => onSelect(url)}
                className={cn(
                  'relative w-10 h-10 p-1 rounded-md hover:bg-muted transition-colors cursor-pointer',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1'
                )}
                title={`OpenMoji ${code}`}
              >
                {!isLoaded && (
                  <Skeleton className="absolute inset-1 rounded" />
                )}
                <img
                  src={url}
                  alt={`OpenMoji ${code}`}
                  className={cn(
                    'w-full h-full object-contain transition-opacity pointer-events-none',
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={() => handleImageLoad(code)}
                  onError={() => handleImageError(code)}
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
