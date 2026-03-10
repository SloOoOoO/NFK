FROM node:20-alpine

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies like vite)
# Use npm ci for reproducible installs from lockfile
# Fall back to npm install if no lockfile exists
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code (node_modules excluded by .dockerignore)
COPY . .

EXPOSE 5173

# Use the locally installed vite directly, not npx
CMD ["./node_modules/.bin/vite", "--host", "0.0.0.0"]
