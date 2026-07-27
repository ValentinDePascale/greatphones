const http = require('http');

// First get orders to find a real code
http.get('http://localhost:3000/api/orders', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const j = JSON.parse(d);
      const orders = j.data || j;
      console.log('Orders found:', Array.isArray(orders) ? orders.length : 'n/a');
      if (Array.isArray(orders) && orders.length > 0) {
        const o = orders[0];
        console.log('Order:', { code: o.code, status: o.status, warranty: o.warranty, createdAt: o.createdAt });
      } else {
        console.log('No orders array, keys:', Object.keys(j).slice(0,5));
      }
    } catch(e) {
      console.log('Parse error:', e.message);
      console.log('Raw:', d.substring(0, 200));
    }
  });
}).on('error', e => console.log('Error:', e.message));
