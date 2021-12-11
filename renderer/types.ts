import { User as FirebaseUser } from 'firebase/auth';

export type FormType = 'SIGN_IN' | 'SIGN_UP';

export interface IAuthContext {
  user: FirebaseUser;
  loading: boolean;
}

export interface IAlertContext {
  showErrorMsg: (msg: string) => void;
  showSuccessMsg: (msg: string) => void;
}

export interface Message {
  chatRoomId: string;
  message: string;
  sender: string;
  sentAt: number;
  mine?: boolean;
  senderEmail?: string;
}

export interface ChatRoom {
  id?: string;
  type: 'group' | 'private';
  members: string[];
}

export type SelectedChatRoom =
  | ChatRoom
  | undefined
  | { to: { email: string; uid: string } };

export type AlertType = 'error' | 'warning' | 'info' | 'success';

export type AlertState = {
  open: boolean;
  type: AlertType;
  message: string;
};
