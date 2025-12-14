import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as bcrypt from 'bcrypt'
import { prisma, cleanupDatabase, createTestEmail, createTestUsername } from '../utils/test-db'

describe('Task 8 - Like System: Property-Based Tests', () => {
  let testUser1: { id: string; email: string; username: string }
  let testUser2: { id: string; email: string; username: string }
  let testPost: { id: string; image: string; userId: string }

  beforeEach(async () => {
    // Clean up database before each test
    await cleanupDatabase()

    // Create test users with transaction to ensure consistency
    const users = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: createTestEmail('user1'),
          username: createTestUsername('user1'),
          password: await bcrypt.hash('password123', 10),
          name: 'Test User 1',
        },
      }),
      prisma.user.create({
        data: {
          email: createTestEmail('user2'),
          username: createTestUsername('user2'),
          password: await bcrypt.hash('password123', 10),
          name: 'Test User 2',
        },
      }),
    ])

    testUser1 = users[0]
    testUser2 = users[1]

    // Create test post after users are confirmed to exist
    testPost = await prisma.post.create({
      data: {
        image: '/uploads/test-image.jpg',
        caption: 'Test post for likes',
        userId: testUser1.id,
      },
    })
  })

  afterEach(async () => {
    // Clean up database after each test
    await cleanupDatabase()
  })

  describe('Property 12: Like increases count and activates button (Requirements 4.1)', () => {
    it('should increase like count by 1 when user likes a post', async () => {
      // Arrange
      const initialLikeCount = await prisma.like.count({
        where: { postId: testPost.id },
      })

      // Act
      const like = await prisma.like.create({
        data: {
          userId: testUser2.id,
          postId: testPost.id,
        },
      })

      // Assert
      expect(like).toBeDefined()
      expect(like.userId).toBe(testUser2.id)
      expect(like.postId).toBe(testPost.id)
      expect(like.createdAt).toBeInstanceOf(Date)

      const finalLikeCount = await prisma.like.count({
        where: { postId: testPost.id },
      })
      expect(finalLikeCount).toBe(initialLikeCount + 1)
    })

    it('should create a like record with correct relationships', async () => {
      // Act
      const like = await prisma.like.create({
        data: {
          userId: testUser2.id,
          postId: testPost.id,
        },
        include: {
          user: true,
          post: true,
        },
      })

      // Assert
      expect(like.user).toBeDefined()
      expect(like.user.id).toBe(testUser2.id)
      expect(like.user.username).toBe(testUser2.username)
      expect(like.post).toBeDefined()
      expect(like.post.id).toBe(testPost.id)
    })

    it('should allow multiple users to like the same post', async () => {
      // Act
      const like1 = await prisma.like.create({
        data: {
          userId: testUser1.id,
          postId: testPost.id,
        },
      })

      const like2 = await prisma.like.create({
        data: {
          userId: testUser2.id,
          postId: testPost.id,
        },
      })

      // Assert
      expect(like1).toBeDefined()
      expect(like2).toBeDefined()
      expect(like1.userId).not.toBe(like2.userId)
      expect(like1.postId).toBe(like2.postId)

      const totalLikes = await prisma.like.count({
        where: { postId: testPost.id },
      })
      expect(totalLikes).toBe(2)
    })

    it('should retrieve like status for a specific user and post', async () => {
      // Arrange
      await prisma.like.create({
        data: {
          userId: testUser2.id,
          postId: testPost.id,
        },
      })

      // Act
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: testUser2.id,
            postId: testPost.id,
          },
        },
      })

      const nonExistingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: testUser1.id,
            postId: testPost.id,
          },
        },
      })

      // Assert
      expect(existingLike).not.toBeNull()
      expect(existingLike?.userId).toBe(testUser2.id)
      expect(nonExistingLike).toBeNull()
    })
  })

  describe('Property 13: Like toggle is idempotent (Requirements 4.2)', () => {
    it('should decrease like count by 1 when user unlikes a post', async () => {
      // Arrange
      const like = await prisma.like.create({
        data: {
          userId: testUser2.id,
          postId: testPost.id,
        },
      })

      const initialLikeCount = await prisma.like.count({
        where: { postId: testPost.id },
      })

      // Act
      await prisma.like.delete({
        where: {
          id: like.id,
        },
      })

      // Assert
      const finalLikeCount = await prisma.like.count({
        where: { postId: testPost.id },
      })
      expect(finalLikeCount).toBe(initialLikeCount - 1)
    })

    it('should prevent duplicate likes from the same user on the same post', async () => {
      // Arrange
      await prisma.like.create({
        data: {
          userId: testUser2.id,
          postId: testPost.id,
        },
      })

      // Act & Assert
      await expect(
        prisma.like.create({
          data: {
            userId: testUser2.id,
            postId: testPost.id,
          },
        })
      ).rejects.toThrow()
    })

    it('should allow toggling like multiple times (create -> delete -> create)', async () => {
      // Act - First like
      const firstLike = await prisma.like.create({
        data: {
          userId: testUser2.id,
          postId: testPost.id,
        },
      })

      const countAfterFirstLike = await prisma.like.count({
        where: { postId: testPost.id },
      })

      // Act - Unlike
      await prisma.like.delete({
        where: { id: firstLike.id },
      })

      const countAfterUnlike = await prisma.like.count({
        where: { postId: testPost.id },
      })

      // Act - Second like
      const secondLike = await prisma.like.create({
        data: {
          userId: testUser2.id,
          postId: testPost.id,
        },
      })

      const countAfterSecondLike = await prisma.like.count({
        where: { postId: testPost.id },
      })

      // Assert
      expect(countAfterFirstLike).toBe(1)
      expect(countAfterUnlike).toBe(0)
      expect(countAfterSecondLike).toBe(1)
      expect(secondLike).toBeDefined()
      expect(secondLike.id).not.toBe(firstLike.id) // Different IDs
    })

    it('should use unique constraint to ensure idempotency', async () => {
      // Arrange
      await prisma.like.create({
        data: {
          userId: testUser2.id,
          postId: testPost.id,
        },
      })

      // Act
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: testUser2.id,
            postId: testPost.id,
          },
        },
      })

      // Assert
      expect(existingLike).not.toBeNull()

      // Try to create duplicate should fail
      await expect(
        prisma.like.create({
          data: {
            userId: testUser2.id,
            postId: testPost.id,
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('Property 14: Post displays accurate like information (Requirements 4.3)', () => {
    it('should return accurate like count for a post', async () => {
      // Arrange - Create multiple likes
      await prisma.like.create({
        data: { userId: testUser1.id, postId: testPost.id },
      })
      await prisma.like.create({
        data: { userId: testUser2.id, postId: testPost.id },
      })

      // Act
      const likeCount = await prisma.like.count({
        where: { postId: testPost.id },
      })

      // Assert
      expect(likeCount).toBe(2)
    })

    it('should retrieve post with like count and user like status', async () => {
      // Arrange - Create a like from user2
      await prisma.like.create({
        data: { userId: testUser2.id, postId: testPost.id },
      })

      // Act
      const post = await prisma.post.findUnique({
        where: { id: testPost.id },
        include: {
          likes: true,
          _count: {
            select: { likes: true },
          },
        },
      })

      // Check if user2 liked the post
      const user2LikedPost = post?.likes.some((like) => like.userId === testUser2.id)
      const user1LikedPost = post?.likes.some((like) => like.userId === testUser1.id)

      // Assert
      expect(post).toBeDefined()
      expect(post?._count.likes).toBe(1)
      expect(user2LikedPost).toBe(true)
      expect(user1LikedPost).toBe(false)
    })

    it('should return zero like count for posts with no likes', async () => {
      // Act
      const likeCount = await prisma.like.count({
        where: { postId: testPost.id },
      })

      // Assert
      expect(likeCount).toBe(0)
    })

    it('should retrieve all likes for a post with user information', async () => {
      // Arrange
      await prisma.like.create({
        data: { userId: testUser1.id, postId: testPost.id },
      })
      await prisma.like.create({
        data: { userId: testUser2.id, postId: testPost.id },
      })

      // Act
      const likes = await prisma.like.findMany({
        where: { postId: testPost.id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Assert
      expect(likes).toHaveLength(2)
      expect(likes[0].user).toBeDefined()
      expect(likes[1].user).toBeDefined()
      expect(likes[0].user.username).toBeDefined()
      expect(likes[1].user.username).toBeDefined()
    })

    it('should delete all likes when post is deleted (cascade)', async () => {
      // Arrange
      await prisma.like.create({
        data: { userId: testUser1.id, postId: testPost.id },
      })
      await prisma.like.create({
        data: { userId: testUser2.id, postId: testPost.id },
      })

      const likesBeforeDelete = await prisma.like.count({
        where: { postId: testPost.id },
      })

      // Act
      await prisma.post.delete({
        where: { id: testPost.id },
      })

      const likesAfterDelete = await prisma.like.count({
        where: { postId: testPost.id },
      })

      // Assert
      expect(likesBeforeDelete).toBe(2)
      expect(likesAfterDelete).toBe(0)
    })

    it('should delete all likes when user is deleted (cascade)', async () => {
      // Arrange
      await prisma.like.create({
        data: { userId: testUser2.id, postId: testPost.id },
      })

      const likesBeforeDelete = await prisma.like.count({
        where: { userId: testUser2.id },
      })

      // Act
      await prisma.user.delete({
        where: { id: testUser2.id },
      })

      const likesAfterDelete = await prisma.like.count({
        where: { userId: testUser2.id },
      })

      // Assert
      expect(likesBeforeDelete).toBe(1)
      expect(likesAfterDelete).toBe(0)
    })
  })
})
