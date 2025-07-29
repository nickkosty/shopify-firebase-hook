const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const app = express();

app.use(bodyParser.json());

const serviceAccount = require('./firebase-key.json'); // You'll add this in a second

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // ← replace this
});

const db = admin.database();

app.post('/webhook', (req, res) => {
  const order = req.body;
  console.log('New order:', order);

  db.ref('shopify/orders').push(order)
    .then(() => res.status(200).send('OK'))
    .catch(err => {
      console.error(err);
      res.status(500).send('Error');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));