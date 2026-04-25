# Code Audit Report

Date: 2026-04-25
Repository: `st.francis-portal`

## Scope

This audit reviewed build configuration, server middleware, shared UI/config files, selected React components with side effects, browser resource cleanup paths, and dependency/security posture. Automated verification included:

- `npm run build`
- `npm run lint`
- `npm audit --json`

No unit test script is defined in `package.json`, so there were no existing unit tests to run.

## Executive Summary

- Build status: passing
- Lint status: failing with `2153` issues (`1888` errors, `265` warnings)
- Security status: reduced from `20` advisories to `1` remaining advisory
- Remaining unresolved package advisory: `xlsx@0.18.5` (`fixAvailable: false`)

## Irregularities Fixed

| Severity | Location | Irregularity | Recommended Fix | Action Taken |
| --- | --- | --- | --- | --- |
| Critical | `vite.config.ts:6-24` | Supabase URL and publishable key were hardcoded into `define`, overriding `.env.local` and forcing credentials into all builds. | Load environment values first and keep hardcoded values only as fallback for backward compatibility. | Replaced the unconditional override with `loadEnv(...)` and fallback values so local env configuration is respected. |
| High | `package.json:15-17`, `package.json:53`, `package.json:67`, `package.json:92-93`, `package.json:110`, `package.json:114` | Direct dependency vulnerabilities in `axios`, `jspdf`, `postcss`, and `vite`; transitive PWA serialization issue. | Upgrade directly affected packages to patched versions and pin the vulnerable transitive serializer via override. | Upgraded to `axios@1.15.2`, `jspdf@4.2.1`, `postcss@8.5.10`, `vite@7.3.2`, and added an override for `serialize-javascript@7.0.5`. |
| Medium | `server/index.js:29-46`, `server/index.js:103-104`, `server/index.js:142-154` | Rate-limit `Map` entries were never pruned, outbound weather requests had no timeout, and shutdown did not clean up long-lived resources. | Prune stale rate-limit records, set a request timeout, and cleanly close timers/server on shutdown. | Added a prune timer, `axios` timeout, and graceful cleanup for the interval and HTTP server. |
| Medium | `tailwind.config.ts:1-2`, `tailwind.config.ts:148` | Tailwind config used `require(...)` inside an ESM project, violating the repo’s ESLint config and mixing module styles. | Switch to an ESM import. | Replaced `require("tailwindcss-animate")` with an ESM import and plugin reference. |
| Medium | `src/components/dashboard/DashboardCalendar.tsx:20-27`, `src/components/dashboard/DashboardCalendar.tsx:75-78` | Component used `useMemo` for a stateful side effect and untyped mutation payloads. | Use `useEffect` for state synchronization and introduce typed mutation payloads. | Replaced the side-effecting `useMemo` with `useEffect` and added explicit payload interfaces. |
| Medium | `src/components/enrollment/EnrollmentWizard.tsx:65-72` | Wizard used `useMemo` to mutate state when school/year context changed. | Replace with `useEffect` to avoid React memo/side-effect anti-patterns. | Changed synchronization logic to `useEffect`. |
| Medium | `src/components/profile/UserProfilePage.tsx:23-49`, `src/components/profile/UserProfilePage.tsx:109-114`, `src/components/profile/UserProfilePage.tsx:242-249` | Profile image processing created object URLs without consistently revoking them, risking browser memory leaks on repeated image selection. | Revoke temporary object URLs on success, error, replacement, and unmount. | Added object URL cleanup in `resizeImage`, preview replacement logic, and unmount cleanup. |
| Medium | `src/components/teacher-application/steps/PersonalInfoStep.tsx:22-39`, `src/components/teacher-application/steps/PersonalInfoStep.tsx:47-54` | Teacher photo previews created object URLs that could survive replacement/unmount. | Revoke prior preview URLs when replacing or disposing previews. | Added cleanup effect and replacement-safe preview updates. |
| Medium | `src/components/portals/student/widgets/CloudLightningAnimation.tsx:7-27` | Recursive lightning animation used nested `setTimeout` calls without tracking all active timers. | Track both timers and clear them on unmount. | Added refs for both timeouts and cleaned them up in the effect teardown. |
| Medium | `src/components/weather/animations/RainAnimation.tsx:6-25` | Weather animation had the same recursive timeout leak risk as the student portal variant. | Track and clear all scheduled timeouts. | Added timeout refs and cleanup logic. |
| Low | `src/components/registration/RegistrationManagement.tsx:223-231` | CSV export created an object URL without revoking it. | Revoke the object URL immediately after download trigger. | Added `URL.revokeObjectURL(objectUrl)`. |
| Low | `src/components/students/TransmutationManager.tsx:280-287` | CSV export created an object URL without revoking it. | Revoke the object URL after click. | Added `URL.revokeObjectURL(objectUrl)`. |
| Low | `src/components/students/StudentTable.tsx:671-707` | Custom table view still used a hardcoded green header/background instead of semantic design tokens. | Replace hardcoded color classes with tokenized styles. | Updated the header and striping to semantic `secondary`/`muted` classes. |

## Residual Irregularities

| Severity | Location | Irregularity | Recommended Fix | Status |
| --- | --- | --- | --- | --- |
| High | `package.json:93` | `xlsx@0.18.5` still has known prototype-pollution/ReDoS advisories and `npm audit` reports `fixAvailable: false`. | Replace `xlsx` with a maintained alternative or migrate once a patched compatible release is available. | Open |
| High | `src/components/admin/DataQualityDashboard.tsx:36`, `src/components/admin/UserManagement.tsx:82`, `src/components/admissions/AdmissionsPage.tsx:74`, `src/components/aichat/AIChatPage.tsx:70`, `supabase/functions/generate-presentation/index.ts:39`, `supabase/functions/process-pdf/index.ts:17` | The repo has a large inherited lint backlog: unused vars, `any`, missing braces, hook dependency issues, non-null assertions, and console usage. | Plan a dedicated lint/refactor sweep, ideally directory by directory, with CI gating added afterward. | Open |
| Medium | `src/pages/Helpdesk/index.tsx`, `src/pages/Index.tsx`, `src/App.tsx` | Helpdesk is both statically and dynamically imported, preventing expected code-splitting. | Choose one import strategy and keep Helpdesk on that path only. | Open |
| Medium | Build output (`assets/index-*.js`, `assets/ExcalidrawDashboard-*.js`) | Several production chunks exceed the Vite size warning threshold, increasing initial download cost. | Split large routes with dynamic imports and/or configure `manualChunks`. | Open |

## Verification

- `npm run build`: pass
- `npm audit --json`: `1` high severity advisory remains (`xlsx`, no automated fix available)
- `npm run lint`: fail, `2153` total issues remain across the legacy codebase

## Refactoring Notes

- All implemented fixes were selected to preserve current runtime behavior and avoid schema/API changes.
- The config changes keep the previous Supabase values as fallback defaults, so existing deployments remain functional while `.env.local` now works as expected.
- Dependency hardening was limited to safe patch/minor upgrades plus one transitive override that did not alter build behavior.
