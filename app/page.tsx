import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Feed } from '@/components/feed';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();

  // 로그인하지 않은 사용자는 로그인 페이지로 리디렉션
  if (!session) {
    redirect('/auth/signin');
  }

  // 초기 게시물 로드 (최신순, 10개)
  const posts = await prisma.post.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  // 다음 커서 계산
  const nextCursor = posts.length === 10 ? posts[posts.length - 1].id : null;

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">피드</h1>
        <p className="text-muted-foreground">
          최신 게시물을 확인하고 소통하세요
        </p>
      </div>

      <Feed initialPosts={posts} initialCursor={nextCursor} />
    </main>
  );
}
