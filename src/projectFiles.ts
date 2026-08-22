/* Манифест исходников проекта.
   Vite подставляет реальное содержимое каждого файла при сборке (?raw-импорт),
   поэтому архив всегда соответствует текущей версии кода. */
import readme from "../README.md?raw";
import pkg from "../package.json?raw";
import tsconfig from "../tsconfig.json?raw";
import viteConfig from "../vite.config.js?raw";
import indexHtml from "../index.html?raw";

import mainTsx from "./main.tsx?raw";
import appTsx from "./App.tsx?raw";
import indexCss from "./index.css?raw";
import typesTs from "./types.ts?raw";
import speechTs from "./speech.ts?raw";
import seedTs from "./seed.ts?raw";
import viteEnv from "./vite-env.d.ts?raw";
import projectFiles from "./projectFiles.ts?raw";
import downloadZip from "./downloadZip.ts?raw";

import iconsTsx from "./components/icons.tsx?raw";
import carCardTsx from "./components/CarCard.tsx?raw";
import intakeModalTsx from "./components/IntakeModal.tsx?raw";

export const PROJECT_FILES: Record<string, string> = {
  "README.md": readme,
  "package.json": pkg,
  "tsconfig.json": tsconfig,
  "vite.config.js": viteConfig,
  "index.html": indexHtml,
  "src/main.tsx": mainTsx,
  "src/App.tsx": appTsx,
  "src/index.css": indexCss,
  "src/types.ts": typesTs,
  "src/speech.ts": speechTs,
  "src/seed.ts": seedTs,
  "src/vite-env.d.ts": viteEnv,
  "src/projectFiles.ts": projectFiles,
  "src/downloadZip.ts": downloadZip,
  "src/components/icons.tsx": iconsTsx,
  "src/components/CarCard.tsx": carCardTsx,
  "src/components/IntakeModal.tsx": intakeModalTsx,
};

export const ZIP_NAME = "autosklad-24-source.zip";
