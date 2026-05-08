# Wordlist Hash Cracker

A standalone browser tool for checking a hash against a local wordlist. It runs entirely client-side and makes no network calls.

## Live Demo

Use the GitHub Pages version:

[`https://code-wir.github.io/hash-cracker-wordlist/`](https://code-wir.github.io/hash-cracker-wordlist/)

## Open the Tool

Open [`hash-cracker-wordlist/index.html`](./hash-cracker-wordlist/index.html) in a browser.

No install step or server is required.

## Features

- Supports MD5, SHA-1, SHA-256, SHA-384, and SHA-512
- Paste a wordlist or load a `.txt`, `.lst`, or `.dic` file
- Optional salt prefix and suffix
- Candidate trimming, empty-line skipping, lowercase copies, and uppercase copies
- Live status, checked count, speed, run log, and copyable match

## Checks

Run the project checks with:

```sh
node --check hash-cracker-wordlist/app.js
node test/hash.test.mjs
```

## Responsible Use

Only use this with hashes and wordlists you own or are authorized to test.
