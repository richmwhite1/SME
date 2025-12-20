# Global Search Setup

## Overview
Global Search functionality has been implemented with a search bar in the header, dropdown quick results, and a dedicated search results page.

## What Was Built

### 1. Search Bar Component (`components/search/SearchBar.tsx`)
- **Location**: Integrated into the main Navbar
- **Features**:
  - Real-time search as user types (300ms debounce)
  - Dropdown with quick results (max 5 per category)
  - Command-K (⌘K) shortcut to focus search bar
  - Escape key to close dropdown
  - Click outside to close
  - Categorized results: Products, Discussions, Resources
  - Visual icons for each result type
  - SME Certified badge indicator for certified products
  - "View all results" link to navigate to full results page

### 2. Search Results Page (`app/search/page.tsx`)
- **Route**: `/search?q=...`
- **Features**:
  - Detailed results list (up to 50 results)
  - Results grouped by type (Products, Discussions, Resources)
  - High relevance indicators
  - Author information and timestamps
  - Empty state with call-to-action
  - Clickable results that navigate to the content

### 3. Global Search RPC Function (`supabase-global-search-rpc.sql`)
- **Function**: `global_search(search_query TEXT, result_limit INTEGER)`
- **Searches Across**:
  - `protocols` table (Products)
  - `discussions` table
  - `resource_library` view (Resources)
- **Features**:
  - Relevance scoring (title matches = 10, content matches = 5)
  - Filters out flagged content
  - Returns results with metadata (type, slug, author, certification status)
  - Sorted by relevance score and date

### 4. Visual Cues
- **Icons**:
  - Flask icon (🫙) for Products (earth-green)
  - Message icon (💬) for Discussions (blue)
  - Book icon (📚) for Resources (purple)
- **Badges**:
  - Award icon (🏆) for SME Certified products
  - "High relevance" badge for results with score > 5
- **Type Labels**: Category headers in dropdown and results page

### 5. Empty State
- **Message**: "No evidence found. Start a new discussion to crowd-source this topic!"
- **CTA**: Link to create new discussion
- **Shown When**: No results found or query too short (< 2 characters)

## Database Setup Required

### Step 1: Create Global Search RPC Function
Run `supabase-global-search-rpc.sql` in your Supabase SQL Editor to create the `global_search` function.

The function:
- Searches across protocols, discussions, and resource_library
- Uses LIKE queries for text matching
- Calculates relevance scores
- Filters flagged content
- Returns structured results with metadata

## Usage

### Quick Search (Dropdown)
1. Click the search bar or press ⌘K (Command-K)
2. Start typing (minimum 2 characters)
3. View quick results in dropdown
4. Click a result to navigate, or press Enter to see all results

### Full Search Results
1. Type in search bar and press Enter
2. Navigate to `/search?q=your-query`
3. View all results grouped by type
4. Click any result to view the full content

### Keyboard Shortcuts
- **⌘K (Mac) / Ctrl+K (Windows)**: Focus search bar
- **Escape**: Close dropdown and clear search
- **Enter**: Navigate to full results page

## Features

### Search Bar
- Real-time search with debouncing
- Dropdown with categorized results
- Visual indicators (icons, badges)
- Keyboard navigation support
- Responsive design

### Results Page
- Detailed result cards
- Grouped by content type
- Relevance scoring
- Author and timestamp info
- Empty state with CTA

### Search Logic
- Searches titles and content
- Relevance-based ranking
- Filters flagged content
- Supports all content types
- Fast response times

## Security
- Search route is public (no authentication required)
- Results automatically filter flagged content
- No sensitive data exposed in search results

## Next Steps
1. Run the SQL migration (`supabase-global-search-rpc.sql`)
2. Test search functionality with various queries
3. Verify Command-K shortcut works
4. Check that SME Certified badges appear correctly
5. Test empty state messaging

## Technical Details

### Search Algorithm
- Uses PostgreSQL LIKE queries for pattern matching
- Relevance scoring:
  - Title match: 10 points
  - Content match: 5 points
  - Default: 1 point
- Results sorted by relevance, then by date

### Performance
- Debounced search (300ms) to reduce API calls
- Limited to 5 results in dropdown for speed
- Up to 50 results on full results page
- Indexed columns for fast queries

### UI/UX
- Dropdown appears after 2+ characters
- Loading state during search
- Smooth transitions and hover states
- Mobile-responsive design
- Accessible keyboard navigation





