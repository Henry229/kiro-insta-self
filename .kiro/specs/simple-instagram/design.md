# Design Document

## Overview

간단한 Instagram 애플리케이션은 사용자가 사진을 공유하고 소셜 상호작용을 할 수 있는 웹 기반 플랫폼입니다. 이 시스템은 사용자 인증, 미디어 업로드, 피드 관리, 소셜 상호작용(좋아요, 댓글) 기능을 제공합니다.

## Architecture

시스템은 Next.js 16+ 풀스택 아키텍처를 따릅니다:

```
┌─────────────────────────────────────┐
│           Next.js 16+               │
│  ┌─────────────┐ ┌─────────────────┐│
│  │  Frontend   │ │   API Routes    ││
│  │ (App Router)│ │  (Server-side)  ││
│  │             │ │                 ││
│  │ - Pages     │ │ - Authentication││
│  │ - Components│ │ - Posts API     ││
│  │ - UI/UX     │ │ - Users API     ││
│  └─────────────┘ └─────────────────┘│
└─────────────────────────────────────┘
                    │
                    │ Database Queries
                    ▼
┌─────────────────────────────────────┐
│              SQLite                 │
│           (Local Database)          │
└─────────────────────────────────────┘
```

### 기술 스택:
- **프레임워크**: Next.js 16+ (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS 4+
- **UI 컴포넌트**: shadcn/ui
- **데이터베이스**: SQLite with Prisma ORM
- **인증**: NextAuth.js
- **파일 스토리지**: 로컬 파일 시스템 (public/uploads)

### 주요 구성 요소:
- **프론트엔드**: Next.js App Router, React Server Components, shadcn/ui 컴포넌트
- **백엔드**: Next.js API Routes, 서버 액션
- **데이터베이스**: SQLite, 사용자 및 게시물 데이터 저장
- **파일 스토리지**: Next.js public 폴더, 업로드된 이미지 저장

## Components and Interfaces

### Frontend Components

#### 1. Authentication Components
- **LoginForm**: 사용자 로그인 인터페이스
- **RegisterForm**: 새 계정 생성 인터페이스
- **AuthGuard**: 인증된 사용자만 접근 가능한 라우트 보호

#### 2. Post Components
- **PostUpload**: 새 게시물 업로드 인터페이스
- **PostCard**: 개별 게시물 표시 컴포넌트
- **PostFeed**: 게시물 목록 표시 컴포넌트

#### 3. Interaction Components
- **LikeButton**: 좋아요 토글 버튼
- **CommentSection**: 댓글 목록 및 입력 인터페이스
- **CommentForm**: 새 댓글 작성 폼

#### 4. Profile Components
- **ProfilePage**: 사용자 프로필 페이지
- **ProfileHeader**: 사용자 정보 표시
- **PostGrid**: 사용자 게시물 그리드 뷰

### Next.js API Routes

#### Authentication (NextAuth.js)
```
GET /api/auth/[...nextauth] - NextAuth.js 인증 핸들러
POST /api/auth/register - 새 사용자 등록
```

#### Post API Routes
```
GET /api/posts - 모든 게시물 조회 (피드)
POST /api/posts - 새 게시물 생성
GET /api/posts/[id] - 특정 게시물 조회
PUT /api/posts/[id] - 게시물 수정
DELETE /api/posts/[id] - 게시물 삭제
```

#### Interaction API Routes
```
POST /api/posts/[id]/like - 게시물 좋아요 토글
GET /api/posts/[id]/comments - 게시물 댓글 조회
POST /api/posts/[id]/comments - 새 댓글 작성
DELETE /api/comments/[id] - 댓글 삭제
```

#### User API Routes
```
GET /api/users/[id] - 사용자 프로필 조회
GET /api/users/[id]/posts - 사용자의 게시물 조회
PUT /api/users/[id] - 사용자 프로필 수정
```

#### File Upload API Routes
```
POST /api/upload - 이미지 파일 업로드
```

## Data Models

### User Model
```typescript
interface User {
  id: string;
  email: string;
  username: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Post Model
```typescript
interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Like Model
```typescript
interface Like {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}
```

### Comment Model
```typescript
interface Comment {
  id: string;
  userId: string;
  postId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Prisma Schema (SQLite)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  username       String    @unique
  name           String?
  image          String?
  emailVerified  DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  // Relations
  posts          Post[]
  likes          Like[]
  comments       Comment[]
  accounts       Account[]
  sessions       Session[]
  
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
}

model Post {
  id           String    @id @default(cuid())
  userId       String
  imageUrl     String
  caption      String?
  likesCount   Int       @default(0)
  commentsCount Int      @default(0)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  // Relations
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  likes        Like[]
  comments     Comment[]
  
  @@map("posts")
}

model Like {
  id        String   @id @default(cuid())
  userId    String
  postId    String
  createdAt DateTime @default(now())
  
  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  @@unique([userId, postId])
  @@map("likes")
}

model Comment {
  id        String   @id @default(cuid())
  userId    String
  postId    String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  @@map("comments")
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid user registration creates account
*For any* valid email and password combination, registering a new user should result in a new account being created in the system that can be retrieved
**Validates: Requirements 1.1**

### Property 2: Valid login succeeds
*For any* registered user with correct credentials, login should succeed and create a valid session
**Validates: Requirements 1.2**

### Property 3: Invalid login fails
*For any* invalid credentials (wrong email or password), login should fail and return an error
**Validates: Requirements 1.3**

### Property 4: Successful login creates session
*For any* successful login, a user session should be created and the user should be redirected to the feed page
**Validates: Requirements 1.4**

### Property 5: Valid image upload shows preview
*For any* valid image file, uploading it should display a preview in the upload interface
**Validates: Requirements 2.1**

### Property 6: Post creation adds to feed
*For any* valid post (image and caption), creating it should result in the post appearing in the feed
**Validates: Requirements 2.2**

### Property 7: Invalid file upload rejected
*For any* unsupported file format, upload should be rejected with an error message
**Validates: Requirements 2.3**

### Property 8: Successful post creation redirects
*For any* successful post creation, the user should be redirected to the feed page
**Validates: Requirements 2.4**

### Property 9: Feed displays posts in chronological order
*For any* set of posts, the feed should display them ordered by creation time (newest first)
**Validates: Requirements 3.1**

### Property 10: Post display includes required information
*For any* post displayed in the feed, it should include image, author name, caption, and timestamp
**Validates: Requirements 3.2**

### Property 11: New posts appear at top of feed
*For any* newly created post, it should appear at the top of the feed when refreshed
**Validates: Requirements 3.4**

### Property 12: Like increases count and activates button
*For any* post that a user hasn't liked, clicking like should increase the count by 1 and activate the button state
**Validates: Requirements 4.1**

### Property 13: Like toggle is idempotent
*For any* post, liking and then unliking should return to the original state (count and button status)
**Validates: Requirements 4.2**

### Property 14: Post displays accurate like information
*For any* post, the displayed like count and user's like status should accurately reflect the current state
**Validates: Requirements 4.3**

### Property 15: Comment creation adds to post
*For any* valid comment text, submitting it should add the comment to the post's comment list
**Validates: Requirements 5.1**

### Property 16: Comment display includes required information
*For any* displayed comment, it should include author name, content, and timestamp
**Validates: Requirements 5.2**

### Property 17: Empty comments rejected
*For any* empty or whitespace-only comment, submission should be rejected and input state maintained
**Validates: Requirements 5.3**

### Property 18: Comments displayed in chronological order
*For any* set of comments on a post, they should be displayed ordered by creation time
**Validates: Requirements 5.4**

### Property 19: Profile displays user information
*For any* user profile page, it should display username, post count, and profile picture
**Validates: Requirements 6.1**

### Property 20: Profile displays user posts in grid
*For any* user profile, it should display all of that user's posts in a grid layout
**Validates: Requirements 6.2**

### Property 21: Profile post click shows detail view
*For any* post in a user's profile grid, clicking it should navigate to the post detail view
**Validates: Requirements 6.3**

### Property 22: Own profile shows edit options
*For any* user viewing their own profile, edit and delete options should be available for their posts
**Validates: Requirements 6.4**

## Error Handling

### Authentication Errors
- Invalid credentials should return 401 Unauthorized
- Expired tokens should return 401 Unauthorized and redirect to login
- Missing authentication should return 401 Unauthorized

### Validation Errors
- Invalid email format should return 400 Bad Request with specific error message
- Weak passwords should return 400 Bad Request with password requirements
- Missing required fields should return 400 Bad Request with field-specific errors

### File Upload Errors
- Unsupported file types should return 400 Bad Request
- Files exceeding size limit should return 413 Payload Too Large
- Corrupted files should return 400 Bad Request

### Database Errors
- Duplicate email/username should return 409 Conflict
- Foreign key violations should return 400 Bad Request
- Database connection errors should return 500 Internal Server Error

### Rate Limiting
- Excessive requests should return 429 Too Many Requests
- Implement exponential backoff for failed requests

## Testing Strategy

### Unit Testing
이 프로젝트는 Jest와 React Testing Library를 사용하여 단위 테스트를 구현합니다. 단위 테스트는 다음을 포함합니다:
- Next.js API Routes의 특정 예제 테스트
- Prisma 모델 및 데이터베이스 작업 테스트
- NextAuth.js 인증 플로우 테스트
- React 컴포넌트 렌더링 및 상호작용 테스트
- 파일 업로드 기능 테스트

### Property-Based Testing
이 프로젝트는 fast-check 라이브러리를 사용하여 속성 기반 테스트를 구현합니다. 각 속성 기반 테스트는:
- 최소 100회 반복 실행되도록 구성
- 설계 문서의 정확성 속성을 직접 구현
- 다음 형식으로 태그: '**Feature: simple-instagram, Property {number}: {property_text}**'

### Testing Environment
- **테스트 데이터베이스**: SQLite in-memory 데이터베이스 사용
- **Mock 서비스**: NextAuth.js 및 파일 업로드 모킹
- **E2E 테스트**: Playwright를 사용한 브라우저 테스트

속성 기반 테스트와 단위 테스트는 상호 보완적입니다:
- 단위 테스트는 구체적인 버그를 잡아냅니다
- 속성 테스트는 일반적인 정확성을 검증합니다
- 함께 사용하면 포괄적인 커버리지를 제공합니다

각 정확성 속성은 단일 속성 기반 테스트로 구현되어야 합니다.