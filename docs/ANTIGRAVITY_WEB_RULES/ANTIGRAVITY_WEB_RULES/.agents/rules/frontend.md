---
trigger: model_decision
description: Apply when creating or reviewing the React web frontend, components, forms, routing, tables, data fetching, or responsive UI.
---
# Frontend Rules

- Use TypeScript and React Functional Components. Avoid `any`; define types/interfaces/enums.
- Follow the standard stack: Vite, Tailwind, Ant Design, MUI X Data Grid, Axios, TanStack Query, Zustand/Context, React Router `createHashRouter`, React Hook Form, Zod, Prettier, and Vite ESLint.
- Use Ant Design for general UI components and MUI X Data Grid for primary data grids. Avoid building a second bespoke component system without need.
- Use Axios through one configured instance/interceptor. Match frontend response types to backend `IResponseEntity<T>` and pagination metadata.
- TanStack Query owns API/server state. Zustand/Context own only shared client/UI state; do not mirror all API data into Zustand.
- Use React Hook Form + Zod for forms. Frontend validation improves UX; backend DTO/business validation remains authoritative.
- Use `createHashRouter`; protect routes for role-aware navigation, but never treat route guards as backend security.
- Apply mobile-first responsive layout. Every data view/form needs loading, empty, error, success, validation, and disabled states as applicable.
- Lazy-load large route pages. Use memoization only when it avoids measured/unnecessary renders; do not add `memo/useMemo/useCallback` mechanically.
- Never hardcode mock data in production paths. Mock data is allowed only for the agreed early UI/mock stage and must be clearly isolated.
- Never decide final booking availability, stock, approval, or schedule conflicts in the browser.
