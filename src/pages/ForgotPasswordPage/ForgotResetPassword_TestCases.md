# Forgot/Reset Password Page Test Cases (Client Interactable Features)

## 1. UI Elements (Forgot Password)

- [ ] Forgot Password form is visible on page load
- [ ] Email input field is present
- [ ] Send OTP button is present and enabled by default
- [ ] Error message area is present
- [ ] Link to Login page is present

## 2. Input Validation (Forgot Password)

- [ ] Email field requires input (cannot submit empty)
- [ ] Email field validates correct email format
- [ ] Error message shown for invalid email format
- [ ] Error message shown for empty email

## 3. OTP Flow (Forgot Password)

- [ ] OTP input field is present after sending OTP
- [ ] Verify OTP button is present
- [ ] Error message shown for invalid OTP
- [ ] Can resend OTP
- [ ] Success message shown after valid OTP

## 4. Navigation

- [ ] Clicking Login link navigates to Login page

## 5. UI Elements (Reset Password)

- [ ] Reset Password form is visible when accessed with valid token
- [ ] New Password input field is present
- [ ] Confirm Password input field is present
- [ ] Password visibility toggle for both fields
- [ ] Reset Password button is present and enabled by default
- [ ] Error message area is present
- [ ] Link to Login page is present

## 6. Input Validation (Reset Password)

- [ ] New Password field requires input (cannot submit empty)
- [ ] Confirm Password field requires input (cannot submit empty)
- [ ] Password field validates rules (min 8 chars)
- [ ] Confirm Password must match New Password
- [ ] Error message shown for invalid password
- [ ] Error message shown for mismatched passwords
- [ ] Error message shown for empty required fields

## 7. Form Submission (Reset Password)

- [ ] Submitting valid data triggers password reset API call
- [ ] Submitting invalid data shows error message
- [ ] Loading indicator appears during reset request
- [ ] On successful reset, success message is displayed
- [ ] On failed reset, error message is displayed
- [ ] Reset Password button is disabled during loading

## 8. Navigation

- [ ] Clicking Login link navigates to Login page

## 9. Accessibility

- [ ] All form fields have proper labels
- [ ] Error messages use aria attributes for accessibility
- [ ] All interactive elements are keyboard accessible

## 10. Edge Cases

- [ ] Submitting form with spaces in input trims input
- [ ] Submitting form with very long input handles gracefully
- [ ] Multiple rapid submissions are prevented
- [ ] Invalid or expired token shows error message and disables form

---

_Last updated: November 19, 2025_
