import * as functions from "firebase-functions";

const FUNCTIONS_REGION = "asia-east1";
const cors = require("cors")({ origin: true });
const admin = require("firebase-admin");
admin.initializeApp();
// const db = admin.firestore();

export const test = functions
  .region(FUNCTIONS_REGION)
  .https.onRequest((req, res) => {
    return cors(req, res, async () => {
      return res.json({
        message: "OK",
      });
    });
  });
