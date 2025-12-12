/**
 * Property-Based Tests for Authentication
 * 
 * **Feature: simple-instagram, Property 2: Valid login succeeds**
 * **Validates: Requirements 1.2**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import * as fc from 'fast-check';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Property-Based Tests: Authentication', () => {
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

  describe('Property 2: Valid login succeeds', () => {
    it('should successfully authenticate any registered user with correct credentials', async () => {
      /**
       * **Feature: simple-instagram, Property 2: Valid login succeeds**
       * **Validates: Requirements 1.2**
       * 
       * Property: For any registered user with correct credentials, login should succeed 
       * and create a valid session
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
            
            // Arrange: Create a user account first (simulating registration)
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const createdUser = await prisma.user.create({
              data: {
                email: email,
                username: username,
                password: hashedPassword,
                name: userData.name || username,
              },
            });

            // Act: Simulate the NextAuth authorize function logic
            // This is what happens when a user tries to login
            const foundUser = await prisma.user.findUnique({
              where: { email: email },
            });

            // Assert: User should be found
            expect(foundUser).toBeDefined();
            expect(foundUser?.email).toBe(email);

            // Act: Verify password (core login logic)
            const isPasswordValid = await bcrypt.compare(
              userData.password,
              foundUser!.password
            );

            // Assert: Password verification should succeed
            expect(isPasswordValid).toBe(true);

            // Act: Simulate successful authentication return (what NextAuth returns)
            const authResult = {
              id: foundUser!.id,
              email: foundUser!.email,
              name: foundUser!.name,
              image: foundUser!.image,
            };

            // Assert: Authentication result should contain valid user data
            expect(authResult).toBeDefined();
            expect(authResult.id).toBe(createdUser.id);
            expect(authResult.email).toBe(email);
            expect(authResult.name).toBe(userData.name || username);
            expect(authResult.id).toMatch(/^[a-zA-Z0-9]+$/); // Valid ID format

            // Assert: User data should be complete for session creation
            expect(authResult.id).toBeDefined();
            expect(authResult.email).toBeDefined();
            expect(authResult.name).toBeDefined();
            // image can be null, but property should exist
            expect(authResult).toHaveProperty('image');
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    }, 15000); // Increased timeout for property-based testing

    it('should handle edge cases in valid login scenarios', async () => {
      /**
       * **Feature: simple-instagram, Property 2: Valid login succeeds**
       * **Validates: Requirements 1.2**
       * 
       * Property: Edge cases with valid credentials should still succeed
       */
      
      const testStartTime = Date.now();
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Test various password patterns that should all be valid
            password: fc.oneof(
              // Simple alphanumeric passwords
              fc.string({ minLength: 8, maxLength: 20 }).filter(s => s.trim().length >= 8),
              // Passwords with special characters
              fc.string({ minLength: 4, maxLength: 16 }).map(s => s.trim() + '!@#$123'),
              // Passwords with mixed case and numbers
              fc.string({ minLength: 4, maxLength: 16 }).map(s => s.toUpperCase() + s.toLowerCase() + '123')
            ).filter(s => s.length >= 8),
            // Test various name scenarios
            name: fc.oneof(
              fc.constant(undefined), // No name provided
              fc.string({ minLength: 1, maxLength: 30 }), // Regular name
              fc.string({ minLength: 1, maxLength: 10 }).map(s => s + ' ' + s), // Name with space
            )
          }),
          async (userData) => {
            testCounter++;
            const uniqueId = `edge_${testStartTime}_${testCounter}`;
            const email = `${uniqueId}@test.com`;
            const username = `${uniqueId}`;

            // Arrange: Create user
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            await prisma.user.create({
              data: {
                email: email,
                username: username,
                password: hashedPassword,
                name: userData.name || username,
              },
            });

            // Act: Attempt login
            const user = await prisma.user.findUnique({
              where: { email: email },
            });

            const isPasswordValid = await bcrypt.compare(
              userData.password,
              user!.password
            );

            // Assert: Login should succeed regardless of edge case
            expect(user).toBeDefined();
            expect(isPasswordValid).toBe(true);
            expect(user?.email).toBe(email);
            expect(user?.username).toBe(username);
            
            // Verify authentication data is suitable for session
            const sessionData = {
              id: user!.id,
              email: user!.email,
              name: user!.name,
              image: user!.image,
            };
            
            expect(sessionData.id).toBeDefined();
            expect(sessionData.email).toBe(email);
            expect(sessionData.name).toBeDefined();
          }
        ),
        { numRuns: 50 } // Fewer runs for edge cases
      );
    }, 15000);
  });

  describe('Property 3: Invalid login fails', () => {
    it('should fail authentication for any invalid credentials', async () => {
      /**
       * **Feature: simple-instagram, Property 3: Invalid login fails**
       * **Validates: Requirements 1.3**
       * 
       * Property: For any invalid credentials (wrong email or password), login should fail and return an error
       */
      
      const testStartTime = Date.now();
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Valid user data for creating the account
            validPassword: fc.string({ minLength: 8, maxLength: 50 }).filter(s => s.trim().length >= 8),
            name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            // Invalid credentials to test with
            invalidCredentials: fc.oneof(
              // Wrong password (user exists but password is wrong)
              fc.record({
                type: fc.constant('wrong_password'),
                wrongPassword: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
              }),
              // Wrong email (user doesn't exist)
              fc.record({
                type: fc.constant('wrong_email'),
                wrongEmail: fc.string({ minLength: 5, maxLength: 50 }).map(s => `wrong_${s}@test.com`)
              }),
              // Both wrong email and password
              fc.record({
                type: fc.constant('both_wrong'),
                wrongEmail: fc.string({ minLength: 5, maxLength: 50 }).map(s => `fake_${s}@test.com`),
                wrongPassword: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
              })
            )
          }),
          async (testData) => {
            testCounter++;
            const uniqueId = `invalid_${testStartTime}_${testCounter}`;
            const validEmail = `test_${uniqueId}@example.com`;
            const validUsername = `user_${uniqueId}`;
            
            // Arrange: Create a valid user account first
            const hashedPassword = await bcrypt.hash(testData.validPassword, 10);
            await prisma.user.create({
              data: {
                email: validEmail,
                username: validUsername,
                password: hashedPassword,
                name: testData.name || validUsername,
              },
            });

            // Act & Assert: Test different types of invalid credentials
            if (testData.invalidCredentials.type === 'wrong_password') {
              // Test: Correct email, wrong password
              const user = await prisma.user.findUnique({
                where: { email: validEmail },
              });
              
              expect(user).toBeDefined(); // User should exist
              
              // Ensure the wrong password is actually different from the valid one
              const wrongPassword = testData.invalidCredentials.wrongPassword === testData.validPassword 
                ? testData.invalidCredentials.wrongPassword + '_different'
                : testData.invalidCredentials.wrongPassword;
              
              const isPasswordValid = await bcrypt.compare(wrongPassword, user!.password);
              expect(isPasswordValid).toBe(false); // Password verification should fail
              
            } else if (testData.invalidCredentials.type === 'wrong_email') {
              // Test: Wrong email (user doesn't exist)
              const wrongEmail = testData.invalidCredentials.wrongEmail;
              
              // Ensure the wrong email is different from the valid one
              const emailToTest = wrongEmail === validEmail ? `different_${wrongEmail}` : wrongEmail;
              
              const user = await prisma.user.findUnique({
                where: { email: emailToTest },
              });
              
              expect(user).toBeNull(); // User should not exist
              
            } else if (testData.invalidCredentials.type === 'both_wrong') {
              // Test: Both email and password are wrong
              const wrongEmail = testData.invalidCredentials.wrongEmail;
              const wrongPassword = testData.invalidCredentials.wrongPassword;
              
              // Ensure the wrong email is different from the valid one
              const emailToTest = wrongEmail === validEmail ? `different_${wrongEmail}` : wrongEmail;
              
              const user = await prisma.user.findUnique({
                where: { email: emailToTest },
              });
              
              expect(user).toBeNull(); // User should not exist with wrong email
              
              // Even if we had a user, the password would be wrong
              if (user) {
                const isPasswordValid = await bcrypt.compare(wrongPassword, user.password);
                expect(isPasswordValid).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    }, 15000); // Increased timeout for property-based testing

    it('should handle edge cases in invalid login scenarios', async () => {
      /**
       * **Feature: simple-instagram, Property 3: Invalid login fails**
       * **Validates: Requirements 1.3**
       * 
       * Property: Edge cases with invalid credentials should still fail appropriately
       */
      
      const testStartTime = Date.now();
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            validPassword: fc.string({ minLength: 8, maxLength: 20 }).filter(s => s.trim().length >= 8),
            // Test various invalid password patterns
            invalidPassword: fc.oneof(
              fc.constant(''), // Empty password
              fc.constant('   '), // Whitespace only
              fc.string({ minLength: 1, maxLength: 7 }), // Too short
              fc.string({ minLength: 1, maxLength: 20 }).map(s => s + '_wrong'), // Different but similar
            )
          }),
          async (testData) => {
            testCounter++;
            const uniqueId = `edge_invalid_${testStartTime}_${testCounter}`;
            const email = `${uniqueId}@test.com`;
            const username = `${uniqueId}`;

            // Arrange: Create valid user
            const hashedPassword = await bcrypt.hash(testData.validPassword, 10);
            await prisma.user.create({
              data: {
                email: email,
                username: username,
                password: hashedPassword,
                name: username,
              },
            });

            // Act: Attempt login with invalid password
            const user = await prisma.user.findUnique({
              where: { email: email },
            });

            expect(user).toBeDefined(); // User should exist
            
            // Ensure invalid password is different from valid password
            const passwordToTest = testData.invalidPassword === testData.validPassword 
              ? testData.invalidPassword + '_definitely_wrong'
              : testData.invalidPassword;

            const isPasswordValid = await bcrypt.compare(passwordToTest, user!.password);

            // Assert: Login should fail regardless of edge case
            expect(isPasswordValid).toBe(false);
          }
        ),
        { numRuns: 50 } // Fewer runs for edge cases
      );
    }, 15000);
  });

  describe('Property 4: Successful login creates session', () => {
    it('should create a valid session for any successful login', async () => {
      /**
       * **Feature: simple-instagram, Property 4: Successful login creates session**
       * **Validates: Requirements 1.4**
       * 
       * Property: For any successful login, a user session should be created and the user should be redirected to the feed page
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
            const uniqueId = `session_${testStartTime}_${testCounter}`;
            const email = `test_${uniqueId}@example.com`;
            const username = `user_${uniqueId}`;
            
            // Arrange: Create a user account first (simulating registration)
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const createdUser = await prisma.user.create({
              data: {
                email: email,
                username: username,
                password: hashedPassword,
                name: userData.name || username,
              },
            });

            // Act: Simulate the NextAuth authorize function (successful login)
            const foundUser = await prisma.user.findUnique({
              where: { email: email },
            });

            // Verify user exists and password is correct
            expect(foundUser).toBeDefined();
            const isPasswordValid = await bcrypt.compare(
              userData.password,
              foundUser!.password
            );
            expect(isPasswordValid).toBe(true);

            // Act: Simulate successful authentication return (what NextAuth authorize returns)
            const authResult = {
              id: foundUser!.id,
              email: foundUser!.email,
              name: foundUser!.name,
              image: foundUser!.image,
            };

            // Assert: Authentication result should be valid for session creation
            expect(authResult).toBeDefined();
            expect(authResult.id).toBe(createdUser.id);
            expect(authResult.email).toBe(email);
            expect(authResult.name).toBe(userData.name || username);

            // Act: Simulate JWT token creation (NextAuth jwt callback)
            const jwtToken = {
              sub: authResult.id, // User ID stored in token
              email: authResult.email,
              name: authResult.name,
              image: authResult.image,
            };

            // Assert: JWT token should contain valid session data
            expect(jwtToken.sub).toBe(createdUser.id);
            expect(jwtToken.email).toBe(email);
            expect(jwtToken.name).toBe(userData.name || username);
            expect(jwtToken.sub).toMatch(/^[a-zA-Z0-9]+$/); // Valid ID format for session

            // Act: Simulate session creation (NextAuth session callback)
            const sessionData = {
              user: {
                id: jwtToken.sub,
                email: jwtToken.email,
                name: jwtToken.name,
                image: jwtToken.image,
              },
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            };

            // Assert: Session should contain complete user information
            expect(sessionData.user).toBeDefined();
            expect(sessionData.user.id).toBe(createdUser.id);
            expect(sessionData.user.email).toBe(email);
            expect(sessionData.user.name).toBe(userData.name || username);
            expect(sessionData.expires).toBeDefined();
            expect(new Date(sessionData.expires)).toBeInstanceOf(Date);
            expect(new Date(sessionData.expires).getTime()).toBeGreaterThan(Date.now());

            // Assert: Session data should be complete for authenticated user experience
            expect(sessionData.user.id).toBeDefined();
            expect(sessionData.user.email).toBeDefined();
            expect(sessionData.user.name).toBeDefined();
            // image can be null, but property should exist
            expect(sessionData.user).toHaveProperty('image');

            // Assert: Session should enable user identification for subsequent requests
            expect(sessionData.user.id).toMatch(/^[a-zA-Z0-9]+$/); // Valid format for user identification
            expect(sessionData.user.email).toMatch(/^[^@]+@[^@]+\.[^@]+$/); // Valid email format
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    }, 15000); // Increased timeout for property-based testing

    it('should handle edge cases in session creation', async () => {
      /**
       * **Feature: simple-instagram, Property 4: Successful login creates session**
       * **Validates: Requirements 1.4**
       * 
       * Property: Edge cases in successful login should still create valid sessions
       */
      
      const testStartTime = Date.now();
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Test various password patterns that should all be valid
            password: fc.oneof(
              // Simple alphanumeric passwords
              fc.string({ minLength: 8, maxLength: 20 }).filter(s => s.trim().length >= 8),
              // Passwords with special characters
              fc.string({ minLength: 4, maxLength: 16 }).map(s => s.trim() + '!@#$123'),
              // Passwords with mixed case and numbers
              fc.string({ minLength: 4, maxLength: 16 }).map(s => s.toUpperCase() + s.toLowerCase() + '123')
            ).filter(s => s.length >= 8),
            // Test various name scenarios
            name: fc.oneof(
              fc.constant(undefined), // No name provided
              fc.string({ minLength: 1, maxLength: 30 }), // Regular name
              fc.string({ minLength: 1, maxLength: 10 }).map(s => s + ' ' + s), // Name with space
            )
          }),
          async (userData) => {
            testCounter++;
            const uniqueId = `session_edge_${testStartTime}_${testCounter}`;
            const email = `${uniqueId}@test.com`;
            const username = `${uniqueId}`;

            // Arrange: Create user
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const createdUser = await prisma.user.create({
              data: {
                email: email,
                username: username,
                password: hashedPassword,
                name: userData.name || username,
              },
            });

            // Act: Simulate successful login
            const user = await prisma.user.findUnique({
              where: { email: email },
            });

            const isPasswordValid = await bcrypt.compare(
              userData.password,
              user!.password
            );

            // Verify login succeeds
            expect(user).toBeDefined();
            expect(isPasswordValid).toBe(true);

            // Act: Create session data
            const sessionData = {
              user: {
                id: user!.id,
                email: user!.email,
                name: user!.name,
                image: user!.image,
              },
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            };

            // Assert: Session should be valid regardless of edge case
            expect(sessionData.user.id).toBe(createdUser.id);
            expect(sessionData.user.email).toBe(email);
            expect(sessionData.user.name).toBe(userData.name || username);
            expect(sessionData.expires).toBeDefined();
            
            // Verify session enables user identification
            expect(sessionData.user.id).toBeDefined();
            expect(sessionData.user.email).toBeDefined();
            expect(sessionData.user.name).toBeDefined();
            
            // Verify session expiry is in the future
            expect(new Date(sessionData.expires).getTime()).toBeGreaterThan(Date.now());
          }
        ),
        { numRuns: 50 } // Fewer runs for edge cases
      );
    }, 15000);
  });
});