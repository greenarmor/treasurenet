#!/usr/bin/env node

/**
 * TreasureNet Admin CLI
 *
 * Usage:
 *   node scripts/admin.js issue-sbt <player-address>
 *   node scripts/admin.js promote-gm <wallet-address>
 *   node scripts/admin.js setup <player-address>
 */

const API_URL = process.env.API_URL || 'http://localhost:4000/api/v1';
const ADMIN_KEY = process.env.ADMIN_KEY || 'treasurenet-admin-dev';

async function request(method: string, path: string, body?: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function issueSbt(address: string) {
  console.log(`Issuing SBT to ${address}...`);
  const result = await request('POST', '/profile/issue-sbt', { address, adminKey: ADMIN_KEY });
  console.log('SBT issued:', JSON.stringify(result, null, 2));
}

async function promoteGm(address: string) {
  console.log(`Promoting ${address} to Game Master...`);
  const result = await request('POST', '/profile/promote-gm', { address, adminKey: ADMIN_KEY });
  console.log('Promoted:', JSON.stringify(result, null, 2));
}

async function setup(playerAddress: string) {
  console.log('=== TreasureNet Setup ===\n');

  // Step 1: Issue SBT (player must already have a wallet via mobile app)
  console.log('Step 1: Issue SBT to player');
  try {
    await issueSbt(playerAddress);
  } catch (err: any) {
    console.error('SBT issue failed:', err.message);
    console.log('Make sure the player has created a wallet via the mobile app first.');
  }

  // Step 2: Promote a Game Master wallet
  console.log('\nStep 2: Promote Game Master');
  console.log('Use the web wallet page to connect Freighter, then run:');
  console.log(`  node scripts/admin.js promote-gm <gm-address>\n`);

  console.log('Setup complete!');
}

const [,, command, ...args] = process.argv;

switch (command) {
  case 'issue-sbt':
    issueSbt(args[0]).catch((e) => { console.error(e.message); process.exit(1); });
    break;
  case 'promote-gm':
    promoteGm(args[0]).catch((e) => { console.error(e.message); process.exit(1); });
    break;
  case 'setup':
    setup(args[0]).catch((e) => { console.error(e.message); process.exit(1); });
    break;
  default:
    console.log('Usage: node scripts/admin.js <issue-sbt|promote-gm|setup> <address>');
    console.log('\nExamples:');
    console.log('  node scripts/admin.js issue-sbt GA...PLAYER...ADDRESS');
    console.log('  node scripts/admin.js promote-gm GA...GM...ADDRESS');
    console.log('  node scripts/admin.js setup GA...PLAYER...ADDRESS');
    process.exit(1);
}
