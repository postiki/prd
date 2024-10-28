FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx tsc

ENV NODE_ENV=production

CMD ["node", "./dist/index.js"]
