import assert from 'node:assert/strict';
import test from 'node:test';

import { OPTIONS, POST } from './route';

const originalFetch = global.fetch;
const originalConsoleError = console.error;
const originalGithubToken = process.env.GITHUB_TOKEN;

test.afterEach(() => {
  global.fetch = originalFetch;
  console.error = originalConsoleError;

  if (originalGithubToken === undefined) {
    delete process.env.GITHUB_TOKEN;
    return;
  }

  process.env.GITHUB_TOKEN = originalGithubToken;
});

test('creates a private user repository by default', async () => {
  process.env.GITHUB_TOKEN = 'test-token';

  let requestedUrl = '';
  let requestedInit: RequestInit | undefined;
  global.fetch = async (input, init) => {
    requestedUrl = input.toString();
    requestedInit = init;

    return new Response(
      JSON.stringify({
        full_name: 'openclaw/example-repo',
        html_url: 'https://github.com/openclaw/example-repo',
        private: true,
      }),
      { status: 201 }
    );
  };

  const response = await POST(
    new Request('http://localhost/api/github/repositories', {
      body: JSON.stringify({
        description: ' Test repository ',
        name: '  example-repo  ',
      }),
      method: 'POST',
    })
  );

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    full_name: 'openclaw/example-repo',
    html_url: 'https://github.com/openclaw/example-repo',
    private: true,
  });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'GET, POST, PUT, DELETE, OPTIONS');
  assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
  assert.equal(requestedUrl, 'https://api.github.com/user/repos');
  assert.deepEqual(requestedInit, {
    body: JSON.stringify({
      auto_init: true,
      description: 'Test repository',
      name: 'example-repo',
      private: true,
    }),
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    method: 'POST',
  });
});

test('creates an organization repository when organization is provided', async () => {
  process.env.GITHUB_TOKEN = 'test-token';

  let requestedUrl = '';
  global.fetch = async (input) => {
    requestedUrl = input.toString();

    return new Response(JSON.stringify({ full_name: 'rOreBurnIntern/example-repo' }), { status: 201 });
  };

  const response = await POST(
    new Request('http://localhost/api/github/repositories', {
      body: JSON.stringify({
        autoInit: false,
        name: 'example-repo',
        organization: ' rOreBurnIntern ',
        private: false,
      }),
      method: 'POST',
    })
  );

  assert.equal(response.status, 201);
  assert.equal(requestedUrl, 'https://api.github.com/orgs/rOreBurnIntern/repos');
  assert.deepEqual(await response.json(), { full_name: 'rOreBurnIntern/example-repo' });
});

test('rejects requests without a repository name', async () => {
  process.env.GITHUB_TOKEN = 'test-token';

  const response = await POST(
    new Request('http://localhost/api/github/repositories', {
      body: JSON.stringify({ name: '   ' }),
      method: 'POST',
    })
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Repository name is required' });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
});

test('returns a 500 response when the GitHub token is missing', async () => {
  delete process.env.GITHUB_TOKEN;

  const response = await POST(
    new Request('http://localhost/api/github/repositories', {
      body: JSON.stringify({ name: 'example-repo' }),
      method: 'POST',
    })
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'GitHub token is not configured' });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
});

test('forwards GitHub API validation errors', async () => {
  process.env.GITHUB_TOKEN = 'test-token';

  global.fetch = async () =>
    new Response(JSON.stringify({ message: 'Repository creation failed' }), { status: 422 });

  const response = await POST(
    new Request('http://localhost/api/github/repositories', {
      body: JSON.stringify({ name: 'example-repo' }),
      method: 'POST',
    })
  );

  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), { error: 'Repository creation failed' });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
});

test('returns a 500 response when the GitHub request throws', async () => {
  process.env.GITHUB_TOKEN = 'test-token';
  console.error = () => {};

  global.fetch = async () => {
    throw new Error('network down');
  };

  const response = await POST(
    new Request('http://localhost/api/github/repositories', {
      body: JSON.stringify({ name: 'example-repo' }),
      method: 'POST',
    })
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to create GitHub repository' });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
});

test('returns CORS headers for preflight requests', () => {
  const response = OPTIONS();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'GET, POST, PUT, DELETE, OPTIONS');
  assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
});
