'use client';

import { useState, useCallback } from 'react';
import { PostCard } from './post-card';
import { Button } from './ui/button';

interface Post {
  id: string;
  image: string;
  caption: string | null;
  createdAt: Date;
  liked: boolean;
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

interface FeedProps {
  initialPosts: Post[];
  initialCursor: string | null;
  isAuthenticated: boolean;
}

export function Feed({ initialPosts, initialCursor, isAuthenticated }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialCursor !== null);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/posts?cursor=${cursor}&limit=10`);
      const data = await response.json();

      if (data.posts && Array.isArray(data.posts)) {
        setPosts((prev) => [...prev, ...data.posts]);
        setCursor(data.nextCursor);
        setHasMore(data.nextCursor !== null);
      }
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  // 빈 피드 상태
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-6xl mb-4">📷</div>
        <h2 className="text-2xl font-semibold mb-2">아직 게시물이 없습니다</h2>
        <p className="text-muted-foreground mb-4">
          첫 번째 게시물을 공유하여 피드를 시작하세요!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} isAuthenticated={isAuthenticated} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            size="lg"
          >
            {loading ? '로딩 중...' : '더 보기'}
          </Button>
        </div>
      )}
    </div>
  );
}
