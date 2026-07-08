/**
 * Constants for the client-side localStorage data layer.
 * Safe to import on both server and client (no runtime APIs).
 */

/** localStorage key holding the JSON-encoded Store. */
export const DATA_KEY = 'naub-lms-data';

/** localStorage key holding Record<userId, password>. */
export const PASSWORDS_KEY = 'naub-lms-passwords';

/** localStorage key holding the currently signed-in user's id. */
export const CURRENT_USER_KEY = 'naub-lms-current-user';

/** Cookie mirrored from CURRENT_USER_KEY for middleware route guards. */
export const DEMO_COOKIE_NAME = 'naub-demo-user';

/** Cookie mirroring the current user's role. */
export const DEMO_ROLE_COOKIE_NAME = 'naub-demo-role';

/** Default password assigned to every newly-seeded and newly-registered user.
 *  Documented as demo-only - changeable from the user's profile. */
export const DEFAULT_PASSWORD = 'NAUB@2026';

/** Schema version baked into the stored blob; bump if the data shape changes. */
export const STORE_SCHEMA_VERSION = 1;