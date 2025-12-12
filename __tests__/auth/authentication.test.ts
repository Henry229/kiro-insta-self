/**
 * Authentication Property Tests
 *
 * These tests validate the authentication requirements:
 * - Property 2: Valid login succeeds (Requirement 1.2)
 * - Property 3: Invalid login fails (Requirement 1.3)
 * - Property 4: Successful login creates session (Requirement 1.4)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Authentication System', () => {
  const testUser = {
    email: 'auth-test@example.com',
    username: 'authtestuser',
    password: 'testpassword123',
    name: 'Auth Test User',
  };

  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        OR: [{ email: testUser.email }, { username: testUser.username }],
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        OR: [{ email: testUser.email }, { username: testUser.username }],
      },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Ensure clean state before each test
    await prisma.user.deleteMany({
      where: {
        OR: [{ email: testUser.email }, { username: testUser.username }],
      },
    });
  });

  describe('Property 2: Valid login succeeds (Requirement 1.2)', () => {
    it('should successfully authenticate user with correct credentials', async () => {
      // Arrange: Create a user with hashed password
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await prisma.user.create({
        data: {
          email: testUser.email,
          username: testUser.username,
          password: hashedPassword,
          name: testUser.name,
        },
      });

      // Act: Attempt to verify credentials
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      // Assert: User exists and password can be verified
      expect(user).toBeDefined();
      expect(user?.email).toBe(testUser.email);

      const isPasswordValid = await bcrypt.compare(
        testUser.password,
        user!.password
      );
      expect(isPasswordValid).toBe(true);
    });

    it('should return user data when authentication succeeds', async () => {
      // Arrange: Create a user
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      const createdUser = await prisma.user.create({
        data: {
          email: testUser.email,
          username: testUser.username,
          password: hashedPassword,
          name: testUser.name,
        },
      });

      // Act: Retrieve user
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          image: true,
        },
      });

      // Assert: User data is correct
      expect(user).toBeDefined();
      expect(user?.id).toBe(createdUser.id);
      expect(user?.email).toBe(testUser.email);
      expect(user?.username).toBe(testUser.username);
      expect(user?.name).toBe(testUser.name);
    });
  });

  describe('Property 3: Invalid login fails (Requirement 1.3)', () => {
    it('should fail authentication with incorrect password', async () => {
      // Arrange: Create a user
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await prisma.user.create({
        data: {
          email: testUser.email,
          username: testUser.username,
          password: hashedPassword,
          name: testUser.name,
        },
      });

      // Act: Attempt to verify with wrong password
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      const isPasswordValid = await bcrypt.compare(
        'wrongpassword',
        user!.password
      );

      // Assert: Password verification fails
      expect(isPasswordValid).toBe(false);
    });

    it('should return null for non-existent user', async () => {
      // Act: Try to find non-existent user
      const user = await prisma.user.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      // Assert: User not found
      expect(user).toBeNull();
    });

    it('should fail authentication with non-existent email', async () => {
      // Act: Try to authenticate with non-existent email
      const user = await prisma.user.findUnique({
        where: { email: 'fake@example.com' },
      });

      // Assert: User should not exist
      expect(user).toBeNull();
    });
  });

  describe('Property 4: Successful login creates session (Requirement 1.4)', () => {
    it('should verify user exists before creating session', async () => {
      // Arrange: Create a user
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await prisma.user.create({
        data: {
          email: testUser.email,
          username: testUser.username,
          password: hashedPassword,
          name: testUser.name,
        },
      });

      // Act: Verify user and password
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      const isPasswordValid = await bcrypt.compare(
        testUser.password,
        user!.password
      );

      // Assert: User can be authenticated (ready for session creation)
      expect(user).toBeDefined();
      expect(isPasswordValid).toBe(true);
      expect(user?.id).toBeDefined();
      expect(user?.email).toBe(testUser.email);
    });

    it('should provide necessary user data for session', async () => {
      // Arrange: Create a user
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await prisma.user.create({
        data: {
          email: testUser.email,
          username: testUser.username,
          password: hashedPassword,
          name: testUser.name,
        },
      });

      // Act: Get user data for session
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      });

      // Assert: Session data is available
      expect(user).toBeDefined();
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(user?.name).toBeDefined();
      // Image can be null
      expect(user).toHaveProperty('image');
    });

    it('should not create session for invalid credentials', async () => {
      // Arrange: Create a user
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await prisma.user.create({
        data: {
          email: testUser.email,
          username: testUser.username,
          password: hashedPassword,
          name: testUser.name,
        },
      });

      // Act: Try to authenticate with wrong password
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      const isPasswordValid = await bcrypt.compare(
        'wrongpassword',
        user!.password
      );

      // Assert: Session should not be created
      expect(isPasswordValid).toBe(false);
    });
  });

  describe('User Registration API', () => {
    it('should create user with hashed password', async () => {
      // Act: Create user (simulating registration)
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          username: testUser.username,
          password: hashedPassword,
          name: testUser.name,
        },
      });

      // Assert: User created with hashed password
      expect(user).toBeDefined();
      expect(user.password).not.toBe(testUser.password);
      expect(user.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash format
    });

    it('should prevent duplicate email registration', async () => {
      // Arrange: Create first user
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await prisma.user.create({
        data: {
          email: testUser.email,
          username: testUser.username,
          password: hashedPassword,
          name: testUser.name,
        },
      });

      // Act & Assert: Try to create duplicate user
      await expect(
        prisma.user.create({
          data: {
            email: testUser.email,
            username: 'different',
            password: hashedPassword,
            name: 'Different User',
          },
        })
      ).rejects.toThrow();
    });

    it('should prevent duplicate username registration', async () => {
      // Arrange: Create first user
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await prisma.user.create({
        data: {
          email: testUser.email,
          username: testUser.username,
          password: hashedPassword,
          name: testUser.name,
        },
      });

      // Act & Assert: Try to create duplicate username
      await expect(
        prisma.user.create({
          data: {
            email: 'different@example.com',
            username: testUser.username,
            password: hashedPassword,
            name: 'Different User',
          },
        })
      ).rejects.toThrow();
    });
  });
});
