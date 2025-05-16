FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port for dev server
EXPOSE 3000

# Start NextJS in development mode with hot reloading
CMD ["npm", "run", "dev"]
