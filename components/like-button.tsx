'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  isAuthenticated: boolean;
}

export function LikeButton({
  postId,
  initialLiked,
  initialLikeCount,
  isAuthenticated,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLike = async () => {
    // 로그인하지 않은 경우 로그인 페이지로 리디렉션
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    // 낙관적 업데이트 (Optimistic Update)
    const previousLiked = liked;
    const previousLikeCount = likeCount;

    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('좋아요 처리에 실패했습니다.');
      }

      const data = await response.json();

      // 서버 응답으로 상태 동기화
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (error) {
      console.error('좋아요 오류:', error);

      // 오류 발생 시 이전 상태로 롤백
      setLiked(previousLiked);
      setLikeCount(previousLikeCount);

      // 사용자에게 오류 알림 (선택사항)
      alert('좋아요 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 gap-1"
        onClick={handleLike}
        disabled={isLoading}
        aria-label={liked ? '좋아요 취소' : '좋아요'}
      >
        <Heart
          className={`h-5 w-5 transition-colors ${
            liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
          }`}
        />
        <span className="text-sm font-medium">{likeCount}</span>
      </Button>
    </div>
  );
}
