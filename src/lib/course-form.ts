import type { CourseStatus } from "./db";

export type CourseInput = {
  title: string;
  platform: string;
  status: CourseStatus;
  progress: number;
  topics: string[];
  url: string;
  startDate: string;
  endDate: string;
  notes: string;
  published: 0 | 1;
};

const STATUSES: readonly CourseStatus[] = ["not_started", "in_progress", "completed"];

const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/**
 * Single source of truth for turning the admin course form into a row — the
 * create and update routes used to each carry their own copy. Returns an error
 * string for input the DB's CHECK constraints would otherwise reject with a 500.
 */
export function courseFromForm(form: FormData): { input: CourseInput } | { error: string } {
  const title = str(form, "title");
  if (!title) return { error: "title is required" };

  const status = str(form, "status") || "not_started";
  if (!(STATUSES as readonly string[]).includes(status)) return { error: "invalid status" };

  return {
    input: {
      title,
      platform: str(form, "platform"),
      status: status as CourseStatus,
      progress: Math.min(100, Math.max(0, Math.round(Number(form.get("progress") ?? 0)) || 0)),
      topics: str(form, "topics")
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean),
      url: str(form, "url"),
      startDate: str(form, "start_date"),
      endDate: str(form, "end_date"),
      notes: str(form, "notes"),
      published: form.get("published") === "1" ? 1 : 0,
    },
  };
}
