import { NextResponse } from 'next/server';
import { withCors } from '../../lib/cors';
import { getExploreProxyResponse } from './proxy';

export async function GET(request: Request) {
  const { body, status } = await getExploreProxyResponse(new URL(request.url).searchParams);
  return withCors(NextResponse.json(body, { status }));
}

export function OPTIONS() {
  return withCors(NextResponse.json({}));
}
