import React from 'react';
import { Avatar, List, ListItemAvatar } from '@material-ui/core';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Theme, makeStyles, createStyles } from '@material-ui/core/styles';
import { User as FirebaseUser } from 'firebase/auth';

interface Props {
  users: FirebaseUser[];
  onUserSelect: (uid: string, email: string) => () => void;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    userList: {
      flexGrow: 1,
      overflowY: 'auto',
    },
    me: {
      color: '#40739e',
    },
  })
);

function stringToColor(string: string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.substr(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

function stringAvatar(name: string) {
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: name.substring(0, 2),
  };
}

function UserList({ users, onUserSelect }: Props) {
  const classes = useStyles();

  return (
    <List dense className={classes.userList}>
      {users &&
        users.map((user, userIdx) => {
          return (
            <ListItem
              key={user.uid}
              onClick={
                onUserSelect ? onUserSelect(user.uid, user.email) : undefined
              }
              className={userIdx === 0 ? classes.me : ''}
            >
              <ListItemButton>
                <ListItemAvatar>
                  <Avatar {...stringAvatar(user.email)} />
                </ListItemAvatar>
                <ListItemText primary={user.email} />
              </ListItemButton>
            </ListItem>
          );
        })}
    </List>
  );
}

export default UserList;
