FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat python3 make g++

WORKDIR /app

COPY . .

RUN rm -rf node_modules/.prisma/client apps/*/dist dist .turbo

RUN npm ci

ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

RUN npx turbo run build --filter=@intervu-ai/worker

CMD ["npm", "run", "--workspace=@intervu-ai/worker", "start"]
