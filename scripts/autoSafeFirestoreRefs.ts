#!/usr/bin/env tsx
/**
 * 🔧 Auto Safe Firestore Refs
 * Scans and patches Next.js Firestore collection pages/components
 * to ensure array defaults, loading/empty guards, and safer rendering.
 */

import fs from "fs"
import path from "path"

const SRC_DIR = path.join(process.cwd(), "src")

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = entries.flatMap((entry) => {
    const res = path.resolve(dir, entry.name)
    return entry.isDirectory() ? walk(res) : res
  })
  return files.filter((f) => f.endsWith(".tsx"))
}

function patchFile(filePath: string) {
  let code = fs.readFileSync(filePath, "utf8")

  // 1️⃣ Add `useState` and `useEffect` imports if Firestore is used but not imported
  if (code.includes('collection(') && !code.includes('useState')) {
    code = code.replace(
      /("|')use client("|')/,
      `"use client"\nimport { useState, useEffect } from "react"`
    )
  }

  // 2️⃣ Ensure initialization of Firestore array states
  if (code.match(/const\s*\[\s*\w+,\s*set\w+\s*\]\s*=\s*useState\(\)/)) {
    code = code.replace(/useState\(\)/g, "useState<any[]>([])")
  }

  // 3️⃣ Replace risky array calls `.filter(` / `.map(` / `.length` with safe optional chaining
  code = code.replace(/(\w+)\.filter\(/g, "($1 || []).filter(")
  code = code.replace(/(\w+)\.map\(/g, "($1 || []).map(")
  code = code.replace(/(\w+)\.length/g, "($1?.length || 0)")

  // 4️⃣ Inject loading guards (only if Firestore usage detected)
  if (code.includes("collection(") && !code.includes("loading") && !code.includes("Loading")) {
    code += `\n\n// 🔒 Auto-added loading guard\nif (loading) return <p>Loading...</p>\nif (!items?.length) return <p>No data found.</p>\n`
  }

  fs.writeFileSync(filePath, code, "utf8")
  console.log(`✅ Patched: ${path.relative(SRC_DIR, filePath)}`)
}

function main() {
  console.log("🚀 Auto-safing Firestore data access patterns...")
  const files = walk(SRC_DIR)
  const firestoreFiles = files.filter((f) => fs.readFileSync(f, "utf8").includes("collection("))
  console.log(`Found ${firestoreFiles.length} Firestore-based files.`)
  firestoreFiles.forEach(patchFile)
  console.log("✨ Done! Review your diffs carefully before committing.")
}

main()
