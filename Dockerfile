FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Set default environment variable for port
ENV PORT=80

# Expose the port the app runs on
EXPOSE 80

# Define the command to run the app
CMD [ "node", "server.js" ]

