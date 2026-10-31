import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    // Database tests share one test database, so files run one after another.
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    env: { NODE_ENV: 'test' },
  },
});
