import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface WebNotification {
  id: string;
  tenantId: number;
  userId?: number;
  title: string;
  description: string;
  type: string;
  status: 'UNREAD' | 'READ' | 'DELETED';
  createdAt: string;
}

interface NotificationState {
  items: WebNotification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
}

const initialState: NotificationState = {
  items: [],
  loading: false,
  error: null,
  unreadCount: 0,
};

// Async thunks for API calls
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        }
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<WebNotification>) => {
      state.items.unshift(action.payload);
      if (action.payload.status === 'UNREAD') {
        state.unreadCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<WebNotification[]>) => {
        state.loading = false;
        state.items = action.payload;
        state.unreadCount = action.payload.filter(n => n.status === 'UNREAD').length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markAsRead.fulfilled, (state, action: PayloadAction<string>) => {
        const index = state.items.findIndex(n => n.id === action.payload);
        if (index !== -1 && state.items[index].status === 'UNREAD') {
          state.items[index].status = 'READ';
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(deleteNotification.fulfilled, (state, action: PayloadAction<string>) => {
        const index = state.items.findIndex(n => n.id === action.payload);
        if (index !== -1) {
          if (state.items[index].status === 'UNREAD') {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.items.splice(index, 1);
        }
      });
  },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
