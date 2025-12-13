import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Post {
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
  _count: {
    likes: number;
    comments: number;
  };
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader className="flex flex-row items-center gap-3 p-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={post.user.image || undefined} alt={post.user.username} />
          <AvatarFallback>{post.user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="font-semibold text-sm">{post.user.username}</p>
          <p className="text-xs text-muted-foreground">{post.user.name}</p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative aspect-square w-full">
          <Image
            src={post.image}
            alt={post.caption || '게시물 이미지'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-2 p-4">
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">좋아요</span>
            <span className="text-sm text-muted-foreground">{post._count.likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">댓글</span>
            <span className="text-sm text-muted-foreground">{post._count.comments}</span>
          </div>
        </div>

        {post.caption && (
          <div className="w-full">
            <p className="text-sm">
              <span className="font-semibold mr-2">{post.user.username}</span>
              {post.caption}
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </CardFooter>
    </Card>
  );
}
