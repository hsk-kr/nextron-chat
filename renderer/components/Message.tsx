import React from 'react';
import { Theme, makeStyles, createStyles } from '@material-ui/core/styles';

interface Props {
  children?: React.ReactNode | string;
  sender?: string;
  timestamp?: string;
  mine?: boolean;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    message: {},
    sender: {
      fontSize: 11,
      color: '#1e272e',
    },
    otherMessage: {
      maxWidth: '80%',
      width: 'fit-content',
      backgroundColor: '#aaaaaa',
      padding: 8,
      margin: 8,
      borderRadius: 8,
      display: 'flex',
      flexDirection: 'column',
      wordBreak: 'break-word',
    },
    myMessage: {
      maxWidth: '80%',
      width: 'fit-content',
      backgroundColor: '#ffdd59',
      padding: 8,
      margin: 8,
      borderRadius: 8,
      alignSelf: 'flex-end',
      wordBreak: 'break-word',
    },
  })
);

function Message({
  children,
  sender = '',
  timestamp = '',
  mine = true,
}: Props) {
  const classes = useStyles();

  return (
    <div className={mine ? classes.myMessage : classes.otherMessage}>
      {sender && <span className={classes.sender}>{sender}</span>}
      <p>{children}</p>
    </div>
  );
}

export default Message;
