'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // 세션에서 사용자명 가져오기
    const fetchUsername = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/user/me');
          if (response.ok) {
            const data = await response.json();
            setUsername(data.username);
          }
        } catch (error) {
          console.error('Failed to fetch username:', error);
        }
      } else {
        setUsername(null);
      }
    };

    fetchUsername();
  }, [session]);

  // 인증되지 않은 사용자에게는 모바일 네비게이션 표시 안 함
  if (!session) {
    return null;
  }

  const navItems = [
    {
      title: '홈',
      href: '/',
      icon: Home,
    },
    {
      title: '업로드',
      href: '/upload',
      icon: PlusSquare,
    },
    {
      title: '프로필',
      href: username ? `/profile/${username}` : '/profile',
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-6 w-6', isActive && 'fill-current')} />
              <span className="text-xs mt-1">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
