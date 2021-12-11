import React, { useState, useCallback } from 'react';
import { Grid, Button } from '@material-ui/core';
import { Theme, makeStyles, createStyles } from '@material-ui/core/styles';
import Message from './Message';
import { Message as MessageType } from '../types';

interface Props {
  onSubmit: (message: string) => void;
  messages: MessageType[];
  to: string;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    chatRoom: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    chatRoomMessages: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    },
    sendForm: {
      display: 'flex',
      alignItems: 'center',
      height: 48,
    },
    sendFormInput: {
      flexGrow: 1,
      height: '100%',
    },
    sendFormButton: {
      height: '100%',
    },
    to: {
      padding: 12,
      borderBottom: '1px solid black',
    },
  })
);

function ChatRoom({ onSubmit, messages, to }: Props) {
  const [message, setMessage] = useState('');
  const classes = useStyles();

  const handleSubmit = useCallback(() => {
    if (!onSubmit || !message) return;

    onSubmit(message);
    setMessage('');
  }, [message, onSubmit]);

  return (
    <Grid container className={classes.chatRoom}>
      <div className={classes.to}>{to}</div>
      <div className={classes.chatRoomMessages}>
        {messages.map((message, messageIdx) => (
          <Message
            key={messageIdx}
            mine={message.mine}
            sender={message.senderEmail ? message.senderEmail : ''}
          >
            {message.message}
          </Message>
        ))}
      </div>
      <div className={classes.sendForm}>
        <input
          type="text"
          className={classes.sendFormInput}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        />
        <Button
          variant="contained"
          className={classes.sendFormButton}
          onClick={handleSubmit}
        >
          SEND
        </Button>
      </div>
    </Grid>
  );
}

export default ChatRoom;
