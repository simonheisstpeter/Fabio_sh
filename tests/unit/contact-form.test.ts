// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initContactForm } from "../../src/lib/contact-form";
import { BUTTON_LABEL, TEXTS, mountForm } from "../helpers/contact-dom";

const flush = async () => {
  for (let i = 0; i < 4; i++) await new Promise((r) => setTimeout(r, 0));
};

let form: HTMLFormElement;
const el = <T extends HTMLElement>(sel: string) => form.querySelector(sel) as T;
const input = (name: "name" | "email" | "message") => form.elements.namedItem(name) as HTMLInputElement;
const error = (field: string) => el<HTMLElement>(`[data-error-for="${field}"]`);
const button = () => el<HTMLButtonElement>("button[type=submit]");
const feedback = () => el<HTMLElement>("[data-feedback]");

function type(field: "name" | "email" | "message", value: string) {
  const node = input(field);
  node.value = value;
  node.dispatchEvent(new Event("input", { bubbles: true }));
}
const blur = (field: "name" | "email" | "message") => input(field).dispatchEvent(new Event("blur"));
function submit() {
  const event = new Event("submit", { cancelable: true, bubbles: true });
  form.dispatchEvent(event);
  return event;
}
function fillValid() {
  type("name", "Tester");
  type("email", "tester@example.com");
  type("message", "A perfectly fine message.");
}
const reply = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));

beforeEach(() => {
  form = mountForm();
});
afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("setup", () => {
  it("takes over validation from the browser once JS is running", () => {
    expect(form.noValidate).toBe(false);
    initContactForm(form);
    expect(form.noValidate).toBe(true);
  });

  it("stamps the timing field and shows the counter", () => {
    initContactForm(form);
    expect(Number(input("message").form!.querySelector<HTMLInputElement>("#form-ts")!.value)).toBeGreaterThan(1_600_000_000_000);
    expect(el("[data-counter]").textContent).toBe("0 / 2000");
  });

  it("shows no errors before anyone has touched anything", () => {
    initContactForm(form);
    for (const f of ["name", "email", "message"]) {
      expect(error(f).hidden).toBe(true);
      expect(input(f as "name").getAttribute("aria-invalid")).toBeNull();
    }
  });

  it("is safe to initialise twice (View Transitions re-run it)", async () => {
    const fetchMock = reply(200, { ok: true });
    vi.stubGlobal("fetch", fetchMock);
    initContactForm(form);
    initContactForm(form);
    fillValid();
    submit();
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("live validation", () => {
  beforeEach(() => initContactForm(form));

  it("judges a field only after it has been left", () => {
    type("name", "x"); // too short, but still typing
    expect(error("name").hidden).toBe(true);
    blur("name");
    expect(error("name").hidden).toBe(false);
    expect(error("name").textContent).toBe(TEXTS.name);
    expect(input("name").getAttribute("aria-invalid")).toBe("true");
  });

  it("clears the message the moment the problem is fixed", () => {
    blur("name");
    expect(error("name").hidden).toBe(false);
    type("name", "Fabio");
    expect(error("name").hidden).toBe(true);
    expect(error("name").textContent).toBe("");
    expect(input("name").getAttribute("aria-invalid")).toBe("false");
  });

  it("re-flags a field that becomes invalid again while editing", () => {
    type("name", "Fabio");
    blur("name");
    expect(error("name").hidden).toBe(true);
    type("name", "F");
    expect(error("name").hidden).toBe(false);
  });

  it("refuses whitespace-only names", () => {
    type("name", "      ");
    blur("name");
    expect(error("name").hidden).toBe(false);
  });

  it.each([
    ["not-an-email", true],
    ["a@b", true],
    ["a@b.c", true],
    ["hello@example.com", false],
  ])("email %j → error shown: %s", (value, shown) => {
    type("email", value);
    blur("email");
    expect(error("email").hidden).toBe(!shown);
    if (shown) expect(error("email").textContent).toBe(TEXTS.email);
  });

  it("validates the message length and reports it in the visitor's language", () => {
    type("message", "too short");
    blur("message");
    expect(error("message").textContent).toBe(TEXTS.message);
    type("message", "long enough now");
    expect(error("message").hidden).toBe(true);
  });

  it("keeps a live character counter", () => {
    type("message", "hello");
    expect(el("[data-counter]").textContent).toBe("5 / 2000");
    type("message", "hello world");
    expect(el("[data-counter]").textContent).toBe("11 / 2000");
    type("message", "");
    expect(el("[data-counter]").textContent).toBe("0 / 2000");
  });

  it("keeps each field's error independent", () => {
    blur("name");
    blur("email");
    type("email", "ok@example.com");
    expect(error("email").hidden).toBe(true);
    expect(error("name").hidden).toBe(false);
  });
});

describe("submitting", () => {
  it("blocks an invalid form, shows every problem, and focuses the first", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    initContactForm(form);
    type("email", "nope");

    const event = submit();

    expect(event.defaultPrevented).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(error("name").hidden).toBe(false);
    expect(error("email").hidden).toBe(false);
    expect(error("message").hidden).toBe(false);
    expect(document.activeElement).toBe(input("name"));
  });

  it("focuses the first *invalid* field, not just the first field", () => {
    vi.stubGlobal("fetch", vi.fn());
    initContactForm(form);
    type("name", "Tester");
    type("email", "tester@example.com");
    type("message", "short");
    submit();
    expect(document.activeElement).toBe(input("message"));
  });

  it("sends a valid form as JSON-preferring multipart, showing a busy state", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => {
      await gate;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    initContactForm(form);
    fillValid();

    submit();
    await flush();

    expect(button().disabled).toBe(true);
    expect(button().textContent).toBe(TEXTS.sending);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(/\/api\/contact$/);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Accept).toBe("application/json");
    const body = init.body as FormData;
    expect(body.get("name")).toBe("Tester");
    expect(body.get("email")).toBe("tester@example.com");
    expect(body.get("message")).toBe("A perfectly fine message.");
    expect(Number(body.get("_t"))).toBeGreaterThan(0);
    expect(body.get("website")).toBe("");

    release();
    await flush();
  });

  it("replaces the form with the success message on ok", async () => {
    vi.stubGlobal("fetch", reply(200, { ok: true }));
    initContactForm(form);
    fillValid();
    submit();
    await flush();
    expect(form.textContent?.trim()).toBe(TEXTS.success);
    expect(form.querySelector("input")).toBeNull();
  });

  it("renders the success text as text, never as markup", async () => {
    form = mountForm({ success: "&lt;img src=x onerror=alert(1)&gt;" });
    vi.stubGlobal("fetch", reply(200, { ok: true }));
    initContactForm(form);
    fillValid();
    submit();
    await flush();
    expect(form.querySelector("img")).toBeNull();
    expect(form.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("a 200 without ok:true is not a success", async () => {
    vi.stubGlobal("fetch", reply(200, { nope: true }));
    initContactForm(form);
    fillValid();
    submit();
    await flush();
    expect(feedback().textContent).toBe(TEXTS.generic);
    expect(form.querySelector("input")).not.toBeNull();
  });

  describe("when the server says no", () => {
    it("422 for a field: shows that field's localized message, focuses it, and re-enables the form", async () => {
      vi.stubGlobal("fetch", reply(422, { error: "Message must be 10–2000 characters", field: "message" }));
      initContactForm(form);
      fillValid();
      submit();
      await flush();

      expect(error("message").hidden).toBe(false);
      expect(error("message").textContent).toBe(TEXTS.message);
      expect(document.activeElement).toBe(input("message"));
      expect(button().disabled).toBe(false);
      expect(button().innerHTML).toBe(BUTTON_LABEL);
      expect(feedback().className).toBe("hidden");
    });

    it("422 with an unknown field falls back to the generic message", async () => {
      vi.stubGlobal("fetch", reply(422, { error: "?", field: "bogus" }));
      initContactForm(form);
      fillValid();
      submit();
      await flush();
      expect(feedback().textContent).toBe(TEXTS.generic);
    });

    it("429 explains the rate limit", async () => {
      vi.stubGlobal("fetch", reply(429, { error: "Too many submissions. Please try again later." }));
      initContactForm(form);
      fillValid();
      submit();
      await flush();
      expect(feedback().textContent).toBe(TEXTS.rate);
      expect(feedback().className).toContain("text-red-400");
      expect(button().disabled).toBe(false);
      expect(button().innerHTML).toBe(BUTTON_LABEL);
    });

    it.each([500, 413, 403])("%d gives the generic error and lets the visitor retry", async (status) => {
      vi.stubGlobal("fetch", reply(status, { error: "x" }));
      initContactForm(form);
      fillValid();
      submit();
      await flush();
      expect(feedback().textContent).toBe(TEXTS.generic);
      expect(button().disabled).toBe(false);
      expect(input("message").value).toBe("A perfectly fine message."); // nothing lost
    });

    it("a network failure gives the generic error too", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
      initContactForm(form);
      fillValid();
      submit();
      await flush();
      expect(feedback().textContent).toBe(TEXTS.generic);
      expect(button().disabled).toBe(false);
    });

    it("a non-JSON body doesn't break the handler", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>bad gateway</html>", { status: 502 })));
      initContactForm(form);
      fillValid();
      submit();
      await flush();
      expect(feedback().textContent).toBe(TEXTS.generic);
    });

    it("clears the previous banner when the visitor tries again", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response("{}", { status: 500 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);
      initContactForm(form);
      fillValid();

      submit();
      await flush();
      expect(feedback().textContent).toBe(TEXTS.generic);

      submit();
      await flush();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(form.textContent?.trim()).toBe(TEXTS.success);
    });
  });
});
