'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUpload } from '@/components/image-upload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

export function UploadForm() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleImageSelect = (file: File, preview: string) => {
    setSelectedFile(file);
    setPreviewUrl(preview);
    setError('');
  };

  const handleImageRemove = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('사진을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // 1단계: 이미지 업로드
      setUploadProgress('이미지 업로드 중...');
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || '이미지 업로드에 실패했습니다.');
      }

      const uploadData = await uploadResponse.json();

      // 2단계: 게시물 생성
      setUploadProgress('게시물 생성 중...');
      const postResponse = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: uploadData.url,
          caption: caption.trim() || null,
        }),
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        throw new Error(errorData.error || '게시물 생성에 실패했습니다.');
      }

      // 3단계: 성공 - 피드로 리디렉션
      setUploadProgress('완료!');
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 이미지 업로드 영역 */}
      <div>
        <Label htmlFor="image" className="text-base font-semibold">
          사진
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          공유할 사진을 선택하세요
        </p>
        <ImageUpload
          onImageSelect={handleImageSelect}
          onImageRemove={handleImageRemove}
          value={previewUrl}
          disabled={isUploading}
        />
      </div>

      {/* 캡션 입력 영역 */}
      <div>
        <Label htmlFor="caption" className="text-base font-semibold">
          설명
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          사진에 대한 설명을 추가하세요 (선택사항)
        </p>
        <Textarea
          id="caption"
          placeholder="이 사진에 대해 이야기해보세요..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={isUploading}
          className="min-h-[120px] resize-none"
          maxLength={2200}
        />
        <p className="text-xs text-muted-foreground mt-2">
          {caption.length}/2200
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 업로드 진행 상태 */}
      {uploadProgress && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>{uploadProgress}</AlertDescription>
        </Alert>
      )}

      {/* 제출 버튼 */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/')}
          disabled={isUploading}
          className="flex-1"
        >
          취소
        </Button>
        <Button
          type="submit"
          disabled={!selectedFile || isUploading}
          className="flex-1"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              업로드 중...
            </>
          ) : (
            '게시하기'
          )}
        </Button>
      </div>
    </form>
  );
}
