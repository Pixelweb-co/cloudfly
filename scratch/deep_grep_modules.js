const { exec } = require('child_process');

exec('grep -r "modules-list" c:\\apps\\cloudfly\\backend_new\\src', (err, stdout, stderr) => {
  console.log('STDOUT:', stdout);
  console.log('STDERR:', stderr);
  if (err) console.error('ERR:', err);
});
