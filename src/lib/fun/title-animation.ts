import { LIST_OF_EMOJIS } from "./emojis";

const POOL = 8;
const pool: string[] = Array(POOL).fill("🙆");
const changeTimers: (ReturnType<typeof setTimeout> | null)[] = Array(POOL).fill(null);
let marqueeTimer: ReturnType<typeof setInterval> | null = null;
let offset = 0;

function randomEmoji(): string {
  return LIST_OF_EMOJIS[Math.floor(Math.random() * LIST_OF_EMOJIS.length)];
}

function randomDelay(): number {
  return 300 + Math.random() * 1700;
}

function updateTitle() {
  const pre = [0, 1, 2].map((i) => pool[(offset + i) % POOL]).join("");
  const post = [3, 4, 5].map((i) => pool[(offset + i) % POOL]).join("");
  document.title = `${pre} fabio.sh ${post}`;
}

function scheduleChange(i: number) {
  changeTimers[i] = setTimeout(() => {
    pool[i] = randomEmoji();
    updateTitle();
    scheduleChange(i);
  }, randomDelay());
}

function startFocusTitle() {
  if (marqueeTimer !== null) return;
  for (let i = 0; i < POOL; i++) scheduleChange(i);
  marqueeTimer = setInterval(() => {
    offset = (offset + 1) % POOL;
    updateTitle();
  }, 700);
}

function stopFocusTitle() {
  for (let i = 0; i < POOL; i++) {
    if (changeTimers[i] !== null) {
      clearTimeout(changeTimers[i]!);
      changeTimers[i] = null;
    }
  }
  if (marqueeTimer !== null) {
    clearInterval(marqueeTimer);
    marqueeTimer = null;
  }
  document.title = "😢 Come back! 😢";
}

export default function titleAnimation() {
  window.addEventListener("focus", startFocusTitle);
  window.addEventListener("blur", stopFocusTitle);
  if (document.hasFocus()) startFocusTitle();
}
