FROM node:18.18.1-alpine as builder
RUN mkdir /app
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build

FROM node:18.18.1-alpine
RUN apk update && apk add --no-cache git
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/build ./
RUN npm install --only=production
CMD ["lib/app.js"]
