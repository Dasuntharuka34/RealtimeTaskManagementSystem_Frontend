import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const login = createAsyncThunk('auth/login', async (credentials, thunkAPI) => {
    try {
        const response = await api.post('/users/login', credentials);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.message);
    }
});

export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
    try {
        const response = await api.post('/users/register', userData);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.message);
    }
});

export const logout = createAsyncThunk('auth/logout', async () => {
    await api.post('/users/logout');
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (userData, thunkAPI) => {
    try {
        const response = await api.put('/users/profile', userData);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.message);
    }
});

export const uploadAvatar = createAsyncThunk('auth/uploadAvatar', async (formData, thunkAPI) => {
    try {
        const response = await api.post('/users/profile/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to upload avatar');
    }
});

const userInfoFromStorage = sessionStorage.getItem('userInfo')
    ? JSON.parse(sessionStorage.getItem('userInfo'))
    : null;

const initialState = {
    userInfo: userInfoFromStorage,
    isLoading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        logoutLocal: (state) => {
            state.userInfo = null;
            sessionStorage.removeItem('userInfo');
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.userInfo = action.payload;
                sessionStorage.setItem('userInfo', JSON.stringify(action.payload));
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                // Only set userInfo and localStorage if it's a full user object (login case)
                // For verification-based registration, we just get a success message
                if (action.payload._id) {
                    state.userInfo = action.payload;
                    sessionStorage.setItem('userInfo', JSON.stringify(action.payload));
                }
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(logout.fulfilled, (state) => {
                state.userInfo = null;
                sessionStorage.removeItem('userInfo');
            })
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.userInfo = action.payload;
                sessionStorage.setItem('userInfo', JSON.stringify(action.payload));
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(uploadAvatar.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(uploadAvatar.fulfilled, (state, action) => {
                state.isLoading = false;
                state.userInfo = action.payload;
                sessionStorage.setItem('userInfo', JSON.stringify(action.payload));
            })
            .addCase(uploadAvatar.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError, logoutLocal } = authSlice.actions;
export default authSlice.reducer;
