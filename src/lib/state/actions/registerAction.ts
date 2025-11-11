// src/lib/state/actions/registerAction.ts
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { register, verifyOtp, resendOtp } from "../../api/auth.api";

interface RegisterState {
  loading: boolean;
  message: string | null;
  error: string | null;
  email: string | null;
  formData: any | null;
  showOTP: boolean;
}

const initialState: RegisterState = {
  loading: false,
  message: null,
  error: null,
  email: null,
  formData: null,
  showOTP: false,
};

// Send OTP
export const registerUser = createAsyncThunk<
  { message: string; email: string; formData: any },
  any,
  { rejectValue: string }
>("register/registerUser", async (data, { rejectWithValue }) => {
  try {
    const res = await register(data);
    return { message: res.data.message, email: data.email, formData: data };
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || "Registration failed"
    );
  }
});

// Verify OTP
export const verifyOtpAction = createAsyncThunk<
  { message: string },
  { email: string; otp: string; formData: any },
  { rejectValue: string }
>(
  "register/verifyOtp",
  async ({ email, otp, formData }, { rejectWithValue }) => {
    try {
      const res = await verifyOtp(email, otp, formData);
      return { message: res.data.message };
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "OTP verification failed"
      );
    }
  }
);

// Resend OTP
export const resendOtpAction = createAsyncThunk<
  { message: string },
  { email: string },
  { rejectValue: string }
>("register/resendOtp", async ({ email }, { rejectWithValue }) => {
  try {
    const res = await resendOtp(email);
    return { message: res.data.message };
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || "Resend OTP failed");
  }
});

const registerAction = createSlice({
  name: "register",
  initialState,
  reducers: {
    clearRegisterState: (state) => {
      state.loading = false;
      state.message = null;
      state.error = null;
      state.showOTP = false;
      state.email = null;
      state.formData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.message = null;
        state.error = null;
      })
      .addCase(
        registerUser.fulfilled,
        (
          state,
          action: PayloadAction<{
            message: string;
            email: string;
            formData: any;
          }>
        ) => {
          state.loading = false;
          state.message = action.payload.message;
          state.error = null;
          state.showOTP = true;
          state.email = action.payload.email;
          state.formData = action.payload.formData;
        }
      )
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.message = null;
      })
      .addCase(verifyOtpAction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(
        verifyOtpAction.fulfilled,
        (state, action: PayloadAction<{ message: string }>) => {
          state.loading = false;
          state.message = action.payload.message;
          state.error = null;
          state.showOTP = false;
        }
      )
      .addCase(verifyOtpAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(resendOtpAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        resendOtpAction.fulfilled,
        (state, action: PayloadAction<{ message: string }>) => {
          state.loading = false;
          state.message = action.payload.message;
        }
      )
      .addCase(resendOtpAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearRegisterState } = registerAction.actions;
export default registerAction.reducer;
