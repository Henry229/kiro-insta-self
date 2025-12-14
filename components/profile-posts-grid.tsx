'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';
import { PostDetailModal } from './post-detail-modal';

interface Post {
  id: string;
  image: string;
  caption: string | null;
  createdAt: Date;
  _count: {
    likes: number;
    comments: number;
  };
}

interface ProfilePostsGridProps {
  posts: Post[];
  username: string;
  currentUserId?: string;
}

export function ProfilePostsGrid({ posts, username, currentUserId }: ProfilePostsGridProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="text-6xl mb-4">📷</div>
        <h2 className="text-2xl font-semibold mb-2">아직 게시물이 없습니다</h2>
        <p className="text-muted-foreground">
          {username}님의 첫 번째 게시물을 기다리고 있어요!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="relative aspect-square cursor-pointer group"
            onClick={() => setSelectedPostId(post.id)}
          >
            <Image
              src={post.image}
              alt={post.caption || '게시물 이미지'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 25vw"
            />

            {/* 호버 오버레이 */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-white">
                <Heart className="h-6 w-6 fill-white" />
                <span className="font-semibold">{post._count.likes}</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <MessageCircle className="h-6 w-6 fill-white" />
                <span className="font-semibold">{post._count.comments}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 게시물 상세 모달 */}
      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
