import fs from "fs"
import path from "path"
import { glob } from "glob"
import url from "url"

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "../src")

const files = glob.sync(`${root}/**/*.{ts,tsx}`, {
  ignore: ["**/node_modules/**", "**/.next/**"]
})

let count = 0

for (const file of files) {
  let code = fs.readFileSync(file, "utf8")

  // 🔧 Fix `snap.(docs || [])` → `(snap.docs || [])`
  code = code.replace(/snap\.\(docs\s*\|\|\s*\[\]\)/g, "(snap.docs || [])")
  code = code.replace(/snapshot\.\(docs\s*\|\|\s*\[\]\)/g, "(snapshot.docs || [])")

  // 🔧 Fix `return` usage outside functions (from auto-added guards)
  code = code.replace(/\/\/ 🔒 Auto-added loading guard[\s\S]*?(?=if\s*\(!items\?\.length\)|if\s*\(loading\))/g, "")
  code = code.replace(/\bif\s*\(loading\)\s*return\s*<p>Loading[^;]+;/g, "")
  code = code.replace(/\bif\s*\(!items\?\.\s*length\)\s*return\s*<p>No data[^;]+;/g, "")

  // 🔧 Remove stray comment stubs like "// FIXED: Firestore ref has no data"
  code = code.replace(/\/\/ FIXED:[^\n]+/g, "")

  // 🔧 Fix broken "d.data (removed)" references
  code = code.replace(/\.\.\.\/\/\s*d\.data\s*\(removed\)\(\)/g, "...d.data()")

  // 🔧 Clean up multi-line comment fragments left over
  // new (compatible with ES6+)
code = code.replace(/\(\/\/[\s\S]*?\)/g, "")

  code = code.replace(/\s{2,}/g, " ")

  fs.writeFileSync(file, code)
  count++
}

console.log(`✅ Firestore syntax and guard cleanup applied to ${count} files.`)
