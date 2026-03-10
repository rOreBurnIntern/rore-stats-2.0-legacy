import { NextResponse } from 'next/server';
import { withCors } from '../../../lib/cors';
import { logError } from '../../../lib/log';

type CreateRepositoryRequest = {
  autoInit?: boolean;
  description?: string;
  organization?: string;
  private?: boolean;
};

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';
const MISSING_TOKEN_RESPONSE = { error: 'GitHub token is not configured' };
const INVALID_BODY_RESPONSE = { error: 'Repository name is required' };
const GENERIC_ERROR_RESPONSE = { error: 'Failed to create GitHub repository' };

function getEndpoint(organization?: string) {
  if (organization) {
    return `${GITHUB_API_URL}/orgs/${organization}/repos`;
  }

  return `${GITHUB_API_URL}/user/repos`;
}

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const message = payload instanceof Error ? payload.message : Reflect.get(payload, 'message');
  return typeof message === 'string' && message.length > 0 ? message : null;
}

export async function POST(request: Request) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return withCors(NextResponse.json(MISSING_TOKEN_RESPONSE, { status: 500 }));
  }

  let body: CreateRepositoryRequest & { name?: unknown };

  try {
    body = await request.json();
  } catch {
    return withCors(NextResponse.json(INVALID_BODY_RESPONSE, { status: 400 }));
  }

  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    return withCors(NextResponse.json(INVALID_BODY_RESPONSE, { status: 400 }));
  }

  const name = body.name.trim();
  const organization =
    typeof body.organization === 'string' && body.organization.trim().length > 0
      ? body.organization.trim()
      : undefined;

  try {
    const response = await fetch(getEndpoint(organization), {
      body: JSON.stringify({
        auto_init: body.autoInit ?? true,
        description: body.description?.trim() || undefined,
        name,
        private: body.private ?? true,
      }),
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
      },
      method: 'POST',
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      return withCors(NextResponse.json(
        { error: getErrorMessage(errorPayload) ?? GENERIC_ERROR_RESPONSE.error },
        { status: response.status }
      ));
    }

    const payload = await response.json();
    return withCors(NextResponse.json(payload, { status: 201 }));
  } catch (error) {
    logError('Failed to create GitHub repository', error, {
      organization: organization ?? null,
      route: '/api/github/repositories',
      upstreamUrl: getEndpoint(organization),
    });
    return withCors(NextResponse.json(GENERIC_ERROR_RESPONSE, { status: 500 }));
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}));
}
