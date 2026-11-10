// Development/test adapter only. Production commands use native PHP directly.
import { runtime } from './runtime.mjs';
const php = await runtime('cli');
const args = process.argv.slice(2);
if (!args.length) args.push('tests/run.php');
const response = await php.cli(['php', ...args], { cwd: '/app', env: { ...process.env, APP_ENV: process.env.APP_ENV || 'development' } });
let output = Promise.all([
  response.stdout.pipeTo(new WritableStream({ write(chunk) { process.stdout.write(chunk); } })),
  response.stderr.pipeTo(new WritableStream({ write(chunk) { process.stderr.write(chunk); } })),
]);
await response.finished;
await output;
const code = await response.exitCode;
php.exit();
process.exitCode = code;
