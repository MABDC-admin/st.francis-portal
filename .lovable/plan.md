

# Show Description as Primary Name in Agent Cards

## Problem

The agent cards currently display the hostname (e.g., `DESKTOP-4VD01U8`) as the primary label, which is not meaningful. The **Description** field in Tactical RMM contains the actual user/PC name (e.g., "JULIE FE PC"), which is more useful.

## Changes

### 1. AgentCard.tsx

- Show `agent.description` as the primary bold name (falling back to `agent.hostname` if no description exists)
- Show `agent.hostname` as secondary muted text below

### 2. AgentTable.tsx

- Reorder columns so Description appears more prominently
- Show description as the primary identifier in the hostname column, with the actual hostname as secondary text

### Files Modified

| File | Change |
|---|---|
| `src/components/tacticalrmm/AgentCard.tsx` | Swap description and hostname display priority |
| `src/components/tacticalrmm/AgentTable.tsx` | Show description as primary identifier in table rows |

