import { connection } from 'next/server';

const MISSING_REQUEST_SCOPE_ERROR = 'outside a request scope';

export async function waitForRequest() {
  try {
    await connection();
  } catch (error) {
    // Unit tests render the page without Next's request context.
    if (error instanceof Error && error.message.includes(MISSING_REQUEST_SCOPE_ERROR)) {
      return;
    }

    throw error;
  }
}
