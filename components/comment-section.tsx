'use client';

import { useState } from 'react';
import { CommentList } from '@/components/comment-list';
import { CommentForm } from '@/components/comment-form';
import { Button } from '@/components/ui/button';

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
}

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
  initialCommentCount: number;
  isAuthenticated: boolean;
  currentUserId?: string;
}

export function CommentSection({
  postId,
  postAuthorId,
  initialCommentCount,
  isAuthenticated,
  currentUserId,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (!response.ok) {
        throw new Error('댓글 로드 실패');
      }
      const data = await response.json();
      setComments(data.comments);
      setIsExpanded(true);
    } catch (error) {
      console.error('댓글 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentAdded = async (newComment: Comment) => {
    // 댓글 목록이 아직 로드되지 않았다면 먼저 로드
    if (!isExpanded && initialCommentCount > 0) {
      await loadComments();
    }
    // 새 댓글 추가
    setComments((prev) => [...prev, newComment]);
    // 댓글 목록 표시
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  return (
    <div className="space-y-3 border-t pt-3">
      {/* 댓글 보기 버튼 */}
      {initialCommentCount > 0 && !isExpanded && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-auto p-0"
          onClick={loadComments}
          disabled={isLoading}
        >
          {isLoading ? '로딩 중...' : `댓글 ${initialCommentCount}개 모두 보기`}
        </Button>
      )}

      {/* 댓글 목록 */}
      {isExpanded && (
        <CommentList
          initialComments={comments}
          currentUserId={currentUserId}
          postAuthorId={postAuthorId}
        />
      )}

      {/* 댓글 작성 폼 */}
      <CommentForm
        postId={postId}
        isAuthenticated={isAuthenticated}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
}
