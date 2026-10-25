// The ?return= whitelist for the visitor login page, mirroring safeUserReturn in the api's user
// module (apps/web never imports the backend; the two must agree on the same rule). Backslashes are
// folded first: a browser reads "/\evil.com" as a protocol-relative redirect.
export function safeLoginReturn(target: string): string {
  const path = target.replace(/\\/g, "/");
  return /^\/(?!\/)/.test(path) ? path.slice(0, 500) : "/";
}
