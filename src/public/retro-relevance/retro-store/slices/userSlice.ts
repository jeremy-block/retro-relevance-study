// // src/store/slices/userSlice.ts
// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { User } from '../../retro-types';

// const initialState: User = {
//   userId: '1234', // Default user ID
//   condition: 'U',// Marking them as unassigned
//   phase: '4', // Default phase 4 since we're staring here for this study
// };

//   // Generate a random user ID
// function generateUserId(condition: string) {
//     const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
//     const newId = `${condition}${randomId}`;
//     return newId;
//   };
  
// const userSlice = createSlice({
//   name: 'user',
//   initialState,
//   reducers: {
//     setStudy(state, action: PayloadAction<{ userId: string | number, condition: string, phase: string }>) {
//       if (typeof action.payload.userId === 'number') {
//         state.userId = `${action.payload.condition}_${action.payload.userId}`;
//       } else {
//         state.userId = action.payload.userId;
//       }
//         state.condition = action.payload.condition;
//         state.phase = action.payload.phase;
//     },
//     generateUserId(state, action: PayloadAction<{condition: string}>) {
//       const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
//       const newId = `${action.payload}${randomId}`;
//       state.userId = newId;
//     },
//     setUser(state, action: PayloadAction<{ userId: string } | null>) {
//       console.log('action.payload', action.payload);  
//       state.userId = action.payload?.userId || generateUserId(state.condition);
//     },
//     setCondition(state, action: PayloadAction<string>) {
//       console.log("🚀 ~ setCondition ~ action:", action)
//       state.condition = action.payload;
//     },
//     setPhase(state, action: PayloadAction<string>) {
//       state.phase = action.payload;
//     },
//   },
// });

// export const { setStudy, setUser, setCondition, setPhase } = userSlice.actions;
// export default userSlice.reducer;