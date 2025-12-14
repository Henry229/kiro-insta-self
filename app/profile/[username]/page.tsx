import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ProfileHeader } from '@/components/profile-header';
import { ProfilePostsGrid } from '@/components/profile-posts-grid';

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const session = await auth();

  // 프로필 사용자 조회
  const profileUser = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  if (!profileUser) {
    notFound();
  }

  // 사용자 게시물 조회 (최신순)
  const posts = await prisma.post.findMany({
    where: { userId: profileUser.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      image: true,
      caption: true,
      createdAt: true,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  // 현재 로그인한 사용자 확인
  let currentUserId: string | undefined;
  if (session?.user?.email) {
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    currentUserId = currentUser?.id;
  }

  const isOwnProfile = currentUserId === profileUser.id;

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <ProfileHeader
        user={{
          username: profileUser.username,
          name: profileUser.name,
          image: profileUser.image,
          postCount: profileUser._count.posts,
        }}
        isOwnProfile={isOwnProfile}
      />

      <div className="mt-8">
        <ProfilePostsGrid
          posts={posts}
          username={profileUser.username}
          currentUserId={currentUserId}
        />
      </div>
    </main>
  );
}
