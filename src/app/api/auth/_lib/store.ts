import { compare, hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { Plan } from '@/lib/plan/features';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export const SESSION_COOKIE_NAME = 'session_token';
export const SESSION_MAX_AGE_SECONDS = Math.floor(SESSION_TTL_MS / 1000);

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

function normalizeStringArray(items?: string[]): string[] | undefined {
  if (!Array.isArray(items)) return undefined;
  const cleaned = items.map((item) => item.trim()).filter((item) => item.length > 0);
  return cleaned.length > 0 ? cleaned : undefined;
}

function normalizePlan(plan?: string | null): Plan {
  return plan === 'pro' ? 'pro' : 'free';
}

export async function createUser(params: {
  email: string;
  password: string;
  displayName?: string;
  areas?: string[];
  targets?: string[];
}): Promise<
  | {
      user: {
        id: string;
        email: string;
        displayName?: string | null;
        areas?: string[];
        targets?: string[];
      };
    }
  | { error: 'duplicate' }
> {
  const normalizedEmail = params.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { error: 'duplicate' };
  }

  const passwordHash = await hashPassword(params.password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      displayName: params.displayName?.trim() || undefined,
      areas: normalizeStringArray(params.areas) ?? [],
      targets: normalizeStringArray(params.targets) ?? [],
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? undefined,
      areas: user.areas ?? undefined,
      targets: user.targets ?? undefined,
    },
  };
}

export async function validateCredentials(
  email: string,
  password: string
): Promise<{
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  areas?: string[];
  targets?: string[];
} | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    areas: user.areas,
    targets: user.targets,
  };
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
    },
    select: { id: true },
  });
  return session.id;
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await prisma.session.delete({ where: { id: sessionId } });
  } catch (error) {
    // セッションが存在しない場合は無視しつつ、予期せぬエラーを検知できるように記録
    console.error('Failed to delete session:', sessionId, error);
  }
}

async function getSession(sessionId: string): Promise<{ userId: string } | null> {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await deleteSession(sessionId);
    return null;
  }
  return { userId: session.userId };
}

export async function getUserBySession(sessionId: string): Promise<{
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  areas?: string[];
  targets?: string[];
  plan: Plan;
} | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    await deleteSession(sessionId);
    return null;
  }

  const plan = normalizePlan(user.plan);

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    areas: user.areas,
    targets: user.targets,
    plan,
  };
}

export async function updateUserSettings(
  userId: string,
  params: {
    displayName?: string;
    avatarUrl?: string | null;
    areas?: string[];
    targets?: string[];
  }
): Promise<{
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  areas?: string[];
  targets?: string[];
}> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: params.displayName?.trim() || null,
      avatarUrl: params.avatarUrl,
      areas: normalizeStringArray(params.areas) ?? [],
      targets: normalizeStringArray(params.targets) ?? [],
    },
  });

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    areas: user.areas,
    targets: user.targets,
  };
}
