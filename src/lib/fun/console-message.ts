import { LIST_OF_EMOJIS } from "./emojis";

function randomEmojis(count: number): string {
  return Array.from(
    { length: count },
    () => LIST_OF_EMOJIS[Math.floor(Math.random() * LIST_OF_EMOJIS.length)],
  ).join("");
}

function randomColor() {
  const colors = ["#ff00ff", "#00ffff", "#10b981", "#f59e0b", "#ef4444"];
  return colors[Math.floor(Math.random() * 5)];
}

export default function consoleMessage() {
  const groupStyle = `
    background-color: black;
    color: #fff;
    width: 100%;
    padding: 1rem;
  `;

  const textFieldStyle = `
      width: 100%;
      height: auto;
      margin: 0 auto 2rem auto;
      padding: 4rem;
      display: block;
      background: linear-gradient(120deg,  #34d399 30%, #cbd5e1 80%);
      line-height: 4.5rem;
      color: white;
      border-radius: 8px;
      font-size: 1.5rem;
  `;

  const topRow = randomEmojis(12);
  const bottomRow = randomEmojis(12);
  const headerIcon = randomEmojis(1);

  const textFieldContent = `%c${topRow}\nHello!\nand welcome to my console!\nLeave me a message here:\nhttps://fabio.sh/contact\n${bottomRow}`;

  const svgPattern =
    "data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l20 20H0V0zm20 0L0 20h20V0z' fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E";

  const mainStyle = `
      margin: 3rem;
       padding: 4rem;
       background:
         linear-gradient(to right, rgba(16,185,129,0.85), rgba(52,211,153,0.6)),
         url("${svgPattern}");
       color: #ecfdf5;
       font-size: 3rem;
       font-family: 'Segoe UI', sans-serif;
       font-weight: bold;
       font-style: italic;
       text-shadow: 3px 3px 0px #064e3b;
       border-radius: 0 100px 0 100px;
       border: 5px solid #ecfdf5;
     `;

  const accent = randomColor();
  const extraHeaderStyle = `
      padding: 1rem 2rem;
      font-size: 1.4rem;
      font-weight: bold;
      color: ${accent};
      border-bottom: 1px solid ${accent};
      text-shadow: 0 0 6px ${accent};
    `;

  // Group starts
  console.group(
    `%c fabio.sh - Console Message to you! ${headerIcon}`,
    groupStyle,
  );
  console.log(
    "%c// system status: testing the limits of console styling",
    extraHeaderStyle,
  );

  console.log();
  console.log("%cWELCOME TO MY CONSOLE", mainStyle);
  console.log();

  // FABIO
  console.log(
    "%cF%cA%cB%cI%cO",

    // F — electric indigo, hard right-down depth + horizontal discharge streaks
    `
      font-size: 8rem;
      font-weight: 900;
      font-family: monospace;
      color: #a5b4fc;
      text-shadow:
        1px 1px 0 #818cf8,
        2px 2px 0 #6366f1,
        3px 3px 0 #4f46e5,
        4px 4px 0 #4338ca,
        5px 5px 0 #3730a3,
        6px 6px 0 #312e81,
        7px 7px 0 #1e1b4b,
        8px 8px 14px #6366f1,
        0 0 8px #a5b4fc,
        0 0 20px rgba(99,102,241,0.9),
        0 0 45px rgba(99,102,241,0.4),
        12px 0 18px rgba(99,102,241,0.3),
        -12px 0 18px rgba(165,180,252,0.3),
        0 -4px 10px #c7d2fe,
        -3px 3px 6px #4f46e5;
      padding: 0 0.05em;
    `,

    // A — volcanic orange, lava-drip shadow straight down + rising fire halo
    `
      font-size: 8rem;
      font-weight: 900;
      font-family: monospace;
      color: #fb923c;
      text-shadow:
        0 1px 0 #ea7a1a,
        0 2px 0 #d96a0a,
        0 3px 0 #c45a00,
        0 4px 0 #a34a00,
        0 5px 0 #7c3800,
        0 6px 0 #5a2800,
        0 7px 0 #3d1a00,
        0 8px 0 #200d00,
        0 9px 16px #f97316,
        0 0 8px #fb923c,
        0 0 18px rgba(249,115,22,0.9),
        0 0 36px rgba(249,115,22,0.5),
        0 0 60px rgba(234,88,12,0.2),
        -4px -3px 10px #fcd34d,
        4px -3px 10px #fcd34d,
        0 -5px 14px rgba(252,211,77,0.6);
      padding: 0 0.05em;
    `,

    // B — holographic purple, bottom-left depth + magenta-to-blue chromatic shift
    `
      font-size: 8rem;
      font-weight: 900;
      font-family: monospace;
      color: #e879f9;
      text-shadow:
        -1px 1px 0 #d946ef,
        -2px 2px 0 #c026d3,
        -3px 3px 0 #a21caf,
        -4px 4px 0 #86198f,
        -5px 5px 0 #701a75,
        -6px 6px 0 #4a044e,
        -7px 7px 14px #c026d3,
        5px -2px 0 #818cf8,
        4px -1px 0 #6366f1,
        0 0 8px #f0abfc,
        0 0 18px rgba(232,121,249,0.9),
        0 0 36px rgba(192,38,211,0.5),
        0 0 60px rgba(126,34,206,0.25),
        4px 4px 14px rgba(99,102,241,0.5),
        -4px -4px 14px rgba(249,168,212,0.4);
      padding: 0 0.05em;
    `,

    // I — acid lime, rising upward shadow + laser core + toxic bleed
    `
      font-size: 8rem;
      font-weight: 900;
      font-family: monospace;
      color: #bef264;
      text-shadow:
        0 -1px 0 #a3e635,
        0 -2px 0 #84cc16,
        0 -3px 0 #65a30d,
        0 -4px 0 #4d7c0f,
        0 -5px 0 #365314,
        0 -6px 12px #84cc16,
        0 1px 0 #d9f99d,
        0 2px 8px #bef264,
        0 0 6px #d9f99d,
        0 0 14px rgba(190,242,100,1),
        0 0 28px rgba(132,204,22,0.8),
        0 0 50px rgba(132,204,22,0.4),
        0 0 80px rgba(101,163,13,0.2),
        3px 0 12px rgba(190,242,100,0.5),
        -3px 0 12px rgba(190,242,100,0.5);
      padding: 0 0.05em;
    `,

    // O — deep rose, 4-diagonal shadow ring + pulsing circular halo
    `
      font-size: 8rem;
      font-weight: 900;
      font-family: monospace;
      color: #fb7185;
      text-shadow:
        3px 3px 0 #f43f5e,
        -3px 3px 0 #e11d48,
        3px -3px 0 #be123c,
        -3px -3px 0 #9f1239,
        5px 5px 0 #881337,
        -5px 5px 0 #881337,
        5px -5px 0 #881337,
        -5px -5px 0 #881337,
        7px 7px 12px #f43f5e,
        -7px -7px 12px #f43f5e,
        0 0 8px #fda4af,
        0 0 16px rgba(251,113,133,0.95),
        0 0 32px rgba(244,63,94,0.7),
        0 0 56px rgba(225,29,72,0.4),
        0 0 80px rgba(159,18,57,0.2),
        8px 0 16px rgba(253,164,175,0.4),
        -8px 0 16px rgba(253,164,175,0.4),
        0 8px 16px rgba(244,63,94,0.4),
        0 -8px 16px rgba(244,63,94,0.4);
      padding: 0 0.05em;
    `,
  );
  console.log();

  // Group content
  console.log(textFieldContent, textFieldStyle);
  console.log();

  console.log(
    "%cWant to see the code? %cfor access to my (all) private_repos please contact me",
    "color: gray; margin-top: 2rem;",
    "color: blue; font-weight: bold; text-decoration: underline; margin-bottom: 2rem;",
  );

  console.log();

  // Group ends
  console.groupEnd();

  // Gradient-clip text + multi-layer box-shadow + outline rings
  console.log(
    "%clive %claugh %clog",

    // "you" — indigo→violet→pink gradient fill, indigo box-shadow rings, violet outline
    `
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 45%, #ec4899 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-size: 5rem;
      font-weight: 900;
      font-family: monospace;
      letter-spacing: 0.1em;
      padding: 1rem 2rem;
      border-radius: 8px;
      outline: 2px solid #818cf8;
      outline-offset: 6px;
      box-shadow:
        0 0 0 2px #4f46e5,
        0 0 0 4px #3730a3,
        0 0 6px 4px rgba(99,102,241,0.85),
        0 0 14px 6px rgba(139,92,246,0.65),
        0 0 24px 10px rgba(168,85,247,0.45),
        0 0 40px 14px rgba(168,85,247,0.25),
        0 0 60px 18px rgba(99,102,241,0.12),
        inset 0 0 10px rgba(165,180,252,0.25),
        inset 0 0 20px rgba(216,180,254,0.1);
    `,

    // "found" — lime→emerald→teal gradient fill, green box-shadow rings, emerald outline
    `
      background: linear-gradient(160deg, #bef264 0%, #10b981 50%, #0d9488 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-size: 5rem;
      font-weight: 900;
      font-family: monospace;
      letter-spacing: 0.1em;
      padding: 1rem 2rem;
      border-radius: 8px;
      outline: 2px solid #34d399;
      outline-offset: 6px;
      box-shadow:
        0 0 0 2px #059669,
        0 0 0 4px #065f46,
        0 0 6px 4px rgba(16,185,129,0.85),
        0 0 14px 6px rgba(52,211,153,0.65),
        0 0 24px 10px rgba(13,148,136,0.45),
        0 0 40px 14px rgba(16,185,129,0.25),
        0 0 60px 18px rgba(6,95,70,0.12),
        inset 0 0 10px rgba(110,231,183,0.25),
        inset 0 0 20px rgba(167,243,208,0.1);
    `,

    // "me" — amber→orange→rose gradient fill, gold box-shadow rings, amber outline
    `
      background: linear-gradient(120deg, #fcd34d 0%, #f97316 50%, #fb7185 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-size: 5rem;
      font-weight: 900;
      font-family: monospace;
      letter-spacing: 0.1em;
      padding: 1rem 2rem;
      border-radius: 8px;
      outline: 2px solid #fbbf24;
      outline-offset: 6px;
      box-shadow:
        0 0 0 2px #d97706,
        0 0 0 4px #92400e,
        0 0 6px 4px rgba(251,191,36,0.85),
        0 0 14px 6px rgba(249,115,22,0.65),
        0 0 24px 10px rgba(251,113,133,0.45),
        0 0 40px 14px rgba(249,115,22,0.25),
        0 0 60px 18px rgba(146,64,14,0.12),
        inset 0 0 10px rgba(252,211,77,0.25),
        inset 0 0 20px rgba(253,186,116,0.1);
    `,
  );

  // Hidden
  console.log(
    "%c  Long live the internet and browser culture  ",
    `
      display: block;
      padding: 1.5rem 3rem;
      background: #0f172a;
      color: transparent;
      font-size: 1.1rem;
      font-family: monospace;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-shadow:
        0 0 6px rgba(16, 185, 129, 0.9),
        0 0 12px rgba(16, 185, 129, 0.6),
        0 0 24px rgba(16, 185, 129, 0.3);
      filter: blur(1.5px);
      border-radius: 6px;
      border: 1px solid rgba(16, 185, 129, 0.15);
    `,
  );
}
