# Use the official Node.js 18 Bullseye image as the base image
FROM node:20-alpine AS src-builder

# Set the working directory inside the container
WORKDIR /app/src

COPY src/package.json src/yarn.lock ./

RUN yarn install --frozen-lockfile

COPY src ./

RUN yarn build


FROM node:20-alpine AS server-builder

WORKDIR /app/server

COPY server/package.json server/yarn.lock ./

RUN yarn install --frozen-lockfile

COPY server/ ./

# Update Prisma client
RUN npx prisma generate

RUN yarn build


FROM node:20-alpine

WORKDIR /app

COPY --from=src-builder /app/dist/frontend-build ./frontend-build
COPY --from=server-builder /app/dist/server-build ./server-build
COPY --from=server-builder /app/server/node_modules ./server-build/node_modules
COPY --from=server-builder /app/server/package.json ./server-build/package.json

COPY package.json ./

EXPOSE 4000

CMD [ "yarn", "run", "start:prod" ]