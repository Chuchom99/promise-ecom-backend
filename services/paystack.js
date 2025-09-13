const axios = require('axios');

async function initializeTransaction(email, amount, metadata = {}) {
  const res = await axios.post('https://api.paystack.co/transaction/initialize',
    { email, amount, metadata },
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );
  return res.data;
}

async function verifyTransaction(reference) {
  const res = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );
  return res.data;
}

module.exports = { initializeTransaction, verifyTransaction };
