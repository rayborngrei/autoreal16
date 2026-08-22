import JSZip from "jszip";
import { PROJECT_FILES, ZIP_NAME } from "./projectFiles";

/** Собирает все исходники проекта в ZIP и скачивает его в браузере. */
export async function downloadProjectZip(): Promise<number> {
  const zip = new JSZip();
  const root = zip.folder("autosklad-24");
  if (!root) throw new Error("zip folder");
  for (const [path, content] of Object.entries(PROJECT_FILES)) {
    root.file(path, content);
  }
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = ZIP_NAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return Object.keys(PROJECT_FILES).length;
}
