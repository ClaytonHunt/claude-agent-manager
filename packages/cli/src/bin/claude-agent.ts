#!/usr/bin/env node

import { ClaudeAgentCLI } from '../cli.js';

async function main() {
  const cli = new ClaudeAgentCLI();
  await cli.run(process.argv);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});