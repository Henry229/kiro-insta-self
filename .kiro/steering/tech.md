# Technology Stack

## Framework & Language

- **Next.js 16+** with App Router (React Server Components)
- **TypeScript** for type safety
- **React 18+** for UI components

## Styling & UI

- **Tailwind CSS 4+** for styling
- **shadcn/ui** component library
- Responsive design for mobile and desktop

## Database & ORM

- **SQLite** for local development database
- **Prisma ORM** for database operations and migrations
- Database models: User, Post, Like, Comment, Account, Session

## Authentication

- **NextAuth.js** for authentication system
- Session-based authentication with database sessions
- Email/password registration and login

## File Storage

- **Local file system** (public/uploads directory)
- Image validation and processing
- Supported formats: JPEG, PNG, WebP

## Testing

- **Jest** for unit testing
- **React Testing Library** for component testing
- **fast-check** for property-based testing
- **Playwright** for end-to-end testing

## Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes
npx prisma studio    # Open database GUI

# Testing
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode
npm run test:e2e    # Run end-to-end tests

# Code Quality
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript compiler
```

## Project Structure

```
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── lib/                # Utility functions and configurations
├── prisma/             # Database schema and migrations
├── public/             # Static assets and uploads
├── types/              # TypeScript type definitions
└── __tests__/          # Test files
```