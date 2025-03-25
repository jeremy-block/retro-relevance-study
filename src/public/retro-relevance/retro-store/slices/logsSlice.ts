// src/store/slices/logsSlice.ts
// logsSlice.ts is responsible for: Storing and managing log data
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LogEntry } from '../../types';

interface LogsState {
  entries: LogEntry[];
  unsyncedEntries: LogEntry[];
  syncing: boolean;
  lastSyncTime: number | null;
}

const initialState: LogsState = {
  entries: [],
  unsyncedEntries: [],
  syncing: false,
  lastSyncTime: null,
};

const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    addLogEntry(state, action: PayloadAction<LogEntry>) {
      state.entries.push(action.payload);
      state.unsyncedEntries.push(action.payload);
    },
    addLogEntries(state, action: PayloadAction<LogEntry[]>) {
      state.entries.push(...action.payload);
    },
    setSyncing(state, action: PayloadAction<boolean>) {
      state.syncing = action.payload;
    },
    clearUnsyncedLogs(state) {
      state.unsyncedEntries = [];
      state.lastSyncTime = Date.now();
    },
    importLogs(state, action: PayloadAction<LogEntry[]>) {
      state.entries = action.payload;
      state.lastSyncTime = Date.now();
    }
  },
});

export const { 
  addLogEntry, 
  addLogEntries, 
  setSyncing, 
  clearUnsyncedLogs, 
  importLogs 
} = logsSlice.actions;

export default logsSlice.reducer;