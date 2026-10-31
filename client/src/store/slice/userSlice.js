import { createSlice } from "@reduxjs/toolkit";

const getInitialUserData = () => {
    try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: getInitialUserData(),
    },
    reducers: {
        saveUserData: (state, action) => {
            state.userData = action.payload;
            try {
                if (action.payload) {
                    localStorage.setItem("user", JSON.stringify(action.payload));
                } else {
                    localStorage.removeItem("user");
                }
            } catch (err) {
                console.warn("Failed to persist user in localStorage:", err);
            }
        },
        clearUserData: (state) => {
            state.userData = null;
            try {
                localStorage.removeItem("user");
                localStorage.removeItem("token");
            } catch (err) {
                console.warn("Failed to clear user from localStorage:", err);
            }
        },
    },
});

export const { saveUserData, clearUserData } = userSlice.actions;
const userReducer = userSlice.reducer;
export default userReducer;
