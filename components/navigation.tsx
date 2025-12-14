'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
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

  const navItems = [
    {
      title: '홈',
      href: '/',
    },
    {
      title: '업로드',
      href: '/upload',
    },
    {
      title: '프로필',
      href: username ? `/profile/${username}` : '/profile',
    },
  ];

  return (
    <nav className={cn('flex items-center space-x-4 lg:space-x-6', className)}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === item.href
              ? 'text-foreground'
              : 'text-muted-foreground'
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
