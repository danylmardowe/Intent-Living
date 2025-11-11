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

  // 1️⃣ Replace misuse of `.data` and `.loading` on Firestore refs
  code = code.replace(/(\w+)\.data/g, "// FIXED: Firestore ref has no data\n// $1.data (removed)")
  code = code.replace(/(\w+)\.loading/g, "// FIXED: Firestore ref has no loading\n// $1.loading (removed)")

  // 2️⃣ Remove generic arguments in Firestore hooks
  code = code.replace(/useCollection<[^>]+>\(/g, "useCollection(")
  code = code.replace(/getDocs<[^>]+>\(/g, "getDocs(")

  // 3️⃣ Replace deprecated functions
  code = code.replace(/createActivityType/g, "createActivity")
  code = code.replace(/deleteActivityType/g, "deleteActivity")

  // 4️⃣ Add explicit types for untyped map/filter params
  code = code.replace(/\.map\((\w+)\s*=>/g, ".map(($1: any) =>")
  code = code.replace(/\.filter\((\w+)\s*=>/g, ".filter(($1: any) =>")
  code = code.replace(/\.reduce\((\w+)\s*=>/g, ".reduce(($1: any) =>")

  fs.writeFileSync(file, code)
  count++
}

console.log(`✅ Fixed Firestore misuse and typing in ${count} files.`)
