FROM node:slim AS builder
WORKDIR /ws
COPY . .
RUN npm i -g pnpm && pnpm i && pnpm build
CMD ["node", "dist/index.js"]