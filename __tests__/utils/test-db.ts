/**
 * Test Database Utilities
 *
 * Provides utilities for managing database state during tests,
 * ensuring proper cleanup and isolation between test runs.
 */

import { PrismaClient } from '@prisma/client';

// Create Prisma client for test database with SQLite optimizations
const prisma = new PrismaClient({
  log: ['error'],
});

/**
 * Clean up all database tables in the correct order (child to parent)
 * to avoid foreign key constraint violations
 */
export async function cleanupDatabase(): Promise<void> {
  try {
    // Ensure foreign keys are enabled for proper cleanup
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

    // Delete in correct order to respect foreign key constraints
    // Child tables first, then parent tables
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.error('Database cleanup failed:', error);
    throw error;
  }
}

/**
 * Reset the database to a clean state
 * Ensures a completely clean slate by disabling and re-enabling foreign keys
 */
export async function resetDatabase(): Promise<void> {
  try {
    // Temporarily disable foreign keys for aggressive cleanup
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');

    // Delete all data
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    // Re-enable foreign keys
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
  } catch (error) {
    console.error('Database reset failed:', error);
    // Ensure foreign keys are back on even if cleanup fails
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
    throw error;
  }
}

/**
 * Create a unique test identifier to avoid conflicts
 */
export function createTestId(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a unique email for testing
 */
export function createTestEmail(prefix: string = 'test'): string {
  return `${prefix}_${createTestId()}@example.com`;
}

/**
 * Create a unique username for testing
 */
export function createTestUsername(prefix: string = 'user'): string {
  return `${prefix}_${createTestId()}`;
}

export { prisma };
