import * as functions from 'firebase-functions';

const FUNCTIONS_REGION = 'asia-east1';
const cors = require('cors')({ origin: true });
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

export const createUserDocument = functions
  .region(FUNCTIONS_REGION)
  .auth.user()
  .onCreate((user) => {
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

export const sendMessage = functions
  .region(FUNCTIONS_REGION)
  .https.onRequest((req, res) => {
    const doesChatRoomExists = async (id: string): Promise<boolean> => {
      const chatRoom = await db.collection('chatRooms').doc(id).get();
      return chatRoom.exists;
    };

    const appendChatRoomIfUserDoesNotHave = async (
      userId: string,
      chatRoomId: string
    ): Promise<void> => {
      const doc = await db.collection('users').doc(userId).get();

      if (doc.exists) {
        const data = doc.data();

        if (!data.chats.includes(chatRoomId)) {
          data.chats.push(chatRoomId);

          db.collection('users').doc(userId).set(data);
        }
      }
    };

    const makeChatRoomId = (uid: string, to: string): string => {
      if (uid.localeCompare(to)) {
        return uid + to;
      }

      return to + uid;
    };

    return cors(req, res, async () => {
      if (req.method !== 'POST') {
        return res.status(401).json({
          message: 'Not allowed',
        });
      }

      let { chatRoomId, message, to, token }: any = req.body;

      let uid: string = '';
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        uid = decodedToken.uid;
      } catch {
        return res.status(500).json({
          message: 'Failed to verify the token',
        });
      }

      if (!chatRoomId) {
        // It has to create a chat room
        chatRoomId = makeChatRoomId(uid, to);

        if (!(await doesChatRoomExists(chatRoomId))) {
          await db
            .collection('chatRooms')
            .doc(chatRoomId)
            .set({
              type: 'private',
              members: [uid, to],
            });
        }
      }

      appendChatRoomIfUserDoesNotHave(uid, chatRoomId);
      appendChatRoomIfUserDoesNotHave(to, chatRoomId);

      await db.collection('messages').add({
        chatRoomId,
        sender: uid,
        message,
        sentAt: new Date().getTime(),
      });

      return res.status(200).json({
        id: chatRoomId,
        message: 'OK',
      });
    });
  });
