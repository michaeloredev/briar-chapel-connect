import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserRole } from '@/lib/auth/roles';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ role: 'client' });
  }

  const role = await getUserRole(userId);
  return NextResponse.json({ role });
}
