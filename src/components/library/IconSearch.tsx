import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface IconResult {
  prefix: string;
  name: string;
}

interface IconSearchProps {
  onSelect: (iconUrl: string) => void;
}

export function IconSearch({ onSelect }: IconSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IconResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchIcons = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.iconify.design/search?query=${encodeURIComponent(searchQuery)}&limit=48`
      );
      const data = await response.json();
      
      if (data.icons) {
        const icons: IconResult[] = data.icons.map((icon: string) => {
          const [prefix, ...nameParts] = icon.split(':');
          return { prefix, name: nameParts.join(':') };
        });
        setResults(icons);
      }
    } catch (error) {
      console.error('Failed to search icons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    // Debounce search
    const timeoutId = setTimeout(() => searchIcons(value), 300);
    return () => clearTimeout(timeoutId);
  };

  const handleSelect = (icon: IconResult) => {
    const iconUrl = `https://api.iconify.design/${icon.prefix}/${icon.name}.svg`;
    onSelect(iconUrl);
  };

  return (
    <div className="flex flex-col h-[300px]">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search icons (e.g., star, heart, check)..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-6 gap-2 p-3">
            {results.map((icon, index) => (
              <button
                key={`${icon.prefix}:${icon.name}-${index}`}
                onClick={() => handleSelect(icon)}
                className="p-2 rounded-lg hover:bg-muted transition-colors flex items-center justify-center cursor-pointer"
                title={`${icon.prefix}:${icon.name}`}
              >
                <img
                  src={`https://api.iconify.design/${icon.prefix}/${icon.name}.svg`}
                  alt={icon.name}
                  className="h-6 w-6 pointer-events-none"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        ) : query ? (
          <div className="flex items-center justify-center h-full py-8 text-muted-foreground text-sm">
            No icons found
          </div>
        ) : (
          <div className="flex items-center justify-center h-full py-8 text-muted-foreground text-sm">
            Search for icons above
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
