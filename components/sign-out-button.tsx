'use client';

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      className="hidden md:flex"
    >
      <LogOut className="h-4 w-4 mr-2" />
      <span className="hidden lg:inline">로그아웃</span>
    </Button>
  );
}
