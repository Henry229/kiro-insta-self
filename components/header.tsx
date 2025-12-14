import Link from 'next/link';
import { Home, PlusSquare, User, LogIn } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SignOutButton } from '@/components/sign-out-button';

export async function Header() {
  const session = await auth();

  // 로그인한 사용자 정보 가져오기
  let currentUser = null;
  if (session?.user?.email) {
    currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
      },
    });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-xl items-center px-4">
        <div className="flex flex-1 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Instagram</span>
          </Link>

          {/* Desktop Navigation - 중간 크기 이상에서만 표시 */}
          {currentUser && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
              >
                <Home className="h-5 w-5" />
                <span className="hidden lg:inline">홈</span>
              </Link>
              <Link
                href="/upload"
                className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
              >
                <PlusSquare className="h-5 w-5" />
                <span className="hidden lg:inline">업로드</span>
              </Link>
              <Link
                href={`/profile/${currentUser.username}`}
                className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
              >
                <User className="h-5 w-5" />
                <span className="hidden lg:inline">프로필</span>
              </Link>
            </nav>
          )}

          {/* User Profile or Auth Buttons */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <Link
                  href={`/profile/${currentUser.username}`}
                  className="hidden md:flex items-center space-x-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={currentUser.image || undefined}
                      alt={currentUser.name || currentUser.username}
                    />
                    <AvatarFallback>
                      {currentUser.name?.[0]?.toUpperCase() ||
                        currentUser.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm font-medium">
                    {currentUser.username}
                  </span>
                </Link>
                <SignOutButton />
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/signin">
                    <LogIn className="h-4 w-4 mr-2" />
                    로그인
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/signup">회원가입</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
