import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig({
    root: true,
    env: {
        node: true,
        es2024: true,
        jest: true,
    },
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    files: ["**/*.ts", "**/*.js", "src/tests/**/*.ts", "tests/**/*.js"],
    languageOptions: {
        globals: {
            ...globals.jest,
            ...globals.node,
            ...globals.es2024,
        },
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
    ],
    rules: {
        // Add any custom rules here
        'no-unused-vars': 'warn',
        'no-undef': 'warn',
    },
});