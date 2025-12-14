/**
 * Property-Based Tests for Like System
 * 
 * **Feature: simple-instagram, Property 12: Like increases count and activates button**
 * **Validates: Requirements 4.1**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import bcrypt from 'bcrypt';
import { prisma, cleanupDatabase, createTestEmail, createTestUsername } from '../utils/test-db';

describe('Property-Based Tests: Like System', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await cleanupDatabase();
  });

  afterEach(async () => {
    // Clean up database after each test
    await cleanupDatabase();
  });

  describe('Property 12: Like increases count and activates button', () => {
    it('should increase like count by 1 and activate button state for any post that a user has not liked', async () => {
      /**
       * **Feature: simple-instagram, Property 12: Like increases count and activates button**
       * **Validates: Requirements 4.1**
       * 
       * Property: For any post that a user hasn't liked, clicking like should increase 
       * the count by 1 and activate the button state
       */
      
      const testStartTime = Date.now();
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate random user data
            userEmail: fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length >= 5).map(s => `${s.replace(/\s/g, '_')}@test.com`),
            userName: fc.string({ minLength: 3, maxLength: 15 }).filter(s => s.trim().length >= 3).map(s => s.replace(/\s/g, '_')),
            userDisplayName: fc.option(fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length >= 1), { nil: undefined }),
            // Generate random post data
            postCaption: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length >= 1), { nil: undefined }),
            postImage: fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length >= 5).map(s => `/uploads/${s.replace(/\s/g, '_')}.jpg`),
          }),
          async (testData) => {
            testCounter++;
            const uniqueId = `like_${testStartTime}_${testCounter}`;
            
            // Ensure unique identifiers
            const email = `${uniqueId}_${testData.userEmail}`;
            const username = `${uniqueId}_${testData.userName}`;
            const imageUrl = `${testData.postImage}_${uniqueId}`;
            
            // Arrange: Create a user who will like the post
            const hashedPassword = await bcrypt.hash('password123', 10);
            const user = await prisma.user.create({
              data: {
                email: createTestEmail('likeuser'),
                username: createTestUsername('likeuser'),
                password: hashedPassword,
                name: testData.userDisplayName || 'Like User',
              },
            });

            // Arrange: Create another user who owns the post
            const postOwner = await prisma.user.create({
              data: {
                email: createTestEmail('postowner'),
                username: createTestUsername('postowner'),
                password: hashedPassword,
                name: 'Post Owner',
              },
            });

            // Arrange: Create a post
            const post = await prisma.post.create({
              data: {
                userId: postOwner.id,
                image: imageUrl,
                caption: testData.postCaption || 'Test post',
              },
            });

            // Arrange: Verify initial state - user has not liked the post
            const initialLike = await prisma.like.findUnique({
              where: {
                userId_postId: {
                  userId: user.id,
                  postId: post.id,
                },
              },
            });
            expect(initialLike).toBeNull(); // User should not have liked the post initially

            // Arrange: Get initial like count
            const initialLikeCount = await prisma.like.count({
              where: { postId: post.id },
            });

            // Act: Simulate the like action (what happens when user clicks like button)
            const createdLike = await prisma.like.create({
              data: {
                userId: user.id,
                postId: post.id,
              },
            });

            // Act: Get updated like count
            const updatedLikeCount = await prisma.like.count({
              where: { postId: post.id },
            });

            // Act: Check if user now has liked the post (button state)
            const userLikeStatus = await prisma.like.findUnique({
              where: {
                userId_postId: {
                  userId: user.id,
                  postId: post.id,
                },
              },
            });

            // Assert: Like count should increase by exactly 1
            expect(updatedLikeCount).toBe(initialLikeCount + 1);

            // Assert: Like record should be created with correct data
            expect(createdLike).toBeDefined();
            expect(createdLike.userId).toBe(user.id);
            expect(createdLike.postId).toBe(post.id);
            expect(createdLike.createdAt).toBeInstanceOf(Date);

            // Assert: Button state should be activated (user has liked the post)
            expect(userLikeStatus).not.toBeNull();
            expect(userLikeStatus?.userId).toBe(user.id);
            expect(userLikeStatus?.postId).toBe(post.id);

            // Assert: Like should be retrievable and have valid properties
            expect(userLikeStatus?.id).toBeDefined();
            expect(userLikeStatus?.createdAt).toBeInstanceOf(Date);
            expect(userLikeStatus?.createdAt.getTime()).toBeGreaterThan(testStartTime);
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    }, 25000); // Increased timeout for property-based testing

    it('should handle edge cases when liking posts', async () => {
      /**
       * **Feature: simple-instagram, Property 12: Like increases count and activates button**
       * **Validates: Requirements 4.1**
       * 
       * Property: Edge cases should still result in proper like count increase and button activation
       */
      
      const testStartTime = Date.now();
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Test various user name patterns
            userName: fc.oneof(
              fc.string({ minLength: 3, maxLength: 10 }).filter(s => s.trim().length >= 3).map(s => s.replace(/\s/g, '_')), // Simple username
              fc.string({ minLength: 2, maxLength: 8 }).filter(s => s.trim().length >= 2).map(s => s.replace(/\s/g, '_') + '_user'), // Username with suffix
              fc.string({ minLength: 3, maxLength: 12 }).filter(s => s.trim().length >= 3).map(s => s.toLowerCase().replace(/\s/g, '_')), // Lowercase username
            ),
            // Test various post caption patterns
            postCaption: fc.oneof(
              fc.constant(undefined), // No caption
              fc.constant(''), // Empty caption
              fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length >= 1), // Regular caption
              fc.string({ minLength: 10, maxLength: 30 }).filter(s => s.trim().length >= 10).map(s => s + ' #hashtag'), // Caption with hashtag
            ),
          }),
          async (testData) => {
            testCounter++;
            const uniqueId = `edge_like_${testStartTime}_${testCounter}`;
            
            const email = `${uniqueId}@test.com`;
            const username = `${uniqueId}_${testData.userName}`;
            
            // Arrange: Create user and post owner
            const hashedPassword = await bcrypt.hash('password123', 10);
            const user = await prisma.user.create({
              data: {
                email: email,
                username: username,
                password: hashedPassword,
                name: username,
              },
            });

            const postOwner = await prisma.user.create({
              data: {
                email: `owner_${email}`,
                username: `owner_${username}`,
                password: hashedPassword,
                name: `Owner ${username}`,
              },
            });

            // Arrange: Create post with edge case data
            const post = await prisma.post.create({
              data: {
                userId: postOwner.id,
                image: `/uploads/${uniqueId}.jpg`,
                caption: testData.postCaption || null,
              },
            });

            // Arrange: Get initial state
            const initialLikeCount = await prisma.like.count({
              where: { postId: post.id },
            });

            // Act: Like the post
            const like = await prisma.like.create({
              data: {
                userId: user.id,
                postId: post.id,
              },
            });

            // Act: Get updated state
            const finalLikeCount = await prisma.like.count({
              where: { postId: post.id },
            });

            const likeStatus = await prisma.like.findUnique({
              where: {
                userId_postId: {
                  userId: user.id,
                  postId: post.id,
                },
              },
            });

            // Assert: Like count should increase by 1 regardless of edge case
            expect(finalLikeCount).toBe(initialLikeCount + 1);

            // Assert: Button should be activated regardless of edge case
            expect(likeStatus).not.toBeNull();
            expect(likeStatus?.userId).toBe(user.id);
            expect(likeStatus?.postId).toBe(post.id);

            // Assert: Like record should be valid
            expect(like).toBeDefined();
            expect(like.id).toBeDefined();
            expect(like.createdAt).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 50 } // Fewer runs for edge cases
      );
    }, 15000);

    it('should work correctly when multiple users like the same post', async () => {
      /**
       * **Feature: simple-instagram, Property 12: Like increases count and activates button**
       * **Validates: Requirements 4.1**
       * 
       * Property: When multiple users like the same post, each like should increase 
       * the count by 1 and activate the button state for that specific user
       */
      
      const testStartTime = Date.now();
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate multiple users (2-5 users)
            numUsers: fc.integer({ min: 2, max: 5 }),
            postCaption: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          }),
          async (testData) => {
            testCounter++;
            const uniqueId = `multi_like_${testStartTime}_${testCounter}`;
            
            // Arrange: Create post owner
            const hashedPassword = await bcrypt.hash('password123', 10);
            const postOwner = await prisma.user.create({
              data: {
                email: `owner_${uniqueId}@test.com`,
                username: `owner_${uniqueId}`,
                password: hashedPassword,
                name: `Owner ${uniqueId}`,
              },
            });

            // Arrange: Create post
            const post = await prisma.post.create({
              data: {
                userId: postOwner.id,
                image: `/uploads/${uniqueId}.jpg`,
                caption: testData.postCaption || 'Multi-user test post',
              },
            });

            // Arrange: Create multiple users
            const users = [];
            for (let i = 0; i < testData.numUsers; i++) {
              const user = await prisma.user.create({
                data: {
                  email: `user${i}_${uniqueId}@test.com`,
                  username: `user${i}_${uniqueId}`,
                  password: hashedPassword,
                  name: `User ${i} ${uniqueId}`,
                },
              });
              users.push(user);
            }

            // Arrange: Get initial like count
            const initialLikeCount = await prisma.like.count({
              where: { postId: post.id },
            });
            expect(initialLikeCount).toBe(0); // Should start with 0 likes

            // Act: Each user likes the post sequentially
            const likes = [];
            for (let i = 0; i < users.length; i++) {
              const user = users[i];
              
              // Get like count before this user likes
              const countBefore = await prisma.like.count({
                where: { postId: post.id },
              });

              // User likes the post
              const like = await prisma.like.create({
                data: {
                  userId: user.id,
                  postId: post.id,
                },
              });
              likes.push(like);

              // Get like count after this user likes
              const countAfter = await prisma.like.count({
                where: { postId: post.id },
              });

              // Assert: Count should increase by exactly 1 for each like
              expect(countAfter).toBe(countBefore + 1);
              expect(countAfter).toBe(i + 1); // Should equal the number of users who have liked so far

              // Assert: This user's button should be activated
              const userLikeStatus = await prisma.like.findUnique({
                where: {
                  userId_postId: {
                    userId: user.id,
                    postId: post.id,
                  },
                },
              });
              expect(userLikeStatus).not.toBeNull();
              expect(userLikeStatus?.userId).toBe(user.id);
            }

            // Assert: Final like count should equal number of users
            const finalLikeCount = await prisma.like.count({
              where: { postId: post.id },
            });
            expect(finalLikeCount).toBe(testData.numUsers);

            // Assert: All users should have their button activated
            for (const user of users) {
              const userLikeStatus = await prisma.like.findUnique({
                where: {
                  userId_postId: {
                    userId: user.id,
                    postId: post.id,
                  },
                },
              });
              expect(userLikeStatus).not.toBeNull();
              expect(userLikeStatus?.userId).toBe(user.id);
              expect(userLikeStatus?.postId).toBe(post.id);
            }

            // Assert: All like records should be unique and valid
            expect(likes).toHaveLength(testData.numUsers);
            const likeIds = likes.map(like => like.id);
            const uniqueLikeIds = new Set(likeIds);
            expect(uniqueLikeIds.size).toBe(testData.numUsers); // All IDs should be unique
          }
        ),
        { numRuns: 30 } // Fewer runs due to complexity
      );
    }, 20000); // Longer timeout for complex test
  });

  describe('Property 13: Like toggle is idempotent', () => {
    it('should return to original state when liking and then unliking a post', async () => {
      /**
       * **Feature: simple-instagram, Property 13: Like toggle is idempotent**
       * **Validates: Requirements 4.2**
       * 
       * Property: For any post, liking and then unliking should return to the 
       * original state (count and button status)
       */
      
      const testStartTime = Date.now();
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate random user data
            userEmail: fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length >= 5).map(s => `${s.replace(/\s/g, '_')}@test.com`),
            userName: fc.string({ minLength: 3, maxLength: 15 }).filter(s => s.trim().length >= 3).map(s => s.replace(/\s/g, '_')),
            userDisplayName: fc.option(fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length >= 1), { nil: undefined }),
            // Generate random post data
            postCaption: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length >= 1), { nil: undefined }),
            postImage: fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length >= 5).map(s => `/uploads/${s.replace(/\s/g, '_')}.jpg`),
            // Generate initial like count (0-10 existing likes)
            initialLikeCount: fc.integer({ min: 0, max: 10 }),
          }),
          async (testData) => {
            testCounter++;
            const uniqueId = `toggle_${testStartTime}_${testCounter}`;
            
            // Ensure unique identifiers
            const email = `${uniqueId}_${testData.userEmail}`;
            const username = `${uniqueId}_${testData.userName}`;
            const imageUrl = `${testData.postImage}_${uniqueId}`;
            
            // Arrange: Create a user who will toggle the like
            const hashedPassword = await bcrypt.hash('password123', 10);
            const user = await prisma.user.create({
              data: {
                email: email,
                username: username,
                password: hashedPassword,
                name: testData.userDisplayName || username,
              },
            });

            // Arrange: Create another user who owns the post
            const postOwner = await prisma.user.create({
              data: {
                email: `owner_${email}`,
                username: `owner_${username}`,
                password: hashedPassword,
                name: `Owner ${username}`,
              },
            });

            // Arrange: Create a post
            const post = await prisma.post.create({
              data: {
                userId: postOwner.id,
                image: imageUrl,
                caption: testData.postCaption || 'Test post',
              },
            });

            // Arrange: Create initial likes from other users to simulate existing likes
            const otherUsers = [];
            for (let i = 0; i < testData.initialLikeCount; i++) {
              const otherUser = await prisma.user.create({
                data: {
                  email: `other${i}_${email}`,
                  username: `other${i}_${username}`,
                  password: hashedPassword,
                  name: `Other User ${i}`,
                },
              });
              otherUsers.push(otherUser);

              await prisma.like.create({
                data: {
                  userId: otherUser.id,
                  postId: post.id,
                },
              });
            }

            // Arrange: Record initial state - user has not liked the post
            const initialUserLike = await prisma.like.findUnique({
              where: {
                userId_postId: {
                  userId: user.id,
                  postId: post.id,
                },
              },
            });
            expect(initialUserLike).toBeNull(); // User should not have liked initially

            const initialTotalLikeCount = await prisma.like.count({
              where: { postId: post.id },
            });
            expect(initialTotalLikeCount).toBe(testData.initialLikeCount);

            // Act 1: User likes the post (first toggle)
            const firstLike = await prisma.like.create({
              data: {
                userId: user.id,
                postId: post.id,
              },
            });

            // Verify intermediate state after like
            const afterLikeCount = await prisma.like.count({
              where: { postId: post.id },
            });
            const afterLikeUserStatus = await prisma.like.findUnique({
              where: {
                userId_postId: {
                  userId: user.id,
                  postId: post.id,
                },
              },
            });

            expect(afterLikeCount).toBe(initialTotalLikeCount + 1);
            expect(afterLikeUserStatus).not.toBeNull();
            expect(afterLikeUserStatus?.userId).toBe(user.id);

            // Act 2: User unlikes the post (second toggle - should return to original state)
            await prisma.like.delete({
              where: {
                id: firstLike.id,
              },
            });

            // Assert: Final state should match initial state
            const finalTotalLikeCount = await prisma.like.count({
              where: { postId: post.id },
            });
            const finalUserLike = await prisma.like.findUnique({
              where: {
                userId_postId: {
                  userId: user.id,
                  postId: post.id,
                },
              },
            });

            // Assert: Like count should return to original value
            expect(finalTotalLikeCount).toBe(initialTotalLikeCount);

            // Assert: User's like status should return to original state (not liked)
            expect(finalUserLike).toBeNull();

            // Assert: Other users' likes should remain unchanged
            const remainingLikes = await prisma.like.findMany({
              where: { postId: post.id },
            });
            expect(remainingLikes).toHaveLength(testData.initialLikeCount);

            // Verify that all remaining likes are from other users, not the test user
            const remainingUserIds = remainingLikes.map(like => like.userId);
            expect(remainingUserIds).not.toContain(user.id);

            // Verify that all other users' likes are still present
            for (const otherUser of otherUsers) {
              const otherUserLike = await prisma.like.findUnique({
                where: {
                  userId_postId: {
                    userId: otherUser.id,
                    postId: post.id,
                  },
                },
              });
              expect(otherUserLike).not.toBeNull();
              expect(otherUserLike?.userId).toBe(otherUser.id);
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    }, 30000); // Increased timeout for property-based testing

    it('should handle multiple toggle cycles correctly', async () => {
      /**
       * **Feature: simple-instagram, Property 13: Like toggle is idempotent**
       * **Validates: Requirements 4.2**
       * 
       * Property: Multiple like/unlike cycles should always return to the original state
       */
      
      const testStartTime = Date.now();
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userName: fc.string({ minLength: 3, maxLength: 15 }).filter(s => s.trim().length >= 3).map(s => s.replace(/\s/g, '_')),
            postCaption: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            // Number of like/unlike cycles to perform (1-5 cycles)
            toggleCycles: fc.integer({ min: 1, max: 5 }),
          }),
          async (testData) => {
            testCounter++;
            const uniqueId = `multi_toggle_${testStartTime}_${testCounter}`;
            
            const email = `${uniqueId}@test.com`;
            const username = `${uniqueId}_${testData.userName}`;
            
            // Arrange: Create user and post owner
            const hashedPassword = await bcrypt.hash('password123', 10);
            const user = await prisma.user.create({
              data: {
                email: email,
                username: username,
                password: hashedPassword,
                name: username,
              },
            });

            const postOwner = await prisma.user.create({
              data: {
                email: `owner_${email}`,
                username: `owner_${username}`,
                password: hashedPassword,
                name: `Owner ${username}`,
              },
            });

            // Arrange: Create post
            const post = await prisma.post.create({
              data: {
                userId: postOwner.id,
                image: `/uploads/${uniqueId}.jpg`,
                caption: testData.postCaption || 'Multi-toggle test post',
              },
            });

            // Arrange: Record initial state
            const initialLikeCount = await prisma.like.count({
              where: { postId: post.id },
            });
            const initialUserLike = await prisma.like.findUnique({
              where: {
                userId_postId: {
                  userId: user.id,
                  postId: post.id,
                },
              },
            });

            expect(initialLikeCount).toBe(0);
            expect(initialUserLike).toBeNull();

            // Act: Perform multiple like/unlike cycles
            for (let cycle = 0; cycle < testData.toggleCycles; cycle++) {
              // Like the post
              const like = await prisma.like.create({
                data: {
                  userId: user.id,
                  postId: post.id,
                },
              });

              // Verify liked state
              const likedCount = await prisma.like.count({
                where: { postId: post.id },
              });
              const likedStatus = await prisma.like.findUnique({
                where: {
                  userId_postId: {
                    userId: user.id,
                    postId: post.id,
                  },
                },
              });

              expect(likedCount).toBe(1);
              expect(likedStatus).not.toBeNull();

              // Unlike the post
              await prisma.like.deleteMany({
                where: {
                  userId: user.id,
                  postId: post.id,
                },
              });

              // Verify unliked state (should return to original)
              const unlikedCount = await prisma.like.count({
                where: { postId: post.id },
              });
              const unlikedStatus = await prisma.like.findUnique({
                where: {
                  userId_postId: {
                    userId: user.id,
                    postId: post.id,
                  },
                },
              });

              expect(unlikedCount).toBe(0);
              expect(unlikedStatus).toBeNull();
            }

            // Assert: Final state should match initial state after all cycles
            const finalLikeCount = await prisma.like.count({
              where: { postId: post.id },
            });
            const finalUserLike = await prisma.like.findUnique({
              where: {
                userId_postId: {
                  userId: user.id,
                  postId: post.id,
                },
              },
            });

            expect(finalLikeCount).toBe(initialLikeCount);
            expect(finalUserLike).toBe(initialUserLike);
          }
        ),
        { numRuns: 50 } // Fewer runs due to complexity
      );
    }, 15000);

    it('should maintain idempotence with concurrent operations', async () => {
      /**
       * **Feature: simple-instagram, Property 13: Like toggle is idempotent**
       * **Validates: Requirements 4.2**
       * 
       * Property: Like toggle should remain idempotent even when other users 
       * are simultaneously liking/unliking the same post
       */
      
      const testStartTime = Date.now();
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userName: fc.string({ minLength: 3, maxLength: 15 }).filter(s => s.trim().length >= 3).map(s => s.replace(/\s/g, '_')),
            // Number of other users who will also interact with the post
            otherUsersCount: fc.integer({ min: 1, max: 3 }),
          }),
          async (testData) => {
            testCounter++;
            const uniqueId = `concurrent_toggle_${testStartTime}_${testCounter}`;
            
            const email = `${uniqueId}@test.com`;
            const username = `${uniqueId}_${testData.userName}`;
            
            // Arrange: Create main user
            const hashedPassword = await bcrypt.hash('password123', 10);
            const mainUser = await prisma.user.create({
              data: {
                email: email,
                username: username,
                password: hashedPassword,
                name: username,
              },
            });

            // Arrange: Create post owner
            const postOwner = await prisma.user.create({
              data: {
                email: `owner_${email}`,
                username: `owner_${username}`,
                password: hashedPassword,
                name: `Owner ${username}`,
              },
            });

            // Arrange: Create other users
            const otherUsers = [];
            for (let i = 0; i < testData.otherUsersCount; i++) {
              const otherUser = await prisma.user.create({
                data: {
                  email: `other${i}_${email}`,
                  username: `other${i}_${username}`,
                  password: hashedPassword,
                  name: `Other User ${i}`,
                },
              });
              otherUsers.push(otherUser);
            }

            // Arrange: Create post
            const post = await prisma.post.create({
              data: {
                userId: postOwner.id,
                image: `/uploads/${uniqueId}.jpg`,
                caption: 'Concurrent toggle test post',
              },
            });

            // Arrange: Other users like the post to create initial state
            for (const otherUser of otherUsers) {
              await prisma.like.create({
                data: {
                  userId: otherUser.id,
                  postId: post.id,
                },
              });
            }

            // Arrange: Record initial state for main user
            const initialMainUserLike = await prisma.like.findUnique({
              where: {
                userId_postId: {
                  userId: mainUser.id,
                  postId: post.id,
                },
              },
            });
            const initialTotalCount = await prisma.like.count({
              where: { postId: post.id },
            });

            expect(initialMainUserLike).toBeNull();
            expect(initialTotalCount).toBe(testData.otherUsersCount);

            // Act: Main user likes the post
            const mainUserLike = await prisma.like.create({
              data: {
                userId: mainUser.id,
                postId: post.id,
              },
            });

            // Verify intermediate state
            const afterLikeCount = await prisma.like.count({
              where: { postId: post.id },
            });
            expect(afterLikeCount).toBe(testData.otherUsersCount + 1);

            // Act: Main user unlikes the post (toggle back)
            await prisma.like.delete({
              where: { id: mainUserLike.id },
            });

            // Assert: Main user should return to original state
            const finalMainUserLike = await prisma.like.findUnique({
              where: {
                userId_postId: {
                  userId: mainUser.id,
                  postId: post.id,
                },
              },
            });
            const finalTotalCount = await prisma.like.count({
              where: { postId: post.id },
            });

            // Assert: Main user's state should be back to original (not liked)
            expect(finalMainUserLike).toBeNull();

            // Assert: Total count should be back to original (only other users' likes)
            expect(finalTotalCount).toBe(testData.otherUsersCount);

            // Assert: Other users' likes should remain unchanged
            for (const otherUser of otherUsers) {
              const otherUserLike = await prisma.like.findUnique({
                where: {
                  userId_postId: {
                    userId: otherUser.id,
                    postId: post.id,
                  },
                },
              });
              expect(otherUserLike).not.toBeNull();
              expect(otherUserLike?.userId).toBe(otherUser.id);
            }
          }
        ),
        { numRuns: 30 } // Fewer runs due to complexity
      );
    }, 15000);
  });

  describe('Property 14: Post displays accurate like information', () => {
    it('should display accurate like count and user like status for any post', async () => {
      /**
       * **Feature: simple-instagram, Property 14: Post displays accurate like information**
       * **Validates: Requirements 4.3**
       * 
       * Property: For any post, the displayed like count and user's like status 
       * should accurately reflect the current state
       */
      
      const testStartTime = Date.now();
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate random user data
            userEmail: fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length >= 5).map(s => `${s.replace(/\s/g, '_')}@test.com`),
            userName: fc.string({ minLength: 3, maxLength: 15 }).filter(s => s.trim().length >= 3).map(s => s.replace(/\s/g, '_')),
            // Generate random post data
            postCaption: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length >= 1), { nil: undefined }),
            postImage: fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length >= 5).map(s => `/uploads/${s.replace(/\s/g, '_')}.jpg`),
            // Generate number of other users who will like the post (0-10)
            otherLikersCount: fc.integer({ min: 0, max: 10 }),
            // Whether the main user should like the post
            userShouldLike: fc.boolean(),
          }),
          async (testData) => {
            testCounter++;
            const uniqueId = `display_${testStartTime}_${testCounter}`;
            
            // Ensure unique identifiers
            const email = `${uniqueId}_${testData.userEmail}`;
            const username = `${uniqueId}_${testData.userName}`;
            const imageUrl = `${testData.postImage}_${uniqueId}`;
            
            // Arrange: Create main user (the one viewing the post)
            const hashedPassword = await bcrypt.hash('password123', 10);
            const mainUser = await prisma.user.create({
              data: {
                email: email,
                username: username,
                password: hashedPassword,
                name: username,
              },
            });

            // Arrange: Create post owner
            const postOwner = await prisma.user.create({
              data: {
                email: `owner_${email}`,
                username: `owner_${username}`,
                password: hashedPassword,
                name: `Owner ${username}`,
              },
            });

            // Arrange: Create a post
            const post = await prisma.post.create({
              data: {
                userId: postOwner.id,
                image: imageUrl,
                caption: testData.postCaption || 'Test post for like display',
              },
            });

            // Arrange: Create other users who will like the post
            const otherUsers = [];
            for (let i = 0; i < testData.otherLikersCount; i++) {
              const otherUser = await prisma.user.create({
                data: {
                  email: `other${i}_${email}`,
                  username: `other${i}_${username}`,
                  password: hashedPassword,
                  name: `Other User ${i}`,
                },
              });
              otherUsers.push(otherUser);

              // Other user likes the post
              await prisma.like.create({
                data: {
                  userId: otherUser.id,
                  postId: post.id,
                },
              });
            }

            // Arrange: Main user likes the post if specified
            let mainUserLike = null;
            if (testData.userShouldLike) {
              mainUserLike = await prisma.like.create({
                data: {
                  userId: mainUser.id,
                  postId: post.id,
                },
              });
            }

            // Act: Simulate fetching post data for display (what the UI would do)
            const postWithLikes = await prisma.post.findUnique({
              where: { id: post.id },
              include: {
                likes: true,
                _count: {
                  select: {
                    likes: true,
                  },
                },
              },
            });

            // Act: Check if main user has liked this post (for button state)
            const mainUserLikeStatus = await prisma.like.findUnique({
              where: {
                userId_postId: {
                  userId: mainUser.id,
                  postId: post.id,
                },
              },
            });

            // Act: Get total like count
            const totalLikeCount = await prisma.like.count({
              where: { postId: post.id },
            });

            // Calculate expected values
            const expectedLikeCount = testData.otherLikersCount + (testData.userShouldLike ? 1 : 0);
            const expectedUserLiked = testData.userShouldLike;

            // Assert: Post should exist and have correct structure
            expect(postWithLikes).not.toBeNull();
            expect(postWithLikes?.id).toBe(post.id);
            expect(postWithLikes?.userId).toBe(postOwner.id);
            expect(postWithLikes?.image).toBe(imageUrl);

            // Assert: Like count should be accurate
            expect(postWithLikes?._count.likes).toBe(expectedLikeCount);
            expect(totalLikeCount).toBe(expectedLikeCount);
            expect(postWithLikes?.likes).toHaveLength(expectedLikeCount);

            // Assert: User's like status should be accurate
            if (expectedUserLiked) {
              expect(mainUserLikeStatus).not.toBeNull();
              expect(mainUserLikeStatus?.userId).toBe(mainUser.id);
              expect(mainUserLikeStatus?.postId).toBe(post.id);
              expect(mainUserLikeStatus?.id).toBe(mainUserLike?.id);
              expect(mainUserLikeStatus?.createdAt).toBeInstanceOf(Date);
            } else {
              expect(mainUserLikeStatus).toBeNull();
            }

            // Assert: All likes should be valid and belong to the correct post
            for (const like of postWithLikes?.likes || []) {
              expect(like.postId).toBe(post.id);
              expect(like.userId).toBeDefined();
              expect(like.createdAt).toBeInstanceOf(Date);
              expect(like.createdAt.getTime()).toBeGreaterThan(testStartTime);
            }

            // Assert: Verify that the likes belong to the expected users
            const likeUserIds = (postWithLikes?.likes || []).map(like => like.userId);
            
            // All other users should have liked the post
            for (const otherUser of otherUsers) {
              expect(likeUserIds).toContain(otherUser.id);
            }

            // Main user should be in the list only if they liked the post
            if (testData.userShouldLike) {
              expect(likeUserIds).toContain(mainUser.id);
            } else {
              expect(likeUserIds).not.toContain(mainUser.id);
            }

            // Assert: No duplicate likes should exist
            const uniqueLikeUserIds = new Set(likeUserIds);
            expect(uniqueLikeUserIds.size).toBe(likeUserIds.length);
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    }, 25000); // Increased timeout for property-based testing

    it('should maintain accurate like information after like state changes', async () => {
      /**
       * **Feature: simple-instagram, Property 14: Post displays accurate like information**
       * **Validates: Requirements 4.3**
       * 
       * Property: Like information should remain accurate after users like/unlike posts
       */
      
      const testStartTime = Date.now();
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userName: fc.string({ minLength: 3, maxLength: 15 }).filter(s => s.trim().length >= 3).map(s => s.replace(/\s/g, '_')),
            postCaption: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            // Number of users who will interact with the post
            interactingUsersCount: fc.integer({ min: 1, max: 5 }),
            // Actions each user will perform (like, unlike, or both)
            userActions: fc.array(fc.oneof(
              fc.constant('like'),
              fc.constant('unlike'),
              fc.constant('like_then_unlike')
            ), { minLength: 1, maxLength: 5 }),
          }),
          async (testData) => {
            testCounter++;
            const uniqueId = `dynamic_display_${testStartTime}_${testCounter}`;
            
            const email = `${uniqueId}@test.com`;
            const username = `${uniqueId}_${testData.userName}`;
            
            // Arrange: Create viewing user
            const hashedPassword = await bcrypt.hash('password123', 10);
            const viewingUser = await prisma.user.create({
              data: {
                email: email,
                username: username,
                password: hashedPassword,
                name: username,
              },
            });

            // Arrange: Create post owner
            const postOwner = await prisma.user.create({
              data: {
                email: `owner_${email}`,
                username: `owner_${username}`,
                password: hashedPassword,
                name: `Owner ${username}`,
              },
            });

            // Arrange: Create post
            const post = await prisma.post.create({
              data: {
                userId: postOwner.id,
                image: `/uploads/${uniqueId}.jpg`,
                caption: testData.postCaption || 'Dynamic like test post',
              },
            });

            // Arrange: Create interacting users
            const interactingUsers = [];
            for (let i = 0; i < testData.interactingUsersCount; i++) {
              const user = await prisma.user.create({
                data: {
                  email: `user${i}_${email}`,
                  username: `user${i}_${username}`,
                  password: hashedPassword,
                  name: `User ${i}`,
                },
              });
              interactingUsers.push(user);
            }

            // Act: Perform actions and verify display accuracy after each action
            let expectedLikeCount = 0;
            const currentlyLikedUsers = new Set<string>();

            for (let i = 0; i < Math.min(testData.userActions.length, interactingUsers.length); i++) {
              const user = interactingUsers[i];
              const action = testData.userActions[i];

              if (action === 'like') {
                if (!currentlyLikedUsers.has(user.id)) {
                  await prisma.like.create({
                    data: {
                      userId: user.id,
                      postId: post.id,
                    },
                  });
                  currentlyLikedUsers.add(user.id);
                  expectedLikeCount++;
                }
              } else if (action === 'unlike') {
                if (currentlyLikedUsers.has(user.id)) {
                  await prisma.like.delete({
                    where: {
                      userId_postId: {
                        userId: user.id,
                        postId: post.id,
                      },
                    },
                  });
                  currentlyLikedUsers.delete(user.id);
                  expectedLikeCount--;
                }
              } else if (action === 'like_then_unlike') {
                // Like first
                if (!currentlyLikedUsers.has(user.id)) {
                  await prisma.like.create({
                    data: {
                      userId: user.id,
                      postId: post.id,
                    },
                  });
                  currentlyLikedUsers.add(user.id);
                  expectedLikeCount++;
                }

                // Then unlike
                await prisma.like.delete({
                  where: {
                    userId_postId: {
                      userId: user.id,
                      postId: post.id,
                    },
                  },
                });
                currentlyLikedUsers.delete(user.id);
                expectedLikeCount--;
              }

              // Verify display accuracy after each action
              const postWithLikes = await prisma.post.findUnique({
                where: { id: post.id },
                include: {
                  likes: true,
                  _count: {
                    select: {
                      likes: true,
                    },
                  },
                },
              });

              const actualLikeCount = await prisma.like.count({
                where: { postId: post.id },
              });

              // Assert: Like count should be accurate after each action
              expect(postWithLikes?._count.likes).toBe(expectedLikeCount);
              expect(actualLikeCount).toBe(expectedLikeCount);
              expect(postWithLikes?.likes).toHaveLength(expectedLikeCount);

              // Assert: Each user's like status should be accurate
              for (const interactingUser of interactingUsers) {
                const userLikeStatus = await prisma.like.findUnique({
                  where: {
                    userId_postId: {
                      userId: interactingUser.id,
                      postId: post.id,
                    },
                  },
                });

                if (currentlyLikedUsers.has(interactingUser.id)) {
                  expect(userLikeStatus).not.toBeNull();
                  expect(userLikeStatus?.userId).toBe(interactingUser.id);
                  expect(userLikeStatus?.postId).toBe(post.id);
                } else {
                  expect(userLikeStatus).toBeNull();
                }
              }
            }

            // Final verification: Check viewing user's status (should be null since they didn't interact)
            const viewingUserLikeStatus = await prisma.like.findUnique({
              where: {
                userId_postId: {
                  userId: viewingUser.id,
                  postId: post.id,
                },
              },
            });
            expect(viewingUserLikeStatus).toBeNull();
          }
        ),
        { numRuns: 50 } // Fewer runs due to complexity
      );
    }, 20000); // Longer timeout for complex test
  });
});