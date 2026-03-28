// node scripts/subscription-cron.js
const cron = require('node-cron');
const { exec } = require('child_process');

// Run every day at 2am
cron.schedule('0 2 * * *', () => {
  console.log('Running daily subscription maintenance...');
  exec('node scripts/expire-subscriptions.js', (err, stdout, stderr) => {
    if (err) console.error('Expire error:', stderr);
    else console.log(stdout);
  });
  exec('node scripts/unlist-expired-farmer-products.js', (err, stdout, stderr) => {
    if (err) console.error('Unlist error:', stderr);
    else console.log(stdout);
  });
  exec('node scripts/list-active-farmer-products.js', (err, stdout, stderr) => {
    if (err) console.error('List error:', stderr);
    else console.log(stdout);
  });
  exec('node scripts/notify-expiry.js', (err, stdout, stderr) => {
    if (err) console.error('Notify error:', stderr);
    else console.log(stdout);
  });
});

console.log('Subscription cron job started.');
