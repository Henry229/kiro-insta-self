/**
 * Property-Based Tests for File Upload
 *
 * **Feature: simple-instagram, Property 5: Valid image upload shows preview**
 * **Validates: Requirements 2.1**
 *
 * **Feature: simple-instagram, Property 7: Invalid file upload rejected**
 * **Validates: Requirements 2.3**
 */

import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/upload/route';
import { NextRequest } from 'next/server';
import * as fc from 'fast-check';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('Property-Based Tests: File Upload', () => {
  const uploadsDir = join(process.cwd(), 'public', 'uploads');

  // Helper function to create mock file
  const createMockFile = (
    name: string,
    type: string,
    size: number
  ): File => {
    const buffer = Buffer.alloc(size);
    const blob = new Blob([buffer], { type });
    return new File([blob], name, { type });
  };

  // Helper function to create mock request
  const createMockRequest = (file: File): NextRequest => {
    const formData = new FormData();
    formData.append('file', file);

    return new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });
  };

  // Cleanup helper
  const cleanupFile = (fileName: string) => {
    const filePath = join(uploadsDir, fileName);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  };

  describe('Property 5: Valid image upload shows preview', () => {
    it('should successfully upload any valid image file and return preview URL', async () => {
      /**
       * **Feature: simple-instagram, Property 5: Valid image upload shows preview**
       * **Validates: Requirements 2.1**
       *
       * Property: For any valid image file (JPEG, PNG, GIF, WebP) within size limits,
       * the upload should succeed and return a preview URL
       */

      const validImageTypes = fc.constantFrom(
        { ext: 'jpg', mime: 'image/jpeg' },
        { ext: 'jpeg', mime: 'image/jpeg' },
        { ext: 'png', mime: 'image/png' },
        { ext: 'gif', mime: 'image/gif' },
        { ext: 'webp', mime: 'image/webp' }
      );

      const validFileName = fc
        .string({ minLength: 1, maxLength: 20 })
        .map((s) => s.replace(/[^a-zA-Z0-9]/g, '_') || 'file');

      const validFileSize = fc.integer({ min: 1, max: 5 * 1024 * 1024 }); // 1 byte to 5MB

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            imageType: validImageTypes,
            fileName: validFileName,
            size: validFileSize,
          }),
          async ({ imageType, fileName, size }) => {
            const fullFileName = `${fileName}.${imageType.ext}`;
            const file = createMockFile(fullFileName, imageType.mime, size);
            const request = createMockRequest(file);

            // Act: Upload the file
            const response = await POST(request);
            const data = await response.json();

            // Assert: Upload should succeed
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.url).toBeDefined();
            expect(data.url).toMatch(/^\/uploads\/.+/);
            expect(data.fileName).toBeDefined();
            expect(data.type).toBe(imageType.mime);
            expect(data.size).toBe(size);

            // Verify file URL format
            expect(data.url).toMatch(
              new RegExp(`^/uploads/\\d+-${fileName.replace(/[^a-zA-Z0-9]/g, '_')}\\.${imageType.ext}$`)
            );

            // Verify file was actually created
            const filePath = join(uploadsDir, data.fileName);
            expect(existsSync(filePath)).toBe(true);

            // Cleanup
            cleanupFile(data.fileName);
          }
        ),
        { numRuns: 20 }
      );
    }, 15000);

    it('should handle edge cases in valid image uploads', async () => {
      /**
       * **Feature: simple-instagram, Property 5: Valid image upload shows preview**
       * **Validates: Requirements 2.1**
       *
       * Property: Edge cases of valid images should still upload successfully
       */

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Edge case: very small file
            size: fc.constantFrom(1, 100, 1024),
            imageType: fc.constantFrom(
              { ext: 'jpg', mime: 'image/jpeg' },
              { ext: 'png', mime: 'image/png' }
            ),
          }),
          async ({ size, imageType }) => {
            const file = createMockFile(
              `edge_test.${imageType.ext}`,
              imageType.mime,
              size
            );
            const request = createMockRequest(file);

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.url).toBeDefined();
            expect(data.size).toBe(size);

            // Cleanup
            cleanupFile(data.fileName);
          }
        ),
        { numRuns: 10 }
      );
    }, 10000);

    it('should upload files with maximum allowed size', async () => {
      /**
       * **Feature: simple-instagram, Property 5: Valid image upload shows preview**
       * **Validates: Requirements 2.1**
       *
       * Property: Files at the maximum allowed size should upload successfully
       */

      const maxSize = 5 * 1024 * 1024; // 5MB

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            { ext: 'jpg', mime: 'image/jpeg' },
            { ext: 'png', mime: 'image/png' }
          ),
          async (imageType) => {
            const file = createMockFile(
              `max_size.${imageType.ext}`,
              imageType.mime,
              maxSize
            );
            const request = createMockRequest(file);

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.size).toBe(maxSize);

            // Cleanup
            cleanupFile(data.fileName);
          }
        ),
        { numRuns: 5 }
      );
    }, 10000);
  });

  describe('Property 7: Invalid file upload rejected', () => {
    it('should reject any file with unsupported MIME type', async () => {
      /**
       * **Feature: simple-instagram, Property 7: Invalid file upload rejected**
       * **Validates: Requirements 2.3**
       *
       * Property: For any file with an unsupported MIME type, the upload should
       * be rejected with an appropriate error message
       */

      const invalidMimeTypes = fc.constantFrom(
        { ext: 'txt', mime: 'text/plain' },
        { ext: 'pdf', mime: 'application/pdf' },
        { ext: 'doc', mime: 'application/msword' },
        { ext: 'zip', mime: 'application/zip' },
        { ext: 'mp4', mime: 'video/mp4' },
        { ext: 'mp3', mime: 'audio/mpeg' },
        { ext: 'svg', mime: 'image/svg+xml' },
        { ext: 'bmp', mime: 'image/bmp' },
        { ext: 'tiff', mime: 'image/tiff' }
      );

      const fileName = fc
        .string({ minLength: 1, maxLength: 15 })
        .map((s) => s.replace(/[^a-zA-Z0-9]/g, '_') || 'file');

      const fileSize = fc.integer({ min: 100, max: 1024 * 1024 }); // 100 bytes to 1MB

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            invalidType: invalidMimeTypes,
            fileName: fileName,
            size: fileSize,
          }),
          async ({ invalidType, fileName, size }) => {
            const file = createMockFile(
              `${fileName}.${invalidType.ext}`,
              invalidType.mime,
              size
            );
            const request = createMockRequest(file);

            // Act: Attempt to upload invalid file
            const response = await POST(request);
            const data = await response.json();

            // Assert: Upload should be rejected
            expect(response.status).toBe(400);
            expect(data.success).toBeUndefined();
            expect(data.error).toBeDefined();
            expect(data.error).toContain('지원되지 않는 파일 형식');
            expect(data.url).toBeUndefined();

            // Verify no file was created
            // Since upload failed, no fileName should exist
            expect(data.fileName).toBeUndefined();
          }
        ),
        { numRuns: 20 }
      );
    }, 15000);

    it('should reject any file exceeding size limit', async () => {
      /**
       * **Feature: simple-instagram, Property 7: Invalid file upload rejected**
       * **Validates: Requirements 2.3**
       *
       * Property: For any file exceeding the 5MB size limit, the upload should
       * be rejected with an appropriate error message
       */

      const oversizedFile = fc.integer({
        min: 5 * 1024 * 1024 + 1, // 5MB + 1 byte
        max: 10 * 1024 * 1024, // 10MB
      });

      const validImageTypes = fc.constantFrom(
        { ext: 'jpg', mime: 'image/jpeg' },
        { ext: 'png', mime: 'image/png' },
        { ext: 'gif', mime: 'image/gif' }
      );

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            size: oversizedFile,
            imageType: validImageTypes,
          }),
          async ({ size, imageType }) => {
            const file = createMockFile(
              `large_file.${imageType.ext}`,
              imageType.mime,
              size
            );
            const request = createMockRequest(file);

            // Act: Attempt to upload oversized file
            const response = await POST(request);
            const data = await response.json();

            // Assert: Upload should be rejected
            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
            expect(data.error).toContain('5MB를 초과');
            expect(data.url).toBeUndefined();
            expect(data.fileName).toBeUndefined();
          }
        ),
        { numRuns: 10 }
      );
    }, 10000);

    it('should handle combination of invalid file properties', async () => {
      /**
       * **Feature: simple-instagram, Property 7: Invalid file upload rejected**
       * **Validates: Requirements 2.3**
       *
       * Property: Files with multiple invalid properties should be rejected
       */

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Invalid type AND large size
            invalidType: fc.constantFrom(
              { ext: 'txt', mime: 'text/plain' },
              { ext: 'pdf', mime: 'application/pdf' }
            ),
            size: fc.integer({
              min: 6 * 1024 * 1024,
              max: 10 * 1024 * 1024,
            }),
          }),
          async ({ invalidType, size }) => {
            const file = createMockFile(
              `invalid.${invalidType.ext}`,
              invalidType.mime,
              size
            );
            const request = createMockRequest(file);

            const response = await POST(request);
            const data = await response.json();

            // Should be rejected (type check comes first in implementation)
            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
            expect(data.url).toBeUndefined();
          }
        ),
        { numRuns: 5 }
      );
    }, 10000);
  });
});
