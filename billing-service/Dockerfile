# Stage 1: Build the binary
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy go.mod and download/tidy dependencies (generates go.sum if missing)
COPY go.mod ./
RUN go mod tidy

# Copy source code
COPY . .

# Tidy again after full source is available (resolves all imports)
RUN go mod tidy

# Build a static binary
RUN CGO_ENABLED=0 GOOS=linux go build -o billing-app ./cmd/server/main.go

# Stage 2: Final lightweight image
FROM alpine:3.18

WORKDIR /

# Copy binary from builder
COPY --from=builder /app/billing-app /billing-app

EXPOSE 8080

ENTRYPOINT ["/billing-app"]
