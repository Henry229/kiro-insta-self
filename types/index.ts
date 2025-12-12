import { User, Post, Comment, Like } from '@prisma/client'

// User types
export type UserWithRelations = User & {
  posts?: Post[]
  likes?: Like[]
  comments?: Comment[]
}

export type UserWithPosts = User & {
  posts: Post[]
}

// Post types
export type PostWithRelations = Post & {
  user: User
  likes?: Like[]
  comments?: CommentWithUser[]
  _count?: {
    likes: number
    comments: number
  }
}

export type PostWithUser = Post & {
  user: User
}

// Comment types
export type CommentWithUser = Comment & {
  user: User
}

// Like types
export type LikeWithUser = Like & {
  user: User
}

// API Response types
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

// Form types
export type RegisterFormData = {
  email: string
  username: string
  password: string
  name?: string
}

export type LoginFormData = {
  email: string
  password: string
}

export type CreatePostFormData = {
  image: string
  caption?: string
}

export type CreateCommentFormData = {
  content: string
  postId: string
}
