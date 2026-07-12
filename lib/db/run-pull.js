const { execSync } = require('child_process');
try {
  console.log('Running drizzle-kit pull...');
  const output = execSync('npx drizzle-kit pull', { stdio: 'pipe', encoding: 'utf-8' });
  console.log('Success:', output);
} catch (error) {
  console.error('Exit code:', error.status);
  console.error('Stderr:', error.stderr);
  if (error.stdout) {
    const lines = error.stdout.split('\n');
    console.error('Filtered stdout (no fetching/fetched lines):');
    console.error(lines.filter(line => !line.includes('fetching') && !line.includes('fetched')).join('\n'));
  }
}
