const form = document.querySelector("#crack-form");
const hashInput = document.querySelector("#hash-input");
const algorithmSelect = document.querySelector("#algorithm-select");
const limitInput = document.querySelector("#limit-input");
const prefixInput = document.querySelector("#prefix-input");
const suffixInput = document.querySelector("#suffix-input");
const trimLines = document.querySelector("#trim-lines");
const skipEmpty = document.querySelector("#skip-empty");
const lowercaseCopy = document.querySelector("#lowercase-copy");
const uppercaseCopy = document.querySelector("#uppercase-copy");
const wordlistInput = document.querySelector("#wordlist-input");
const wordlistFile = document.querySelector("#wordlist-file");
const startButton = document.querySelector("#start-button");
const stopButton = document.querySelector("#stop-button");
const sampleButton = document.querySelector("#sample-button");
const statusValue = document.querySelector("#status-value");
const checkedValue = document.querySelector("#checked-value");
const speedValue = document.querySelector("#speed-value");
const matchValue = document.querySelector("#match-value");
const digestPreview = document.querySelector("#digest-preview");
const logList = document.querySelector("#log-list");
const copyMatch = document.querySelector("#copy-match");

const sampleWords = [
  "123456",
  "password",
  "admin",
  "letmein",
  "welcome",
  "dragon",
  "sunshine",
  "correcthorsebatterystaple",
  "open-sesame",
];

let stopRequested = false;
let lastMatch = "";

const encoder = new TextEncoder();

function setStatus(text) {
  statusValue.textContent = text;
}

function addLog(html) {
  const item = document.createElement("li");
  item.innerHTML = html;
  logList.prepend(item);
}

function normalizeHash(value) {
  return value.toLowerCase().replace(/^0x/, "").replace(/\s+/g, "");
}

function bytesToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function digest(candidate, algorithm) {
  if (algorithm === "md5") {
    return md5(candidate);
  }

  const buffer = await crypto.subtle.digest(algorithm, encoder.encode(candidate));
  return bytesToHex(buffer);
}

function buildCandidates() {
  const seen = new Set();
  const max = Number(limitInput.value) || 100000;
  const lines = wordlistInput.value.split(/\r?\n/);
  const candidates = [];

  for (const rawLine of lines) {
    const base = trimLines.checked ? rawLine.trim() : rawLine;
    if (skipEmpty.checked && base.length === 0) {
      continue;
    }

    const variants = [base];
    if (lowercaseCopy.checked) {
      variants.push(base.toLowerCase());
    }
    if (uppercaseCopy.checked) {
      variants.push(base.toUpperCase());
    }

    for (const variant of variants) {
      if (!seen.has(variant)) {
        seen.add(variant);
        candidates.push(variant);
      }
      if (candidates.length >= max) {
        return candidates;
      }
    }
  }

  return candidates;
}

function setRunning(running) {
  startButton.disabled = running;
  stopButton.disabled = !running;
  sampleButton.disabled = running;
  wordlistFile.disabled = running;
}

async function crack(event) {
  event.preventDefault();

  const target = normalizeHash(hashInput.value);
  const algorithm = algorithmSelect.value;
  const candidates = buildCandidates();
  const prefix = prefixInput.value;
  const suffix = suffixInput.value;

  if (!/^[a-f0-9]+$/.test(target)) {
    setStatus("Invalid hash");
    addLog("<strong>Invalid target:</strong> use a hexadecimal digest.");
    return;
  }

  if (!candidates.length) {
    setStatus("No candidates");
    addLog("<strong>No candidates:</strong> add wordlist entries first.");
    return;
  }

  stopRequested = false;
  lastMatch = "";
  copyMatch.disabled = true;
  matchValue.textContent = "None";
  matchValue.className = "";
  checkedValue.textContent = "0";
  speedValue.textContent = "0 / sec";
  digestPreview.textContent = `${algorithm.toUpperCase()} target: ${target}`;
  setRunning(true);
  setStatus("Running");

  const start = performance.now();
  let checked = 0;

  try {
    for (const candidate of candidates) {
      if (stopRequested) {
        setStatus("Stopped");
        addLog(`<strong>Stopped:</strong> checked ${checked.toLocaleString()} candidates.`);
        return;
      }

      const saltedCandidate = `${prefix}${candidate}${suffix}`;
      const candidateHash = await digest(saltedCandidate, algorithm);
      checked += 1;

      if (candidateHash === target) {
        lastMatch = candidate;
        const elapsed = Math.max((performance.now() - start) / 1000, 0.001);
        checkedValue.textContent = checked.toLocaleString();
        speedValue.textContent = `${Math.round(checked / elapsed).toLocaleString()} / sec`;
        matchValue.textContent = candidate || "(empty string)";
        matchValue.className = "found";
        copyMatch.disabled = false;
        setStatus("Matched");
        addLog(
          `<strong>Match found:</strong> ${escapeHtml(candidate || "(empty string)")} after ${checked.toLocaleString()} checks.`
        );
        return;
      }

      if (checked % 100 === 0) {
        const elapsed = Math.max((performance.now() - start) / 1000, 0.001);
        checkedValue.textContent = checked.toLocaleString();
        speedValue.textContent = `${Math.round(checked / elapsed).toLocaleString()} / sec`;
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    const elapsed = Math.max((performance.now() - start) / 1000, 0.001);
    checkedValue.textContent = checked.toLocaleString();
    speedValue.textContent = `${Math.round(checked / elapsed).toLocaleString()} / sec`;
    matchValue.textContent = "Not found";
    matchValue.className = "missing";
    setStatus("Complete");
    addLog(`<strong>No match:</strong> checked ${checked.toLocaleString()} candidates.`);
  } catch (error) {
    setStatus("Error");
    addLog(`<strong>Error:</strong> ${escapeHtml(error.message)}`);
  } finally {
    setRunning(false);
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

wordlistFile.addEventListener("change", async () => {
  const [file] = wordlistFile.files;
  if (!file) {
    return;
  }

  wordlistInput.value = await file.text();
  addLog(`<strong>Loaded:</strong> ${escapeHtml(file.name)} (${wordlistInput.value.split(/\r?\n/).length.toLocaleString()} lines).`);
});

sampleButton.addEventListener("click", async () => {
  wordlistInput.value = sampleWords.join("\n");
  algorithmSelect.value = "SHA-256";
  hashInput.value = await digest("correcthorsebatterystaple", "SHA-256");
  addLog("<strong>Sample loaded:</strong> target is SHA-256 for correcthorsebatterystaple.");
});

stopButton.addEventListener("click", () => {
  stopRequested = true;
  setStatus("Stopping");
});

copyMatch.addEventListener("click", async () => {
  if (!lastMatch) {
    return;
  }

  await navigator.clipboard.writeText(lastMatch);
  copyMatch.textContent = "Copied";
  setTimeout(() => {
    copyMatch.textContent = "Copy match";
  }, 1200);
});

form.addEventListener("submit", crack);

// Compact public-domain style MD5 implementation adapted for local string hashing.
function md5(input) {
  function add32(a, b) {
    return (a + b) & 0xffffffff;
  }

  function cmn(q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }

  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function md5cycle(state, block) {
    let [a, b, c, d] = state;

    a = ff(a, b, c, d, block[0], 7, -680876936);
    d = ff(d, a, b, c, block[1], 12, -389564586);
    c = ff(c, d, a, b, block[2], 17, 606105819);
    b = ff(b, c, d, a, block[3], 22, -1044525330);
    a = ff(a, b, c, d, block[4], 7, -176418897);
    d = ff(d, a, b, c, block[5], 12, 1200080426);
    c = ff(c, d, a, b, block[6], 17, -1473231341);
    b = ff(b, c, d, a, block[7], 22, -45705983);
    a = ff(a, b, c, d, block[8], 7, 1770035416);
    d = ff(d, a, b, c, block[9], 12, -1958414417);
    c = ff(c, d, a, b, block[10], 17, -42063);
    b = ff(b, c, d, a, block[11], 22, -1990404162);
    a = ff(a, b, c, d, block[12], 7, 1804603682);
    d = ff(d, a, b, c, block[13], 12, -40341101);
    c = ff(c, d, a, b, block[14], 17, -1502002290);
    b = ff(b, c, d, a, block[15], 22, 1236535329);

    a = gg(a, b, c, d, block[1], 5, -165796510);
    d = gg(d, a, b, c, block[6], 9, -1069501632);
    c = gg(c, d, a, b, block[11], 14, 643717713);
    b = gg(b, c, d, a, block[0], 20, -373897302);
    a = gg(a, b, c, d, block[5], 5, -701558691);
    d = gg(d, a, b, c, block[10], 9, 38016083);
    c = gg(c, d, a, b, block[15], 14, -660478335);
    b = gg(b, c, d, a, block[4], 20, -405537848);
    a = gg(a, b, c, d, block[9], 5, 568446438);
    d = gg(d, a, b, c, block[14], 9, -1019803690);
    c = gg(c, d, a, b, block[3], 14, -187363961);
    b = gg(b, c, d, a, block[8], 20, 1163531501);
    a = gg(a, b, c, d, block[13], 5, -1444681467);
    d = gg(d, a, b, c, block[2], 9, -51403784);
    c = gg(c, d, a, b, block[7], 14, 1735328473);
    b = gg(b, c, d, a, block[12], 20, -1926607734);

    a = hh(a, b, c, d, block[5], 4, -378558);
    d = hh(d, a, b, c, block[8], 11, -2022574463);
    c = hh(c, d, a, b, block[11], 16, 1839030562);
    b = hh(b, c, d, a, block[14], 23, -35309556);
    a = hh(a, b, c, d, block[1], 4, -1530992060);
    d = hh(d, a, b, c, block[4], 11, 1272893353);
    c = hh(c, d, a, b, block[7], 16, -155497632);
    b = hh(b, c, d, a, block[10], 23, -1094730640);
    a = hh(a, b, c, d, block[13], 4, 681279174);
    d = hh(d, a, b, c, block[0], 11, -358537222);
    c = hh(c, d, a, b, block[3], 16, -722521979);
    b = hh(b, c, d, a, block[6], 23, 76029189);
    a = hh(a, b, c, d, block[9], 4, -640364487);
    d = hh(d, a, b, c, block[12], 11, -421815835);
    c = hh(c, d, a, b, block[15], 16, 530742520);
    b = hh(b, c, d, a, block[2], 23, -995338651);

    a = ii(a, b, c, d, block[0], 6, -198630844);
    d = ii(d, a, b, c, block[7], 10, 1126891415);
    c = ii(c, d, a, b, block[14], 15, -1416354905);
    b = ii(b, c, d, a, block[5], 21, -57434055);
    a = ii(a, b, c, d, block[12], 6, 1700485571);
    d = ii(d, a, b, c, block[3], 10, -1894986606);
    c = ii(c, d, a, b, block[10], 15, -1051523);
    b = ii(b, c, d, a, block[1], 21, -2054922799);
    a = ii(a, b, c, d, block[8], 6, 1873313359);
    d = ii(d, a, b, c, block[15], 10, -30611744);
    c = ii(c, d, a, b, block[6], 15, -1560198380);
    b = ii(b, c, d, a, block[13], 21, 1309151649);
    a = ii(a, b, c, d, block[4], 6, -145523070);
    d = ii(d, a, b, c, block[11], 10, -1120210379);
    c = ii(c, d, a, b, block[2], 15, 718787259);
    b = ii(b, c, d, a, block[9], 21, -343485551);

    state[0] = add32(a, state[0]);
    state[1] = add32(b, state[1]);
    state[2] = add32(c, state[2]);
    state[3] = add32(d, state[3]);
  }

  function md5blk(string) {
    const blocks = [];
    for (let i = 0; i < 64; i += 4) {
      blocks[i >> 2] =
        string.charCodeAt(i) +
        (string.charCodeAt(i + 1) << 8) +
        (string.charCodeAt(i + 2) << 16) +
        (string.charCodeAt(i + 3) << 24);
    }
    return blocks;
  }

  function md51(string) {
    let n = string.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i;

    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(string.substring(i - 64, i)));
    }

    string = string.substring(i - 64);
    const tail = Array(16).fill(0);
    for (i = 0; i < string.length; i += 1) {
      tail[i >> 2] |= string.charCodeAt(i) << (i % 4 << 3);
    }

    tail[i >> 2] |= 0x80 << (i % 4 << 3);

    if (i > 55) {
      md5cycle(state, tail);
      tail.fill(0);
    }

    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }

  function rhex(n) {
    let string = "";
    for (let j = 0; j < 4; j += 1) {
      string += ((n >> (j * 8 + 4)) & 0x0f).toString(16) + ((n >> (j * 8)) & 0x0f).toString(16);
    }
    return string;
  }

  return md51(unescape(encodeURIComponent(input))).map(rhex).join("");
}
