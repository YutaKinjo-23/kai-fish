import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'session_token';
const PUBLIC_PATHS = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的/ビルトインパスは除外
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/kai-wave.svg'
  ) {
    return NextResponse.next();
  }

  // 認証不要ページ
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // セッション cookie 判定
  const hasSession = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname || '/');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 画像など静的アセットは除外し、それ以外を対象にする
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|kai-wave.svg).*)'],
};
