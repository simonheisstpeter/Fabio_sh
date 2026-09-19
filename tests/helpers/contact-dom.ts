import { CONTACT_LIMITS } from "../../src/lib/contact-rules.js";

/**
 * The contact form's markup as `ContactForm.astro` renders it — same ids, `data-*` hooks and
 * limits. (An e2e test checks the real page still exposes these hooks, so the two can't drift
 * apart unnoticed.)
 */
export const TEXTS = {
  name: "Bitte gib deinen Namen ein (2–100 Zeichen).",
  email: "Bitte gib eine gültige E-Mail-Adresse ein.",
  message: "Deine Nachricht muss zwischen 10 und 2000 Zeichen lang sein.",
  rate: "Zu viele Nachrichten.",
  generic: "Etwas ist schiefgelaufen.",
  success: "Danke für deine Nachricht!",
  sending: "Wird gesendet…",
};

export const BUTTON_LABEL = `Los <svg data-icon=""></svg>`;

export function mountForm(over: Partial<typeof TEXTS> = {}): HTMLFormElement {
  const t = { ...TEXTS, ...over };
  document.body.innerHTML = `
    <form id="contact-form" action="/api/contact" method="POST"
      data-success="${t.success}" data-error="${t.generic}" data-err-name="${t.name}"
      data-err-email="${t.email}" data-err-message="${t.message}" data-err-rate="${t.rate}"
      data-sending="${t.sending}">
      <input type="text" name="website" tabindex="-1" />
      <input type="hidden" name="_t" id="form-ts" value="" />
      <input type="text" id="contact-name" name="name" required
        minlength="${CONTACT_LIMITS.nameMin}" maxlength="${CONTACT_LIMITS.nameMax}" aria-describedby="contact-name-error" />
      <p id="contact-name-error" data-error-for="name" hidden></p>
      <input type="email" id="contact-email" name="email" required
        maxlength="${CONTACT_LIMITS.emailMax}" aria-describedby="contact-email-error" />
      <p id="contact-email-error" data-error-for="email" hidden></p>
      <textarea id="contact-message" name="message" required
        minlength="${CONTACT_LIMITS.messageMin}" maxlength="${CONTACT_LIMITS.messageMax}" aria-describedby="contact-message-error"></textarea>
      <p id="contact-message-error" data-error-for="message" hidden></p>
      <span data-counter></span>
      <div id="form-feedback" data-feedback class="hidden"></div>
      <button type="submit" id="contact-submit">${BUTTON_LABEL}</button>
    </form>`;
  return document.getElementById("contact-form") as HTMLFormElement;
}
