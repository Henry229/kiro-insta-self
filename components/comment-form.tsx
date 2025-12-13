'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

interface CommentFormProps {
  postId: string;
  isAuthenticated: boolean;
  onCommentAdded?: (comment: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      username: string;
      name: string | null;
      image: string | null;
    };
  }) => void;
}

export function CommentForm({ postId, isAuthenticated, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: trimmedContent }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '댓글 작성에 실패했습니다.');
      }

      const data = await response.json();

      // 입력 필드 초기화
      setContent('');

      // 부모 컴포넌트에 새 댓글 알림
      if (onCommentAdded && data.comment) {
        onCommentAdded(data.comment);
      }

      // 페이지 새로고침 (댓글 수 업데이트를 위해)
      router.refresh();
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      alert(error instanceof Error ? error.message : '댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder={isAuthenticated ? '댓글을 입력하세요...' : '로그인 후 댓글을 작성할 수 있습니다'}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={!isAuthenticated || isSubmitting}
        className="flex-1"
        maxLength={500}
      />
      <Button type="submit" disabled={!isAuthenticated || isSubmitting || !content.trim()}>
        {isSubmitting ? '작성 중...' : '게시'}
      </Button>
    </form>
  );
}
