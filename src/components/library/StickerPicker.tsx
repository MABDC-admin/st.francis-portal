import { useState } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconSearch } from './IconSearch';
import { OpenMojiPicker } from './OpenMojiPicker';
import { FluentEmojiPicker } from './FluentEmojiPicker';
import { Smile, Search, Palette, Sparkles } from 'lucide-react';

export interface StickerData {
  type: 'emoji' | 'icon';
  value: string;
}

interface StickerPickerProps {
  onSelect: (sticker: StickerData) => void;
}

export function StickerPicker({ onSelect }: StickerPickerProps) {
  const [activeTab, setActiveTab] = useState('emoji');

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect({
      type: 'emoji',
      value: emojiData.emoji,
    });
  };

  const handleIconSelect = (iconUrl: string) => {
    onSelect({
      type: 'icon',
      value: iconUrl,
    });
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="emoji" className="flex items-center gap-1 text-xs px-2">
            <Smile className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Emojis</span>
          </TabsTrigger>
          <TabsTrigger value="openmoji" className="flex items-center gap-1 text-xs px-2">
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">OpenMoji</span>
          </TabsTrigger>
          <TabsTrigger value="fluent" className="flex items-center gap-1 text-xs px-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Fluent</span>
          </TabsTrigger>
          <TabsTrigger value="icons" className="flex items-center gap-1 text-xs px-2">
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emoji" className="mt-0">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width="100%"
            height={350}
            theme={Theme.AUTO}
            searchPlaceholder="Search emojis..."
            previewConfig={{ showPreview: false }}
            lazyLoadEmojis
          />
        </TabsContent>

        <TabsContent value="openmoji" className="mt-0">
          <OpenMojiPicker onSelect={handleIconSelect} />
        </TabsContent>

        <TabsContent value="fluent" className="mt-0">
          <FluentEmojiPicker onSelect={handleIconSelect} />
        </TabsContent>

        <TabsContent value="icons" className="mt-0">
          <IconSearch onSelect={handleIconSelect} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
