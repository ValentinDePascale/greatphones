const http = require('http');

const code = 'GP-MR14KCE9-8UAU';

http.get('http://localhost:3000/api/warranty?code=' + encodeURIComponent(code), res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const j = JSON.parse(d);
      console.log('Response:', JSON.stringify(j, null, 2));
    } catch(e) {
      console.log('Raw:', d.substring(0, 500));
    }
  });
}).on('error', e => console.log('Error:', e.message));
