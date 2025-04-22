FROM node:23.10.0 AS builder

# Set the working directory
WORKDIR /app

COPY package*.json ./

# Install production dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application files
COPY . .

# Build the application
RUN npm run build

FROM node:22.12.0-bullseye-slim AS runner

COPY --from=builder /app/.next/standalone ./standalone
COPY --from=builder /app/public ./standalone/public 
COPY --from=builder /app/.next/static ./standalone/.next/static

# Expose the Next.js default port
EXPOSE 3000

# Start the Next.js app
CMD ["node", "./standalone/server.js"]
