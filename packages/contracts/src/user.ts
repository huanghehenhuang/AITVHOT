// Visitor account contracts (/api/auth/user/*): what reader pages see about sign-in availability
// and about the signed-in visitor. Unlike the admin contracts these are public.

/** Which sign-in ways the deployment offers right now (credentials decide). */
export interface UserAuthOptions {
  /** Email magic-link sign-in (SMTP configured). */
  magic: boolean;
  /** Google sign-in (an OAuth client is configured). */
  google: boolean;
}

/** The signed-in visitor, as /api/auth/user/me returns inside `{ user }`. */
export interface UserMe {
  email: string;
  displayName: string;
  avatarUrl: string | null;
  /** Send with every state-changing /api/auth/user/* call as x-csrf-token. */
  csrf: string;
  method: "magic" | "google";
}
