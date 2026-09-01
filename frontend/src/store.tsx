import {
  configureStore,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import {
  Provider,
  useDispatch,
  useSelector,
} from 'react-redux';
import { ReactNode } from 'react';

import { User } from './types';

const savedUser = localStorage.getItem('rateiq_user');

const authSlice = createSlice({
  name: 'auth',

  initialState: {
    user: savedUser
      ? (JSON.parse(savedUser) as User)
      : null,
    token: localStorage.getItem('rateiq_token') as string | null,
  },

  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;

      localStorage.setItem(
        'rateiq_user',
        JSON.stringify(action.payload.user),
      );

      localStorage.setItem(
        'rateiq_token',
        action.payload.token,
      );
    },

    clearAuth: (state) => {
      state.user = null;
      state.token = null;

      localStorage.removeItem('rateiq_user');
      localStorage.removeItem('rateiq_token');
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export const useAuth = () =>
  useSelector((state: RootState) => state.auth);

export const useAppDispatch = () =>
  useDispatch<AppDispatch>();

export function AppStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
}