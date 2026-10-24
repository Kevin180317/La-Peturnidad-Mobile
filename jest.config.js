module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/test/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/legacy/", "/supabase/"],
  // Floor just under current coverage; raise as tests are added.
  coverageThreshold: {
    global: { statements: 12, branches: 9, functions: 10, lines: 12 },
  },
  collectCoverageFrom: ["services/**/*.ts", "utils/**/*.ts", "components/**/*.tsx"],
};
