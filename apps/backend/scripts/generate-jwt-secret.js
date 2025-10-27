import crypto from 'crypto';

function generateJWTSecret() {
  // Generate 64 bytes (512 bits) of random data for a strong secret
  const secret = crypto.randomBytes(64).toString('hex');
  return secret;
}

// Generate and display the secret
const jwtSecret = generateJWTSecret();
console.log('Generated JWT Secret:');
console.log(jwtSecret);
console.log('\nAdd this to your .env file:');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('\n⚠️  Keep this secret secure and never commit it to version control!');