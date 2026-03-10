import { NextResponse } from 'next/server';
import { withCors } from '../../lib/cors';
import { getMotherlodeProxyResponse } from './proxy';

export async function GET() {
  const { body, status } = await getMotherlodeProxyResponse();
  return withCors(NextResponse.json(body, { status }));
}

export function OPTIONS() {
  return withCors(NextResponse.json({}));
}
