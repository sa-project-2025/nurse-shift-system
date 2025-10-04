# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application for a nurse shift management system, built with React 19, TypeScript, and Tailwind CSS v4. The project uses Turbopack for faster builds and follows the Next.js App Router structure.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Architecture & Structure

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **UI**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4 with PostCSS
- **Build Tool**: Turbopack (Next.js integrated)
- **Fonts**: Geist Sans and Geist Mono from Google Fonts

### Project Structure
```
src/
  app/
    layout.tsx    # Root layout with font configuration
    page.tsx      # Homepage
    globals.css   # Global Tailwind styles
    favicon.ico   # Site favicon
```

### Configuration Files
- `tsconfig.json` - TypeScript config with path mapping (`@/*` → `./src/*`)
- `eslint.config.mjs` - ESLint config using Next.js presets and flat config format
- `next.config.ts` - Next.js configuration (currently minimal)
- `postcss.config.mjs` - PostCSS configuration for Tailwind
- `next-env.d.ts` - Next.js TypeScript declarations

### Key Patterns
- Uses App Router (not Pages Router)
- TypeScript throughout with strict mode enabled
- CSS-in-JS via Tailwind classes
- Font optimization via `next/font/google`
- Image optimization via `next/image`

## Development Notes

- The project is currently in initial state with default Next.js scaffolding
- Turbopack is enabled for both development and build processes
- ESLint uses the flat config format with Next.js recommended rules
- Path aliases are configured for cleaner imports (`@/` maps to `src/`)