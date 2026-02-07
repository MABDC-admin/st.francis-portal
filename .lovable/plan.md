
# Add "Take Control" Button to Agent Cards

## What Changes

Add a **Take Control** button directly on each agent card so you can launch a remote desktop session without opening the detail sheet first. The button will only appear on online agents and will call the same API-authenticated flow already built.

## Changes

### AgentCard.tsx

- Accept a new `onTakeControl` callback prop (passed from the parent dashboard)
- Add a small "Take Control" button at the bottom of each card, visible only for online agents
- The button click calls `onTakeControl(agent)` and stops event propagation (so the card click still opens the detail sheet)
- Show a loading state on the button while connecting

### TacticalRMMDashboard.tsx

- Extract the `openTakeControl` logic (calling the edge function proxy to get the authenticated MeshCentral URL) into a shared function
- Pass it as an `onTakeControl` prop to each `AgentCard`

## Technical Details

| File | Change |
|---|---|
| `src/components/tacticalrmm/AgentCard.tsx` | Add `onTakeControl` prop, render a small button for online agents with loading state |
| `src/components/tacticalrmm/TacticalRMMDashboard.tsx` | Add `handleTakeControl(agent)` function that calls the proxy, pass it to `AgentCard` |

The button will use `e.stopPropagation()` so clicking it does not also trigger the card's `onClick` (which opens the detail sheet). Offline agents will not show the button.
