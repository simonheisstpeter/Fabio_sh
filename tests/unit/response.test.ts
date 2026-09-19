import { describe, expect, it } from "vitest";
import { jsonError, jsonOk, methodOverride, redirectGet, redirectTo } from "../../src/lib/response";

describe("response helpers", () => {
  it("jsonError defaults to 422 with an error body", async () => {
    const res = jsonError("nope");
    expect(res.status).toBe(422);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await res.json()).toEqual({ error: "nope" });
  });

  it("jsonError honours a custom status", () => {
    expect(jsonError("gone", 410).status).toBe(410);
  });

  it("jsonOk defaults to { ok: true } and serialises custom data", async () => {
    expect(await jsonOk().json()).toEqual({ ok: true });
    expect(await jsonOk([1, 2]).json()).toEqual([1, 2]);
  });

  it("redirectTo sets Location and defaults to 302", () => {
    const res = redirectTo("/x");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/x");
    expect(redirectTo("/y", 303).status).toBe(303);
  });

  it("redirectGet builds a handler that bounces to the path", async () => {
    const handler = redirectGet("/admin/login");
    const res = (await handler({} as never)) as Response;
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/login");
  });

  it("methodOverride upper-cases the hidden field and defaults to empty", () => {
    const form = new FormData();
    expect(methodOverride(form)).toBe("");
    form.set("_method", "put");
    expect(methodOverride(form)).toBe("PUT");
  });
});
