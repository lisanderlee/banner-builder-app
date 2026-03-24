# Banner Platform — Build Brief
> HTML5 & static banner production tool. Campaign management, shared assets, resize-aware layers, client review.

---

## Product definition

A campaign management tool for HTML5 and static banner production. Define all deliverable sizes upfront, upload shared assets once, apply them globally with resize rules, tweak per-banner, and share a clean review link with clients.

**Stack:** Next.js (App Router) · Supabase (auth, database, storage) · Tailwind CSS

---

## What is in v1

- Campaigns CRUD
- Deliverables list per campaign (size, format, locale, label)
- Asset library per campaign (upload to Supabase Storage, tag by type)
- Layer system with resize behavior rules
- Canvas editor — layer stack + live HTML preview, apply globally, override per banner
- Banner grid overview — thumbnails at correct aspect ratio, status badges
- Export — clean HTML5 file per banner, PNG fallback, zip download
- Client review page — public token, no login, approve or comment per banner

**Explicitly out of scope for v1:**
- Animation authoring / timeline editor
- Team accounts or multi-user editing
- Approval workflow automation
- GIF or video export

---

## Database schema (Supabase)

### `campaigns`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | references auth.users |
| name | text | |
| client | text | |
| brand | text | |
| status | text | `active` \| `archived` |
| created_at | timestamptz | |

### `deliverables`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| campaign_id | uuid FK | |
| label | text | e.g. "Leaderboard EN" |
| width | integer | pixels |
| height | integer | pixels |
| format | text | `html5` \| `static` |
| locale | text | e.g. `en-US`, `fr-FR` |
| status | text | `pending` \| `in_progress` \| `ready_for_review` \| `approved` \| `exported` |
| created_at | timestamptz | |

### `assets`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| campaign_id | uuid FK | |
| type | text | `logo` \| `background` \| `product` \| `font` \| `other` |
| name | text | display name |
| url | text | Supabase Storage public URL |
| created_at | timestamptz | |

### `layers`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| campaign_id | uuid FK | |
| name | text | e.g. "Headline", "Logo", "Background" |
| type | text | `image` \| `text` \| `shape` |
| asset_id | uuid FK nullable | references assets |
| content | text nullable | for text layers |
| x_pct | float | position as % of canvas width |
| y_pct | float | position as % of canvas height |
| w_pct | float | width as % of canvas width |
| h_pct | float | height as % of canvas height |
| resize_behavior | text | `scale` \| `anchor` \| `fixed` \| `hide` |
| anchor_x | text nullable | `left` \| `center` \| `right` — used when resize_behavior is `anchor` |
| anchor_y | text nullable | `top` \| `center` \| `bottom` |
| z_index | integer | |
| font_size | integer nullable | base font size in px (for text layers) |
| font_size_min | integer nullable | minimum font size floor when scaling |
| styles | jsonb nullable | additional CSS properties |

### `layer_overrides`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| layer_id | uuid FK | |
| deliverable_id | uuid FK | |
| patch | jsonb | sparse delta — only what changed from master layer |

### `review_tokens`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| campaign_id | uuid FK | |
| token | text | UUID, used in public URL |
| created_at | timestamptz | |

### `review_comments`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| deliverable_id | uuid FK | |
| token | text | which review session |
| action | text | `approved` \| `comment` |
| body | text nullable | comment text |
| created_at | timestamptz | |

---

## Resize behavior rules

Each layer carries a `resize_behavior` field. The renderer applies the rule when generating output for each deliverable size.

| behavior | description | use for |
|---|---|---|
| `scale` | Position and size scale proportionally with canvas | Backgrounds, full-bleed images |
| `anchor` | Layer stays pinned to a corner/edge, does not scale | Logos, CTA buttons |
| `fixed` | Layer stays at exact pixel dimensions regardless of canvas size | Text at minimum readable size, legal copy |
| `hide` | Layer is excluded from this size entirely | Decorative elements that don't fit small formats |

Overrides in `layer_overrides.patch` can change any layer field for a specific deliverable, including `resize_behavior`.

---

## Renderer (build this first, in isolation)

The renderer is a pure function. Everything else is a UI wrapper around it.

```typescript
// lib/renderer.ts

interface Layer {
  id: string
  type: 'image' | 'text' | 'shape'
  asset_id?: string
  content?: string
  x_pct: number
  y_pct: number
  w_pct: number
  h_pct: number
  resize_behavior: 'scale' | 'anchor' | 'fixed' | 'hide'
  anchor_x?: 'left' | 'center' | 'right'
  anchor_y?: 'top' | 'center' | 'bottom'
  z_index: number
  font_size?: number
  font_size_min?: number
  styles?: Record<string, string>
  url?: string // resolved from asset
}

interface Override {
  [key: string]: unknown // sparse patch
}

function renderBanner(
  layers: Layer[],
  overrides: Record<string, Override>, // keyed by layer_id
  width: number,
  height: number
): string {
  // 1. Merge overrides into layers
  // 2. Filter hidden layers
  // 3. Compute absolute px values from pct + resize rule
  // 4. Return complete HTML string
}
```

### Rendering logic per resize behavior

```
scale:
  x = x_pct * width
  y = y_pct * height
  w = w_pct * width
  h = h_pct * height

anchor:
  w = w_pct * master_width  (fixed size from master)
  h = h_pct * master_height
  x = resolved from anchor_x (left → 0+margin, center → (width-w)/2, right → width-w-margin)
  y = resolved from anchor_y

fixed:
  x = x_pct * width
  y = y_pct * height
  w = fixed px from master
  h = fixed px from master
  font_size = max(font_size, font_size_min)

hide:
  layer excluded from output
```

### HTML output structure

Each banner export is a self-contained HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="ad.size" content="width={w},height={h}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: {w}px; height: {h}px; overflow: hidden; position: relative; }
    .layer { position: absolute; }
  </style>
</head>
<body>
  <!-- layers rendered as absolute-positioned divs -->
  <div class="layer" style="left:{x}px; top:{y}px; width:{w}px; height:{h}px; z-index:{z};">
    <!-- image: <img src="..." style="width:100%;height:100%;object-fit:cover"> -->
    <!-- text: content string with inline styles -->
  </div>
  <script>
    var clickTag = ""; // ad server click URL placeholder
  </script>
</body>
</html>
```

---

## Next.js routes

```
app/
  page.tsx                                  → campaigns dashboard
  campaigns/
    new/
      page.tsx                              → create campaign form
    [id]/
      page.tsx                              → campaign workspace (assets + deliverables tabs)
      canvas/
        page.tsx                            → banner grid overview
        [deliverable_id]/
          page.tsx                          → single banner editor
review/
  [token]/
    page.tsx                                → public client review page (no auth)
```

---

## Page specs

### `/` — Campaigns dashboard
- List of campaigns (name, client, status, deliverable count, last updated)
- Create new campaign button
- Archive / unarchive action
- Filter by status

### `/campaigns/new` — Create campaign
- Fields: name, client, brand
- On submit → create campaign → redirect to `/campaigns/[id]`

### `/campaigns/[id]` — Campaign workspace
Two tabs:

**Deliverables tab**
- Table with columns: label, width × height, format, locale, status
- Add row inline (or paste from spreadsheet — parse tab-separated values)
- Delete row
- Bulk status update

**Assets tab**
- Drag-and-drop uploader → Supabase Storage → insert into `assets`
- Asset type tag selector (logo / background / product / font / other)
- Asset grid with thumbnail, name, type badge
- Delete asset

### `/campaigns/[id]/canvas` — Banner grid
- All deliverables as thumbnail cards at correct aspect ratio
- Status badge per card (color-coded)
- Click card → go to single banner editor
- "Share review link" button → generate token → copy URL to clipboard
- "Export all approved" button → zip download

### `/campaigns/[id]/canvas/[deliverable_id]` — Single banner editor

Three-panel layout:

**Left panel — Layer stack**
- Ordered list of layers (master layers for this campaign)
- Visibility toggle per layer
- Click layer to select and show in right panel
- Override indicator badge if this deliverable has a delta for that layer
- "Reset to global" per overridden layer
- Add layer button

**Center panel — Live preview**
- iframe or div rendering the HTML output of `renderBanner()`
- Updates in real time as layers or overrides change
- Shows canvas at correct pixel dimensions (scaled to fit panel)
- Size label shown below preview

**Right panel — Layer properties**
- Shows properties of the selected layer
- Editable fields: content (text), asset picker (image), x/y/w/h, font size, resize behavior
- Editing any field writes to `layer_overrides` for this deliverable
- "Apply to all sizes" button → updates master layer (clears all overrides for that layer)

### `/review/[token]` — Client review page
- Validate token against `review_tokens`
- Show campaign name and brand
- Grid of all deliverables with live HTML preview per banner
- Each banner card has: Approve button, Add comment input
- Approved banners show green badge
- Commented banners show comment count badge
- No editing, no login, no complexity
- Designer sees all comments in the campaign workspace

---

## Build phases

Six phases. Each one has a clear done state you can verify yourself before starting the next.

---

### Phase 1 — Foundation
**Goal:** working app shell with auth and campaign management.

Tasks:
- Scaffold Next.js app with App Router and Tailwind
- Connect Supabase client (`lib/supabase.ts`)
- Auth: email/password sign up, sign in, sign out, middleware route protection
- Create `campaigns` table with RLS policies
- `/` — campaigns dashboard: list, create, archive
- `/campaigns/new` — create campaign form

**Done when:** you can open the browser, sign in, create a campaign, and see it listed.

Cursor prompt to start:
> "Using PRD.md, scaffold a Next.js App Router project with Supabase auth, the campaigns table, and the dashboard and create-campaign pages. Phase 1 only."

---

### Phase 2 — Data entry
**Goal:** a campaign can hold all its deliverable specs and uploaded assets.

Tasks:
- Create `deliverables` table with RLS
- `/campaigns/[id]` — two-tab workspace layout
- Deliverables tab: inline table, add/delete rows, set width/height/format/locale/label
- Create `assets` table and Supabase Storage bucket
- Assets tab: drag-drop uploader, type tag selector, thumbnail grid, delete

**Done when:** a campaign has a list of banner sizes and at least one uploaded image visible in the asset grid.

Cursor prompt to start:
> "Using PRD.md Phase 2, add the deliverables table and asset upload to the campaign workspace. Build the two-tab layout with inline deliverables editing and drag-drop asset upload to Supabase Storage."

---

### Phase 3 — Renderer
**Goal:** a pure function that turns layer data into a valid HTML banner string.

Tasks:
- Create `layers` and `layer_overrides` tables with RLS
- Build `lib/renderer.ts` — `renderBanner(layers, overrides, width, height): string`
- Implement all four resize behaviors: `scale`, `anchor`, `fixed`, `hide`
- Build a simple test page at `/test-renderer` with hardcoded layer data
- Verify output at three sizes: 970×250, 300×250, 160×600

**Done when:** the test page renders a background image, a logo, and a text layer correctly at all three sizes with no manual pixel adjustments.

Cursor prompt to start:
> "Using PRD.md Phase 3, create the layers and layer_overrides tables, then build lib/renderer.ts as a pure function. Add a /test-renderer page with hardcoded data to verify output at three banner sizes."

---

### Phase 4 — Canvas editor
**Goal:** open any deliverable, see a live preview, edit layers, save overrides.

Tasks:
- Layer management UI on the campaign workspace: add/edit/delete master layers
- `/campaigns/[id]/canvas/[deliverable_id]` — three-panel editor
- Left: layer stack with visibility toggle, override badge, reset-to-global
- Center: live iframe preview, updates on change, correct aspect ratio
- Right: property panel — content, asset picker, position, resize behavior
- Writes overrides to `layer_overrides` on edit
- "Apply to all sizes" button clears overrides and updates master layer

**Done when:** you can open a specific banner, change the headline text in the property panel, and see it update in the preview without reloading.

Cursor prompt to start:
> "Using PRD.md Phase 4, build the three-panel canvas editor for /campaigns/[id]/canvas/[deliverable_id]. Wire it to the renderer for live preview and save edits as layer_overrides."

---

### Phase 5 — Grid and export
**Goal:** see all banners at a glance and download working files.

Tasks:
- `/campaigns/[id]/canvas` — banner grid
- Thumbnail cards at correct aspect ratios using the renderer
- Status badge per card (color-coded by status value)
- Click card → navigate to editor
- Export single banner → HTML file download
- Export all → JSZip bundle, one folder per deliverable
- PNG fallback for static format banners (html2canvas or similar)

**Done when:** you can click "Export all" and open a downloaded HTML file in a browser and it renders correctly.

Cursor prompt to start:
> "Using PRD.md Phase 5, build the banner grid page and export functionality. Each card renders a live preview via the renderer. Export generates clean HTML files and a zip download using JSZip."

---

### Phase 6 — Client review
**Goal:** share a link with a client, they approve or comment, you see their feedback.

Tasks:
- Create `review_tokens` and `review_comments` tables
- "Share review link" button on banner grid → generate UUID token → copy to clipboard
- `/review/[token]` — public page, no auth required
- Show campaign name, banner grid with live previews
- Approve button and comment input per banner card
- Approved and commented states persist and show badges
- Designer sees comment count and approve status in the campaign workspace

**Done when:** you can open the review link in an incognito window, approve two banners, add a comment, and see both reflected when you return to the workspace.

Cursor prompt to start:
> "Using PRD.md Phase 6, add the review_tokens and review_comments tables, a share button that generates a token, and the public /review/[token] page with approve and comment per banner."

---

## Key technical decisions

**Positions stored as percentages, not pixels.**
All layer x/y/w/h values are stored as floats (0.0–1.0) relative to canvas size. The renderer converts to absolute px at render time. This is what enables resize rules to work cleanly.

**Overrides are sparse JSON patches.**
`layer_overrides.patch` only stores what changed — `{ "content": "Shop Now" }` not a full layer copy. The renderer merges patch on top of master layer before rendering.

**Renderer is a pure function.**
No side effects, no DB calls. Takes layers + overrides + dimensions, returns an HTML string. This makes it testable in isolation and reusable for both preview and export.

**Client review requires no login.**
A UUID token in the URL is the only authentication. Tokens are stored in `review_tokens`. Revoke by deleting the token row.

**Supabase Storage structure:**
```
campaigns/{campaign_id}/{asset_id}/{filename}
```
Assets are scoped per campaign. RLS ensures users can only access their own campaign assets.

---

## Supabase RLS policies (reference)

```sql
-- campaigns: users own their campaigns
create policy "users manage own campaigns"
on campaigns for all
using (auth.uid() = user_id);

-- deliverables: accessible if campaign belongs to user
create policy "users manage own deliverables"
on deliverables for all
using (
  campaign_id in (
    select id from campaigns where user_id = auth.uid()
  )
);

-- review_tokens: public read by token (no auth required)
create policy "public read review tokens"
on review_tokens for select
using (true);

-- review_comments: public insert by token
create policy "public insert review comments"
on review_comments for insert
with check (true);
```

---

## Glossary

| term | meaning |
|---|---|
| Campaign | Top-level project container |
| Deliverable | A single banner at a specific size, format and locale |
| Asset | An uploaded file (image, font) scoped to a campaign |
| Layer | A visual element defined on a campaign, shared across all deliverables |
| Override | A per-deliverable delta on top of a master layer |
| Resize behavior | Rule that controls how a layer adapts when canvas size changes |
| Review token | A UUID that grants public read-only access to a campaign's review page |
