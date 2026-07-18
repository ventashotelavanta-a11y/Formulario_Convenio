import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      SESSION_SECRET: 'test-secret',
    },
  },
})
