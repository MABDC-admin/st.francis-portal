

# Connect All Monitors - Live View Page

## Overview

Add a "Connect All" button to the Tactical RMM dashboard that fetches authenticated MeshCentral URLs for all online agents simultaneously and opens a dedicated multi-monitor live view showing each agent's remote desktop in an embedded iframe grid.

## How It Works

1. User clicks "Connect All" in the toolbar
2. The system fetches authenticated MeshCentral control URLs for all online agents in parallel (using the existing `takecontrol` proxy action)
3. A new full-screen view renders each agent's remote desktop feed inside an iframe tile
4. Each tile shows the agent's name, status badge, and a close button to remove individual feeds
5. A toolbar at the top lets you go back, refresh all connections, or toggle grid layout

## Important Note

MeshCentral remote desktop URLs are full web applications. Whether they render inside iframes depends on the MeshCentral server's `X-Frame-Options` / CSP headers. If the server blocks iframe embedding, the implementation will fall back to opening each connection in a separate browser tab (same as current "Take Control" behavior, but for all agents at once). The UI will detect and display an error state per tile if iframe loading fails.

## Changes

### 1. New Component: `LiveMonitorView.tsx`

A full-page view component that:
- Receives the list of online agents and their control URLs
- Renders a responsive grid of iframe tiles (auto-adjusts from 1 to 4 columns)
- Each tile has: agent name label, status indicator, close/remove button, iframe with the MeshCentral control URL
- Handles iframe load errors gracefully (shows "Open in new tab" fallback)
- Header bar with: back button, "Refresh All" button, connected count, layout toggle (2x2, 3x3, auto)

### 2. Updated: `TacticalRMMDashboard.tsx`

- Add "Connect All" button next to the existing "Refresh" button in the header
- Add `connectAllLoading` state to show progress during batch URL fetching
- Add `liveViewMode` state to toggle between normal dashboard and the live monitor view
- Fetch control URLs for all online agents in parallel using `Promise.allSettled`
- Track connection results (success/failed per agent) and pass to `LiveMonitorView`

### 3. Updated: `types.ts`

- Add `ConnectedAgent` type extending `Agent` with a `controlUrl` field and `connectionError` field

## Files

| File | Action | Description |
|---|---|---|
| `src/components/tacticalrmm/LiveMonitorView.tsx` | Create | Multi-monitor iframe grid view |
| `src/components/tacticalrmm/TacticalRMMDashboard.tsx` | Modify | Add "Connect All" button, batch URL fetching, live view toggle |
| `src/components/tacticalrmm/types.ts` | Modify | Add `ConnectedAgent` type |

## Technical Details

- Batch fetching uses `Promise.allSettled` so one failed agent does not block others
- Each iframe gets a unique key and `sandbox="allow-scripts allow-same-origin allow-popups"` for security
- If an iframe fails to load (detected via `onError` and a timeout check), the tile shows an error state with an "Open in Tab" button as fallback
- The grid uses CSS `grid-template-columns` with responsive breakpoints
- Individual tiles can be closed/removed from the view
- A "Refresh All" button re-fetches all control URLs (tokens are temporary so they may expire)

