#!/usr/bin/env node

/**
 * Cirkel.io Environment Setup Script
 * Automatically configures development environment and validates dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  nodeVersion: '18.0.0',
  npmVersion: '9.0.0',
  requiredEnvVars: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ],
  optionalEnvVars: [
    'OPENAI_API_KEY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'ETHEREUM_RPC_URL',
    'SOLANA_RPC_URL'
  ],
  directories: [
    'logs',
    'uploads',
    'cache',
    'tmp',
    '.next',
    'coverage'
  ]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

function execCommand(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return null;
  }
}

function compareVersions(version1, version2) {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }
  return 0;
}

function generateSecretKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Main setup functions
async function checkPrerequisites() {
  log.header('🔍 Checking Prerequisites');
  
  // Check Node.js
  try {
    const nodeVersion = execCommand('node --version', { silent: true }).trim().substring(1);
    if (compareVersions(nodeVersion, CONFIG.nodeVersion) < 0) {
      log.error(`Node.js ${CONFIG.nodeVersion} or higher required (current: ${nodeVersion})`);
      process.exit(1);
    }
    log.success(`Node.js ${nodeVersion} ✓`);
  } catch (error) {
    log.error('Node.js not found. Please install Node.js from https://nodejs.org/');
    process.exit(1);
  }
  
  // Check npm
  try {
    const npmVersion = execCommand('npm --version', { silent: true }).trim();
    if (compareVersions(npmVersion, CONFIG.npmVersion) < 0) {
      log.warning(`npm ${CONFIG.npmVersion} or higher recommended (current: ${npmVersion})`);
    } else {
      log.success(`npm ${npmVersion} ✓`);
    }
  } catch (error) {
    log.error('npm not found');
    process.exit(1);
  }
  
  // Check Git
  try {
    execCommand('git --version', { silent: true });
    log.success('Git ✓');
  } catch (error) {
    log.warning('Git not found - version control features may not work');
  }
  
  // Check Docker (optional)
  try {
    execCommand('docker --version', { silent: true });
    log.success('Docker ✓');
  } catch (error) {
    log.warning('Docker not found - containerization features disabled');
  }
}

function setupDirectories() {
  log.header('📁 Setting up Directories');
  
  CONFIG.directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log.success(`Created directory: ${dir}`);
    } else {
      log.info(`Directory exists: ${dir}`);
    }
  });
  
  // Create .gitkeep files for empty directories
  const emptyDirs = ['logs', 'uploads', 'cache', 'tmp'];
  emptyDirs.forEach(dir => {
    const gitkeepPath = path.join(process.cwd(), dir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
      fs.writeFileSync(gitkeepPath, '');
    }
  });
}

function setupEnvironment() {
  log.header('🔧 Setting up Environment');
  
  const envExamplePath = path.join(process.cwd(), '.env.example');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  // Create .env.example if it doesn't exist
  if (!fs.existsSync(envExamplePath)) {
    const envExample = `# Cirkel.io Environment Configuration

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cirkel"
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_SECRET="${generateSecretKey()}"
NEXTAUTH_URL="http://localhost:3000"

# Supabase
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# AI Services
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Web3
ETHEREUM_RPC_URL="your-ethereum-rpc-url"
SOLANA_RPC_URL="your-solana-rpc-url"
ALCHEMY_API_KEY="your-alchemy-api-key"

# Cloud Storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket"

# Firebase
FIREBASE_PROJECT_ID="your-firebase-project"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"

# Analytics
GOOGLE_ANALYTICS_ID="your-ga-id"
MIXPANEL_TOKEN="your-mixpanel-token"

# Social Media APIs
TWITTER_API_KEY="your-twitter-api-key"
FACEBOOK_APP_ID="your-facebook-app-id"
INSTAGRAM_ACCESS_TOKEN="your-instagram-token"

# Payment Processing
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
PAYPAL_CLIENT_ID="your-paypal-client-id"

# Email Services
SENDGRID_API_KEY="your-sendgrid-api-key"
RESEND_API_KEY="your-resend-api-key"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
LOGROCKET_APP_ID="your-logrocket-app-id"

# Development
NODE_ENV="development"
DEBUG="cirkel:*"
LOG_LEVEL="debug"
`;
    
    fs.writeFileSync(envExamplePath, envExample);
    log.success('Created .env.example');
  }
  
  // Copy to .env.local if it doesn't exist
  if (!fs.existsSync(envLocalPath)) {
    fs.copyFileSync(envExamplePath, envLocalPath);
    log.success('Created .env.local from .env.example');
    log.warning('Please update .env.local with your actual configuration values');
  } else {
    log.info('.env.local already exists');
  }
}

function validateEnvironment() {
  log.header('✅ Validating Environment');
  
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envLocalPath)) {
    log.error('.env.local not found');
    return false;
  }
  
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const envVars = {};
  
  // Parse environment variables
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      envVars[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });
  
  let isValid = true;
  
  // Check required variables
  CONFIG.requiredEnvVars.forEach(varName => {
    if (!envVars[varName] || envVars[varName].startsWith('your-')) {
      log.error(`Required environment variable not set: ${varName}`);
      isValid = false;
    } else {
      log.success(`${varName} ✓`);
    }
  });
  
  // Check optional variables
  CONFIG.optionalEnvVars.forEach(varName => {
    if (!envVars[varName] || envVars[varName].startsWith('your-')) {
      log.warning(`Optional environment variable not set: ${varName}`);
    } else {
      log.success(`${varName} ✓`);
    }
  });
  
  return isValid;
}

function installDependencies() {
  log.header('📦 Installing Dependencies');
  
  try {
    log.info('Installing npm dependencies...');
    execCommand('npm ci');
    log.success('Dependencies installed successfully');
  } catch (error) {
    log.error('Failed to install dependencies');
    log.info('Trying with npm install...');
    try {
      execCommand('npm install');
      log.success('Dependencies installed successfully');
    } catch (fallbackError) {
      log.error('Failed to install dependencies with npm install');
      throw fallbackError;
    }
  }
}

function setupDatabase() {
  log.header('🗄️ Setting up Database');
  
  try {
    // Check if Supabase CLI is available
    execCommand('supabase --version', { silent: true });
    
    log.info('Running database migrations...');
    execCommand('npm run db:migrate', { ignoreError: true });
    
    log.info('Seeding database...');
    execCommand('npm run db:seed', { ignoreError: true });
    
    log.success('Database setup completed');
  } catch (error) {
    log.warning('Supabase CLI not found - skipping database setup');
    log.info('Please set up your database manually or install Supabase CLI');
  }
}

function setupGitHooks() {
  log.header('🪝 Setting up Git Hooks');
  
  try {
    // Check if husky is available
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.devDependencies && packageJson.devDependencies.husky) {
      execCommand('npx husky install');
      log.success('Git hooks installed');
    } else {
      log.info('Husky not found - skipping git hooks setup');
    }
  } catch (error) {
    log.warning('Failed to setup git hooks');
  }
}

function generateConfigFiles() {
  log.header('⚙️ Generating Configuration Files');
  
  // Generate VS Code settings
  const vscodeDir = path.join(process.cwd(), '.vscode');
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir);
  }
  
  const vscodeSettings = {
    "typescript.preferences.importModuleSpecifier": "relative",
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    },
    "files.exclude": {
      "**/.next": true,
      "**/node_modules": true,
      "**/.git": true
    },
    "search.exclude": {
      "**/.next": true,
      "**/node_modules": true
    }
  };
  
  const vscodeSettingsPath = path.join(vscodeDir, 'settings.json');
  if (!fs.existsSync(vscodeSettingsPath)) {
    fs.writeFileSync(vscodeSettingsPath, JSON.stringify(vscodeSettings, null, 2));
    log.success('Created VS Code settings');
  }
  
  // Generate launch configuration
  const launchConfig = {
    "version": "0.2.0",
    "configurations": [
      {
        "name": "Next.js: debug server-side",
        "type": "node-terminal",
        "request": "launch",
        "command": "npm run dev"
      },
      {
        "name": "Next.js: debug client-side",
        "type": "chrome",
        "request": "launch",
        "url": "http://localhost:3000"
      }
    ]
  };
  
  const launchPath = path.join(vscodeDir, 'launch.json');
  if (!fs.existsSync(launchPath)) {
    fs.writeFileSync(launchPath, JSON.stringify(launchConfig, null, 2));
    log.success('Created VS Code launch configuration');
  }
}

function runHealthCheck() {
  log.header('🏥 Running Health Check');
  
  try {
    log.info('Running type check...');
    execCommand('npm run type-check');
    log.success('TypeScript compilation ✓');
  } catch (error) {
    log.error('TypeScript compilation failed');
  }
  
  try {
    log.info('Running linter...');
    execCommand('npm run lint');
    log.success('Linting passed ✓');
  } catch (error) {
    log.warning('Linting issues found - run "npm run lint:fix" to auto-fix');
  }
  
  try {
    log.info('Running tests...');
    execCommand('npm run test -- --passWithNoTests');
    log.success('Tests passed ✓');
  } catch (error) {
    log.warning('Some tests failed');
  }
}

function printSummary() {
  log.header('🎉 Setup Complete!');
  
  console.log(`${colors.green}Cirkel.io development environment is ready!${colors.reset}\n`);
  
  console.log('Next steps:');
  console.log(`  1. Update ${colors.cyan}.env.local${colors.reset} with your API keys`);
  console.log(`  2. Run ${colors.cyan}npm run dev${colors.reset} to start development server`);
  console.log(`  3. Open ${colors.cyan}http://localhost:3000${colors.reset} in your browser`);
  console.log(`  4. Check out the documentation at ${colors.cyan}docs/${colors.reset}\n`);
  
  console.log('Useful commands:');
  console.log(`  ${colors.cyan}npm run dev${colors.reset}        Start development server`);
  console.log(`  ${colors.cyan}npm run build${colors.reset}      Build for production`);
  console.log(`  ${colors.cyan}npm run test${colors.reset}       Run tests`);
  console.log(`  ${colors.cyan}npm run lint${colors.reset}       Run linter`);
  console.log(`  ${colors.cyan}npm run type-check${colors.reset} Check TypeScript types`);
  console.log(`  ${colors.cyan}./build.sh${colors.reset}         Run production build script\n`);
  
  console.log(`For more information, visit: ${colors.cyan}https://docs.cirkel.io${colors.reset}`);
}

// Main execution
async function main() {
  try {
    console.log(`${colors.bright}${colors.magenta}`);
    console.log('  ______ _      _        _   _       ');
    console.log(' / _____(_)    | |      | | (_)      ');
    console.log('| /     _ _ __ | | _____| |  _  ___  ');
    console.log('| |    | |  __|| |/ / _ \\ | | |/ _ \\ ');
    console.log('| \\____| | |   |   <  __/ |_| | (_) |');
    console.log(' \\_____|_|_|   |_|\\_\\___|_(_)_|\\___/ ');
    console.log('                                     ');
    console.log(`${colors.reset}`);
    console.log(`${colors.bright}Welcome to Cirkel.io Setup!${colors.reset}\n`);
    
    await checkPrerequisites();
    setupDirectories();
    setupEnvironment();
    installDependencies();
    setupDatabase();
    setupGitHooks();
    generateConfigFiles();
    
    const isEnvValid = validateEnvironment();
    if (isEnvValid) {
      runHealthCheck();
    }
    
    printSummary();
    
    if (!isEnvValid) {
      process.exit(1);
    }
    
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  setupDirectories,
  setupEnvironment,
  validateEnvironment,
  installDependencies,
  setupDatabase,
  runHealthCheck
};