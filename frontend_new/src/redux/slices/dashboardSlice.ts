import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dashboardService from '@/services/dashboardService';
import type { DashboardStats, PipelineStats } from '@/services/dashboardService';

interface DashboardState {
  stats: DashboardStats | null;
  pipelineStats: PipelineStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: DashboardState = {
  stats: null,
  pipelineStats: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (companyId: number | undefined, { rejectWithValue }) => {
    try {
      const [stats, pipelineStats] = await Promise.all([
        dashboardService.getStats(companyId),
        dashboardService.getPipelineStats(companyId)
      ]);
      return { stats, pipelineStats };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar datos del dashboard');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.pipelineStats = action.payload.pipelineStats;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
