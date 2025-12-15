import { useEffect, useMemo, useState } from 'react';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import initializeAuthentication from '../Firebase/firebase.init';

initializeAuthentication();

const useFirebase = () => {
  const [user, setUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Create a stable auth instance (prevents re-creating on every render)
  const auth = useMemo(() => getAuth(), []);

  const signInUsingGoogle = () => {
    setIsLoading(true);
    const googleProvider = new GoogleAuthProvider();

    return signInWithPopup(auth, googleProvider)
      .then((result) => {
        setUser(result.user);
        return result.user;
      })
      .finally(() => setIsLoading(false));
  };

  // Observe user state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || {});
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const logOut = () => {
    setIsLoading(true);
    return signOut(auth)
      .then(() => {
        setUser({});
      })
      .finally(() => setIsLoading(false));
  };

  return {
    user,
    isLoading,
    signInUsingGoogle,
    logOut,
  };
};

export default useFirebase;
