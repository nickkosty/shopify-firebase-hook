const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const crypto = require('crypto');
const app = express();

// Verify Shopify webhook signature
function verifyShopifyWebhook(req, res, buf) {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  const generatedHmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(buf, 'utf8')
    .digest('base64');

  if (generatedHmac !== hmacHeader) {
    throw new Error('Webhook signature mismatch');
  }
}

// Middleware
app.use(bodyParser.json({ verify: verifyShopifyWebhook }));

// Firebase config
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  token_uri: "https://oauth2.googleapis.com/token",
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://shopify-counter-688ee-default-rtdb.firebaseio.com',
});

const db = admin.database();

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const order = req.body;

  const filteredData = {
    order_id: order.id,
    created_at: order.created_at,
    email: order.email,
    name: order.name,
    total_price: order.total_price,
    currency: order.currency,
    line_items: order.line_items.map(item => ({
      title: item.title,
      quantity: item.quantity,
      price: item.price,
    })),
    shipping_address: order.shipping_address
      ? {
          name: order.shipping_address.name,
          address1: order.shipping_address.address1,
          city: order.shipping_address.city,
          zip: order.shipping_address.zip,
          province: order.shipping_address.province,
          country: order.shipping_address.country,
        }
      : null,
  };

  console.log('✅ Order received:', filteredData);

  db.ref('shopify/orders').push(filteredData)
    .then(() => res.status(200).send('OK'))
    .catch(err => {
      console.error('❌ Firebase error:', err);
      res.status(500).send('Error');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));