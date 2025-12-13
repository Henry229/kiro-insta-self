import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// DELETE /api/comments/[id] - 댓글 삭제
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id: commentId } = await context.params;

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 댓글 조회
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 확인: 댓글 작성자 또는 게시물 작성자만 삭제 가능
    if (comment.userId !== user.id && comment.post.userId !== user.id) {
      return NextResponse.json(
        { error: '댓글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 댓글 삭제
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      message: '댓글이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    return NextResponse.json(
      { error: '댓글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
