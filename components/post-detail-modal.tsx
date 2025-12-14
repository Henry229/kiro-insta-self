'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LikeButton } from '@/components/like-button';
import { CommentSection } from '@/components/comment-section';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

interface PostDetail {
  id: string;
  image: string;
  caption: string | null;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
  liked: boolean;
  _count: {
    likes: number;
    comments: number;
  };
}

interface PostDetailModalProps {
  postId: string;
  onClose: () => void;
  currentUserId?: string;
}

export function PostDetailModal({ postId, onClose, currentUserId }: PostDetailModalProps) {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/posts/${postId}`);

        if (!response.ok) {
          throw new Error('게시물을 불러오지 못했습니다.');
        }

        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {post && (
          <div className="grid md:grid-cols-2 h-full">
            {/* 이미지 영역 */}
            <div className="relative bg-black">
              <Image
                src={post.image}
                alt={post.caption || '게시물 이미지'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>

            {/* 내용 영역 */}
            <div className="flex flex-col h-full">
              {/* 헤더 */}
              <div className="flex items-center gap-3 p-4 border-b">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.user.image || undefined} alt={post.user.username} />
                  <AvatarFallback>{post.user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{post.user.username}</p>
                  <p className="text-xs text-muted-foreground">{post.user.name}</p>
                </div>
              </div>

              {/* 캡션 */}
              {post.caption && (
                <div className="p-4 border-b">
                  <p className="text-sm">
                    <span className="font-semibold mr-2">{post.user.username}</span>
                    {post.caption}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </p>
                </div>
              )}

              {/* 댓글 섹션 - 스크롤 가능 영역 */}
              <div className="flex-1 overflow-y-auto p-4">
                <CommentSection
                  postId={post.id}
                  postAuthorId={post.user.id}
                  initialCommentCount={post._count.comments}
                  isAuthenticated={true}
                  currentUserId={currentUserId}
                />
              </div>

              {/* 좋아요 및 액션 */}
              <div className="border-t p-4">
                <div className="flex items-center gap-4 mb-2">
                  <LikeButton
                    postId={post.id}
                    initialLiked={post.liked}
                    initialLikeCount={post._count.likes}
                    isAuthenticated={true}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
