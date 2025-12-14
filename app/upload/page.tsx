import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UploadForm } from '@/components/upload-form';

export default async function UploadPage() {
  const session = await auth();

  // 로그인하지 않은 사용자는 로그인 페이지로 리디렉션
  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">새 게시물 만들기</h1>
        <p className="text-muted-foreground">
          사진을 업로드하고 설명을 추가하세요
        </p>
      </div>

      <UploadForm />
    </main>
  );
}
