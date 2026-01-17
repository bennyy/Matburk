// eslint.config.js
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  // Basconfig för modern JS
  js.configs.recommended,

  // React-specifik config
  {
    files: ['**/*.{js,jsx}'], // Kör för JS och JSX
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        alert: 'readonly',
        document: 'readonly',
        FormData: 'readonly',
        window: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // Viktigt för JSX-parsing
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect', // Automatisk React-version
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off', // React 17+ behöver ej import React
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error', // Hooks måste följas strikt
      'react-hooks/exhaustive-deps': 'warn', // Missing deps i useEffect
    },
  },

  // Prettier - stänger av regler som kolliderar med formattering
  prettier,
];
