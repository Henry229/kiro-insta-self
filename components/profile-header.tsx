import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface ProfileHeaderProps {
  user: {
    username: string;
    name: string | null;
    image: string | null;
    postCount: number;
  };
  isOwnProfile: boolean;
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
      {/* 프로필 이미지 */}
      <div className="flex-shrink-0">
        <Avatar className="h-32 w-32 md:h-40 md:w-40">
          <AvatarImage src={user.image || undefined} alt={user.username} />
          <AvatarFallback className="text-4xl">
            {user.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* 프로필 정보 */}
      <div className="flex-1 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
          <h1 className="text-2xl font-semibold">{user.username}</h1>
          {isOwnProfile && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              프로필 편집
            </Button>
          )}
        </div>

        <div className="mb-4">
          <div className="flex gap-8 justify-center md:justify-start">
            <div className="text-center md:text-left">
              <span className="font-semibold">{user.postCount}</span>
              <span className="text-muted-foreground ml-1">게시물</span>
            </div>
          </div>
        </div>

        {user.name && (
          <div className="font-semibold mb-1">{user.name}</div>
        )}
      </div>
    </div>
  );
}
