module.exports = {
  preset: 'ts-jest',
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)', '**/?(*.)+(test|spec).(ts|tsx)'],
   transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.test.json" }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  clearMocks: true,
};

// What each part does
// preset: 'ts-jest' lets Jest run TypeScript files directly.

// testEnvironment: 'jsdom' gives your tests a browser-like DOM, which React needs.

// setupFilesAfterEnv loads your shared test setup before tests run.

// moduleNameMapper handles CSS and image imports that Jest cannot read by default.

// testMatch tells Jest which files are test files.

// clearMocks: true resets mock state between tests.
// <rootDir> means “the root folder of your project.” You do not replace it with a fixed name most of the time; Jest replaces it automatically with your project’s root path.
