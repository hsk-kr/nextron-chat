import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { IAuthContext } from '../types';

const AuthContext = createContext<IAuthContext>({
  user: null,
  loading: false,
});

export const redirectMainIfUserExist = () => {
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem('user')) {
      router.push('/main');
    }
  }, []);
};

export const redirectLoginIfUserNotExist = () => {
  const router = useRouter();

  useEffect(() => {
    if (!sessionStorage.getItem('user')) {
      router.push('/login');
    }
  }, []);
};

export const redirectDependsOnUserExistence = () => {
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem('user')) {
      router.push('/main');
    } else {
      router.push('/login');
    }
  }, []);
};

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (authState) => {
      if (!authState) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setUser(authState);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('user');
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
