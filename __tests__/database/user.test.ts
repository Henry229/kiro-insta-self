import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

describe('Task 2.1 - Database Model: Valid user registration creates account', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.comment.deleteMany()
    await prisma.like.deleteMany()
    await prisma.post.deleteMany()
    await prisma.user.deleteMany()
  })

  afterEach(async () => {
    // Clean up database after each test
    await prisma.comment.deleteMany()
    await prisma.like.deleteMany()
    await prisma.post.deleteMany()
    await prisma.user.deleteMany()
  })

  it('should create a new user account with valid email and password', async () => {
    // Arrange
    const validUserData = {
      email: 'test@example.com',
      username: 'testuser',
      password: await bcrypt.hash('password123', 10),
      name: 'Test User',
    }

    // Act
    const createdUser = await prisma.user.create({
      data: validUserData,
    })

    // Assert
    expect(createdUser).toBeDefined()
    expect(createdUser.id).toBeDefined()
    expect(createdUser.email).toBe(validUserData.email)
    expect(createdUser.username).toBe(validUserData.username)
    expect(createdUser.name).toBe(validUserData.name)
    expect(createdUser.password).toBeDefined()
    expect(createdUser.createdAt).toBeInstanceOf(Date)
    expect(createdUser.updatedAt).toBeInstanceOf(Date)
  })

  it('should create a user with optional fields as null', async () => {
    // Arrange
    const minimalUserData = {
      email: 'minimal@example.com',
      username: 'minimaluser',
      password: await bcrypt.hash('password123', 10),
    }

    // Act
    const createdUser = await prisma.user.create({
      data: minimalUserData,
    })

    // Assert
    expect(createdUser).toBeDefined()
    expect(createdUser.id).toBeDefined()
    expect(createdUser.email).toBe(minimalUserData.email)
    expect(createdUser.username).toBe(minimalUserData.username)
    expect(createdUser.name).toBeNull()
    expect(createdUser.image).toBeNull()
  })

  it('should enforce unique email constraint', async () => {
    // Arrange
    const userData = {
      email: 'duplicate@example.com',
      username: 'user1',
      password: await bcrypt.hash('password123', 10),
    }

    await prisma.user.create({ data: userData })

    // Act & Assert
    await expect(
      prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          username: 'user2',
          password: await bcrypt.hash('password456', 10),
        },
      })
    ).rejects.toThrow()
  })

  it('should enforce unique username constraint', async () => {
    // Arrange
    const userData = {
      email: 'user1@example.com',
      username: 'duplicateuser',
      password: await bcrypt.hash('password123', 10),
    }

    await prisma.user.create({ data: userData })

    // Act & Assert
    await expect(
      prisma.user.create({
        data: {
          email: 'user2@example.com',
          username: 'duplicateuser',
          password: await bcrypt.hash('password456', 10),
        },
      })
    ).rejects.toThrow()
  })

  it('should retrieve created user by email', async () => {
    // Arrange
    const userData = {
      email: 'findme@example.com',
      username: 'findmeuser',
      password: await bcrypt.hash('password123', 10),
      name: 'Find Me',
    }

    await prisma.user.create({ data: userData })

    // Act
    const foundUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    // Assert
    expect(foundUser).toBeDefined()
    expect(foundUser?.email).toBe(userData.email)
    expect(foundUser?.username).toBe(userData.username)
    expect(foundUser?.name).toBe(userData.name)
  })

  it('should retrieve created user by username', async () => {
    // Arrange
    const userData = {
      email: 'findme2@example.com',
      username: 'findme2user',
      password: await bcrypt.hash('password123', 10),
    }

    await prisma.user.create({ data: userData })

    // Act
    const foundUser = await prisma.user.findUnique({
      where: { username: userData.username },
    })

    // Assert
    expect(foundUser).toBeDefined()
    expect(foundUser?.email).toBe(userData.email)
    expect(foundUser?.username).toBe(userData.username)
  })

  it('should verify password can be hashed and stored', async () => {
    // Arrange
    const plainPassword = 'mySecurePassword123!'
    const hashedPassword = await bcrypt.hash(plainPassword, 10)
    const userData = {
      email: 'secure@example.com',
      username: 'secureuser',
      password: hashedPassword,
    }

    // Act
    const createdUser = await prisma.user.create({
      data: userData,
    })

    // Assert
    expect(createdUser.password).toBeDefined()
    expect(createdUser.password).not.toBe(plainPassword)

    // Verify password can be compared
    const isPasswordValid = await bcrypt.compare(plainPassword, createdUser.password)
    expect(isPasswordValid).toBe(true)
  })

  it('should automatically set createdAt and updatedAt timestamps', async () => {
    // Arrange
    const userData = {
      email: 'timestamp@example.com',
      username: 'timestampuser',
      password: await bcrypt.hash('password123', 10),
    }

    const beforeCreation = new Date()

    // Act
    const createdUser = await prisma.user.create({
      data: userData,
    })

    const afterCreation = new Date()

    // Assert
    expect(createdUser.createdAt).toBeInstanceOf(Date)
    expect(createdUser.updatedAt).toBeInstanceOf(Date)
    expect(createdUser.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
    expect(createdUser.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
    expect(createdUser.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
    expect(createdUser.updatedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
  })
})
