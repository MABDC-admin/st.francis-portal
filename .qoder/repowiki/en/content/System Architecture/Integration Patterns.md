# Integration Patterns

<cite>
**Referenced Files in This Document**
- [index.ts](file://supabase/functions/canva-api/index.ts)
- [index.ts](file://supabase/functions/canva-auth/index.ts)
- [index.ts](file://supabase/functions/nocodb-proxy/index.ts)
- [index.ts](file://supabase/functions/tacticalrmm-proxy/index.ts)
- [index.ts](file://supabase/functions/zoom-auth/index.ts)
- [CanvaStudio.tsx](file://src/components/canva/CanvaStudio.tsx)
- [NocoDBDashboard.tsx](file://src/components/nocodb/NocoDBDashboard.tsx)
- [TacticalRMMDashboard.tsx](file://src/components/tacticalrmm/TacticalRMMDashboard.tsx)
- [ZoomDashboard.tsx](file://src/components/zoom/ZoomDashboard.tsx)
- [GoogleDocsDashboard.tsx](file://src/components/googledocs/GoogleDocsDashboard.tsx)
- [client.ts](file://src/integrations/supabase/client.ts)
- [20260205201205_b21fa2e1-664f-4a7e-a181-62d40fa90375.sql](file://supabase/migrations/20260205201205_b21fa2e1-664f-4a7e-a181-62d40fa90375.sql)
- [20260205202544_ed9e158e-1cb5-4d45-951e-ef0001dc7cef.sql](file://supabase/migrations/20260205202544_ed9e158e-1cb5-4d45-951e-ef0001dc7cef.sql)
- [20260208003659_39356598-c156-47f6-aa3d-4a829b37cb35.sql](file://supabase/migrations/20260208003659_39356598-c156-47f6-aa3d-4a829b37cb35.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document describes the integration patterns used by the St. Francis Portal for third-party services. It focuses on how the system proxies external APIs, authenticates users, manages connections, synchronizes data, and handles errors. The covered integrations include:
- Zoom virtual classrooms
- Canva design collaboration
- NocoDB database management
- Tactical RMM system
- Google Docs integration

It also explains proxy patterns for secure third-party API access, authentication mechanisms, data synchronization strategies, error handling, configuration management, rate limiting considerations, and monitoring integration health.

## Project Structure
The integration architecture is split between:
- Frontend React components that orchestrate user actions and display data
- Supabase Edge Functions that act as secure proxies to external APIs and manage OAuth flows
- Supabase database tables and Row Level Security (RLS) policies to store connection metadata and enforce access controls

```mermaid
graph TB
subgraph "Frontend"
ZDash["ZoomDashboard.tsx"]
CStudio["CanvaStudio.tsx"]
NDash["NocoDBDashboard.tsx"]
TRDash["TacticalRMMDashboard.tsx"]
GDDash["GoogleDocsDashboard.tsx"]
end
subgraph "Supabase Edge Functions"
ZAuth["zoom-auth/index.ts"]
CA["canva-auth/index.ts"]
CApi["canva-api/index.ts"]
NP["nocodb-proxy/index.ts"]
TRP["tacticalrmm-proxy/index.ts"]
end
subgraph "Supabase DB"
Conn["canva_connections<br/>canva_oauth_states"]
GDocs["google_docs"]
end
ZDash --> ZAuth
CStudio --> CA
CStudio --> CApi
NDash --> NP
TRDash --> TRP
GDDash --> GDocs
CA --> Conn
CA --> GDocs
CApi --> Conn
NP --> GDocs
```

**Diagram sources**
- [ZoomDashboard.tsx](file://src/components/zoom/ZoomDashboard.tsx#L1-L308)
- [CanvaStudio.tsx](file://src/components/canva/CanvaStudio.tsx#L1-L199)
- [NocoDBDashboard.tsx](file://src/components/nocodb/NocoDBDashboard.tsx#L1-L233)
- [TacticalRMMDashboard.tsx](file://src/components/tacticalrmm/TacticalRMMDashboard.tsx#L1-L250)
- [GoogleDocsDashboard.tsx](file://src/components/googledocs/GoogleDocsDashboard.tsx#L1-L260)
- [index.ts](file://supabase/functions/zoom-auth/index.ts#L1-L120)
- [index.ts](file://supabase/functions/canva-auth/index.ts#L1-L336)
- [index.ts](file://supabase/functions/canva-api/index.ts#L1-L161)
- [index.ts](file://supabase/functions/nocodb-proxy/index.ts#L1-L72)
- [index.ts](file://supabase/functions/tacticalrmm-proxy/index.ts#L1-L116)
- [20260205201205_b21fa2e1-664f-4a7e-a181-62d40fa90375.sql](file://supabase/migrations/20260205201205_b21fa2e1-664f-4a7e-a181-62d40fa90375.sql#L1-L39)
- [20260205202544_ed9e158e-1cb5-4d45-951e-ef0001dc7cef.sql](file://supabase/migrations/20260205202544_ed9e158e-1cb5-4d45-951e-ef0001dc7cef.sql#L1-L18)
- [20260208003659_39356598-c156-47f6-aa3d-4a829b37cb35.sql](file://supabase/migrations/20260208003659_39356598-c156-47f6-aa3d-4a829b37cb35.sql#L1-L19)

**Section sources**
- [client.ts](file://src/integrations/supabase/client.ts#L1-L17)
- [index.ts](file://supabase/functions/canva-api/index.ts#L1-L161)
- [index.ts](file://supabase/functions/canva-auth/index.ts#L1-L336)
- [index.ts](file://supabase/functions/nocodb-proxy/index.ts#L1-L72)
- [index.ts](file://supabase/functions/tacticalrmm-proxy/index.ts#L1-L116)
- [index.ts](file://supabase/functions/zoom-auth/index.ts#L1-L120)
- [CanvaStudio.tsx](file://src/components/canva/CanvaStudio.tsx#L1-L199)
- [NocoDBDashboard.tsx](file://src/components/nocodb/NocoDBDashboard.tsx#L1-L233)
- [TacticalRMMDashboard.tsx](file://src/components/tacticalrmm/TacticalRMMDashboard.tsx#L1-L250)
- [ZoomDashboard.tsx](file://src/components/zoom/ZoomDashboard.tsx#L1-L308)
- [GoogleDocsDashboard.tsx](file://src/components/googledocs/GoogleDocsDashboard.tsx#L1-L260)

## Core Components
- Supabase Edge Functions: Secure, serverless proxies that:
  - Authenticate requests via Supabase Auth
  - Manage OAuth flows and token storage
  - Forward requests to external APIs with appropriate headers
  - Enforce configuration checks and return structured error responses
- Frontend dashboards: Orchestrate user actions, display data, and call Edge Functions for backend operations
- Supabase DB: Stores connection metadata and user-accessible documents with RLS policies

Key implementation patterns:
- Proxy pattern: Edge Functions forward HTTP requests/responses to external services
- OAuth 2.0 with PKCE: Secure authorization for Canva
- Token refresh and expiration handling: Automatic renewal for long-lived integrations
- Configuration gating: Proxies check environment variables and return explicit “not configured” responses
- Error normalization: Consistent error payloads and status codes

**Section sources**
- [index.ts](file://supabase/functions/canva-api/index.ts#L1-L161)
- [index.ts](file://supabase/functions/canva-auth/index.ts#L1-L336)
- [index.ts](file://supabase/functions/nocodb-proxy/index.ts#L1-L72)
- [index.ts](file://supabase/functions/tacticalrmm-proxy/index.ts#L1-L116)
- [index.ts](file://supabase/functions/zoom-auth/index.ts#L1-L120)
- [client.ts](file://src/integrations/supabase/client.ts#L1-L17)

## Architecture Overview
The integration architecture follows a consistent pattern:
- Frontend components call Supabase Edge Functions via the Supabase client
- Edge Functions validate authentication, optionally retrieve or refresh third-party tokens, and proxy requests to external APIs
- Responses are normalized and returned to the frontend
- Database tables store connection metadata and user-accessible resources with RLS policies

```mermaid
sequenceDiagram
participant UI as "Frontend Component"
participant SB as "Supabase Client"
participant FN as "Edge Function"
participant EXT as "External API"
UI->>SB : Invoke function with auth header
SB->>FN : HTTP request (with Authorization)
FN->>FN : Validate auth, load config, fetch/refresh tokens
FN->>EXT : Forward request with required headers
EXT-->>FN : Response (JSON or non-JSON)
FN->>FN : Normalize response, handle errors
FN-->>SB : JSON payload
SB-->>UI : Render data or show error
```

**Diagram sources**
- [client.ts](file://src/integrations/supabase/client.ts#L1-L17)
- [index.ts](file://supabase/functions/canva-api/index.ts#L73-L160)
- [index.ts](file://supabase/functions/canva-auth/index.ts#L44-L335)
- [index.ts](file://supabase/functions/nocodb-proxy/index.ts#L9-L71)
- [index.ts](file://supabase/functions/tacticalrmm-proxy/index.ts#L9-L115)
- [index.ts](file://supabase/functions/zoom-auth/index.ts#L81-L119)

## Detailed Component Analysis

### Zoom Virtual Classrooms
Zoom integration provides meeting credentials and bridging capabilities:
- Backend: Edge Function generates signatures and optional ZAK tokens for secure meetings
- Frontend: Dashboard displays schedule, live status, and controls to join main and breakout sessions

```mermaid
sequenceDiagram
participant UI as "ZoomDashboard.tsx"
participant SB as "Supabase Client"
participant ZF as "zoom-auth/index.ts"
participant Z as "Zoom APIs"
UI->>SB : Invoke zoom-auth with {meetingNumber, role}
SB->>ZF : HTTP request
ZF->>Z : OAuth account_credentials -> access_token
Z-->>ZF : access_token
ZF->>Z : GET /users/me/token (ZAK if role=1)
Z-->>ZF : ZAK token (optional)
ZF->>ZF : Generate JWT signature
ZF-->>SB : {signature, zakToken, sdkKey}
SB-->>UI : Credentials for SDK
```

**Diagram sources**
- [ZoomDashboard.tsx](file://src/components/zoom/ZoomDashboard.tsx#L1-L308)
- [index.ts](file://supabase/functions/zoom-auth/index.ts#L1-L120)

**Section sources**
- [index.ts](file://supabase/functions/zoom-auth/index.ts#L1-L120)
- [ZoomDashboard.tsx](file://src/components/zoom/ZoomDashboard.tsx#L1-L308)

### Canva Design Collaboration
Canva integration supports OAuth 2.0 with PKCE, token refresh, and proxying API calls:
- Authentication flow:
  - Start OAuth with PKCE and state
  - Handle callback, exchange code for tokens, store securely
  - Refresh tokens when nearing expiry
- Proxy:
  - Forward requests to Canva REST API with bearer token
  - Pass-through query params and body for supported methods

```mermaid
sequenceDiagram
participant UI as "CanvaStudio.tsx"
participant SB as "Supabase Client"
participant CA as "canva-auth/index.ts"
participant CP as "canva-api/index.ts"
participant C as "Canva API"
UI->>SB : canva-auth?action=status
SB->>CA : GET status
CA-->>SB : {connected, needsRefresh}
UI->>SB : canva-auth?action=authorize&redirect_uri
SB->>CA : Start OAuth (PKCE, state)
CA-->>SB : {authUrl, state}
UI->>SB : canva-auth?action=callback (after redirect)
SB->>CA : Exchange code for tokens
CA->>C : GET /oauth/token
C-->>CA : tokens
CA->>C : GET /users/me
C-->>CA : profile
CA-->>SB : success
UI->>SB : canva-api?endpoint=...
SB->>CP : Proxy request
CP->>C : Forward with Authorization : Bearer
C-->>CP : Response
CP-->>SB : Response
SB-->>UI : Render designs/templates
```

**Diagram sources**
- [CanvaStudio.tsx](file://src/components/canva/CanvaStudio.tsx#L1-L199)
- [index.ts](file://supabase/functions/canva-auth/index.ts#L44-L335)
- [index.ts](file://supabase/functions/canva-api/index.ts#L73-L160)

**Section sources**
- [index.ts](file://supabase/functions/canva-auth/index.ts#L1-L336)
- [index.ts](file://supabase/functions/canva-api/index.ts#L1-L161)
- [CanvaStudio.tsx](file://src/components/canva/CanvaStudio.tsx#L1-L199)

### NocoDB Database Management
NocoDB integration is proxied through an Edge Function:
- Frontend calls the proxy with an action, path, and optional body
- Proxy validates auth, checks configuration, forwards request to NocoDB, and normalizes responses

```mermaid
sequenceDiagram
participant UI as "NocoDBDashboard.tsx"
participant SB as "Supabase Client"
participant NP as "nocodb-proxy/index.ts"
participant N as "NocoDB API"
UI->>SB : invoke nocodb-proxy {action, path, body}
SB->>NP : HTTP request
NP->>NP : getUser() via Supabase Auth
NP->>N : Forward request with xc-token
N-->>NP : Response (JSON or HTML)
NP->>NP : Validate content-type
NP-->>SB : {data, configured} or error
SB-->>UI : Render bases/tables/records
```

**Diagram sources**
- [NocoDBDashboard.tsx](file://src/components/nocodb/NocoDBDashboard.tsx#L1-L233)
- [index.ts](file://supabase/functions/nocodb-proxy/index.ts#L1-L72)

**Section sources**
- [index.ts](file://supabase/functions/nocodb-proxy/index.ts#L1-L72)
- [NocoDBDashboard.tsx](file://src/components/nocodb/NocoDBDashboard.tsx#L1-L233)

### Tactical RMM System
Tactical RMM integration provides agent listing, status checks, and remote control:
- Frontend invokes proxy actions to list agents, get details, and obtain MeshCentral URLs
- Proxy validates configuration and returns structured responses with optional UI links

```mermaid
sequenceDiagram
participant UI as "TacticalRMMDashboard.tsx"
participant SB as "Supabase Client"
participant TRP as "tacticalrmm-proxy/index.ts"
participant TR as "Tactical RMM API"
UI->>SB : invoke tacticalrmm-proxy {action : list, path : /agents/}
SB->>TRP : HTTP request
TRP->>TR : GET /agents/ with X-API-KEY
TR-->>TRP : Agents list
TRP-->>SB : {data, configured, meshUrl, rmmUrl}
SB-->>UI : Render cards/tables
UI->>SB : invoke tacticalrmm-proxy {action : takecontrol, path : /agents/{id}/meshcentral/}
SB->>TRP : HTTP request
TRP->>TR : GET /agents/{id}/meshcentral/
TR-->>TRP : Mesh URL
TRP-->>SB : {data, configured}
SB-->>UI : Open remote control
```

**Diagram sources**
- [TacticalRMMDashboard.tsx](file://src/components/tacticalrmm/TacticalRMMDashboard.tsx#L1-L250)
- [index.ts](file://supabase/functions/tacticalrmm-proxy/index.ts#L1-L116)

**Section sources**
- [index.ts](file://supabase/functions/tacticalrmm-proxy/index.ts#L1-L116)
- [TacticalRMMDashboard.tsx](file://src/components/tacticalrmm/TacticalRMMDashboard.tsx#L1-L250)

### Google Docs Integration
Google Docs integration stores user-configured links and renders embedded viewers:
- Frontend reads/writes from Supabase table google_docs
- Embed URLs are derived from canonical Google Docs/Sheets/Slides URLs

```mermaid
flowchart TD
Start(["User adds document"]) --> Validate["Validate title and URL"]
Validate --> Detect["Detect doc type (document/spreadsheet/presentation)"]
Detect --> Insert["Insert into google_docs"]
Insert --> Load["Load documents on dashboard"]
Load --> View{"View selected?"}
View --> |Yes| Extract["Convert to embed URL"]
Extract --> Render["Render iframe viewer"]
View --> |No| List["Show grid/list"]
```

**Diagram sources**
- [GoogleDocsDashboard.tsx](file://src/components/googledocs/GoogleDocsDashboard.tsx#L1-L260)
- [20260208003659_39356598-c156-47f6-aa3d-4a829b37cb35.sql](file://supabase/migrations/20260208003659_39356598-c156-47f6-aa3d-4a829b37cb35.sql#L1-L19)

**Section sources**
- [GoogleDocsDashboard.tsx](file://src/components/googledocs/GoogleDocsDashboard.tsx#L1-L260)
- [20260208003659_39356598-c156-47f6-aa3d-4a829b37cb35.sql](file://supabase/migrations/20260208003659_39356598-c156-47f6-aa3d-4a829b37cb35.sql#L1-L19)

## Dependency Analysis
- Frontend depends on Supabase client for function invocation and database access
- Edge Functions depend on:
  - Supabase Auth for user validation
  - Environment variables for external service credentials
  - Database tables for persistent connection metadata
- External services are accessed via HTTPS proxies with minimal request shaping

```mermaid
graph LR
UI["React Components"] --> SB["Supabase Client"]
SB --> F_CANVA_AUTH["canva-auth/index.ts"]
SB --> F_CANVA_API["canva-api/index.ts"]
SB --> F_ZOOM_AUTH["zoom-auth/index.ts"]
SB --> F_NOCODB["nocodb-proxy/index.ts"]
SB --> F_TRMM["tacticalrmm-proxy/index.ts"]
F_CANVA_AUTH --> DB_CONN["canva_connections<br/>canva_oauth_states"]
F_CANVA_API --> DB_CONN
F_NOCODB --> DB_GDOCS["google_docs"]
F_TRMM --> EXT_TRMM["Tactical RMM API"]
F_CANVA_AUTH --> EXT_CANVA["Canva OAuth/API"]
F_ZOOM_AUTH --> EXT_ZOOM["Zoom OAuth/SDK"]
```

**Diagram sources**
- [client.ts](file://src/integrations/supabase/client.ts#L1-L17)
- [index.ts](file://supabase/functions/canva-auth/index.ts#L1-L336)
- [index.ts](file://supabase/functions/canva-api/index.ts#L1-L161)
- [index.ts](file://supabase/functions/zoom-auth/index.ts#L1-L120)
- [index.ts](file://supabase/functions/nocodb-proxy/index.ts#L1-L72)
- [index.ts](file://supabase/functions/tacticalrmm-proxy/index.ts#L1-L116)
- [20260205201205_b21fa2e1-664f-4a7e-a181-62d40fa90375.sql](file://supabase/migrations/20260205201205_b21fa2e1-664f-4a7e-a181-62d40fa90375.sql#L1-L39)
- [20260205202544_ed9e158e-1cb5-4d45-951e-ef0001dc7cef.sql](file://supabase/migrations/20260205202544_ed9e158e-1cb5-4d45-951e-ef0001dc7cef.sql#L1-L18)
- [20260208003659_39356598-c156-47f6-aa3d-4a829b37cb35.sql](file://supabase/migrations/20260208003659_39356598-c156-47f6-aa3d-4a829b37cb35.sql#L1-L19)

**Section sources**
- [client.ts](file://src/integrations/supabase/client.ts#L1-L17)
- [index.ts](file://supabase/functions/canva-auth/index.ts#L1-L336)
- [index.ts](file://supabase/functions/canva-api/index.ts#L1-L161)
- [index.ts](file://supabase/functions/zoom-auth/index.ts#L1-L120)
- [index.ts](file://supabase/functions/nocodb-proxy/index.ts#L1-L72)
- [index.ts](file://supabase/functions/tacticalrmm-proxy/index.ts#L1-L116)
- [20260205201205_b21fa2e1-664f-4a7e-a181-62d40fa90375.sql](file://supabase/migrations/20260205201205_b21fa2e1-664f-4a7e-a181-62d40fa90375.sql#L1-L39)
- [20260205202544_ed9e158e-1cb5-4d45-951e-ef0001dc7cef.sql](file://supabase/migrations/20260205202544_ed9e158e-1cb5-4d45-951e-ef0001dc7cef.sql#L1-L18)
- [20260208003659_39356598-c156-47f6-aa3d-4a829b37cb35.sql](file://supabase/migrations/20260208003659_39356598-c156-47f6-aa3d-4a829b37cb35.sql#L1-L19)

## Performance Considerations
- Minimize round-trips: Batch related operations where possible (e.g., load bases, then tables, then records)
- Cache where feasible: Store frequently accessed lists (e.g., bases, tables) in component state
- Optimize rendering: Use virtualized lists for large datasets (e.g., records)
- Network efficiency: Use proxy functions to avoid CORS complexities and reduce client-side logic
- Rate limiting:
  - Respect external service limits; implement backoff and retry strategies in Edge Functions
  - Consider client-side throttling for frequent refreshes
- Latency reduction:
  - Pre-warm connections by fetching status on app load
  - Defer heavy operations until user interaction

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Authentication failures
  - Verify Supabase Auth is active and user is logged in
  - Check that Edge Functions receive a valid Authorization header
- Configuration not set
  - For NocoDB and Tactical RMM, functions return explicit “not configured” responses when environment variables are missing
  - Confirm environment variables are set in Supabase secrets
- Non-JSON responses
  - Proxies validate content-type and return structured errors when external services return HTML or non-JSON
- Token expiration (Canva)
  - Proxies automatically refresh tokens when nearing expiry; if refresh fails, users must reconnect
- Remote control failures (Tactical RMM)
  - Ensure API keys and URLs are correct; confirm external service availability

Operational checks:
- Monitor function logs for error payloads and status codes
- Validate RLS policies permit access to stored connection data
- Confirm CORS headers are applied consistently across functions

**Section sources**
- [index.ts](file://supabase/functions/nocodb-proxy/index.ts#L29-L60)
- [index.ts](file://supabase/functions/tacticalrmm-proxy/index.ts#L30-L54)
- [index.ts](file://supabase/functions/canva-api/index.ts#L23-L68)
- [index.ts](file://supabase/functions/canva-auth/index.ts#L244-L280)

## Conclusion
The St. Francis Portal integrates third-party services through a robust, secure, and maintainable pattern:
- Edge Functions encapsulate authentication, token management, and proxy logic
- Frontend dashboards remain thin and focused on UX
- Supabase DB enforces access control and persists connection metadata
- Clear error handling and configuration checks improve reliability

This architecture scales across integrations while preserving security and developer ergonomics.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Configuration Management
- Environment variables:
  - Canva: client ID/secret, Supabase service role key
  - NocoDB: base URL and API token
  - Tactical RMM: base URL, API key, Mesh and web URLs
  - Zoom: client ID/secret, account ID
- Supabase secrets: Managed centrally and injected into Edge Functions at runtime

**Section sources**
- [index.ts](file://supabase/functions/canva-api/index.ts#L9-L12)
- [index.ts](file://supabase/functions/canva-auth/index.ts#L9-L12)
- [index.ts](file://supabase/functions/nocodb-proxy/index.ts#L26-L31)
- [index.ts](file://supabase/functions/tacticalrmm-proxy/index.ts#L25-L32)
- [index.ts](file://supabase/functions/zoom-auth/index.ts#L10-L12)

### Data Models and Policies
- canva_connections and canva_oauth_states: Store OAuth tokens and state for PKCE
- google_docs: Stores user-configured document links with RLS policies

```mermaid
erDiagram
CANVA_CONNECTIONS {
uuid user_id PK
string access_token
string refresh_token
timestamptz token_expires_at
string canva_user_id
timestamptz updated_at
}
CANVA_OAUTH_STATES {
uuid state_key PK
uuid user_id
string code_verifier
string redirect_uri
timestamptz expires_at
}
GOOGLE_DOCS {
uuid id PK
string title
string url
string doc_type
timestamptz created_at
}
```

**Diagram sources**
- [20260205201205_b21fa2e1-664f-4a7e-a181-62d40fa90375.sql](file://supabase/migrations/20260205201205_b21fa2e1-664f-4a7e-a181-62d40fa90375.sql#L1-L39)
- [20260205202544_ed9e158e-1cb5-4d45-951e-ef0001dc7cef.sql](file://supabase/migrations/20260205202544_ed9e158e-1cb5-4d45-951e-ef0001dc7cef.sql#L1-L18)
- [20260208003659_39356598-c156-47f6-aa3d-4a829b37cb35.sql](file://supabase/migrations/20260208003659_39356598-c156-47f6-aa3d-4a829b37cb35.sql#L1-L19)