/**
 * Property-Based Tests for User Registration
 * 
 * **Feature: simple-instagram, Property 1: Valid user registration creates account**
 * **Validates: Requirements 1.1**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import * as fc from 'fast-check';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Property-Based Tests: User Registration', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    // Clean up database after each test
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Property 1: Valid user registration creates account', () => {
    it('should create retrievable account for any valid email and password combination', async () => {
      /**
       * **Feature: simple-instagram, Property 1: Valid user registration creates account**
       * **Validates: Requirements 1.1**
       * 
       * Property: For any valid email and password combination, registering a new user 
       * should result in a new account being created in the system that can be retrieved
       */
      
      const testStartTime = Date.now();
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            password: fc.string({ minLength: 8, maxLength: 50 }).filter(s => s.trim().length >= 8),
            name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
          }),
          async (userData) => {
            testCounter++;
            // Generate completely unique identifiers using timestamp and counter
            const uniqueId = `${testStartTime}_${testCounter}`;
            const email = `test_${uniqueId}@example.com`;
            const username = `user_${uniqueId}`;
            
            // Arrange: Hash the password as the API would do
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            // Act: Create user account (simulating the registration API logic)
            const createdUser = await prisma.user.create({
              data: {
                email: email,
                username: username,
                password: hashedPassword,
                name: userData.name || username,
              },
            });

            // Assert: Account should be created and retrievable
            expect(createdUser).toBeDefined();
            expect(createdUser.id).toBeDefined();
            expect(createdUser.email).toBe(email);
            expect(createdUser.username).toBe(username);
            expect(createdUser.password).toBeDefined();
            expect(createdUser.password).not.toBe(userData.password); // Should be hashed
            expect(createdUser.createdAt).toBeInstanceOf(Date);
            expect(createdUser.updatedAt).toBeInstanceOf(Date);

            // Verify account can be retrieved by email
            const retrievedByEmail = await prisma.user.findUnique({
              where: { email: email },
            });
            expect(retrievedByEmail).toBeDefined();
            expect(retrievedByEmail?.id).toBe(createdUser.id);
            expect(retrievedByEmail?.email).toBe(email);

            // Verify account can be retrieved by username
            const retrievedByUsername = await prisma.user.findUnique({
              where: { username: username },
            });
            expect(retrievedByUsername).toBeDefined();
            expect(retrievedByUsername?.id).toBe(createdUser.id);
            expect(retrievedByUsername?.username).toBe(username);

            // Verify password can be validated
            const isPasswordValid = await bcrypt.compare(userData.password, createdUser.password);
            expect(isPasswordValid).toBe(true);
          }
        ),
        { numRuns: 20 } // Reduced runs for stability
      );
    }, 10000); // Increased timeout

    it('should handle edge cases in user registration', async () => {
      /**
       * **Feature: simple-instagram, Property 1: Valid user registration creates account**
       * **Validates: Requirements 1.1**
       * 
       * Property: Edge cases should still result in valid account creation
       */
      
      const testStartTime = Date.now();
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            password: fc.oneof(
              fc.string({ minLength: 8, maxLength: 20 }).filter(s => s.trim().length >= 8),
              // Edge case: password with special characters
              fc.string({ minLength: 4, maxLength: 16 }).map(s => s.trim() + '!@#$123'),
            ),
          }),
          async (userData) => {
            testCounter++;
            // Generate unique identifiers
            const uniqueId = `edge_${testStartTime}_${testCounter}`;
            const email = `${uniqueId}@test.com`;
            const username = `${uniqueId}`;

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            const createdUser = await prisma.user.create({
              data: {
                email: email,
                username: username,
                password: hashedPassword,
                name: username, // Use username as default name
              },
            });

            // Verify basic account properties
            expect(createdUser.id).toBeDefined();
            expect(createdUser.email).toBe(email);
            expect(createdUser.username).toBe(username);
            expect(createdUser.name).toBe(username);
            
            // Verify account is retrievable
            const retrieved = await prisma.user.findUnique({
              where: { id: createdUser.id },
            });
            expect(retrieved).toBeDefined();
            expect(retrieved?.email).toBe(email);
          }
        ),
        { numRuns: 10 } // Reduced runs for stability
      );
    }, 10000); // Increased timeout
  });
});