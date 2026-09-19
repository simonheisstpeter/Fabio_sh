/**
 * Request size limits. Plain JS so `astro.config.mjs` can import it too.
 */

/** Largest file the admin may upload (certificates, CV). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Whole-request cap: an upload plus multipart overhead and the other fields. */
export const MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 2 * 1024 * 1024;
