# Reproducible Playwright runner image — use this for CI and local debug parity.
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY . .

# Default to running smoke against stage — override via docker run -e ENV=...
ENV ENV=stage
CMD ["npx", "playwright", "test", "tests/smoke"]
