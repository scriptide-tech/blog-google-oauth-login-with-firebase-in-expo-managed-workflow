import { useState, useEffect, useCallback } from "react";
import { Button, Text } from "react-native";
import { useIdTokenAuthRequest as useGoogleIdTokenAuthRequest } from "expo-auth-session/providers/google";
import {
  signInWithCredential,
  GoogleAuthProvider,
  User,
  initializeAuth,
  getReactNativePersistence,
  OAuthCredential,
} from "firebase/auth/react-native";
import {
  androidClientId,
  app,
  expoClientId,
  iosClientId,
} from "./firebaseConfig";
import * as SecureStore from "expo-secure-store";

// Util to remove non alphanumeric values from a string
const replaceNonAlphaNumericValues = (key: string) =>
  key.replaceAll(/[^a-zA-Z\d\s]/g, "");

// Persistor for React Native using Secure Storage
const myReactNativeLocalPersistence = getReactNativePersistence({
  async getItem(key) {
    return SecureStore.getItemAsync(replaceNonAlphaNumericValues(key));
  },
  setItem(key, value) {
    return SecureStore.setItemAsync(replaceNonAlphaNumericValues(key), value);
  },
  removeItem(key) {
    return SecureStore.deleteItemAsync(replaceNonAlphaNumericValues(key));
  },
});

// create Firebase auth instace
const auth = initializeAuth(app, {
  persistence: myReactNativeLocalPersistence,
});

export const GoogleLogin: React.FC = () => {
  const [accessToken, setAccessToken] = useState("");
  const [user, setUser] = useState<User | null>(null);

  // Sets the user to the state to be accessible in the component
  // @NOTE: This can be moved to a context so this component can act as a provider
  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      setUser(user);
    });
  }, []);

  // Hook that gives us the function to authenticate our Google OAuth provider
  const [, googleResponse, promptAsyncGoogle] = useGoogleIdTokenAuthRequest({
    selectAccount: true,
    expoClientId,
    iosClientId,
    androidClientId,
  });

  // Handles the login via the Google Provider
  const handleLoginGoogle = async () => {
    await promptAsyncGoogle();
  };

  // Function that logs into firebase using the credentials from an OAuth provider
  const loginToFirebase = useCallback(async (credentials: OAuthCredential) => {
    const signInResponse = await signInWithCredential(auth, credentials);
    const token = await signInResponse.user.getIdToken();
  }, []);

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const credentials = GoogleAuthProvider.credential(
        googleResponse.params.id_token
      );
      loginToFirebase(credentials);
    }
  }, [googleResponse]);

  // Handles the logout using Google Provider
  const handleLogoutGoogle = () => {
    auth.signOut();
    setUser(null);
  };

  return (
    <>
      {user ? (
        <>
          <Button title={"Logout"} onPress={handleLogoutGoogle} />
          <Text>Logged in as:</Text>
          <Text>{user.displayName}</Text>
          <Text>{user.email}</Text>
        </>
      ) : (
        <Button title={"Login"} onPress={handleLoginGoogle} />
      )}
    </>
  );
};
