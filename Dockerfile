# Use Node.js LTS as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Install dependencies for the monorepo
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose ports used by each service (adjust if necessary)
EXPOSE 3000 3001 3002

# Command to run all services concurrently
CMD ["npm", "run", "start-all"]
