import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// POST /api/posts/[id]/comments - 댓글 생성
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id: postId } = await context.params;
    const body = await request.json();
    const { content } = body;

    // 댓글 내용 검증
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '댓글 내용이 필요합니다.' }, { status: 400 });
    }

    // 빈 댓글 및 공백만 있는 댓글 거부
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: '빈 댓글은 작성할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 게시물 존재 확인
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: '게시물을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 댓글 생성
    const comment = await prisma.comment.create({
      data: {
        content: trimmedContent,
        userId: user.id,
        postId,
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
      },
    });

    return NextResponse.json(
      {
        success: true,
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('댓글 생성 오류:', error);
    return NextResponse.json(
      { error: '댓글 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET /api/posts/[id]/comments - 댓글 목록 조회
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: postId } = await context.params;

    // 게시물 존재 확인
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: '게시물을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 댓글 목록 조회 (시간순 정렬)
    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: {
        createdAt: 'asc', // 시간순 정렬 (오래된 것부터)
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
      },
    });

    return NextResponse.json({
      comments,
      count: comments.length,
    });
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    return NextResponse.json(
      { error: '댓글 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
