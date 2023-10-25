FROM node:16

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install

# Copy the installation script into the container
COPY install_dependencies.sh /app/install_dependencies.sh

# Make the script executable
RUN chmod +x /app/install_dependencies.sh

# Run the script to install dependencies
# RUN /app/install_dependencies.sh

# Copy your application code
COPY . .

CMD ["npm", "start"]