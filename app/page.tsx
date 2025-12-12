export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">Simple Instagram</h1>
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
