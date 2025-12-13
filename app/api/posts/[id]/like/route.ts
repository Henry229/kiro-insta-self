import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// POST /api/posts/[id]/like - 좋아요 토글
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id: postId } = await context.params;

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 게시물 존재 확인
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 기존 좋아요 확인
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    let liked = false;

    if (existingLike) {
      // 이미 좋아요를 누른 경우 -> 좋아요 취소
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      liked = false;
    } else {
      // 좋아요를 누르지 않은 경우 -> 좋아요 추가
      await prisma.like.create({
        data: {
          userId: user.id,
          postId,
        },
      });
      liked = true;
    }

    // 업데이트된 좋아요 수 조회
    const likeCount = await prisma.like.count({
      where: { postId },
    });

    return NextResponse.json({
      success: true,
      liked,
      likeCount,
    });
  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    return NextResponse.json(
      { error: '좋아요 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET /api/posts/[id]/like - 좋아요 상태 조회
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    const { id: postId } = await context.params;

    // 게시물 존재 확인
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 좋아요 수 조회
    const likeCount = await prisma.like.count({
      where: { postId },
    });

    let liked = false;

    // 로그인한 사용자인 경우 좋아요 상태 확인
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        const existingLike = await prisma.like.findUnique({
          where: {
            userId_postId: {
              userId: user.id,
              postId,
            },
          },
        });

        liked = !!existingLike;
      }
    }

    return NextResponse.json({
      likeCount,
      liked,
    });
  } catch (error) {
    console.error('좋아요 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '좋아요 상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
