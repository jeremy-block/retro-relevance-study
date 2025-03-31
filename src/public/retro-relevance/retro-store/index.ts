// // src/store/index.ts
// import { configureStore } from '@reduxjs/toolkit';
// import userReducer from './slices/userSlice.ts';
// import logsReducer from './slices/logsSlice.ts';
// import contentReducer from './slices/contentSlice.ts'
// // import { loggerMiddleware } from './middleware/logger';

// export const retroStore = configureStore({
//   reducer: {
//     user: userReducer, // Handles user-related state changes
//     logs: logsReducer, // Manages log entries and related data
//     content: contentReducer, // Controls content-related state
//   },
//   // middleware: (getDefaultMiddleware) => 
//   //   getDefaultMiddleware().concat(loggerMiddleware), // Extends default middleware with a logging function
// });

// export type RootState = ReturnType<typeof retroStore.getState>; // Defines the global state type for type safety
// export type AppDispatch = typeof retroStore.dispatch; // Defines the dispatch function type for consistent action dispatching
