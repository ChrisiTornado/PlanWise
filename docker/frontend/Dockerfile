FROM docker.io/node:20-bookworm-slim

WORKDIR /frontend

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4200

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--poll", "2000"]
