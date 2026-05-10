import { configureStore } from '@reduxjs/toolkit';
import notificationReducer from './slices/notificationSlice';
import unreadMessagesReducer from './slices/unreadMessagesSlice';

export const store = configureStore({
  reducer: {
    notifications: notificationReducer,
    unreadMessages: unreadMessagesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
