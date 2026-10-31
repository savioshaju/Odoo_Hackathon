import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getDemoUser, setDemoUser } from '../api.js';
import { userByKey } from './demoUsers.js';

const DemoUserContext = createContext(null);

export function DemoUserProvider({ children }) {
  const queryClient = useQueryClient();
  const [key, setKey] = useState(getDemoUser);

  const switchTo = useCallback(
    (next) => {
      setDemoUser(next);
      setKey(next);
      queryClient.clear(); // everything on screen belongs to the previous user
    },
    [queryClient],
  );

  const value = useMemo(() => ({ user: userByKey(key), switchTo }), [key, switchTo]);
  return <DemoUserContext.Provider value={value}>{children}</DemoUserContext.Provider>;
}

export function useDemoUser() {
  const ctx = useContext(DemoUserContext);
  if (!ctx) throw new Error('useDemoUser must be used inside DemoUserProvider');
  return ctx;
}
