import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fluent Emoji collection - organized by categories with proper folder names
const FLUENT_EMOJIS = {
  popular: {
    name: '⭐ Popular',
    items: [
      { name: 'Star', folder: 'Star' },
      { name: 'Fire', folder: 'Fire' },
      { name: 'Sparkles', folder: 'Sparkles' },
      { name: 'Heart', folder: 'Red heart' },
      { name: 'Thumbs up', folder: 'Thumbs up' },
      { name: 'Party', folder: 'Party popper' },
      { name: 'Trophy', folder: 'Trophy' },
      { name: 'Crown', folder: 'Crown' },
      { name: 'Rocket', folder: 'Rocket' },
      { name: 'Lightning', folder: 'High voltage' },
      { name: 'Rainbow', folder: 'Rainbow' },
      { name: 'Sun', folder: 'Sun' },
      { name: '100', folder: 'Hundred points' },
      { name: 'Check', folder: 'Check mark button' },
      { name: 'Gift', folder: 'Wrapped gift' },
      { name: 'Clap', folder: 'Clapping hands' },
    ],
  },
  smileys: {
    name: '😊 Smileys',
    items: [
      { name: 'Grinning', folder: 'Grinning face' },
      { name: 'Joy', folder: 'Face with tears of joy' },
      { name: 'Hearts', folder: 'Smiling face with heart-eyes' },
      { name: 'Cool', folder: 'Smiling face with sunglasses' },
      { name: 'Wink', folder: 'Winking face' },
      { name: 'Halo', folder: 'Smiling face with halo' },
      { name: 'Blush', folder: 'Smiling face with smiling eyes' },
      { name: 'Thinking', folder: 'Thinking face' },
      { name: 'Mind Blown', folder: 'Exploding head' },
      { name: 'Nerd', folder: 'Nerd face' },
      { name: 'Zany', folder: 'Zany face' },
      { name: 'Shush', folder: 'Shushing face' },
    ],
  },
  gestures: {
    name: '👍 Gestures',
    items: [
      { name: 'Thumbs up', folder: 'Thumbs up' },
      { name: 'Thumbs down', folder: 'Thumbs down' },
      { name: 'Clap', folder: 'Clapping hands' },
      { name: 'Raised hands', folder: 'Raising hands' },
      { name: 'OK', folder: 'OK hand' },
      { name: 'Peace', folder: 'Victory hand' },
      { name: 'Rock', folder: 'Sign of the horns' },
      { name: 'Wave', folder: 'Waving hand' },
      { name: 'Muscle', folder: 'Flexed biceps' },
      { name: 'Pray', folder: 'Folded hands' },
      { name: 'Writing', folder: 'Writing hand' },
      { name: 'Point up', folder: 'Index pointing up' },
    ],
  },
  animals: {
    name: '🐱 Animals',
    items: [
      { name: 'Dog', folder: 'Dog face' },
      { name: 'Cat', folder: 'Cat face' },
      { name: 'Fox', folder: 'Fox' },
      { name: 'Lion', folder: 'Lion' },
      { name: 'Tiger', folder: 'Tiger face' },
      { name: 'Bear', folder: 'Bear' },
      { name: 'Panda', folder: 'Panda' },
      { name: 'Koala', folder: 'Koala' },
      { name: 'Rabbit', folder: 'Rabbit face' },
      { name: 'Unicorn', folder: 'Unicorn' },
      { name: 'Butterfly', folder: 'Butterfly' },
      { name: 'Owl', folder: 'Owl' },
    ],
  },
  objects: {
    name: '💡 Objects',
    items: [
      { name: 'Light bulb', folder: 'Light bulb' },
      { name: 'Books', folder: 'Books' },
      { name: 'Pencil', folder: 'Pencil' },
      { name: 'Paintbrush', folder: 'Paintbrush' },
      { name: 'Magnifying', folder: 'Magnifying glass tilted left' },
      { name: 'Key', folder: 'Key' },
      { name: 'Lock', folder: 'Locked' },
      { name: 'Bell', folder: 'Bell' },
      { name: 'Megaphone', folder: 'Megaphone' },
      { name: 'Calendar', folder: 'Calendar' },
      { name: 'Alarm', folder: 'Alarm clock' },
      { name: 'Laptop', folder: 'Laptop' },
    ],
  },
  nature: {
    name: '🌸 Nature',
    items: [
      { name: 'Sun', folder: 'Sun' },
      { name: 'Moon', folder: 'Full moon' },
      { name: 'Star', folder: 'Glowing star' },
      { name: 'Cloud', folder: 'Cloud' },
      { name: 'Rainbow', folder: 'Rainbow' },
      { name: 'Snowflake', folder: 'Snowflake' },
      { name: 'Fire', folder: 'Fire' },
      { name: 'Water', folder: 'Water wave' },
      { name: 'Tree', folder: 'Deciduous tree' },
      { name: 'Flower', folder: 'Cherry blossom' },
      { name: 'Rose', folder: 'Rose' },
      { name: 'Sunflower', folder: 'Sunflower' },
    ],
  },
};

type CategoryKey = keyof typeof FLUENT_EMOJIS;

const getFluentEmojiUrl = (folderName: string) => {
  // Convert folder name to URL-safe format
  const safeName = encodeURIComponent(folderName);
  return `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/${safeName}/3D/${safeName.toLowerCase().replace(/%20/g, '_')}_3d.png`;
};

// Alternative: use flat style which is more reliable
const getFluentEmojiUrlFlat = (folderName: string) => {
  const safeName = encodeURIComponent(folderName);
  return `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/${safeName}/Flat/${safeName.toLowerCase().replace(/%20/g, '_')}_flat.svg`;
};

interface FluentEmojiPickerProps {
  onSelect: (iconUrl: string) => void;
}

export function FluentEmojiPicker({ onSelect }: FluentEmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (name: string) => {
    setLoadedImages(prev => new Set([...prev, name]));
  };

  const handleImageError = (name: string) => {
    setFailedImages(prev => new Set([...prev, name]));
  };

  // Get all emojis for search
  const allEmojis = useMemo(() => {
    return Object.values(FLUENT_EMOJIS).flatMap(cat => cat.items);
  }, []);

  // Filter by search
  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) {
      return FLUENT_EMOJIS[activeCategory].items;
    }
    const query = searchQuery.toLowerCase();
    return allEmojis.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.folder.toLowerCase().includes(query)
    );
  }, [searchQuery, activeCategory, allEmojis]);

  const categories = Object.entries(FLUENT_EMOJIS) as [CategoryKey, typeof FLUENT_EMOJIS[CategoryKey]][];

  return (
    <div className="flex flex-col h-[350px]">
      {/* Search */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Fluent emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Category tabs */}
      {!searchQuery && (
        <ScrollArea className="w-full border-b">
          <div className="flex gap-1 p-2">
            {categories.map(([key, category]) => (
              <Button
                key={key}
                variant={activeCategory === key ? 'secondary' : 'ghost'}
                size="sm"
                className="flex-shrink-0 text-xs h-7 px-2"
                onClick={() => setActiveCategory(key)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Emoji grid */}
      <ScrollArea className="flex-1 p-2">
        <div className="grid grid-cols-6 gap-2">
          {filteredEmojis.map((item) => {
            const url = getFluentEmojiUrlFlat(item.folder);
            const isLoaded = loadedImages.has(item.name);
            const hasFailed = failedImages.has(item.name);

            if (hasFailed) return null;

            return (
              <button
                key={item.name}
                onClick={() => onSelect(url)}
                className={cn(
                  'relative aspect-square p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                  'flex flex-col items-center justify-center gap-1'
                )}
                title={item.name}
              >
                {!isLoaded && (
                  <Skeleton className="absolute inset-2 rounded" />
                )}
                <img
                  src={url}
                  alt={item.name}
                  className={cn(
                    'w-8 h-8 object-contain transition-opacity pointer-events-none',
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={() => handleImageLoad(item.name)}
                  onError={() => handleImageError(item.name)}
                  loading="lazy"
                />
                <span className={cn(
                  'text-[10px] text-muted-foreground truncate w-full text-center transition-opacity',
                  isLoaded ? 'opacity-100' : 'opacity-0'
                )}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>

        {filteredEmojis.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No emojis found for "{searchQuery}"
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
