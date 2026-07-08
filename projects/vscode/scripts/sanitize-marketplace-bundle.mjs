#!/usr/bin/env node

// Marketplace spam scanners flag short-link domains (goo.gl, bit.ly, etc.) even when
// they appear only in third-party library error strings inside dist/extension.js.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const bundlePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist", "extension.js")

if (!fs.existsSync(bundlePath)) {
	console.warn("sanitize-marketplace-bundle: dist/extension.js missing, skipping")
	process.exit(0)
}

const replacements = [
	[/http:\/\/goo\.gl\//g, "https://github.com/petkaantonov/bluebird/"],
	[/https:\/\/goo\.gl\//g, "https://github.com/petkaantonov/bluebird/"],
]

let source = fs.readFileSync(bundlePath, "utf8")
let changed = 0
for (const [pattern, value] of replacements) {
	const next = source.replace(pattern, value)
	if (next !== source) {
		changed += (source.match(pattern) ?? []).length
		source = next
	}
}

if (changed > 0) {
	fs.writeFileSync(bundlePath, source)
	console.log(`sanitize-marketplace-bundle: rewrote ${changed} short-link string(s) in dist/extension.js`)
}
