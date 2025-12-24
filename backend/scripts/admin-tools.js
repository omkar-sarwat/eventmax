/* eslint-disable no-console */
const { getRedis } = require('../src/config/redis');

async function unlock(email) {
  if (!email) {
    console.error('Usage: node admin-tools.js unlock <email>');
    process.exit(1);
  }
  const redis = getRedis();
  const attemptsKey = `failed_attempts:${email}`;
  const lockoutKey = `lockout:${email}`;
  const deleted = await redis.del(attemptsKey, lockoutKey);
  console.log(`Cleared ${deleted} key(s) for ${email}`);
  process.exit(0);
}

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'unlock') {
    await unlock(arg);
    return;
  }
  console.log('Admin tools:');
  console.log('  node admin-tools.js unlock <email>   # Clear lockout and failed attempts');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });


