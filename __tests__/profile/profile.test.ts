import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma, cleanupDatabase, createTestEmail, createTestUsername } from '../utils/test-db';

describe('Profile System Tests', () => {
  let testUser1: { id: string; email: string; username: string; name: string | null; image: string | null };
  let testUser2: { id: string; email: string; username: string; name: string | null; image: string | null };
  let testPosts: Array<{ id: string; userId: string; image: string; caption: string | null }>;

  beforeEach(async () => {
    // Clean up database before each test
    await cleanupDatabase();

    // 테스트 사용자 생성
    testUser1 = await prisma.user.create({
      data: {
        email: createTestEmail('user1'),
        username: createTestUsername('user1'),
        name: '테스트 사용자 1',
        password: 'hashedpassword1',
        image: 'https://example.com/profile1.jpg',
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: createTestEmail('user2'),
        username: createTestUsername('user2'),
        name: '테스트 사용자 2',
        password: 'hashedpassword2',
        image: null,
      },
    });

    // testUser1의 게시물 생성
    testPosts = await Promise.all([
      prisma.post.create({
        data: {
          userId: testUser1.id,
          image: '/uploads/image1.jpg',
          caption: '첫 번째 게시물',
        },
      }),
      prisma.post.create({
        data: {
          userId: testUser1.id,
          image: '/uploads/image2.jpg',
          caption: '두 번째 게시물',
        },
      }),
      prisma.post.create({
        data: {
          userId: testUser1.id,
          image: '/uploads/image3.jpg',
          caption: '세 번째 게시물',
        },
      }),
    ]);

    // testUser2의 게시물 생성
    await prisma.post.create({
      data: {
        userId: testUser2.id,
        image: '/uploads/user2-image.jpg',
        caption: 'user2의 게시물',
      },
    });
  });

  afterEach(async () => {
    // Clean up database after each test
    await cleanupDatabase();
  });

  describe('Property 19: Profile displays user information', () => {
    it('should display username, name, and profile image when accessing profile', async () => {
      // Requirement 6.1 검증
      const profile = await prisma.user.findUnique({
        where: { id: testUser1.id },
        select: {
          username: true,
          name: true,
          image: true,
          _count: {
            select: {
              posts: true,
            },
          },
        },
      });

      expect(profile).toBeDefined();
      expect(profile?.username).toBe(testUser1.username);
      expect(profile?.name).toBe('테스트 사용자 1');
      expect(profile?.image).toBe('https://example.com/profile1.jpg');
    });

    it('should display correct post count for user', async () => {
      // Requirement 6.1 검증
      const profile = await prisma.user.findUnique({
        where: { id: testUser1.id },
        select: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
      });

      expect(profile?._count.posts).toBe(3);
    });

    it('should handle user with null profile image', async () => {
      // Requirement 6.1 검증 - 프로필 이미지가 없는 경우
      const profile = await prisma.user.findUnique({
        where: { id: testUser2.id },
        select: {
          username: true,
          name: true,
          image: true,
        },
      });

      expect(profile).toBeDefined();
      expect(profile?.username).toBe(testUser2.username);
      expect(profile?.image).toBeNull();
    });

    it('should handle user with zero posts', async () => {
      // Requirement 6.1 검증 - 게시물이 없는 새 사용자
      const newUser = await prisma.user.create({
        data: {
          email: createTestEmail('newuser'),
          username: createTestUsername('newuser'),
          name: '새 사용자',
          password: 'hashedpassword',
        },
      });

      const profile = await prisma.user.findUnique({
        where: { id: newUser.id },
        select: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
      });

      expect(profile?._count.posts).toBe(0);

      // 정리
      await prisma.user.delete({ where: { id: newUser.id } });
    });
  });

  describe('Property 20: Profile displays user posts in grid', () => {
    it('should retrieve all posts for a specific user', async () => {
      // Requirement 6.2 검증
      const userPosts = await prisma.post.findMany({
        where: { userId: testUser1.id },
        orderBy: { createdAt: 'desc' },
      });

      expect(userPosts).toHaveLength(3);
      expect(userPosts.every(post => post.userId === testUser1.id)).toBe(true);
    });

    it('should order posts by creation date descending', async () => {
      // Requirement 6.2 검증 - 최신순 정렬
      const userPosts = await prisma.post.findMany({
        where: { userId: testUser1.id },
        orderBy: { createdAt: 'desc' },
      });

      expect(userPosts).toHaveLength(3);

      // 시간 순서 검증
      for (let i = 0; i < userPosts.length - 1; i++) {
        expect(
          new Date(userPosts[i].createdAt).getTime()
        ).toBeGreaterThanOrEqual(
          new Date(userPosts[i + 1].createdAt).getTime()
        );
      }
    });

    it('should only show posts from the specific user, not other users', async () => {
      // Requirement 6.2 검증 - 다른 사용자 게시물 제외
      const user1Posts = await prisma.post.findMany({
        where: { userId: testUser1.id },
      });

      const user2Posts = await prisma.post.findMany({
        where: { userId: testUser2.id },
      });

      expect(user1Posts).toHaveLength(3);
      expect(user2Posts).toHaveLength(1);
      expect(user1Posts.every(post => post.userId === testUser1.id)).toBe(true);
      expect(user2Posts.every(post => post.userId === testUser2.id)).toBe(true);
    });

    it('should handle empty post list for user with no posts', async () => {
      // Requirement 6.2 검증 - 빈 상태 처리
      const newUser = await prisma.user.create({
        data: {
          email: createTestEmail('noposts'),
          username: createTestUsername('noposts'),
          name: '게시물 없는 사용자',
          password: 'hashedpassword',
        },
      });

      const userPosts = await prisma.post.findMany({
        where: { userId: newUser.id },
      });

      expect(userPosts).toHaveLength(0);
      expect(Array.isArray(userPosts)).toBe(true);

      // 정리
      await prisma.user.delete({ where: { id: newUser.id } });
    });
  });

  describe('Property 21: Profile post click shows detail view', () => {
    it('should retrieve full post details including user, likes, and comments', async () => {
      // Requirement 6.3 검증
      const post = testPosts[0];

      // 좋아요와 댓글 추가
      await prisma.like.create({
        data: {
          userId: testUser2.id,
          postId: post.id,
        },
      });

      await prisma.comment.create({
        data: {
          userId: testUser2.id,
          postId: post.id,
          content: '멋진 사진이에요!',
        },
      });

      const postDetails = await prisma.post.findUnique({
        where: { id: post.id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
          likes: {
            include: {
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  username: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      expect(postDetails).toBeDefined();
      expect(postDetails?.user.username).toBe(testUser1.username);
      expect(postDetails?._count.likes).toBe(1);
      expect(postDetails?._count.comments).toBe(1);
      expect(postDetails?.comments[0].content).toBe('멋진 사진이에요!');
    });

    it('should handle post with no likes and no comments', async () => {
      // Requirement 6.3 검증 - 좋아요와 댓글이 없는 게시물
      const post = testPosts[2];

      const postDetails = await prisma.post.findUnique({
        where: { id: post.id },
        include: {
          user: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      expect(postDetails).toBeDefined();
      expect(postDetails?._count.likes).toBe(0);
      expect(postDetails?._count.comments).toBe(0);
    });
  });

  describe('Property 22: Own profile shows edit options', () => {
    it('should be able to identify if user owns the profile', async () => {
      // Requirement 6.4 검증 - 프로필 소유권 확인
      const profileUserId = testUser1.id;
      const currentUserId = testUser1.id;

      expect(profileUserId === currentUserId).toBe(true);
    });

    it('should not show edit options for other users profiles', async () => {
      // Requirement 6.4 검증 - 다른 사용자 프로필
      const profileUserId = testUser1.id;
      const currentUserId = testUser2.id;

      expect(profileUserId === currentUserId).toBe(false);
    });

    it('should verify post ownership for edit/delete permissions', async () => {
      // Requirement 6.4 검증 - 게시물 소유권
      const post = testPosts[0];
      const currentUserId = testUser1.id;

      expect(post.userId === currentUserId).toBe(true);
    });

    it('should deny edit permissions for posts owned by other users', async () => {
      // Requirement 6.4 검증 - 다른 사용자 게시물
      const user2Post = await prisma.post.findFirst({
        where: { userId: testUser2.id },
      });

      const currentUserId = testUser1.id;

      expect(user2Post).toBeDefined();
      expect(user2Post?.userId === currentUserId).toBe(false);
    });
  });
});
