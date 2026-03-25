# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jabobo Manager is a React 19 + TypeScript frontend application for managing AI voice devices (Jabobo). It provides user authentication, device binding/management, voiceprint registration, knowledge base management, and admin features. The app supports Chinese and English via i18next.

## Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server (port 80, host 0.0.0.0)
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

## Architecture

### Routing Structure
- **Landing Page (`/`)**: Public marketing page
- **App Shell (`/app/*`)**: Internal application with screen-based navigation

### Key Directories
- `screens/` - Page-level components (Dashboard, Login, Voiceprint, KnowledgeBase, AdminUserManagement, Settings, JaboboSelector)
- `api/` - API modules using shared axios client (`apiClient.ts`)
- `hooks/` - Custom React hooks (`useAuth.ts`)
- `components/` - Reusable UI components
- `public/locales/{zh,en}/` - i18n translation files

### Navigation Pattern
The app uses a screen-based state navigation pattern (not React Router nested routes). `AppShell.tsx` manages screen state (`Screen` type) and passes `onNavigate` callbacks to child screens.

### API Layer
- `apiClient.ts` - Axios instance with:
  - Auto-injection of auth headers (`x-username`, `Authorization`) from localStorage
  - GET request cache-busting with timestamp params
  - 401 handling (redirect to login for non-login requests)
- Individual API modules: `auth.ts`, `jabobo_manager.ts`, `jabobo_voice.ts`, `jabobo_knowledge_base.ts`, `jabobo_congfig.ts`, `user.ts`

### Authentication
- User stored in localStorage as `{ username, role, token }`
- `useAuth` hook provides auth state and login/logout methods
- Protected screens check for user presence before rendering

### Types
All TypeScript interfaces are centralized in `types.ts`, including:
- `Screen` - Navigation screen names
- `Persona` - AI persona configuration
- `Document`, `ChatHistory`, `AudioFileInfo` - Data models
- `ApiResponse<T>` - Generic API response wrapper

## Environment Variables

```bash
VITE_API_BASE_URL=https://jabobo.com/api/          # Production API
TEST_VITE_API_BASE_URL=http://121.41.168.85:8007/api  # Test environment
```

## Deployment

Docker multi-stage build:
1. Node 20 Alpine builds the React app
2. Nginx Alpine serves static files with:
   - SPA routing fallback
   - `/api/` proxy to backend:8007
   - Gzip compression
   - Static asset caching (7 days)

## Path Aliases

`@/*` maps to project root (configured in `vite.config.ts` and `tsconfig.json`)
