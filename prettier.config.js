/** @type {import('prettier').Config} */
module.exports = {
  // Core formatting options
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  
  // Plugin configurations
  plugins: [
    'prettier-plugin-tailwindcss',
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-organize-attributes',
  ],
  
  // Import sorting configuration
  importOrder: [
    '^react$',
    '^next',
    '<THIRD_PARTY_MODULES>',
    '^@/types/(.*)$',
    '^@/lib/(.*)$',
    '^@/store/(.*)$',
    '^@/components/(.*)$',
    '^@/app/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderBuiltinModulesToTop: true,
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderMergeDuplicateImports: true,
  importOrderCombineTypeAndValueImports: true,
  
  // Tailwind CSS class sorting
  tailwindConfig: './tailwind.config.js',
  tailwindFunctions: ['clsx', 'cn', 'cva'],
  
  // HTML attribute organization
  attributeGroups: [
    '^(id|key)$',
    '^(name|type)$',
    '^(class|className)$',
    '^(src|href|alt)$',
    '^(width|height)$',
    '^(data-|aria-)',
    '^on[A-Z].*',
    '$DEFAULT',
  ],
  
  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2,
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.css',
      options: {
        singleQuote: false,
      },
    },
    {
      files: '*.scss',
      options: {
        singleQuote: false,
      },
    },
    {
      files: '*.html',
      options: {
        printWidth: 120,
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.svg',
      options: {
        parser: 'html',
        printWidth: 120,
      },
    },
    {
      files: 'package.json',
      options: {
        tabWidth: 2,
        printWidth: 80,
      },
    },
    {
      files: '*.config.{js,ts}',
      options: {
        printWidth: 120,
        singleQuote: true,
      },
    },
    {
      files: '*.test.{js,ts,jsx,tsx}',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.spec.{js,ts,jsx,tsx}',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.stories.{js,ts,jsx,tsx}',
      options: {
        printWidth: 120,
      },
    },
  ],
};