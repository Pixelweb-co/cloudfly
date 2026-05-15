# Stage 1: Build the binary
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy go.mod and download dependencies
COPY go.mod ./
# Note: go.sum will be generated during download if not present
RUN go mod download

# Copy source code
COPY . .

# Build a static binary
RUN CGO_ENABLED=0 GOOS=linux go build -o billing-app ./cmd/server/main.go

# Stage 2: Final lightweight image
FROM gcr.io/distroless/static-debian12

# Copy binary from builder
COPY --from=builder /app/billing-app /billing-app

# Create necessary directories (since it's a distroless image, we must ensure paths exist if they are not volumes)
# However, usually uploads are volumes.
WORKDIR /

EXPOSE 8080

ENTRYPOINT ["/billing-app"]
