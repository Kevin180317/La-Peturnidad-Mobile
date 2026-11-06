module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/test/setup.ts"],
  // Con caché frío (CI, --coverage) el primer render compila React Native y puede pasar de los 5 s por defecto
  testTimeout: 20000,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/legacy/", "/supabase/"],
  // Floor just under current coverage; raise as tests are added.
  coverageThreshold: {
    global: { statements: 27, branches: 22, functions: 23, lines: 28 },
  },
  collectCoverageFrom: ["services/**/*.ts", "utils/**/*.ts", "components/**/*.tsx"],
};
