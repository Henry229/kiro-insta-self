import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/upload/route';
import { NextRequest } from 'next/server';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('Image Upload API', () => {
  const uploadsDir = join(process.cwd(), 'public', 'uploads');

  const createMockFile = (
    name: string,
    type: string,
    size: number
  ): File => {
    const buffer = Buffer.alloc(size);
    const blob = new Blob([buffer], { type });
    return new File([blob], name, { type });
  };

  const createMockRequest = (file: File): NextRequest => {
    const formData = new FormData();
    formData.append('file', file);

    return new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });
  };

  describe('Valid image uploads', () => {
    it('should successfully upload a JPEG image', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.url).toMatch(/^\/uploads\/.+\.jpg$/);
      expect(data.fileName).toBeTruthy();
      expect(data.type).toBe('image/jpeg');

      // 파일이 실제로 생성되었는지 확인
      const filePath = join(uploadsDir, data.fileName);
      expect(existsSync(filePath)).toBe(true);

      // 테스트 후 파일 삭제
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    });

    it('should successfully upload a PNG image', async () => {
      const file = createMockFile('test.png', 'image/png', 2048);
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.url).toMatch(/^\/uploads\/.+\.png$/);

      const filePath = join(uploadsDir, data.fileName);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    });

    it('should generate unique filenames for uploads', async () => {
      const file1 = createMockFile('test.jpg', 'image/jpeg', 1024);
      const file2 = createMockFile('test.jpg', 'image/jpeg', 1024);

      const request1 = createMockRequest(file1);
      const request2 = createMockRequest(file2);

      const response1 = await POST(request1);
      const data1 = await response1.json();

      // 약간의 지연을 추가하여 타임스탬프가 다르도록 함
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(data1.fileName).not.toBe(data2.fileName);

      const filePath1 = join(uploadsDir, data1.fileName);
      const filePath2 = join(uploadsDir, data2.fileName);

      if (existsSync(filePath1)) unlinkSync(filePath1);
      if (existsSync(filePath2)) unlinkSync(filePath2);
    });
  });

  describe('Invalid file uploads', () => {
    it('should reject file with unsupported type', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024);
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('지원되지 않는 파일 형식');
    });

    it('should reject file exceeding size limit', async () => {
      const file = createMockFile(
        'large.jpg',
        'image/jpeg',
        6 * 1024 * 1024 // 6MB
      );
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('5MB를 초과');
    });

    it('should reject request without file', async () => {
      const formData = new FormData();
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('파일이 제공되지 않았습니다');
    });
  });

  describe('Supported file types', () => {
    const supportedTypes = [
      { ext: 'jpg', mime: 'image/jpeg' },
      { ext: 'jpeg', mime: 'image/jpeg' },
      { ext: 'png', mime: 'image/png' },
      { ext: 'gif', mime: 'image/gif' },
      { ext: 'webp', mime: 'image/webp' },
    ];

    supportedTypes.forEach(({ ext, mime }) => {
      it(`should accept ${ext.toUpperCase()} files`, async () => {
        const file = createMockFile(`test.${ext}`, mime, 1024);
        const request = createMockRequest(file);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        const filePath = join(uploadsDir, data.fileName);
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      });
    });
  });
});
