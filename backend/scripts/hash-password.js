const bcrypt = require('bcryptjs');

async function main() {
  const password = process.argv[2];
  if (!password) {
    throw new Error('Gunakan: npm run auth:hash-password -- "password-anda"');
  }
  const hash = await bcrypt.hash(password, 12);
  console.log(hash);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
