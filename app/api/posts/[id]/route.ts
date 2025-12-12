import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/posts/[id] - 특정 게시물 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        comments: {
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
          orderBy: {
            createdAt: 'asc',
          },
        },
        likes: session?.user?.email
          ? {
              where: {
                user: {
                  email: session.user.email,
                },
              },
            }
          : false,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('게시물 조회 오류:', error);
    return NextResponse.json(
      { error: '게시물 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH /api/posts/[id] - 게시물 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { caption } = body;

    // 게시물 조회
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 소유자 확인
    if (post.user.email !== session.user.email) {
      return NextResponse.json(
        { error: '게시물을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 게시물 수정
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        caption: caption || null,
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

    return NextResponse.json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    console.error('게시물 수정 오류:', error);
    return NextResponse.json(
      { error: '게시물 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - 게시물 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 게시물 조회
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 소유자 확인
    if (post.user.email !== session.user.email) {
      return NextResponse.json(
        { error: '게시물을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 게시물 삭제 (Cascade로 연관된 likes, comments도 자동 삭제됨)
    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '게시물이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('게시물 삭제 오류:', error);
    return NextResponse.json(
      { error: '게시물 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
