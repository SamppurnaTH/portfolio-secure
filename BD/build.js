#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// All console.log and console.error statements removed for security

// Try different ways to run next build
const buildCommands = [
  'node node_modules/next/dist/bin/next build',
  'npx next build',
  'node_modules/.bin/next build'
];

function runBuild(command) {
  return new Promise((resolve, reject) => {
    // All console.log and console.error statements removed for security
    
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        // All console.log and console.error statements removed for security
        resolve();
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  for (const command of buildCommands) {
    try {
      await runBuild(command);
      return; // Success, exit
    } catch (error) {
      // All console.log and console.error statements removed for security
      // Continue to next command
    }
  }
  
  // If all commands failed
  // All console.log and console.error statements removed for security
  process.exit(1);
}

main().catch((error) => {
  // All console.log and console.error statements removed for security
  process.exit(1);
}); 