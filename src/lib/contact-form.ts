import { CONTACT_FIELDS, CONTACT_LIMITS, invalidContactFields } from "./contact-rules.js";

type Field = (typeof CONTACT_FIELDS)[number];

const isField = (value: unknown): value is Field =>
  typeof value === "string" && (CONTACT_FIELDS as readonly string[]).includes(value);

const FEEDBACK_ERROR =
  "mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-400 block";

/**
 * Progressive enhancement for the contact form.
 *
 * Without JS the form still posts natively (and the browser's own constraint
 * validation applies). With JS we turn that off and validate ourselves so each
 * problem gets a message in the visitor's language, right next to the field.
 * Texts arrive via `data-*` attributes rendered from the i18n files.
 *
 * Safe to call more than once for the same form (View Transitions re-run it).
 */
export function initContactForm(form: HTMLFormElement): void {
  if (form.dataset.enhanced) return;
  form.dataset.enhanced = "1";
  form.noValidate = true;

  const inputs = {
    name: form.elements.namedItem("name") as HTMLInputElement,
    email: form.elements.namedItem("email") as HTMLInputElement,
    message: form.elements.namedItem("message") as HTMLTextAreaElement,
  };
  const errorEls = Object.fromEntries(
    CONTACT_FIELDS.map((f) => [f, form.querySelector<HTMLElement>(`[data-error-for="${f}"]`)]),
  ) as Record<Field, HTMLElement | null>;
  const submitBtn = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
  const feedback = form.querySelector<HTMLElement>("[data-feedback]")!;
  const counter = form.querySelector<HTMLElement>("[data-counter]");
  const timestamp = form.querySelector<HTMLInputElement>('input[name="_t"]');

  const text = {
    name: form.dataset.errName ?? "",
    email: form.dataset.errEmail ?? "",
    message: form.dataset.errMessage ?? "",
    rate: form.dataset.errRate ?? "",
    generic: form.dataset.error ?? "",
    success: form.dataset.success ?? "",
    sending: form.dataset.sending ?? "",
  };

  // Server-side timing check keys off this; stamp it when the form comes alive.
  if (timestamp) timestamp.value = String(Date.now());

  const values = () => ({
    name: inputs.name.value,
    email: inputs.email.value,
    message: inputs.message.value,
  });

  function show(field: Field, invalid: boolean) {
    inputs[field].setAttribute("aria-invalid", String(invalid));
    const el = errorEls[field];
    if (!el) return;
    el.textContent = invalid ? text[field] : "";
    el.hidden = !invalid;
  }

  /** Validates everything (or one field) and paints the result. */
  function validate(only?: Field): Field[] {
    const invalid = invalidContactFields(values());
    for (const f of CONTACT_FIELDS) if (!only || f === only) show(f, invalid.includes(f));
    return invalid;
  }

  function updateCounter() {
    if (!counter) return;
    const length = inputs.message.value.length;
    counter.textContent = `${length} / ${CONTACT_LIMITS.messageMax}`;
  }
  updateCounter();

  // Don't nag while someone is still typing: a field is judged once it has been
  // left, and re-judged on every keystroke after that so the message clears the
  // moment the problem is fixed.
  const touched = new Set<Field>();
  for (const field of CONTACT_FIELDS) {
    inputs[field].addEventListener("blur", () => {
      touched.add(field);
      validate(field);
    });
    inputs[field].addEventListener("input", () => {
      if (field === "message") updateCounter();
      if (touched.has(field)) validate(field);
    });
  }

  let idleLabel = submitBtn.innerHTML;
  const setBusy = (busy: boolean) => {
    submitBtn.disabled = busy;
    if (busy) {
      idleLabel = submitBtn.innerHTML;
      if (text.sending) submitBtn.textContent = text.sending;
    } else {
      submitBtn.innerHTML = idleLabel;
    }
  };

  function fail(message: string) {
    feedback.textContent = message;
    feedback.className = FEEDBACK_ERROR;
    setBusy(false);
  }

  function succeed() {
    form.innerHTML = `<div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="h-16 w-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
      </div>
      <p data-success class="text-emerald-400 text-2xl font-andesNeueMedium"></p>
    </div>`;
    // textContent, not interpolation: the message is data, never markup.
    form.querySelector("[data-success]")!.textContent = text.success;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    feedback.className = "hidden";
    feedback.textContent = "";

    for (const f of CONTACT_FIELDS) touched.add(f);
    const invalid = validate();
    if (invalid.length) {
      inputs[invalid[0]].focus();
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; field?: unknown };

      if (res.ok && body.ok) return succeed();

      // The server disagreed with the client about a field — trust the server.
      if (res.status === 422 && isField(body.field)) {
        show(body.field, true);
        inputs[body.field].focus();
        return setBusy(false);
      }
      fail(res.status === 429 ? text.rate || text.generic : text.generic);
    } catch {
      fail(text.generic);
    }
  });
}
