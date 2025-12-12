import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/posts - 게시물 생성
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { image, caption } = body;

    if (!image) {
      return NextResponse.json(
        { error: '이미지가 필요합니다.' },
        { status: 400 }
      );
    }

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

    // 게시물 생성
    const post = await prisma.post.create({
      data: {
        image,
        caption: caption || null,
        userId: user.id,
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

    return NextResponse.json(
      {
        success: true,
        post,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('게시물 생성 오류:', error);
    return NextResponse.json(
      { error: '게시물 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET /api/posts - 게시물 목록 조회 (최신순)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = searchParams.get('limit') || '10';
    const cursor = searchParams.get('cursor');
    const userId = searchParams.get('userId');

    // Validate and clamp limit parameter
    let limit = parseInt(rawLimit, 10);
    if (isNaN(limit) || limit < 1) {
      limit = 10; // Default to 10 if invalid
    } else if (limit > 100) {
      limit = 100; // Cap at 100 to prevent excessive queries
    }

    // 쿼리 조건 설정
    const where = userId ? { userId } : {};

    // 커서 기반 페이지네이션
    const posts = await prisma.post.findMany({
      where,
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
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

    // 다음 페이지 커서
    const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;

    return NextResponse.json({
      posts,
      nextCursor,
    });
  } catch (error) {
    console.error('게시물 조회 오류:', error);
    return NextResponse.json(
      { error: '게시물 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
