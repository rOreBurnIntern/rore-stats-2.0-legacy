export async function fetchFromAPI<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`/api${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Revalidate every 30 seconds
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      console.error(`Error fetching ${endpoint}: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`Exception fetching ${endpoint}:`, error);
    return null;
  }
}