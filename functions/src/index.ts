import * as functions from 'firebase-functions';

const FUNCTIONS_REGION = 'asia-east1';
const cors = require('cors')({ origin: true });
const admin = require('firebase-admin');
admin.initializeApp();
const firestore = admin.firestore;
const db = firestore();

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
        return res.status(401).json({
          message: 'Failed to verify the token',
        });
      }

      if (chatRoomId === undefined) {
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

        appendChatRoomIfUserDoesNotHave(uid, chatRoomId);
        appendChatRoomIfUserDoesNotHave(to, chatRoomId);
      } else {
        const chatRoom = await db.collection('chatRooms').doc(chatRoomId).get();

        if (!chatRoom.exists) {
          return res.status(404).json({
            message: "The chatroom doesn't exist",
          });
        }

        const { type, members } = chatRoom.data();

        // If the sender aren't in the members of the chat
        if (!members.includes(uid)) {
          return res.status(401).json({
            message: "You don't have a permission",
          });
        }

        // Reuse private chatRoom
        if (type === 'private') {
          const to = members.filter((member: string) => member !== uid)[0];

          appendChatRoomIfUserDoesNotHave(uid, chatRoomId);
          appendChatRoomIfUserDoesNotHave(to, chatRoomId);
        }
      }

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

export const openGroupChat = functions
  .region(FUNCTIONS_REGION)
  .https.onRequest((req, res) => {
    const appendChatRoomToUserChats = (uid: string, chatRoomId: string) => {
      db.collection('users')
        .doc(uid)
        .get()
        .then((doc: any) => {
          if (doc.exists) {
            const data = doc.data();
            const { chats } = data;

            chats.push(chatRoomId);

            db.collection('users')
              .doc(uid)
              .set({
                ...data,
                chats,
              });
          }
        });
    };

    return cors(req, res, async () => {
      if (req.method !== 'POST') {
        return res.status(401).json({
          message: 'Not allowed',
        });
      }

      const { members, token }: any = req.body;
      if (!members || !('length' in members)) {
        return res.status(400).json({
          message: 'Invalid Parameters',
        });
      }

      let uid: string = '';
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        uid = decodedToken.uid;
      } catch {
        return res.status(401).json({
          message: 'Failed to verify the token',
        });
      }

      members.push(uid);

      const doc = await db.collection('chatRooms').add({
        type: 'group',
        members,
      });

      for (const member of members) {
        appendChatRoomToUserChats(member, doc.id);
      }

      return res.status(200).json({
        message: 'OK',
        chatRoomId: doc.id,
      });
    });
  });

export const leaveChatRoom = functions
  .region(FUNCTIONS_REGION)
  .https.onRequest((req, res) => {
    const removeMemberInChatRoomIfChatIsGroup = async (
      uid: string,
      chatRoomId: string
    ) => {
      const doc = await db.collection('chatRooms').doc(chatRoomId).get();

      if (!doc.exists) return;

      const data = doc.data();
      if (data.type === 'private') return;

      let members = data.members;
      members = members.filter((userId: any) => userId !== uid);

      // update by query would be better.
      await db
        .collection('chatRooms')
        .doc(chatRoomId)
        .set({
          ...data,
          members,
        });
    };

    const removeChatRoomInUserChats = async (
      uid: string,
      chatRoomId: string
    ) => {
      const doc = await db.collection('users').doc(uid).get();
      if (!doc.exists) return;

      const data = doc.data();

      let chats = data.chats;
      chats = chats.filter((chatId: any) => chatRoomId !== chatId);

      // // update by query would be better.
      await db
        .collection('users')
        .doc(uid)
        .set({
          ...data,
          chats,
        });
    };

    return cors(req, res, async () => {
      if (req.method !== 'POST') {
        return res.status(401).json({
          message: 'Not allowed',
        });
      }

      const { chatRoomId, token }: any = req.body;
      if (!chatRoomId) {
        return res.status(400).json({
          message: 'Invalid Parameters',
        });
      }

      let uid: string = '';
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        uid = decodedToken.uid;
      } catch {
        return res.status(401).json({
          message: 'Failed to verify the token',
        });
      }

      await removeMemberInChatRoomIfChatIsGroup(uid, chatRoomId);
      await removeChatRoomInUserChats(uid, chatRoomId);

      return res.status(200).json({
        message: 'OK',
      });
    });
  });
