const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const app = express();

app.use(bodyParser.json());

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  token_uri: "https://oauth2.googleapis.com/token",
};

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