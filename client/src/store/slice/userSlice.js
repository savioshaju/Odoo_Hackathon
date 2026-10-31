import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: null,
    },
    reducers: {
        saveUserData: (state, action) => {
            state.userData = action.payload;
        },
        clearUserData: (state) => {
            state.userData = null;
        },
    },
});

export const { saveUserData, clearUserData } = userSlice.actions;
const userReducer = userSlice.reducer;
export default userReducer;

