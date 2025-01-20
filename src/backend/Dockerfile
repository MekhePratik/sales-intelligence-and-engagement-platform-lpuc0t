####################################################################################################
# Multi-stage Docker configuration file for building and running the backend service               #
# Project: B2B Sales Intelligence and Engagement Platform                                          #
# Description: Provides an optimized Node.js v18.17+ Alpine multi-stage build for production        #
# with advanced security measures, minimal layers, and performance-focused configurations.          #
####################################################################################################

####################################################################################################
# Stage 1: builder                                                                                 #
# -------------------------------------------------------------------------------------------------#
# Purpose:                                                                                          #
#   - Use Node.js 18.17-alpine (# node: 18.17-alpine) to keep image size small.                     #
#   - Install all necessary build dependencies (git, python3, make, g++).                           #
#   - Use pnpm (v8.x) for faster, disk-efficient dependency installation.                           #
#   - Compile the TypeScript code and build Prisma client.                                          #
#   - Remove development dependencies and build packages to keep final image minimal.               #
####################################################################################################
FROM node:18.17-alpine AS builder

# --------------------------------------------------------------------------------------------------
# Set environment variables for the builder stage
# NODE_ENV=production ensures that dependencies installed are production-first.
# PNPM_HOME and PATH ensure pnpm is globally available.
# HUSKY=0 disables husky scripts during container build to avoid unnecessary overhead.
# --------------------------------------------------------------------------------------------------
ENV NODE_ENV=production \
    PNPM_HOME=/usr/local/share/pnpm \
    PATH=${PNPM_HOME}:${PATH} \
    HUSKY=0

# --------------------------------------------------------------------------------------------------
# Set working directory for the builder stage
# All subsequent commands are run inside /usr/src/app
# --------------------------------------------------------------------------------------------------
WORKDIR /usr/src/app

# --------------------------------------------------------------------------------------------------
# Install build dependencies: git, python3, make, g++, etc.
# We'll name this container layer as .build-deps so we can remove it later.
# --------------------------------------------------------------------------------------------------
RUN apk add --no-cache --virtual .build-deps \
  git \
  python3 \
  make \
  g++

# --------------------------------------------------------------------------------------------------
# Install pnpm package manager globally (v8.x) using npm
# We rely on Node.js 18.17-alpine's built-in npm for this operation.
# --------------------------------------------------------------------------------------------------
RUN npm install -g pnpm@8

# --------------------------------------------------------------------------------------------------
# Copy package.json and pnpm-lock.yaml from the project,
# which are important for installing dependencies consistently.
# --------------------------------------------------------------------------------------------------
COPY package.json pnpm-lock.yaml ./

# --------------------------------------------------------------------------------------------------
# Install all dependencies (including devDependencies) needed for the build.
# We use --frozen-lockfile to ensure reproducible installs matching the lockfile.
# --------------------------------------------------------------------------------------------------
RUN pnpm install --frozen-lockfile

# --------------------------------------------------------------------------------------------------
# Copy the rest of the source code and TypeScript configs
# (including references to tsconfig.json) into the builder.
# --------------------------------------------------------------------------------------------------
COPY . .

# --------------------------------------------------------------------------------------------------
# Generate Prisma client (requires devDependencies such as prisma).
# We assume that "pnpm prisma generate" or an equivalent script is available.
# --------------------------------------------------------------------------------------------------
RUN pnpm prisma generate

# --------------------------------------------------------------------------------------------------
# Build the TypeScript code according to scripts in package.json (e.g., "pnpm run build").
# This compiles code into the dist/ folder configured in tsconfig.json.
# --------------------------------------------------------------------------------------------------
RUN pnpm run build

# --------------------------------------------------------------------------------------------------
# Prune away devDependencies to reduce final image size.
# This leaves only production dependencies in node_modules.
# --------------------------------------------------------------------------------------------------
RUN pnpm prune --prod

# --------------------------------------------------------------------------------------------------
# Remove build dependencies (.build-deps) to lighten our final image layers.
# After the build steps are complete, we no longer need git, python3, make, g++, etc.
# --------------------------------------------------------------------------------------------------
RUN apk del .build-deps

####################################################################################################
# Stage 2: production                                                                               #
# -------------------------------------------------------------------------------------------------#
# Purpose:                                                                                          #
#   - Use Node.js 18.17-alpine (# node: 18.17-alpine) in a fresh stage with minimal runtime libs.   #
#   - Copy over only the compiled dist folder and node_modules from the builder stage.              #
#   - Create a non-root user to enhance security, set capabilities, and set read-only root if needed#
#   - Configure environment variables, health checks, security policies, etc.                       #
#   - Expose port 3000 and set the final command for container startup.                              #
####################################################################################################
FROM node:18.17-alpine AS production

# --------------------------------------------------------------------------------------------------
# Set environment variables for the production stage
# NODE_ENV=production ensures no dev-relevant code paths are used at runtime.
# TZ=UTC sets the container's timezone to UTC.
# PORT=3000 is the default port for the backend service.
# --------------------------------------------------------------------------------------------------
ENV NODE_ENV=production \
    PORT=3000 \
    TZ=UTC

# --------------------------------------------------------------------------------------------------
# Add Docker image labels for maintainability and traceability according to specification.
# These labels assist in identifying the image source, version, creation date, etc.
# --------------------------------------------------------------------------------------------------
LABEL maintainer="DevOps Team <devops@company.com>" \
      com.company.image.created="{{BUILD_DATE}}" \
      com.company.image.version="{{VERSION}}" \
      com.company.image.title="Backend Service" \
      com.company.image.description="B2B Sales Platform Backend Service" \
      org.opencontainers.image.source="{{REPOSITORY_URL}}"

# --------------------------------------------------------------------------------------------------
# Expose port 3000 for incoming HTTP requests in production environment.
# --------------------------------------------------------------------------------------------------
EXPOSE 3000

# --------------------------------------------------------------------------------------------------
# Define a volume for node_modules if needed for local development caching purposes.
# In most production scenarios, node_modules remain read-only.
# --------------------------------------------------------------------------------------------------
VOLUME ["/usr/src/app/node_modules"]

# --------------------------------------------------------------------------------------------------
# Install any minimal runtime system packages required (e.g., libcap) to set permissions for Node.
# Also ensures we have curl for the healthcheck.
# --------------------------------------------------------------------------------------------------
RUN apk add --no-cache \
    libcap \
    curl

# --------------------------------------------------------------------------------------------------
# Create a non-root user and group named "nodejs" with IDs for secure container execution.
# This user will own /usr/src/app to allow writing logs or ephemeral data as needed.
# --------------------------------------------------------------------------------------------------
RUN addgroup -g 1001 nodejs && \
    adduser -D -u 1001 -G nodejs nodejs

# --------------------------------------------------------------------------------------------------
# Set the working directory for the final container also to /usr/src/app
# Copy the compiled application and production node_modules from the builder stage.
# --------------------------------------------------------------------------------------------------
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

# --------------------------------------------------------------------------------------------------
# Optionally set network binding capabilities and apply read-only filesystem if required.
# "cap_net_bind_service=+ep" allows a non-root user to bind to low-numbered ports.
# "no_new_privileges" can be enforced at runtime with Docker's security options.
# --------------------------------------------------------------------------------------------------
RUN setcap 'cap_net_bind_service=+ep' /usr/local/bin/node

# --------------------------------------------------------------------------------------------------
# Switch to the non-root user "nodejs". This prevents escalated permissions within the container.
# Further best-practice security measures can include read-only container filesystem.
# --------------------------------------------------------------------------------------------------
USER nodejs:nodejs

# --------------------------------------------------------------------------------------------------
# Docker HEALTHCHECK to periodically test container health via HTTP on port 3000.
# If the check fails, the container is considered unhealthy.
# --------------------------------------------------------------------------------------------------
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=30s \
 CMD curl -f http://localhost:3000/health || exit 1

# --------------------------------------------------------------------------------------------------
# Final command to start the Node.js application in production mode.
# This calls `node dist/index.js` as specified in the startup_command configuration.
# --------------------------------------------------------------------------------------------------
CMD ["node", "dist/index.js"]