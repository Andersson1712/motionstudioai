# Build desde la raíz del repo: usa la misma composición del editor (src/remotion).
FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 libxkbcommon-dev \
    libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 \
    fonts-noto-color-emoji fonts-inter fonts-liberation ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY render-worker/package.json ./
RUN npm install --omit=dev
COPY render-worker/ ./
COPY src/remotion ./app-src/remotion
COPY src/lib/hyperframes.ts src/lib/types.ts ./app-src/lib/
RUN npx remotion browser ensure
CMD ["node", "index.mjs"]
