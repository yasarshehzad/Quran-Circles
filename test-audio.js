const https = require('https');
https.get('https://everyayah.com/data/Alafasy_128kbps/001001.mp3', res => {
  console.log("Status:", res.statusCode);
  console.log("Headers:", JSON.stringify(res.headers, null, 2));
}).on('error', e => console.error(e));
