import React from 'react';
import { Theme, makeStyles, createStyles } from '@material-ui/core/styles';
import { List } from '@material-ui/core';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { ChatRoom as ChatRoomType } from '../types';

interface Props {
  chatRooms: ChatRoomType[];
  onChatSelect: (selectedChatRoom: ChatRoomType) => () => void;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    chatList: {
      flexGrow: 1,
      overflowY: 'auto',
    },
  })
);

function ChatList({ chatRooms, onChatSelect }: Props) {
  const classes = useStyles();

  return (
    <List dense className={classes.chatList}>
      {chatRooms.map((chatRoom, chatRoomId) => {
        return (
          <ListItem
            key={chatRoomId}
            secondaryAction={
              <IconButton>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemButton onClick={onChatSelect(chatRoom)}>
              <ListItemText
                primary={chatRoom.type === 'group' ? 'G' : chatRoom.members[0]}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

export default ChatList;
