/**
 * Which sign-in methods are configured.
 *
 * Kept free of Prisma and bcrypt so pages and layouts can ask without pulling
 * the Node-only auth module in. Auth.js reads `AUTH_GOOGLE_ID` /
 * `AUTH_GOOGLE_SECRET` by convention; the `GOOGLE_CLIENT_*` names are accepted
 * too because that is what the Google Cloud console calls them.
 */
export const googleClientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
export const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;

/** True when "Continue with Google" should be offered. */
export function isGoogleEnabled() {
  return Boolean(googleClientId && googleClientSecret);
}
