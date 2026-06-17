FROM --platform=$BUILDPLATFORM docker.io/library/alpine:3.22.2 AS builder

ENV WEB_PATH="/opt/zextras/web/login"

# Set up directories
RUN mkdir -p "${WEB_PATH}"

# Copy application files
COPY dist ${WEB_PATH}/

# Final stage - built for all target platforms
FROM docker.io/library/alpine:3.22.2

# Just copy the prepared files (no execution needed)
COPY --from=builder /opt/zextras /opt/zextras
