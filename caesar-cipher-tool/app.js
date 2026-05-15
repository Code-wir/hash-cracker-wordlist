const inputText = document.getElementById("input-text");
const outputText = document.getElementById("output-text");
const encodeMode = document.getElementById("encode-mode");
const decodeMode = document.getElementById("decode-mode");
const shiftRange = document.getElementById("shift-range");
const shiftNumber = document.getElementById("shift-number");
const shiftValue = document.getElementById("shift-value");
const shiftDown = document.getElementById("shift-down");
const shiftUp = document.getElementById("shift-up");
const preserveCase = document.getElementById("preserve-case");
const groupOutput = document.getElementById("group-output");
const copyButton = document.getElementById("copy-button");
const swapButton = document.getElementById("swap-button");
const clearButton = document.getElementById("clear-button");
const sampleButton = document.getElementById("sample-button");
const inputCount = document.getElementById("input-count");
const outputCount = document.getElementById("output-count");
const modeDetail = document.getElementById("mode-detail");
const statusText = document.getElementById("status-text");
const letterTotal = document.getElementById("letter-total");
const frequencyChart = document.getElementById("frequency-chart");
const bruteForceList = document.getElementById("brute-force-list");

const ALPHABET_SIZE = 26;
const A_CODE = "A".charCodeAt(0);
const Z_CODE = "Z".charCodeAt(0);
const LOWER_A_CODE = "a".charCodeAt(0);
const LOWER_Z_CODE = "z".charCodeAt(0);
const SAMPLES = [
  "Meet me by the west gate at dawn.",
  "Wklv phvvdjh zdv vkliwhg ebrqg wkh vhqwlqho.",
  "Knowledge is power, but curiosity opens the door.",
];

let mode = "encode";
let sampleIndex = 0;

function normalizeShift(value) {
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric)) return 0;
  return ((numeric % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
}

function transformLetter(char, shift, preserveLetterCase) {
  const code = char.charCodeAt(0);
  const isUpper = code >= A_CODE && code <= Z_CODE;
  const isLower = code >= LOWER_A_CODE && code <= LOWER_Z_CODE;

  if (!isUpper && !isLower) return char;

  const base = isLower ? LOWER_A_CODE : A_CODE;
  const shiftedCode = ((code - base + shift) % ALPHABET_SIZE) + base;
  const shiftedChar = String.fromCharCode(shiftedCode);

  return preserveLetterCase ? shiftedChar : shiftedChar.toUpperCase();
}

function groupInFives(value) {
  const compact = value.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return compact.match(/.{1,5}/g)?.join(" ") || "";
}

function caesar(value, shift, options = {}) {
  const effectiveShift = options.decode ? -shift : shift;
  const transformed = Array.from(value, (char) =>
    transformLetter(char, effectiveShift, options.preserveCase)
  ).join("");

  return options.groupOutput ? groupInFives(transformed) : transformed;
}

function countLetters(value) {
  const counts = Array.from({ length: ALPHABET_SIZE }, () => 0);
  let total = 0;

  for (const char of value.toUpperCase()) {
    const code = char.charCodeAt(0);
    if (code >= A_CODE && code <= Z_CODE) {
      counts[code - A_CODE] += 1;
      total += 1;
    }
  }

  return { counts, total };
}

function setMode(nextMode) {
  mode = nextMode;
  encodeMode.classList.toggle("active", mode === "encode");
  decodeMode.classList.toggle("active", mode === "decode");
  encodeMode.setAttribute("aria-pressed", String(mode === "encode"));
  decodeMode.setAttribute("aria-pressed", String(mode === "decode"));
  render();
}

function setShift(value) {
  const shift = normalizeShift(value);
  shiftRange.value = String(shift);
  shiftNumber.value = String(shift);
  shiftValue.textContent = String(shift);
  render();
}

function renderFrequency(value) {
  const { counts, total } = countLetters(value);
  const max = Math.max(...counts, 1);
  frequencyChart.innerHTML = "";
  letterTotal.textContent = `${total} ${total === 1 ? "letter" : "letters"}`;

  counts.forEach((count, index) => {
    const letter = String.fromCharCode(A_CODE + index);
    const height = total ? Math.max(4, Math.round((count / max) * 118)) : 4;
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.title = `${letter}: ${count}`;
    bar.innerHTML = `<div class="bar-fill" style="height:${height}px"></div><strong>${letter}</strong>`;
    frequencyChart.appendChild(bar);
  });
}

function renderBruteForce(value) {
  bruteForceList.innerHTML = "";

  for (let shift = 0; shift < ALPHABET_SIZE; shift += 1) {
    const candidate = document.createElement("div");
    candidate.className = "candidate";
    const decoded = caesar(value, shift, {
      decode: true,
      preserveCase: preserveCase.checked,
      groupOutput: false,
    });
    candidate.innerHTML = `<strong>${shift}</strong><span>${decoded || "No input"}</span>`;
    bruteForceList.appendChild(candidate);
  }
}

function render() {
  const shift = normalizeShift(shiftRange.value);
  const result = caesar(inputText.value, shift, {
    decode: mode === "decode",
    preserveCase: preserveCase.checked,
    groupOutput: groupOutput.checked,
  });

  outputText.value = result;
  inputCount.textContent = `${inputText.value.length} chars`;
  outputCount.textContent = `${result.length} chars`;
  modeDetail.textContent = `${mode === "encode" ? "Encoding" : "Decoding"} with shift ${shift}`;
  statusText.textContent = "Ready";
  renderFrequency(inputText.value);
  renderBruteForce(inputText.value);
}

encodeMode.addEventListener("click", () => setMode("encode"));
decodeMode.addEventListener("click", () => setMode("decode"));
shiftRange.addEventListener("input", () => setShift(shiftRange.value));
shiftNumber.addEventListener("input", () => setShift(shiftNumber.value));
shiftDown.addEventListener("click", () => setShift(normalizeShift(Number(shiftRange.value) - 1)));
shiftUp.addEventListener("click", () => setShift(normalizeShift(Number(shiftRange.value) + 1)));
inputText.addEventListener("input", render);
preserveCase.addEventListener("change", render);
groupOutput.addEventListener("change", render);

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(outputText.value);
    statusText.textContent = "Copied";
  } catch {
    outputText.select();
    document.execCommand("copy");
    statusText.textContent = "Copied";
  }
});

swapButton.addEventListener("click", () => {
  inputText.value = outputText.value;
  setMode(mode === "encode" ? "decode" : "encode");
  inputText.focus();
});

clearButton.addEventListener("click", () => {
  inputText.value = "";
  inputText.focus();
  render();
});

sampleButton.addEventListener("click", () => {
  sampleIndex = (sampleIndex + 1) % SAMPLES.length;
  inputText.value = SAMPLES[sampleIndex];
  inputText.focus();
  render();
});

setShift(3);
