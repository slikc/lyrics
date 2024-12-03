import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

interface AuthData {
  clientId: string | null;
  accessToken: string | null;
  expires: number | null;
}

interface SpotifySession {
  accessToken: string;
  clientId: string;
  accessTokenExpirationTimestampMs: number;
}

// typed auth data
const AUTH_STATE: AuthData = {
  clientId: null,
  accessToken: null,
  expires: null,
};

// tailwind merger
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// regex to get free token
const SESSION_REGEX =
  /<script id="session" data-testid="session" type="application\/json">({.*})<\/script>/;

// error for auth
class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * authes with Spotify and returns auth data
 * @throws {AuthError} if authentication fails
 * @returns {Promise<AuthData>} authentication data
 */
async function auth(): Promise<AuthData> {
  // check if creds are valid
  if (
    AUTH_STATE.accessToken &&
    AUTH_STATE.expires &&
    AUTH_STATE.expires > Date.now()
  ) {
    console.log("USED CACHE");
    return { ...AUTH_STATE }; // return a copy to stop editing
  }

  try {
    console.log("REFRESHING");
    const response = await fetch("https://open.spotify.com/search");
    const text = await response.text();
    const match = text.match(SESSION_REGEX);

    if (!match?.[1]) {
      throw new AuthError("Failed to extract session data");
    }

    const sessionData = JSON.parse(match[1]) as SpotifySession;

    Object.assign(AUTH_STATE, {
      accessToken: sessionData.accessToken,
      clientId: sessionData.clientId,
      expires: sessionData.accessTokenExpirationTimestampMs,
    });

    return { ...AUTH_STATE };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new AuthError(`Authentication failed: ${message}`);
  }
}

/**
 * searches spotify with the given query
 * @param query search query string
 * @throws {AuthError} if authentication fails
 */
export async function search(query: string): Promise<any> {
  if (!query.trim()) {
    throw new Error("Search query cannot be empty");
  }

  const authData = await auth();

  console.log(`Searching for: ${query}`);

  console.log("Authenticated with:", authData);

  // url encode the query
  query = encodeURIComponent(query);

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&market=gb&limit=5&type=track`,
    {
      headers: {
        Authorization: `Bearer ${authData.accessToken}`,
      },
    }
  );

  if (!response.ok) {
    return { success: false, error: response.statusText };
  }

  const data = await response.json();

  console.log(data);

  return data;
}

export { auth, AuthError, type AuthData };
