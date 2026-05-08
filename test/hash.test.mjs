import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const source = readFileSync("hash-cracker-wordlist/app.js", "utf8");
const md5Start = source.indexOf("function md5(input)");

assert.notEqual(md5Start, -1, "md5 function should exist");

const md5Source = source.slice(md5Start);
const md5 = Function(`${md5Source}; return md5;`)();

const samples = ["", "password", "correcthorsebatterystaple", "open-sesame"];

for (const sample of samples) {
  const expected = createHash("md5").update(sample).digest("hex");
  assert.equal(md5(sample), expected, `MD5 should match Node crypto for ${sample || "empty string"}`);
}

const sha256 = createHash("sha256").update("correcthorsebatterystaple").digest("hex");
assert.equal(
  sha256,
  "cbe6beb26479b568e5f15b50217c6c83c0ee051dc4e522b9840d8e291d6aaf46",
  "sample SHA-256 target should stay stable"
);

console.log("Hash tests passed");
