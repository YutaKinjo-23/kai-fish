import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, getUserBySession } from './api/auth/_lib/store';

export default async function Home() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/login');
  }

  const user = await getUserBySession(sessionId);

  if (!user) {
    redirect('/login');
  }

  redirect('/dashboard');
}
