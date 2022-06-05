FROM node:18.2.0-alpine as builder
RUN mkdir /app
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build

FROM node:18.0.0-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/build ./
RUN npm install --only=production
CMD ["lib/app.js"]
