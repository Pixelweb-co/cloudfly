const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const filesToUpload = [
  { local: 'frontend_new/src/types/ventas/productTypes.ts', remote: '/apps/cloudfly/frontend_new/src/types/ventas/productTypes.ts' },
  { local: 'frontend_new/src/types/apps/Types.ts', remote: '/apps/cloudfly/frontend_new/src/types/apps/Types.ts' },
  { local: 'frontend_new/src/services/ventas/productService.ts', remote: '/apps/cloudfly/frontend_new/src/services/ventas/productService.ts' },
  { local: 'frontend_new/src/services/ventas/categoryService.ts', remote: '/apps/cloudfly/frontend_new/src/services/ventas/categoryService.ts' },
  { local: 'frontend_new/src/views/marketing/campaigns/Detail/CampaignFormPanel.tsx', remote: '/apps/cloudfly/frontend_new/src/views/marketing/campaigns/Detail/CampaignFormPanel.tsx' }
];

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    let completed = 0;
    filesToUpload.forEach(f => {
      const localPath = path.join('c:/apps/cloudfly', f.local);
      sftp.fastPut(localPath, f.remote, (err) => {
        if (err) console.error(`Error uploading ${f.local}:`, err);
        else console.log(`Uploaded ${f.local} to ${f.remote}`);
        completed++;
        if (completed === filesToUpload.length) {
          console.log('All frontend files uploaded.');
          conn.end();
        }
      });
    });
  });
}).connect({
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  password: 'Elian20200916',
  readyTimeout: 20000
});
