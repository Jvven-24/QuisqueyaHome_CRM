import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "referencia-prototipo/**",
      ".next/**",
      ".next-prod/**",
      // Evidencia de agentes (scripts de captura del QA), no código del producto.
      ".viltrum/**",
      // Worktrees de agentes: no forman parte del código del producto.
      ".claude/**",
      "node_modules/**",
      "next-env.d.ts",
      "scripts/**",
    ],
  },
];

export default eslintConfig;
