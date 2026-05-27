import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface UnreadContact {
  contactId: number;
  contactName: string;
  phone: string;
  avatarUrl?: string;
  unreadCount: number;
}

interface UnreadMessagesState {
  items: UnreadContact[];
  loading: boolean;
  error: string | null;
  totalUnread: number;
}

const initialState: UnreadMessagesState = {
  items: [],
  loading: false,
  error: null,
  totalUnread: 0,
};

export const fetchUnreadSummary = createAsyncThunk(
  'unreadMessages/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/unread-summary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
          'X-Tenant-Id': localStorage.getItem('tenantId') || '',
          'X-Company-Id': localStorage.getItem('activeCompanyId') || localStorage.getItem('companyId') || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch unread summary');
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const markContactAsRead = createAsyncThunk(
  'unreadMessages/markAsRead',
  async (contactId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/mark-read/${contactId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
          'X-Tenant-Id': localStorage.getItem('tenantId') || '',
          'X-Company-Id': localStorage.getItem('activeCompanyId') || localStorage.getItem('companyId') || ''
        }
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return contactId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const unreadMessagesSlice = createSlice({
  name: 'unreadMessages',
  initialState,
  reducers: {
    incrementUnread: (state, action: PayloadAction<{ contactId: number; contactName: string; phone?: string }>) => {
      const existing = state.items.find(i => i.contactId === action.payload.contactId);
      if (existing) {
        existing.unreadCount += 1;
      } else {
        state.items.unshift({
          contactId: action.payload.contactId,
          contactName: action.payload.contactName,
          phone: action.payload.phone || '',
          unreadCount: 1,
        });
      }
      state.totalUnread += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnreadSummary.fulfilled, (state, action: PayloadAction<UnreadContact[]>) => {
        state.loading = false;
        state.items = action.payload;
        state.totalUnread = action.payload.reduce((sum, item) => sum + item.unreadCount, 0);
      })
      .addCase(fetchUnreadSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markContactAsRead.fulfilled, (state, action: PayloadAction<number>) => {
        const index = state.items.findIndex(i => i.contactId === action.payload);
        if (index !== -1) {
          state.totalUnread = Math.max(0, state.totalUnread - state.items[index].unreadCount);
          state.items.splice(index, 1);
        }
      });
  },
});

export const { incrementUnread } = unreadMessagesSlice.actions;
export default unreadMessagesSlice.reducer;
