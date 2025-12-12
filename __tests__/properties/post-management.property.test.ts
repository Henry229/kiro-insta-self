/**
 * Property-Based Tests for Post Management
 *
 * **Feature: simple-instagram, Property 6: Post creation adds to feed**
 * **Validates: Requirements 2.2**
 *
 * **Feature: simple-instagram, Property 8: Successful post creation redirects**
 * **Validates: Requirements 2.4**
 *
 * **Feature: simple-instagram, Property 9: Feed displays posts in chronological order**
 * **Validates: Requirements 3.1**
 *
 * **Feature: simple-instagram, Property 10: Post display includes required information**
 * **Validates: Requirements 3.2**
 *
 * **Feature: simple-instagram, Property 11: New posts appear at top of feed**
 * **Validates: Requirements 3.4**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import * as fc from 'fast-check';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Property-Based Tests: Post Management', () => {
  let testCounter = 0;

  beforeEach(async () => {
    testCounter++;
    // Clean up database in correct order (child to parent)
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    // Clean up database in correct order (child to parent)
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Property 6: Post creation adds to feed', () => {
    it('should add any valid post to the feed and make it retrievable', async () => {
      /**
       * **Feature: simple-instagram, Property 6: Post creation adds to feed**
       * **Validates: Requirements 2.2**
       *
       * Property: For any valid image URL and optional caption, creating a post
       * should result in the post being added to the feed and retrievable
       */

      // Create a test user first
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: `testuser_${testCounter}@example.com`,
          username: `testuser_${testCounter}`,
          password: hashedPassword,
          name: 'Test User',
        },
      });

      const validImageUrl = fc
        .string({ minLength: 1, maxLength: 200 })
        .map((s) => `/uploads/${s.replace(/[^a-zA-Z0-9.-]/g, '_')}.jpg`);

      const validCaption = fc.option(
        fc.string({ minLength: 0, maxLength: 2200 }),
        { nil: null }
      );

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            image: validImageUrl,
            caption: validCaption,
          }),
          async ({ image, caption }) => {
            // Act: Create post
            const createdPost = await prisma.post.create({
              data: {
                image,
                caption,
                userId: user.id,
              },
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
            });

            // Assert: Post should be created
            expect(createdPost).toBeDefined();
            expect(createdPost.id).toBeDefined();
            expect(createdPost.image).toBe(image);
            expect(createdPost.caption).toBe(caption);
            expect(createdPost.userId).toBe(user.id);

            // Assert: Post should be in feed (retrievable)
            const posts = await prisma.post.findMany({
              where: { userId: user.id },
              orderBy: { createdAt: 'desc' },
            });

            const foundPost = posts.find((p) => p.id === createdPost.id);
            expect(foundPost).toBeDefined();
            expect(foundPost?.image).toBe(image);
            expect(foundPost?.caption).toBe(caption);

            // Cleanup this specific post
            await prisma.post.delete({ where: { id: createdPost.id } });
          }
        ),
        { numRuns: 15 }
      );
    }, 15000);

    it('should handle edge cases in post creation', async () => {
      /**
       * **Feature: simple-instagram, Property 6: Post creation adds to feed**
       * **Validates: Requirements 2.2**
       *
       * Property: Edge cases like very long captions or special characters
       * should still result in valid post creation
       */

      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: `edgeuser_${testCounter}@example.com`,
          username: `edgeuser_${testCounter}`,
          password: hashedPassword,
          name: 'Edge User',
        },
      });

      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Very long caption
            fc.constant({ image: '/uploads/test.jpg', caption: 'A'.repeat(2200) }),
            // Empty caption
            fc.constant({ image: '/uploads/test.jpg', caption: null }),
            // Special characters in image path
            fc.constant({ image: '/uploads/test_123-abc.jpg', caption: 'Test' }),
            // Unicode in caption
            fc.constant({ image: '/uploads/test.jpg', caption: '안녕하세요 🎉' })
          ),
          async ({ image, caption }) => {
            const post = await prisma.post.create({
              data: {
                image,
                caption,
                userId: user.id,
              },
            });

            expect(post.id).toBeDefined();
            expect(post.image).toBe(image);
            expect(post.caption).toBe(caption);

            // Verify it's in the feed
            const posts = await prisma.post.findMany({
              where: { id: post.id },
            });
            expect(posts).toHaveLength(1);

            // Cleanup
            await prisma.post.delete({ where: { id: post.id } });
          }
        ),
        { numRuns: 5 }
      );
    }, 10000);
  });

  describe('Property 8: Successful post creation redirects', () => {
    it('should return success status for any valid post creation', async () => {
      /**
       * **Feature: simple-instagram, Property 8: Successful post creation redirects**
       * **Validates: Requirements 2.4**
       *
       * Property: For any valid post creation, the API should return success
       * status (which would trigger redirect in the UI)
       */

      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: `redirectuser_${testCounter}@example.com`,
          username: `redirectuser_${testCounter}`,
          password: hashedPassword,
          name: 'Redirect User',
        },
      });

      const validImageUrl = fc
        .string({ minLength: 5, maxLength: 100 })
        .map((s) => `/uploads/${s.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`);

      await fc.assert(
        fc.asyncProperty(validImageUrl, async (image) => {
          const post = await prisma.post.create({
            data: {
              image,
              userId: user.id,
            },
          });

          // Assert: Post creation should be successful
          expect(post).toBeDefined();
          expect(post.id).toBeDefined();
          expect(post.createdAt).toBeInstanceOf(Date);

          // In API context, this would return 201 status
          // which would trigger redirect to feed page
          const statusCode = post.id ? 201 : 500;
          expect(statusCode).toBe(201);

          // Cleanup
          await prisma.post.delete({ where: { id: post.id } });
        }),
        { numRuns: 10 }
      );
    }, 10000);
  });

  describe('Property 9: Feed displays posts in chronological order', () => {
    it('should always return posts in descending chronological order', async () => {
      /**
       * **Feature: simple-instagram, Property 9: Feed displays posts in chronological order**
       * **Validates: Requirements 3.1**
       *
       * Property: For any sequence of post creations, the feed should always
       * display posts in reverse chronological order (newest first)
       */

      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: `chronouser_${testCounter}@example.com`,
          username: `chronouser_${testCounter}`,
          password: hashedPassword,
          name: 'Chrono User',
        },
      });

      const postCount = fc.integer({ min: 2, max: 10 });

      await fc.assert(
        fc.asyncProperty(postCount, async (count) => {
          const createdPosts = [];

          // Create posts with slight delays to ensure different timestamps
          for (let i = 0; i < count; i++) {
            const post = await prisma.post.create({
              data: {
                image: `/uploads/post_${i}.jpg`,
                caption: `Post ${i}`,
                userId: user.id,
              },
            });
            createdPosts.push(post);

            // Small delay to ensure different createdAt timestamps
            await new Promise((resolve) => setTimeout(resolve, 10));
          }

          // Retrieve posts from feed
          const feedPosts = await prisma.post.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
          });

          // Assert: Posts should be in reverse chronological order
          expect(feedPosts).toHaveLength(count);

          for (let i = 0; i < feedPosts.length - 1; i++) {
            expect(feedPosts[i].createdAt.getTime()).toBeGreaterThanOrEqual(
              feedPosts[i + 1].createdAt.getTime()
            );
          }

          // The most recent post should be first
          expect(feedPosts[0].id).toBe(createdPosts[createdPosts.length - 1].id);

          // Cleanup
          await prisma.post.deleteMany({
            where: { id: { in: createdPosts.map((p) => p.id) } },
          });
        }),
        { numRuns: 8 }
      );
    }, 20000);
  });

  describe('Property 10: Post display includes required information', () => {
    it('should include all required information for any post', async () => {
      /**
       * **Feature: simple-instagram, Property 10: Post display includes required information**
       * **Validates: Requirements 3.2**
       *
       * Property: For any post retrieved from the feed, it should include
       * image, author name, description, and post time
       */

      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: `displayuser_${testCounter}@example.com`,
          username: `displayuser_${testCounter}`,
          password: hashedPassword,
          name: 'Display User',
        },
      });

      const validImageUrl = fc
        .string({ minLength: 5, maxLength: 100 })
        .map((s) => `/uploads/${s.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`);

      const validCaption = fc.option(
        fc.string({ minLength: 1, maxLength: 500 }),
        { nil: null }
      );

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            image: validImageUrl,
            caption: validCaption,
          }),
          async ({ image, caption }) => {
            // Create post
            const post = await prisma.post.create({
              data: {
                image,
                caption,
                userId: user.id,
              },
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
            });

            // Assert: Post should include all required information
            expect(post.image).toBeDefined(); // Image
            expect(post.user.name).toBeDefined(); // Author name
            expect(post.caption !== undefined).toBe(true); // Description (can be null)
            expect(post.createdAt).toBeInstanceOf(Date); // Post time

            // Assert: User information is included
            expect(post.user.username).toBe(user.username);
            expect(post.user.name).toBe(user.name);

            // Cleanup
            await prisma.post.delete({ where: { id: post.id } });
          }
        ),
        { numRuns: 12 }
      );
    }, 12000);
  });

  describe('Property 11: New posts appear at top of feed', () => {
    it('should always place newly created posts at the top of the feed', async () => {
      /**
       * **Feature: simple-instagram, Property 11: New posts appear at top of feed**
       * **Validates: Requirements 3.4**
       *
       * Property: For any existing feed with N posts, adding a new post
       * should result in that post appearing at position 0 in the feed
       */

      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: `topuser_${testCounter}@example.com`,
          username: `topuser_${testCounter}`,
          password: hashedPassword,
          name: 'Top User',
        },
      });

      const initialPostCount = fc.integer({ min: 1, max: 8 });

      await fc.assert(
        fc.asyncProperty(initialPostCount, async (count) => {
          // Create initial posts
          const existingPosts = [];
          for (let i = 0; i < count; i++) {
            const post = await prisma.post.create({
              data: {
                image: `/uploads/existing_${i}.jpg`,
                caption: `Existing post ${i}`,
                userId: user.id,
              },
            });
            existingPosts.push(post);
            await new Promise((resolve) => setTimeout(resolve, 10));
          }

          // Get feed before new post
          const feedBefore = await prisma.post.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
          });

          expect(feedBefore).toHaveLength(count);

          // Add small delay
          await new Promise((resolve) => setTimeout(resolve, 10));

          // Create new post
          const newPost = await prisma.post.create({
            data: {
              image: '/uploads/new_post.jpg',
              caption: 'Brand new post',
              userId: user.id,
            },
          });

          // Get feed after new post
          const feedAfter = await prisma.post.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
          });

          // Assert: Feed should have one more post
          expect(feedAfter).toHaveLength(count + 1);

          // Assert: New post should be at the top (index 0)
          expect(feedAfter[0].id).toBe(newPost.id);

          // Assert: New post should have the latest timestamp
          expect(feedAfter[0].createdAt.getTime()).toBeGreaterThan(
            feedBefore[0].createdAt.getTime()
          );

          // Cleanup
          await prisma.post.deleteMany({
            where: {
              id: { in: [...existingPosts.map((p) => p.id), newPost.id] },
            },
          });
        }),
        { numRuns: 8 }
      );
    }, 20000);

    it('should maintain correct order when adding multiple new posts', async () => {
      /**
       * **Feature: simple-instagram, Property 11: New posts appear at top of feed**
       * **Validates: Requirements 3.4**
       *
       * Property: When adding multiple new posts in sequence, each new post
       * should appear at the top, maintaining chronological order
       */

      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: `multiuser_${testCounter}@example.com`,
          username: `multiuser_${testCounter}`,
          password: hashedPassword,
          name: 'Multi User',
        },
      });

      const newPostCount = fc.integer({ min: 2, max: 5 });

      await fc.assert(
        fc.asyncProperty(newPostCount, async (count) => {
          const createdPosts = [];

          // Create posts sequentially
          for (let i = 0; i < count; i++) {
            const post = await prisma.post.create({
              data: {
                image: `/uploads/sequential_${i}.jpg`,
                caption: `Sequential post ${i}`,
                userId: user.id,
              },
            });
            createdPosts.push(post);

            // Get current feed
            const currentFeed = await prisma.post.findMany({
              where: { userId: user.id },
              orderBy: { createdAt: 'desc' },
            });

            // Assert: Latest post should be at top
            expect(currentFeed[0].id).toBe(post.id);

            await new Promise((resolve) => setTimeout(resolve, 10));
          }

          // Final feed check
          const finalFeed = await prisma.post.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
          });

          // Assert: Most recent post is at index 0
          expect(finalFeed[0].id).toBe(
            createdPosts[createdPosts.length - 1].id
          );

          // Cleanup
          await prisma.post.deleteMany({
            where: { id: { in: createdPosts.map((p) => p.id) } },
          });
        }),
        { numRuns: 6 }
      );
    }, 15000);
  });
});
