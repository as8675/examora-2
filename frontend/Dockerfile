# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Ensure .env.production is available for Vite production mode
COPY .env.production .env.production

RUN echo "VITE_API_BASE_URL=http://examora-alb-945905355.us-east-1.elb.amazonaws.com" > .env.production

# FORCE Vite to use production mode (reads .env.production)
RUN npm run build -- --mode production

EXPOSE 8080
CMD ["./node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "8080"]