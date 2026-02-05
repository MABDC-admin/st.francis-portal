

# Enhanced Sticker Tool with Multiple Sources & Animated Button

## Overview
Transform the sticker feature with:
1. Move the sticker button to the center of the toolbar with an eye-catching animated bouncing rainbow effect
2. Integrate multiple free sticker libraries (OpenMoji, Fluent Emoji, SVG Repo) as browsable categories
3. Keep the existing Iconify search and native emoji picker

---

## UI Changes

### Toolbar Layout (Before vs After)

```text
BEFORE:
[Pencil][Highlight][Rect][Circle][Arrow][Eraser] | [Sticker] | [Colors...] | [Undo][Redo][Clear]

AFTER:
[Pencil][Highlight][Rect][Circle][Arrow][Eraser] | [Colors...] | [✨ STICKER ✨] | [Undo][Redo][Clear]
                                                                   ↑
                                                     Animated rainbow bounce
                                                     Centered position
```

### Animated Sticker Button
- Rainbow gradient background that cycles through colors
- Subtle bouncing animation
- Sparkle/glow effect on hover
- Larger than other tools to draw attention

---

## Sticker Picker Redesign

### New Tab Structure

```text
┌───────────────────────────────────────────────────────────────┐
│  [😊 Emojis]  [🎨 OpenMoji]  [✨ Fluent]  [🔍 Search]         │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Categories: [All] [Smileys] [Animals] [Food] [Activities]    │
│                                                               │
│  🌟 ⭐ 💫 ✨ 🔥 ❤️ 💜 💙 💚 💛 🧡 🤍 🖤 💔                      │
│  😀 😁 😂 🤣 😃 😄 😅 😆 😉 😊 😋 😎 😍 😘                      │
│  🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸                      │
│  ...                                                          │
└───────────────────────────────────────────────────────────────┘
```

---

## Sticker Sources Integration

| Source | Type | CDN URL Pattern | Categories |
|--------|------|-----------------|------------|
| Native Emoji | Emoji Picker | `emoji-picker-react` package | All native emojis |
| OpenMoji | SVG | `https://cdn.jsdelivr.net/npm/openmoji@latest/color/svg/{code}.svg` | Smileys, Animals, Food, etc. |
| Fluent Emoji | PNG/3D | `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/{name}/3D/{name}_3d.png` | Modern 3D style |
| Iconify | SVG | `https://api.iconify.design/search` (existing) | 200k+ icons |

---

## Files to Modify/Create

| Action | File | Changes |
|--------|------|---------|
| Modify | `src/components/library/AnnotationToolbar.tsx` | Move sticker button to center, add rainbow animation |
| Modify | `src/components/library/StickerPicker.tsx` | Add new tabs for OpenMoji, Fluent Emoji |
| Create | `src/components/library/OpenMojiPicker.tsx` | OpenMoji category browser |
| Create | `src/components/library/FluentEmojiPicker.tsx` | Fluent Emoji browser |
| Modify | `src/index.css` | Add rainbow bounce animation keyframes |

---

## Technical Implementation

### 1. Rainbow Bounce Animation (CSS)

```css
@keyframes rainbow-bounce {
  0%, 100% {
    transform: translateY(0) scale(1);
    background-position: 0% 50%;
  }
  25% {
    transform: translateY(-3px) scale(1.05);
  }
  50% {
    transform: translateY(0) scale(1);
    background-position: 100% 50%;
  }
  75% {
    transform: translateY(-2px) scale(1.03);
  }
}

@keyframes rainbow-gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.sticker-button-animated {
  background: linear-gradient(
    90deg,
    #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd
  );
  background-size: 300% 300%;
  animation: rainbow-gradient 3s ease infinite, rainbow-bounce 2s ease-in-out infinite;
}
```

### 2. OpenMoji Integration

OpenMoji provides 4000+ open-source emojis with consistent design:

```typescript
// OpenMoji categories with hex codes
const OPENMOJI_CATEGORIES = {
  smileys: ['1F600', '1F601', '1F602', '1F923', '1F60A', ...],
  animals: ['1F436', '1F431', '1F42D', '1F439', ...],
  food: ['1F34E', '1F34F', '1F350', '1F351', ...],
  activities: ['26BD', '1F3C0', '1F3C8', '1F3BE', ...],
  // ... more categories
};

// CDN URL
const getOpenMojiUrl = (code: string) => 
  `https://cdn.jsdelivr.net/npm/openmoji@15.1.0/color/svg/${code}.svg`;
```

### 3. Fluent Emoji Integration

Microsoft's modern 3D emoji collection:

```typescript
// Popular Fluent Emoji names
const FLUENT_EMOJIS = [
  'grinning-face', 'smiling-face-with-heart-eyes', 'fire',
  'sparkles', 'star', 'red-heart', 'thumbs-up', ...
];

// CDN URL pattern
const getFluentEmojiUrl = (name: string) =>
  `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/${name}/3D/${name}_3d.png`;
```

### 4. Toolbar Restructure

```tsx
// New toolbar layout
<div className="flex items-center justify-between px-4 py-2 border-b bg-card gap-4">
  {/* Left: Drawing Tools */}
  <div className="flex items-center gap-4">
    <ToggleGroup>{/* pencil, highlighter, rect, circle, arrow, eraser */}</ToggleGroup>
    
    {/* Color Picker - moved before sticker */}
    <div className="flex items-center gap-1 border-l pl-4">
      {ANNOTATION_COLORS.map(c => ...)}
    </div>
  </div>
  
  {/* Center: Animated Sticker Button */}
  <Popover>
    <PopoverTrigger asChild>
      <Button className="sticker-button-animated h-10 px-4 text-white font-semibold">
        <Sparkles className="h-4 w-4 mr-2" />
        Stickers
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-[400px] p-0">
      <StickerPicker onSelect={handleStickerSelect} />
    </PopoverContent>
  </Popover>
  
  {/* Right: Actions */}
  <div className="flex items-center gap-1">
    {/* Undo, Redo, Clear */}
  </div>
</div>
```

### 5. Enhanced StickerPicker with 4 Tabs

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="w-full grid grid-cols-4">
    <TabsTrigger value="emoji">😊 Emojis</TabsTrigger>
    <TabsTrigger value="openmoji">🎨 OpenMoji</TabsTrigger>
    <TabsTrigger value="fluent">✨ Fluent</TabsTrigger>
    <TabsTrigger value="search">🔍 Search</TabsTrigger>
  </TabsList>
  
  <TabsContent value="emoji">
    <EmojiPicker {...} />
  </TabsContent>
  
  <TabsContent value="openmoji">
    <OpenMojiPicker onSelect={...} />
  </TabsContent>
  
  <TabsContent value="fluent">
    <FluentEmojiPicker onSelect={...} />
  </TabsContent>
  
  <TabsContent value="search">
    <IconSearch onSelect={...} />
  </TabsContent>
</Tabs>
```

---

## OpenMoji Picker Component

Categories with popular stickers pre-loaded:

```text
┌─────────────────────────────────────────────────────────┐
│ Category: [All ▼] [Smileys] [People] [Animals] [Nature] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇               │
│ 🥰 😍 🤩 😘 😗 ☺️ 😚 😙 🥲 😋 😛 😜                    │
│ 🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐻‍❄️ 🐨 🐯 🦁                 │
│ 🍎 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭                    │
│ ⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🪀 🏓                    │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

---

## Fluent Emoji Picker Component

Microsoft's beautiful 3D emojis:

```text
┌─────────────────────────────────────────────────────────┐
│ 🔍 Search Fluent emojis...                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [3D Star] [3D Fire] [3D Heart] [3D Sparkles]          │
│  [3D Thumbs Up] [3D Party] [3D Trophy] [3D Crown]      │
│  [3D Rocket] [3D Lightning] [3D Rainbow] [3D Sun]      │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Summary

| Feature | Implementation |
|---------|----------------|
| Button position | Moved to center between colors and actions |
| Animation | Rainbow gradient + bounce effect with CSS keyframes |
| Native emojis | Keep existing `emoji-picker-react` |
| OpenMoji (4000+) | Category-based browser with CDN loading |
| Fluent Emoji (3000+) | 3D style emojis from Microsoft |
| Icon search | Keep existing Iconify integration |
| Sticker types | `emoji`, `openmoji`, `fluent`, `icon` |

