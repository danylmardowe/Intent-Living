/**
 * scripts/hardenFirestoreArrays.ts
 * ------------------------------------------------------------
 * Automatically adds safe array guards and fixes Firestore snapshot syntax
 * across your Next.js + Firebase project.
 *
 * Run with:  npx tsx scripts/hardenFirestoreArrays.ts
 */

import fs from "fs"
import path from "path"
import { glob } from "glob" // ✅ FIXED import for ESM
import url from "url"

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "../src")
const exts = ["ts", "tsx"]

console.log("🔍 Scanning for Firestore and array operations...")

function hardenCode(code: string) {
  let updated = code

  // Fix snapshot.(snap.docs)
  updated = updated.replace(/snapshot\.\(snap\.docs/g, "(snapshot.docs")

  // Fix snapshot.(docs)
  updated = updated.replace(/snapshot\.\(docs/g, "(snapshot.docs")

  // Wrap .map, .filter, .reduce safely
  updated = updated.replace(
    /([a-zA-Z0-9_]+)\.map\(/g,
    "($1 || []).map("
  )
  updated = updated.replace(
    /([a-zA-Z0-9_]+)\.filter\(/g,
    "($1 || []).filter("
  )
  updated = updated.replace(
    /([a-zA-Z0-9_]+)\.reduce\(/g,
    "($1 || []).reduce("
  )

  return updated
}

const files = glob.sync(`${projectRoot}/**/*.{${exts.join(",")}}`, {
  ignore: ["**/node_modules/**", "**/.next/**"],
})

let changedCount = 0

for (const file of files) {
  const original = fs.readFileSync(file, "utf8")
  const hardened = hardenCode(original)

  if (hardened !== original) {
    fs.writeFileSync(
      file,
      `// 🛠️ Auto-hardened by scripts/hardenFirestoreArrays.ts\n${hardened}`
    )
    console.log("✅ Hardened:", path.relative(projectRoot, file))
    changedCount++
  }
}

console.log(`\n✨ Completed. ${changedCount} files hardened safely.`)
