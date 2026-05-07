# Wordlist Hash Cracker

A standalone browser tool for checking a hash against a local wordlist. It runs entirely client-side and makes no network calls.

## Use

Open `index.html` in a browser. No install step or server is required.

## Features

- Supports MD5, SHA-1, SHA-256, SHA-384, and SHA-512
- Paste a wordlist or load a `.txt`, `.lst`, or `.dic` file
- Optional salt prefix and suffix
- Candidate trimming, empty-line skipping, lowercase copies, and uppercase copies
- Live status, checked count, speed, run log, and copyable match

Only use this with hashes and wordlists you are authorized to test.
