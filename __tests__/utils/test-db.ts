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
    // Ensure foreign keys are enabled first
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

    // Disable foreign key checks temporarily for cleanup
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');

    // Delete in any order since FK checks are off
    await prisma.$transaction([
      prisma.comment.deleteMany(),
      prisma.like.deleteMany(),
      prisma.post.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // Re-enable foreign key checks
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
  } catch (error) {
    console.error('Database cleanup failed:', error);
    // Re-enable FK even on error
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON').catch(() => {});
    throw error;
  }
}

/**
 * Reset the database to a clean state
 * This simply calls cleanupDatabase without double-checking
 */
export async function resetDatabase(): Promise<void> {
  await cleanupDatabase();
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
