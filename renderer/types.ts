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

export type AlertType = 'error' | 'warning' | 'info' | 'success';

export type AlertState = {
  open: boolean;
  type: AlertType;
  message: string;
};
