# Project Structure & Organization

## Directory Layout

```
├── app/                    # Next.js App Router (pages and layouts)
│   ├── (auth)/            # Authentication routes group
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth.js endpoints
│   │   ├── posts/         # Post CRUD operations
│   │   ├── users/         # User profile operations
│   │   └── upload/        # File upload endpoint
│   ├── feed/              # Main feed page
│   ├── profile/           # User profile pages
│   ├── upload/            # Post upload page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects to feed)
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui base components
│   ├── auth/             # Authentication components
│   ├── posts/            # Post-related components
│   ├── profile/          # Profile components
│   └── layout/           # Layout components (header, nav)
├── lib/                  # Utility functions and configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client instance
│   ├── utils.ts          # General utilities
│   └── validations.ts    # Form validation schemas
├── prisma/               # Database configuration
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── public/               # Static assets
│   ├── uploads/          # User uploaded images
│   └── icons/            # App icons and images
├── types/                # TypeScript type definitions
│   ├── auth.ts           # Authentication types
│   ├── posts.ts          # Post-related types
│   └── users.ts          # User-related types
└── __tests__/            # Test files
    ├── api/              # API route tests
    ├── components/       # Component tests
    └── properties/       # Property-based tests
```

## Naming Conventions

### Files & Directories
- **Pages**: kebab-case (e.g., `user-profile/`)
- **Components**: PascalCase (e.g., `PostCard.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **API Routes**: kebab-case (e.g., `api/posts/[id]/`)

### Code
- **Components**: PascalCase (e.g., `PostUploadForm`)
- **Functions**: camelCase (e.g., `createPost`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (e.g., `UserProfile`)

## Component Organization

### Atomic Design Principles
- **Atoms**: Basic UI elements (Button, Input, Avatar)
- **Molecules**: Simple component combinations (SearchBar, PostActions)
- **Organisms**: Complex components (PostCard, ProfileHeader)
- **Templates**: Page layouts and structures
- **Pages**: Complete page implementations

### Component Structure
```typescript
// Component file structure
export interface ComponentProps {
  // Props definition
}

export function Component({ ...props }: ComponentProps) {
  // Component implementation
}

export default Component;
```

## API Route Organization

### RESTful Conventions
- `GET /api/posts` - List all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/[id]` - Get specific post
- `PUT /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post

### Response Format
```typescript
// Success response
{
  success: true,
  data: T,
  message?: string
}

// Error response
{
  success: false,
  error: string,
  details?: any
}
```

## Database Schema Organization

### Model Relationships
- **User** → hasMany → **Post**, **Like**, **Comment**
- **Post** → belongsTo → **User**, hasMany → **Like**, **Comment**
- **Like** → belongsTo → **User**, **Post**
- **Comment** → belongsTo → **User**, **Post**

### Naming Conventions
- **Tables**: plural snake_case (e.g., `user_posts`)
- **Columns**: snake_case (e.g., `created_at`)
- **Relations**: camelCase (e.g., `userPosts`)

## Import Organization

### Import Order
1. React and Next.js imports
2. Third-party library imports
3. Internal component imports
4. Utility and type imports
5. Relative imports

```typescript
import React from 'react';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { PostCard } from '@/components/posts/PostCard';
import { formatDate } from '@/lib/utils';
import type { Post } from '@/types/posts';
```