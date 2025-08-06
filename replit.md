# Overview

This is a full-stack casino gaming platform built with React, Express, TypeScript, and PostgreSQL. The application provides a comprehensive online casino experience with multiple games (slots, crash, dice, roulette, blackjack, plinko, coin flip), user authentication via Replit Auth, real-time features through WebSockets, and a complete user management system including balance tracking, achievements, leaderboards, and live chat functionality.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript and Vite for development/build tooling
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Design System**: Custom casino-themed dark mode design with CSS variables and utility classes

## Backend Architecture
- **Framework**: Express.js with TypeScript running in ESM mode
- **Authentication**: Replit Auth integration with OpenID Connect (OIDC) and session management
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple
- **Real-time Communication**: WebSocket server for live chat and real-time game updates
- **API Design**: RESTful API with proper error handling and request logging middleware

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless driver for connection pooling
- **Schema Management**: Drizzle Kit for migrations and schema definitions
- **Session Storage**: Database-backed sessions table for persistent authentication
- **Data Models**: Comprehensive schema including users, games, game results, transactions, achievements, chat messages, and daily bonuses

## Authentication and Authorization
- **Provider**: Replit Auth with OIDC flow for secure user authentication
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session store
- **User Management**: Automatic user creation/update on authentication with profile data sync
- **Authorization Middleware**: Route-level authentication checks with proper error handling

## External Dependencies
- **Database**: Neon PostgreSQL for serverless database hosting
- **Authentication**: Replit OIDC service for user authentication
- **UI Components**: Radix UI for accessible, unstyled component primitives
- **Styling**: Tailwind CSS for utility-first styling approach
- **Development**: Replit development environment with hot reloading and error overlays
- **Build Tools**: Vite for fast development server and optimized production builds