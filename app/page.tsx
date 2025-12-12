import { auth, signOut } from '@/lib/auth';
import Link from 'next/link';

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Simple Instagram</h1>
          {session ? (
            <div className="flex items-center gap-4">
              <span className="text-sm">Welcome, {session.user?.name || session.user?.email}!</span>
              <form
                action={async () => {
                  'use server';
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg mb-4">간단한 Instagram 클론 애플리케이션에 오신 것을 환영합니다!</p>
        <p className="text-sm text-gray-600">
          사진을 공유하고, 좋아요를 누르고, 댓글을 남기는 소셜 미디어 경험을 즐겨보세요.
        </p>
      </div>
    </main>
  );
}
