/**
 * 🔧 Firestore Docs Reference Auto-Fix Script (Enhanced)
 *
 * Fixes common Firestore snapshot issues:
 *   - snap.(docs) → snap.docs
 *   - snapshot.(docs) → snapshot.docs
 *   - snapshot.(snap.docs) → snapshot.docs
 *   - Adds safety: (snap.docs || []) where appropriate
 *   - Adds (d: any) typing to .map() calls
 *
 * Run with:
 *   npx tsx scripts/fixFirestoreDocsReference.ts
 */

import fs from "fs"
import path from "path"
import { glob } from "glob"

const SRC_DIR = path.resolve(process.cwd(), "src")

/**
 * Fixes invalid Firestore snapshot references in a file's code.
 */
function fixFirestoreReferences(code: string): string {
  let fixed = code

  // 🧹 Fix malformed doc references
  fixed = fixed
    .replace(/\b(snapshot|snap)\.\(docs\)/g, "$1.docs") // e.g. snap.(docs)
    .replace(/\b(snapshot|snap)\.\(snap\.docs\)/g, "$1.docs") // e.g. snapshot.(snap.docs)
    .replace(/\b(snapshot|snap)\.snap\.docs/g, "$1.docs") // e.g. snapshot.snap.docs

  // 🩹 Add null-safe fallbacks for doc iteration
  fixed = fixed.replace(
    /(\b(snapshot|snap)\.docs)(\.map\()/g,
    "($1 || [])$3"
  )

  // 🧠 Add (d: any) typing to map parameters if missing
  fixed = fixed.replace(
    /\.map\(\s*\((\w+)\)\s*=>/g,
    ".map(($1: any) =>"
  )

  return fixed
}

/**
 * Back up the original file before making changes.
 */
function backupFile(filePath: string) {
  const backupPath = filePath + ".bak"
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath)
  }
}

/**
 * Recursively scans the src directory and applies fixes.
 */
function fixAllFiles() {
  console.log("🔍 Scanning for Firestore snapshot reference issues...")

  const files = glob.sync(`${SRC_DIR}/**/*.{ts,tsx}`, {
    ignore: ["**/node_modules/**", "**/.next/**"],
  })

  let changedCount = 0

  for (const file of files) {
    const code = fs.readFileSync(file, "utf8")
    const fixed = fixFirestoreReferences(code)

    if (code !== fixed) {
      backupFile(file)
      fs.writeFileSync(file, fixed, "utf8")
      changedCount++
      console.log(`✅ Fixed Firestore references in: ${path.relative(SRC_DIR, file)}`)
    }
  }

  if (changedCount === 0) {
    console.log("✨ No issues found. All files are clean.")
  } else {
    console.log(`🎉 Completed! Fixed Firestore issues in ${changedCount} file(s).`)
  }
}

fixAllFiles()
