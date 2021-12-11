import * as functions from 'firebase-functions';

// const FUNCTIONS_REGION = "asia-east1";
// const cors = require("cors")({ origin: true });
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

export const createUserDocument = functions.auth.user().onCreate((user) => {
  const {
    email,
    uid,
    metadata: { creationTime },
  } = user;

  db.collection('users').doc(user.uid).set({
    email,
    uid,
    creationTime,
    chats: [],
  });
});
