/**
 * Test Database Utilities
 * 
 * Provides utilities for managing database state during tests,
 * ensuring proper cleanup and isolation between test runs.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean up all database tables in the correct order (child to parent)
 * to avoid foreign key constraint violations
 */
export async function cleanupDatabase(): Promise<void> {
  try {
    // Use a more aggressive cleanup approach with retries
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        // Delete in correct order: child tables first, then parent tables
        // Use transactions to ensure atomicity
        await prisma.$transaction([
          prisma.comment.deleteMany(),
          prisma.like.deleteMany(),
          prisma.post.deleteMany(),
          prisma.user.deleteMany(),
        ]);
        
        // Verify cleanup was successful
        const counts = await Promise.all([
          prisma.user.count(),
          prisma.post.count(),
          prisma.like.count(),
          prisma.comment.count(),
        ]);
        
        const totalRecords = counts.reduce((sum, count) => sum + count, 0);
        if (totalRecords === 0) {
          return; // Success!
        }
        
        if (attempt === maxRetries - 1) {
          throw new Error(`Database cleanup incomplete after ${maxRetries} attempts. ${totalRecords} records remain.`);
        }
        
        attempt++;
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error('Database cleanup failed:', error);
    throw error;
  }
}

/**
 * Reset the database to a clean state
 * This is more thorough than just deleting records
 */
export async function resetDatabase(): Promise<void> {
  try {
    // First, clean up all data
    await cleanupDatabase();
    
    // Reset any auto-increment counters if needed
    // SQLite doesn't have auto-increment reset, but we can ensure clean state
    
    // Verify the database is clean
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.like.count(),
      prisma.comment.count(),
    ]);
    
    const totalRecords = counts.reduce((sum, count) => sum + count, 0);
    if (totalRecords > 0) {
      throw new Error(`Database cleanup incomplete. ${totalRecords} records remain.`);
    }
  } catch (error) {
    console.error('Database reset failed:', error);
    throw error;
  }
}

/**
 * Create a unique test identifier to avoid conflicts
 */
export function createTestId(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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