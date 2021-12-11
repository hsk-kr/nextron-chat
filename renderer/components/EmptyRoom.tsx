import React from 'react';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

function EmptyRoom() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center' }}>
        <ChatBubbleOutlineIcon sx={{ fontSize: 240 }} />
      </div>
      <h1>Select a chat room</h1>
    </div>
  );
}

export default EmptyRoom;
