import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsEslintParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/coverage/**",
      "apps/api/src/modules/generation/**",
      "apps/api/src/modules/generation-ai/**",
      "apps/api/src/modules/template-library/services/solution-template*.*",
    ],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsEslintParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsEslintPlugin,
    },
    rules: {
      ...tsEslintPlugin.configs.recommended.rules,
      "no-restricted-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: ["class", "interface", "typeAlias"],
          format: ["PascalCase"],
          custom: {
            regex: "(Payload|Body|DataObject)$",
            match: false,
          },
        },
      ],
    },
  },
  eslintConfigPrettier,
];
