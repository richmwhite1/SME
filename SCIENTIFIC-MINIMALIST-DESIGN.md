# Scientific Minimalist Design System

## Overview
A clean, research-focused design system that emphasizes readability, precision, and scientific credibility.

## Color Palette

### Primary Colors
- **Background (Cards)**: `#F8FAFC` - Light gray for card backgrounds
- **Borders**: `#E2E8F0` - Subtle gray borders
- **SME Gold**: `#B8860B` - For certification badges
- **Text Primary**: `#1C1C1E` (deep-stone)
- **Text Secondary**: `#1C1C1E` with opacity (60-80%)

### Accent Colors
- **Green Dots/Checkmarks**: `#16A34A` (green-600) for verification indicators
- **Earth Green**: `#4A5D4E` - Brand color for links and accents

## Typography

### Serif Fonts (Journal of Medicine Feel)
- **Product Titles**: `font-serif` - For main headings
- **Section Headings**: `font-serif` with `font-semibold`
- **Expert Notebook**: All headings use serif

### Monospace Fonts (Technical Data)
- **Step Numbers**: `font-mono` for protocol steps
- **COA Links**: `font-mono` for technical references
- **Search Bar**: `font-mono` for command-line aesthetic
- **Image Counters**: `font-mono` for image navigation
- **Certification Notes**: `font-mono` for technical documentation
- **Code Blocks**: `font-mono` in markdown

### Sans-Serif (Body Text)
- **Body Text**: Default sans-serif for readability
- **Navigation**: Clean sans-serif
- **Buttons**: Sans-serif for clarity

## Component Styling

### Transparency Card
```css
Background: #F8FAFC
Border: 1px solid #E2E8F0
Padding: 1.5rem (p-6)
Border-radius: rounded (4px)
```

**Checklist Items:**
- Small green dot (1.5px × 1.5px) instead of large checkmarks
- Monochrome text layout
- Minimal spacing (py-2)
- No background colors, just clean borders

### Image Gallery
- **Aspect Ratio**: `4/3` (aspect-[4/3])
- **Object Fit**: `object-contain` (no cropping)
- **Background**: `#F8FAFC` with `#E2E8F0` border
- **Padding**: Generous padding (p-6) to show full supplement facts
- **Zoom Modal**: White background, clean borders, high-resolution viewing

### Navigation Bar
- **Height**: `h-14` (56px) - Compact
- **Background**: `bg-white` - No transparency
- **Border**: `border-b border-[#E2E8F0]` - Thin, subtle
- **No Shadows**: Clean, flat design
- **Search Bar**: Command-line style with monospace font

### Search Bar (Command-Line Aesthetic)
- **Style**: Underline input (border-b) instead of full border
- **Font**: `font-mono` for terminal/research tool feel
- **Prompt**: `>` character on the left
- **Shortcut**: `⌘K` indicator on the right
- **Placeholder**: "Search evidence vault... (⌘K)"
- **Background**: Transparent
- **Border**: Bottom border only (`border-b`)

### SME Certified Badge
- **Color**: `#B8860B` (SME Gold)
- **Style**: Subtle border and background tint
- **Icon**: Award icon in gold color
- **No Gradient**: Flat, professional appearance

### Buttons
- **Primary**: Black background (`bg-deep-stone`) with white text
- **Secondary**: Border only with transparent background
- **Hover**: Subtle color transitions, no scaling
- **No Shadows**: Flat design

## Layout Principles

### Spacing
- **Consistent Padding**: p-6 for cards, p-8 for content sections
- **Minimal Gaps**: gap-2, gap-3 for tight, organized layouts
- **Breathing Room**: mb-12 for major sections

### Borders
- **Thin Borders**: `border` (1px) not `border-2`
- **Color**: `#E2E8F0` for all borders
- **Radius**: `rounded` (4px) for subtle corners

### Backgrounds
- **Cards**: `#F8FAFC` for subtle distinction
- **Main Background**: White or sand-beige
- **No Gradients**: Flat colors only

## Implementation Checklist

- [x] Transparency card with #F8FAFC background and #E2E8F0 border
- [x] SME Gold (#B8860B) for certification badge
- [x] Green dots for checklist items (monochrome layout)
- [x] Image gallery with 4/3 aspect ratio and object-contain
- [x] Zoom/lightbox functionality for high-res viewing
- [x] Serif font for product titles
- [x] Monospace font for technical data
- [x] Minimalist navigation with thin borders
- [x] Command-line style search bar
- [x] No shadows throughout
- [x] Clean, flat button designs

## Usage Examples

### Product Title
```tsx
<h1 className="font-serif text-4xl font-semibold text-deep-stone">
  Product Name
</h1>
```

### Technical Data
```tsx
<span className="font-mono text-xs text-deep-stone/60">
  Batch: ABC123
</span>
```

### Transparency Card
```tsx
<div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-6">
  {/* Content */}
</div>
```

### Checklist Item
```tsx
<div className="flex items-center gap-3 py-2">
  <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
  <span className="text-sm text-deep-stone">Item Name</span>
</div>
```




