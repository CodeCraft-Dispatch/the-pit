export default {
  mutate: ["tools/lib/**/*.mjs"],
  testRunner: "command",
  commandRunner: {
    command: "npm run test:knowledge",
  },
  coverageAnalysis: "off",
  reporters: ["clear-text", "progress", "html"],
  thresholds: {
    high: 90,
    low: 80,
    break: 50,
  },
};
