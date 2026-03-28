# Use a lightweight Node.js image
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Playwright browsers
RUN npx playwright install

# Copy the rest of the backend source code
COPY . .

# Expose the port your Express server runs on (assuming 5000 or 8080)
EXPOSE 3000

# Command to start the server
CMD ["node", "server.js"]