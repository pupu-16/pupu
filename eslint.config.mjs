import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".next/**",
      ".next-atmosphere/**",
      ".agents/**",
      "node_modules/**",
      "dev-server.log",
      "dev-server.err"
    ]
  },
  ...nextVitals,
  ...nextTypescript
];

export default config;
