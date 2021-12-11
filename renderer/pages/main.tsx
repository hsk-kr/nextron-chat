import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { redirectLoginIfUserNotExist } from '../context/auth';

function Main() {
  redirectLoginIfUserNotExist();

  return (
    <div>
      Main
      <button
        onClick={() => {
          signOut(auth);
        }}
      >
        Sign Out
      </button>
    </div>
  );
}

export default Main;
