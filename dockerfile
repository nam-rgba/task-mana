FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build
RUN cp -r src/ui dist/ui

EXPOSE 3000

CMD ["npm", "start"]