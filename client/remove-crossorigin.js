import fs from "fs";
import path from "path";

const distPath = "./dist";
const htmlFiles = fs
  .readdirSync(distPath)
  .filter((file) => file.endsWith(".html"));

htmlFiles.forEach((file) => {
  const filePath = path.join(distPath, file);
  let content = fs.readFileSync(filePath, "utf8");

  // Remove crossorigin attributes
  content = content.replace(/\s*crossorigin/g, "");

  fs.writeFileSync(filePath, content);
  console.log(`Removed crossorigin from ${file}`);
});
