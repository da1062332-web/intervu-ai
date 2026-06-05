module.exports = {
  root: true,

  parser: "@typescript-eslint/parser",

  plugins: ["@typescript-eslint"],

  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],

  env: {
    node: true,
    es2022: true,
  },

  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/consistent-type-imports": "error",
  },
};
