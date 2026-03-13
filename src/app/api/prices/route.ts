import { NextResponse } from 'next/server';
import { withCors } from '../../lib/cors';
import { getPricesProxyResponse } from './proxy';

export async function GET() {
  const { body, status } = await getPricesProxyResponse();
  return withCors(NextResponse.json(body, { status }));
}

export function OPTIONS() {
  return withCors(NextResponse.json({}));
}
