#!/bin/bash

# Cirkel.io Production Build Script
# This script handles the complete build and deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NODE_VERSION="18.0.0"
BUILD_DIR="dist"
DOCKER_IMAGE="cirkel-io"
DOCKER_TAG="latest"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_CURRENT=$(node -v | sed 's/v//')
    if [ "$(printf '%s\n' "$NODE_VERSION" "$NODE_CURRENT" | sort -V | head -n1)" != "$NODE_VERSION" ]; then
        log_error "Node.js version $NODE_VERSION or higher is required (current: $NODE_CURRENT)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        log_info "Docker detected - container builds available"
    else
        log_warning "Docker not found - container builds disabled"
    fi
    
    log_success "Prerequisites check passed"
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    # Clean install
    if [ -d "node_modules" ]; then
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    log_success "Dependencies installed"
}

run_tests() {
    log_info "Running tests..."
    
    # Type checking
    npm run type-check
    
    # Linting
    npm run lint
    
    # Unit tests
    npm run test
    
    # E2E tests (if available)
    if npm run | grep -q "test:e2e"; then
        npm run test:e2e
    fi
    
    log_success "All tests passed"
}

build_application() {
    log_info "Building application..."
    
    # Clean previous build
    if [ -d ".next" ]; then
        rm -rf .next
    fi
    
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
    fi
    
    # Set production environment
    export NODE_ENV=production
    
    # Build Next.js application
    npm run build
    
    # Generate static export (if configured)
    if npm run | grep -q "export"; then
        npm run export
    fi
    
    log_success "Application built successfully"
}

optimize_build() {
    log_info "Optimizing build..."
    
    # Bundle analysis
    if npm run | grep -q "analyze"; then
        npm run analyze
    fi
    
    # Compress assets
    if command -v gzip &> /dev/null; then
        find .next/static -name "*.js" -o -name "*.css" | while read file; do
            gzip -k "$file"
        done
        log_info "Assets compressed with gzip"
    fi
    
    # Generate service worker
    if [ -f "public/sw.js" ]; then
        log_info "Service worker found"
    fi
    
    log_success "Build optimization completed"
}

security_scan() {
    log_info "Running security scan..."
    
    # Audit dependencies
    npm audit --audit-level moderate
    
    # Check for known vulnerabilities
    if command -v snyk &> /dev/null; then
        snyk test
    else
        log_warning "Snyk not installed - skipping vulnerability scan"
    fi
    
    log_success "Security scan completed"
}

build_docker_image() {
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not available - skipping container build"
        return
    fi
    
    log_info "Building Docker image..."
    
    # Build multi-stage Docker image
    docker build \
        --tag "$DOCKER_IMAGE:$DOCKER_TAG" \
        --tag "$DOCKER_IMAGE:$(git rev-parse --short HEAD)" \
        --build-arg NODE_VERSION="$NODE_VERSION" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse --short HEAD)" \
        .
    
    # Security scan for Docker image
    if command -v trivy &> /dev/null; then
        trivy image "$DOCKER_IMAGE:$DOCKER_TAG"
    fi
    
    log_success "Docker image built: $DOCKER_IMAGE:$DOCKER_TAG"
}

generate_artifacts() {
    log_info "Generating build artifacts..."
    
    # Create artifacts directory
    mkdir -p artifacts
    
    # Generate build info
    cat > artifacts/build-info.json << EOF
{
  "version": "$(node -p "require('./package.json').version")",
  "buildDate": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "gitCommit": "$(git rev-parse HEAD)",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD)",
  "nodeVersion": "$(node -v)",
  "npmVersion": "$(npm -v)",
  "buildNumber": "${BUILD_NUMBER:-local}",
  "environment": "${NODE_ENV:-production}"
}
EOF
    
    # Generate deployment manifest
    cat > artifacts/deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cirkel-io
  labels:
    app: cirkel-io
    version: $(node -p "require('./package.json').version")
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cirkel-io
  template:
    metadata:
      labels:
        app: cirkel-io
    spec:
      containers:
      - name: cirkel-io
        image: $DOCKER_IMAGE:$DOCKER_TAG
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
EOF
    
    # Package build artifacts
    if command -v tar &> /dev/null; then
        tar -czf artifacts/build-$(date +%Y%m%d-%H%M%S).tar.gz .next public package.json
        log_info "Build artifacts packaged"
    fi
    
    log_success "Artifacts generated in ./artifacts/"
}

cleanup() {
    log_info "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -rf .tmp
    rm -rf coverage
    
    # Clean npm cache
    npm cache clean --force
    
    log_success "Cleanup completed"
}

deploy_staging() {
    log_info "Deploying to staging environment..."
    
    # Deploy to Vercel staging
    if command -v vercel &> /dev/null; then
        vercel --prod=false --confirm
        log_success "Deployed to Vercel staging"
    fi
    
    # Deploy to AWS staging (if configured)
    if [ -n "$AWS_STAGING_BUCKET" ]; then
        aws s3 sync .next/static/ s3://$AWS_STAGING_BUCKET/static/
        log_success "Static assets deployed to AWS S3"
    fi
}

deploy_production() {
    log_info "Deploying to production environment..."
    
    # Confirmation prompt
    read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Production deployment cancelled"
        return
    fi
    
    # Deploy to production
    if command -v vercel &> /dev/null; then
        vercel --prod --confirm
        log_success "Deployed to Vercel production"
    fi
    
    # Update CDN cache
    if [ -n "$CLOUDFLARE_ZONE_ID" ]; then
        curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
             -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
             -H "Content-Type: application/json" \
             --data '{"purge_everything":true}'
        log_success "CDN cache purged"
    fi
}

show_help() {
    echo "Cirkel.io Build Script"
    echo ""
    echo "Usage: $0 [OPTIONS] [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build          Full production build (default)"
    echo "  test           Run tests only"
    echo "  docker         Build Docker image only"
    echo "  deploy-staging Deploy to staging environment"
    echo "  deploy-prod    Deploy to production environment"
    echo "  clean          Clean build artifacts"
    echo ""
    echo "Options:"
    echo "  --skip-tests   Skip running tests"
    echo "  --skip-docker  Skip Docker image build"
    echo "  --verbose      Enable verbose output"
    echo "  --help         Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  NODE_ENV       Build environment (default: production)"
    echo "  BUILD_NUMBER   CI build number"
    echo "  DOCKER_REGISTRY Docker registry URL"
    echo "  AWS_STAGING_BUCKET  S3 bucket for staging"
    echo "  CLOUDFLARE_ZONE_ID  Cloudflare zone for cache purging"
}

# Main execution
main() {
    local skip_tests=false
    local skip_docker=false
    local verbose=false
    local command="build"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --skip-docker)
                skip_docker=true
                shift
                ;;
            --verbose)
                verbose=true
                set -x
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            build|test|docker|deploy-staging|deploy-prod|clean)
                command=$1
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Set verbose mode
    if [ "$verbose" = true ]; then
        set -x
    fi
    
    log_info "Starting Cirkel.io build process..."
    log_info "Command: $command"
    log_info "Node.js: $(node -v)"
    log_info "npm: $(npm -v)"
    
    case $command in
        build)
            check_prerequisites
            install_dependencies
            if [ "$skip_tests" = false ]; then
                run_tests
            fi
            security_scan
            build_application
            optimize_build
            if [ "$skip_docker" = false ]; then
                build_docker_image
            fi
            generate_artifacts
            cleanup
            ;;
        test)
            check_prerequisites
            install_dependencies
            run_tests
            ;;
        docker)
            check_prerequisites
            build_docker_image
            ;;
        deploy-staging)
            deploy_staging
            ;;
        deploy-prod)
            deploy_production
            ;;
        clean)
            cleanup
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
    
    log_success "Build process completed successfully!"
}

# Trap errors and cleanup
trap 'log_error "Build failed at line $LINENO"' ERR

# Run main function
main "$@"