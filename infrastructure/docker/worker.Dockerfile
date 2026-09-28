FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY . .

RUN rm -rf node_modules/.prisma/client apps/*/dist dist .turbo

RUN npm ci

ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

RUN npm run build

CMD ["npm", "run", "--workspace=@intervu-ai/worker", "start"]
