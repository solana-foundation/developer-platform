const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function confirmCliAuth(
  token: string,
  accessToken: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/cli-auth/confirm/${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to confirm CLI authentication');
  }
}
