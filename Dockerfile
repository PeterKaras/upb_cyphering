# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install Nest.js CLI globally
RUN npm install -g @nestjs/cli

# Install application dependencies
RUN npm install
RUN npm i bcrypt
RUN npm i crypto

# Copy the rest of the application code to the container
COPY . .

# Expose the port on which your backend server will run (if different from the Docker Compose port)
EXPOSE 8000

# Define the command to run your script (modify as needed)
CMD ["npm", "start"]
