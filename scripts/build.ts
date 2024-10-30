import { spawnSync } from 'node:child_process';

const resultPkgRoll = spawnSync('pkgroll', {
  stdio: 'inherit'
});

if (resultPkgRoll.error) {
  console.error('Error executing emcc:', resultPkgRoll.error);
} else {
  console.log('pkgroll command executed successfully');
}