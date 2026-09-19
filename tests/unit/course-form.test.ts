import { describe, expect, it } from "vitest";
import { courseFromForm } from "../../src/lib/course-form";

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const ok = (fields: Record<string, string>) => {
  const r = courseFromForm(form(fields));
  if ("error" in r) throw new Error(`unexpected error: ${r.error}`);
  return r.input;
};

describe("courseFromForm", () => {
  it("requires a title", () => {
    expect(courseFromForm(form({}))).toEqual({ error: "title is required" });
    expect(courseFromForm(form({ title: "   " }))).toEqual({ error: "title is required" });
  });

  it("rejects a status the DB CHECK constraint would refuse", () => {
    expect(courseFromForm(form({ title: "t", status: "bogus" }))).toEqual({ error: "invalid status" });
  });

  it("defaults status to not_started and accepts the three real ones", () => {
    expect(ok({ title: "t" }).status).toBe("not_started");
    for (const status of ["not_started", "in_progress", "completed"]) {
      expect(ok({ title: "t", status }).status).toBe(status);
    }
  });

  it.each([
    ["150", 100],
    ["-5", 0],
    ["abc", 0],
    ["", 0],
    ["42.6", 43],
    ["0", 0],
    ["100", 100],
  ])("clamps progress %j to %d", (raw, expected) => {
    expect(ok({ title: "t", progress: raw }).progress).toBe(expected);
  });

  it("splits topics on lines, trimming and dropping blanks", () => {
    expect(ok({ title: "t", topics: "a\n\n  b  \n\r\nc\n" }).topics).toEqual(["a", "b", "c"]);
    expect(ok({ title: "t" }).topics).toEqual([]);
  });

  it("only publishes on an explicit '1'", () => {
    expect(ok({ title: "t", published: "1" }).published).toBe(1);
    expect(ok({ title: "t", published: "on" }).published).toBe(0);
    expect(ok({ title: "t" }).published).toBe(0);
  });

  it("trims text fields and maps the snake_case form names", () => {
    expect(
      ok({
        title: "  T  ",
        platform: " Udemy ",
        url: " https://x ",
        start_date: "2025-01-01",
        end_date: "2025-02-01",
        notes: "  n  ",
      }),
    ).toMatchObject({
      title: "T",
      platform: "Udemy",
      url: "https://x",
      startDate: "2025-01-01",
      endDate: "2025-02-01",
      notes: "n",
    });
  });
});
