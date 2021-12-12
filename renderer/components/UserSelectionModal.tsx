import React, { useState, useEffect, useCallback } from 'react';
import Button from '@mui/material/Button';
import { Theme, makeStyles, createStyles } from '@material-ui/core/styles';
import { Avatar, List, ListItemAvatar, Checkbox } from '@material-ui/core';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import { User as FirebaseUser } from 'firebase/auth';

interface Props {
  users: FirebaseUser[];
  visible: boolean;
  onClose: () => void;
  onSubmit: (userIds: string[]) => void;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    modalContainer: {
      position: 'fixed',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
      width: 400,
      height: 500,
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
    },
    userList: {
      flexGrow: 1,
      overflowY: 'auto',
    },
    buttons: {
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: 8,
      borderTop: '1px solid #ececec',
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

function UserSelectionModal({ visible, users, onClose, onSubmit }: Props) {
  const [selectedUsers, setSelectedUsers] = useState<{
    [key: string]: boolean;
  }>({});
  const classes = useStyles();

  const handleUserSelect = useCallback(
    (uid: string) => () => {
      const newSelectedUsers = { ...selectedUsers };

      if (uid in newSelectedUsers) {
        delete newSelectedUsers[uid];
      } else {
        newSelectedUsers[uid] = true;
      }

      setSelectedUsers(newSelectedUsers);
    },
    [selectedUsers]
  );

  const handleSubmit = useCallback(() => {
    const userIds = Object.keys(selectedUsers);

    if (userIds.length <= 0) {
      if (onClose) onClose();
      return;
    }

    if (onSubmit) onSubmit(userIds);
  }, [selectedUsers, onSubmit, onClose]);

  useEffect(() => {
    setSelectedUsers({});
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={classes.modalContainer}>
      <div className={classes.modalContent}>
        <div className={classes.userList}>
          <List dense className={classes.userList}>
            {users &&
              users.map((user, userIdx) => {
                return (
                  <ListItem
                    key={user.uid}
                    secondaryAction={
                      <Checkbox
                        edge="end"
                        onChange={handleUserSelect(user.uid)}
                        checked={user.uid in selectedUsers}
                      />
                    }
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
        </div>
        <div className={classes.buttons}>
          <Button variant="outlined" color="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleSubmit}
            disabled={Object.keys(selectedUsers).length <= 1}
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UserSelectionModal;
