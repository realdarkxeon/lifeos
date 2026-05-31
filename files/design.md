# Design System

## Theme — dark, minimal, focused
This is a serious productivity tool. No decorative elements, no gradients, no shadows.

## Colors
- Background:   #0a0a0a
- Card:         #111111
- Border:       #1a1a1a
- Text primary: #ffffff
- Text muted:   #666666
- Text subtle:  #333333

Life area color (stored in DB as hex) is used as:
- Left border accent on goal cards (4px solid)
- Progress bar fill color
- Area chip/badge background (at 15% opacity)

## Typography
- Page titles: text-2xl font-semibold
- Card titles: text-base font-medium
- Metadata: text-sm text-muted
- Labels: text-xs uppercase tracking-wide text-subtle

## Components

**Cards**: bg-[#111] border border-[#1a1a1a] rounded-xl p-4

**Progress bar**:
- Track: bg-[#1a1a1a] h-1 rounded-full
- Fill: colored by life area, h-1 rounded-full transition-all

**Buttons**:
- Primary: bg-white text-black rounded-lg px-4 py-2 text-sm font-medium
- Secondary: border border-[#1a1a1a] text-white rounded-lg px-4 py-2 text-sm
- Danger: text-red-500 hover:text-red-400

**Inputs**: bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-white focus:border-white outline-none

**Sidebar**: w-56 border-r border-[#1a1a1a] fixed left-0 top-0 h-full bg-[#0a0a0a]
- Nav items: text-sm text-[#666] hover:text-white px-4 py-2 rounded-lg
- Active: text-white bg-[#111]

## Layout
- Sidebar: 224px fixed left
- Main content: ml-56 p-8 max-w-4xl
- Page header: mb-8 with title + action button right-aligned

## Interaction
- Hover states on all clickable elements
- Smooth transitions (150ms) on progress bars and status changes
- Completing a task: instant strikethrough + KR bar animates
- Empty states: simple text, no illustrations

## Tailwind only
No shadcn, no Radix, no external UI libraries.
