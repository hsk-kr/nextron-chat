import { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { IAlertContext, AlertType, AlertState } from '../types';

const AlertContext = createContext<IAlertContext>({} as IAlertContext);

export function AlertContextProvider({ children }) {
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    type: 'error',
    message: '',
  });

  const handleClose = useCallback(
    (e: any, reason: string) => {
      if (reason === 'clickaway') {
        return;
      }

      setAlert({
        ...alert,
        open: false,
      });
    },
    [alert]
  );

  const showMessage = (type: AlertType) => (msg: string) => {
    setAlert({
      open: true,
      message: msg,
      type,
    });
  };

  const showErrorMsg = showMessage('error');

  const showSuccessMsg = showMessage('success');

  return (
    <AlertContext.Provider value={{ showErrorMsg, showSuccessMsg }}>
      <Snackbar open={alert.open} autoHideDuration={3000} onClose={handleClose}>
        <Alert
          onClose={handleClose as any}
          severity={alert.type}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
      {children}
    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);
