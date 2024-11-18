import globals from "globals";

import tseslint from "typescript-eslint";

import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    eslintConfigPrettier,
    {
        languageOptions: {
            ecmaVersion: 14,
            sourceType: "module",
            globals: {
                ...globals.node,
                ...globals.es6,
                ...globals.commonjs
            },
            parserOptions: {
                parserService: {
                    defaultProject: "tsconfig.json",
                },
                tsconfigRootDir: import.meta.dirname,
                project: "./tsconfig.json",
            }
        },
        ignores: [
            "out/",
            "dist/",
            "**/*.d.ts",
            "./vscodeUninstall.mjs",
            "web",
        ],
        files: ["src/**/*.mts"],
        rules: {
            "@typescript-eslint/naming-convention": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-expressions": ["error", { "allowShortCircuit": true }],
            "@typescript-eslint/dot-notation": ["error", { "allowKeywords": true }],
            "@typescript-eslint/no-empty-function": ["warn", { "allow": ["arrowFunctions"] }],
            "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
            "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
            "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
            "@typescript-eslint/consistent-type-exports": "error",
            "@typescript-eslint/no-unsafe-return": "off",
            "semi": "warn",
            curly: "warn",
            eqeqeq: "warn",
            "no-throw-literal": "warn",
            semi: "off",
            "no-mixed-requires": "error",
            "no-this-before-super": "warn",
            "no-unreachable": "warn",
            "no-unused-vars": "off",
            "max-len": ["warn", { code: 80, comments: 100, ignoreComments: false }],
            "no-fallthrough": "warn",
            "newline-before-return": "warn",
            "no-return-await": "warn",
            "arrow-body-style": ["error", "as-needed"],
            "no-unexpected-multiline": "error",
            "prefer-const": "warn",
        }
    }
);
