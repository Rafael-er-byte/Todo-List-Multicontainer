FROM node:24
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./

RUN corepack enable && corepack install 

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild esbuild

COPY . .
EXPOSE 3000

CMD ["pnpm", "dev"]
