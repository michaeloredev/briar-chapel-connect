import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const Schema = z.object({
  category: z.string().min(1),
  service: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().optional().default(''),
  details: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  contact_email: z.string().email().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = Schema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const provider = await prisma.provider.create({
      data: {
        categorySlug: data.category,
        serviceSlug: data.service,
        name: data.name,
        summary: data.summary || null,
        details: data.details || null,
        tags: data.tags ?? [],
        contactEmail: data.contact_email ?? null,
        contactPhone: data.contact_phone ?? null,
      },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (err: any) {
    console.error('Create provider error:', err);
    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 }
    );
  }
}
