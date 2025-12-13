'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';

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

interface CommentListProps {
  initialComments: Comment[];
  currentUserId?: string;
  postAuthorId: string;
}

export function CommentList({
  initialComments,
  currentUserId,
  postAuthorId,
}: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    setDeletingId(commentId);

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('댓글 삭제에 실패했습니다.');
      }

      // 댓글 목록에서 제거
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const canDeleteComment = (comment: Comment) => {
    if (!currentUserId) return false;
    // 댓글 작성자 또는 게시물 작성자는 댓글 삭제 가능
    return comment.user.id === currentUserId || postAuthorId === currentUserId;
  };

  if (comments.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">아직 댓글이 없습니다.</div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => {
        const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
          addSuffix: true,
          locale: ko,
        });

        return (
          <div key={comment.id} className="flex gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage
                src={comment.user.image || undefined}
                alt={comment.user.username}
              />
              <AvatarFallback>{comment.user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold mr-2">{comment.user.username}</span>
                    <span className="break-words">{comment.content}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                </div>

                {canDeleteComment(comment) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    aria-label="댓글 삭제"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
