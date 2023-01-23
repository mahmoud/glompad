import config from "./playwright.config.js";

const devConfig = {
  ...config,

  webServer: {
    command: "pnpm exec vite --port 5775 --strictPort",
    port: 5775,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
};

if (devConfig.use) {
  devConfig.use.baseURL = "http://localhost:5775";
}

export default devConfig;
