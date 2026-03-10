import { NextResponse } from 'next/server';
import { withCors } from '../../lib/cors';

export async function GET() {
  return withCors(NextResponse.json({ status: 'ok', message: 'API v2 is ready' }, { status: 200 }));
}

export function OPTIONS() {
  return withCors(NextResponse.json({}));
}
