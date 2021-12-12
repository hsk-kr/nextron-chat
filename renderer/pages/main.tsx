import { useEffect, useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Grid, Box, Typography, Button, Divider } from '@material-ui/core';
import { Theme, makeStyles, createStyles } from '@material-ui/core/styles';
import { signOut } from 'firebase/auth';
import {
  onSnapshot,
  collection,
  doc,
  getDoc,
  getDocs,
  where,
  query,
  orderBy,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import network from '../lib/network';
import { redirectLoginIfUserNotExist, useAuth } from '../context/auth';
import { useAlert } from '../context/alert';
import {
  Message as MessageType,
  ChatRoom as ChatRoomType,
  SelectedChatRoom,
} from '../types';
import UserList from '../components/UserList';
import ChatList from '../components/ChatList';
import EmptyRoom from '../components/EmptyRoom';
import ChatRoom from '../components/ChatRoom';
import UserSelectionModal from '../components/UserSelectionModal';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      height: '100vh',
    },
    sidebar: {
      height: '100%',
      backgroundColor: '#ececec',
      display: 'flex',
      flexDirection: 'column',
    },
    main: {
      height: '100%',
      backgroundColor: '#fff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    sidebarHeader: {
      display: 'flex',
      justifyContent: 'center',
    },
  })
);

function Main() {
  const router = useRouter();
  const classes = useStyles();
  const [working, setWorking] = useState<boolean>(false);
  const [selectedChat, setSelectedChat] = useState<SelectedChatRoom>(undefined);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [users, setUsers] = useState<{ [key: string]: FirebaseUser }>({});
  const [chatRoomIds, setChatRoomIds] = useState<string[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([]);
  const [userSelectionModalVisible, setUserSelectionModalVisible] =
    useState<boolean>(false);
  const { user } = useAuth();
  const { showErrorMsg } = useAlert();
  const userList = useMemo<FirebaseUser[]>(() => {
    const keys = Object.keys(users);
    if (keys.length <= 0 || !user) return [];
    const newUserList = [];

    keys.sort();

    // Make logged user to first element of userList.
    newUserList.push(users[user.uid]);

    for (const key of keys) {
      if (key === user.uid) continue;

      newUserList.push(users[key]);
    }

    return newUserList;
  }, [users, user]);

  const handleModalOpen = useCallback(() => {
    setUserSelectionModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setUserSelectionModalVisible(false);
  }, []);

  const handleModalSubmit = useCallback(async (userIds: string[]) => {
    handleModalClose();

    try {
      const token = await auth.currentUser.getIdToken();

      network.post('openGroupChat', {
        members: userIds,
        token,
      });
    } catch (err) {
      showErrorMsg(JSON.stringify(err));
    }
  }, []);

  const handleUserSelect = useCallback(
    (uid: string, email: string) => () => {
      if (working || user.uid === uid) return; // prevent to switch a chat room while retrieving messages or the user clicks themeselves

      for (const chatRoom of chatRooms) {
        if (chatRoom.type === 'private' && chatRoom.members.includes(uid)) {
          setSelectedChat(chatRoom);
          return;
        }
      }

      setSelectedChat({
        to: {
          email,
          uid,
        },
      });
    },
    [chatRooms, user, working]
  );

  const handleChatSelect = useCallback(
    (selectedChatRoom: ChatRoomType) => () => {
      if (working) return; // prevent to switch a chat room while retrieving messages

      setSelectedChat(
        chatRooms.filter((chatRoom) => chatRoom.id === selectedChatRoom.id)[0]
      );
    },
    [working, chatRooms]
  );

  const handleChatLeave = useCallback(
    (selectedChatRoom: ChatRoomType) => async () => {
      if (!('id' in selectedChatRoom)) return;

      // If the chat room's focusing, release the selection
      if (
        selectedChat &&
        'id' in selectedChat &&
        selectedChat.id === selectedChatRoom.id
      ) {
        setSelectedChat(undefined);
      }

      if (chatRooms && chatRooms.length > 0) {
        setChatRooms(
          chatRooms.filter((chatRoom) => chatRoom.id !== selectedChatRoom.id)
        );
      }

      const token = await auth.currentUser.getIdToken();
      try {
        await network.post('leaveChatRoom', {
          chatRoomId: selectedChatRoom.id,
          token,
        });
      } catch {}
    },
    [chatRooms, selectedChat]
  );

  const handleLogout = useCallback(() => {
    signOut(auth).then(() => {
      router.push('/login');
    });
  }, []);

  const handleMessageSend = useCallback(
    async (message) => {
      if (!selectedChat) return;

      const token = await auth.currentUser.getIdToken();

      try {
        const res = await network.post('sendMessage', {
          chatRoomId: 'id' in selectedChat ? selectedChat.id : undefined,
          to: 'to' in selectedChat ? selectedChat.to.uid : undefined,
          token,
          message,
        });

        if (res.status === 200 && !('id' in selectedChat)) {
          const { id } = res.data;
          if (!id) {
            showErrorMsg('Returns No Id with a status code 200');
            return;
          }
          // Fetch the chatRoom then set selectedChat
          const docSnap = await getDoc(doc(db, 'chatRooms', id));
          if (!docSnap.exists) {
            showErrorMsg('There is not the chat room.');
            return;
          }
          const data = docSnap.data();
          setSelectedChat({
            id,
            type: data.type,
            members: data.members,
          });
        } else if (res.status !== 200) {
          showErrorMsg(`Status Code: ${res.status}`);
        }
      } catch (err) {
        showErrorMsg(JSON.stringify(err));
      }
    },
    [selectedChat, chatRooms]
  );

  // Subscribe and fetch a collection 'users'
  useEffect(() => {
    if (!user) return;

    const q = collection(db, 'users');
    return onSnapshot(q, (querySnapshot) => {
      const newUsers = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        newUsers[data.uid] = data;
      });

      setUsers(newUsers);
    });
  }, [user]);

  // Fetch chat rooms' detail data when chatRoomIds is changed
  useEffect(() => {
    if (!user) return;

    if (Object.keys(users).length <= 0) {
      setChatRooms([]);
      return;
    }

    const run = async () => {
      const newChatRooms = [];

      for (const chatRoomId of chatRoomIds) {
        const docSnap = await getDoc(doc(db, 'chatRooms', chatRoomId));

        if (docSnap.exists) {
          let { type, members } = docSnap.data();
          newChatRooms.push({ id: chatRoomId, members, type });
        }
      }

      setChatRooms(newChatRooms);
    };

    run();
  }, [chatRoomIds]);

  // Subscribe and fetch chat rooms that the user's in
  useEffect(() => {
    if (!user) return;

    const q = doc(db, 'users', user.uid);

    return onSnapshot(q, (doc) => {
      const data = doc.data();

      if (!data?.chats) return;
      const newChatRoomIds = data.chats;
      setChatRoomIds(newChatRoomIds);
    });
  }, [user]);

  // Get all messages when selected chat is changed
  useEffect(() => {
    if (!selectedChat || !('id' in selectedChat) || !users || !user) {
      setMessages([]);
      return;
    }

    if (!user) return;

    const { uid } = user;
    const chatRoomId = selectedChat.id;
    const q = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', chatRoomId),
      orderBy('sentAt', 'asc')
    );

    let unmounted = false;
    let unboundFunc: { func: any } = { func: undefined };

    // Get all messages once
    const run = async () => {
      const newMessages: MessageType[] = [];
      const querySnapshot = await getDocs(q);

      if (unmounted) return; // prevent to change messages when this effect unmounted

      if (querySnapshot.size === 0) {
        setMessages([]);
        const q = query(
          collection(db, 'messages'),
          where('chatRoomId', '==', selectedChat.id),
          orderBy('sentAt', 'asc')
        );

        unboundFunc.func = onSnapshot(q, (querySnapshot) => {
          if (querySnapshot.size === 0) return;

          querySnapshot.forEach((doc: any) => {
            const data = doc.data();

            newMessages.push({
              ...data,
              mine: uid === data.sender,
              senderEmail: users[data.sender].email,
            });
          });

          setMessages((prevMessages) => {
            if (prevMessages.length === 0) {
              return newMessages;
            }
            return prevMessages;
          });

          unboundFunc.func();
        });
      } else {
        querySnapshot.forEach((doc: any) => {
          const data = doc.data();
          newMessages.push({
            ...data,
            mine: uid === data.sender,
            senderEmail: users[data.sender].email,
          });
        });

        setMessages(newMessages);
      }

      setWorking(false);
    };

    setWorking(true);
    run();

    return () => {
      unmounted = true;
      setWorking(false);

      if (unboundFunc.func) unboundFunc.func();
    };
  }, [selectedChat]);

  //  and subscribe messages of current chat room
  useEffect(() => {
    if (
      !selectedChat ||
      !('id' in selectedChat) ||
      messages.length <= 0 ||
      !user
    )
      return;

    const { uid } = user;
    const latestMessage = messages[messages.length - 1];

    const q = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', selectedChat.id),
      where('sentAt', '>', latestMessage.sentAt),
      orderBy('sentAt', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const addedMessages = [];

      querySnapshot.forEach((doc: any) => {
        const data = doc.data();

        addedMessages.push({
          ...data,
          mine: uid === data.sender,
          senderEmail: users[data.sender].email,
        });
      });

      if (addedMessages.length > 0) {
        setMessages(messages.concat(addedMessages));
      }
    });
  }, [messages]);

  redirectLoginIfUserNotExist();

  return (
    <>
      <Head>
        <title>Chat</title>
      </Head>
      <Grid container className={classes.container}>
        <UserSelectionModal
          users={userList.filter((u) => u.uid !== user.uid)}
          visible={userSelectionModalVisible}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />
        <Grid item xs={4} className={classes.sidebar}>
          <Box className={classes.sidebarHeader}>
            <Typography variant="h6" component="div">
              Users ({userList.length}){' '}
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </Typography>
          </Box>
          <Divider />
          <UserList users={userList} onUserSelect={handleUserSelect} />
          <Divider />
          <Box className={classes.sidebarHeader}>
            <Typography variant="h6" component="div">
              Rooms ({chatRooms.length}){' '}
              <Button color="inherit" onClick={handleModalOpen}>
                Add
              </Button>
            </Typography>
          </Box>
          <Divider />
          {/** Temporary */}
          <ChatList
            chatRooms={
              user &&
              users &&
              chatRooms &&
              chatRooms.map((chatRoom) => ({
                ...chatRoom,
                members: chatRoom.members
                  .filter((member) => member !== user.uid)
                  .map((member) => users[member].email),
              }))
            }
            onChatSelect={handleChatSelect}
            onChatLeave={handleChatLeave}
          />
        </Grid>
        <Grid item xs={8} className={classes.main}>
          {selectedChat ? (
            <ChatRoom
              onSubmit={handleMessageSend}
              messages={messages}
              to={
                user && users
                  ? 'to' in selectedChat
                    ? selectedChat.to.email
                    : selectedChat.members
                        .filter((member) => member !== user.uid)
                        .map((member) =>
                          member in users ? users[member].email : ''
                        )
                        .join(', ')
                  : ''
              }
            />
          ) : (
            <EmptyRoom />
          )}
        </Grid>
      </Grid>
    </>
  );
}

export default Main;
