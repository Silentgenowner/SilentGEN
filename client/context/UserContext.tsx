"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";


type User = {
  name: string;
  email: string;
};


type UserContextType = {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
};


const UserContext = createContext<UserContextType | undefined>(
  undefined
);



export function UserProvider({
  children,
}: {
  children: ReactNode;
}) {

  const [user, setUser] = useState<User | null>(null);



  function login(userData: User) {
    setUser(userData);
  }



  function logout() {
    setUser(null);
  }



  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );

}




export function useUser() {

  const context = useContext(UserContext);


  if (!context) {
    throw new Error(
      "useUser must be used inside UserProvider"
    );
  }


  return context;

}
