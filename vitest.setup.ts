import '@testing-library/jest-dom'
import { beforeAll, afterAll, beforeEach } from 'vitest'
import { resetDatabase, prisma } from './__tests__/utils/test-db'

// Global setup - run once before all tests
beforeAll(async () => {
  // Ensure database is clean before starting tests
  await resetDatabase()
})

// Global cleanup - run once after all tests
afterAll(async () => {
  // Clean up and disconnect from database
  await resetDatabase()
  await prisma.$disconnect()
})

// Global cleanup before each test to ensure isolation
beforeEach(async () => {
  // Clean database before each test to prevent interference
  await resetDatabase()
})
