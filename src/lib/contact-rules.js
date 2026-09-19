/**
 * Contact-form validation rules — the single source of truth.
 *
 * Plain JS so the server (`api/contact.ts`) and the browser
 * (`contact-form.ts`, bundled into the page) import the very same limits and
 * email pattern. The server stays authoritative; the client just gives the
 * answer sooner and in the visitor's language.
 */

export const CONTACT_LIMITS = Object.freeze({
  nameMin: 2,
  nameMax: 100,
  emailMax: 254,
  messageMin: 10,
  messageMax: 2000,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Field names, in the order they appear in the form. */
export const CONTACT_FIELDS = /** @type {const} */ (["name", "email", "message"]);

/**
 * Returns the invalid fields in form order (empty when everything is fine).
 * Values are trimmed first, exactly as the server does before it stores them.
 *
 * @param {{ name?: string, email?: string, message?: string }} values
 * @returns {("name" | "email" | "message")[]}
 */
export function invalidContactFields(values) {
  const name = (values.name ?? "").trim();
  const email = (values.email ?? "").trim();
  const message = (values.message ?? "").trim();
  const L = CONTACT_LIMITS;

  /** @type {("name" | "email" | "message")[]} */
  const invalid = [];
  if (name.length < L.nameMin || name.length > L.nameMax) invalid.push("name");
  if (!EMAIL_RE.test(email) || email.length > L.emailMax) invalid.push("email");
  if (message.length < L.messageMin || message.length > L.messageMax) invalid.push("message");
  return invalid;
}
