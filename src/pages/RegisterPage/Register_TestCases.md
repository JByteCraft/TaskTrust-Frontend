# Register (Sign Up) Page Test Cases (Client Interactable Features)

## 1. UI Elements

- [ ] Register form is visible on page load
- [ ] First Name input field is present
- [ ] Last Name input field is present
- [ ] Middle Name input field is present
- [ ] Gender selection (Male/Female) is present
- [ ] Role selection (Customer/Tasker) is present
- [ ] Email input field is present
- [ ] Password input field is present
- [ ] Confirm Password input field is present
- [ ] Password visibility toggle for both password fields
- [ ] Terms of Service/Privacy Policy checkbox is present
- [ ] Create Account button is present and enabled by default
- [ ] Sign In link is present

## 2. Input Validation

- [ ] All fields require input (cannot submit empty)
- [ ] Email field validates correct email format
- [ ] Password field validates rules (min 8 chars, 1 uppercase, 1 symbol)
- [ ] Confirm Password must match Password
- [ ] Error message shown for invalid email format
- [ ] Error message shown for invalid password
- [ ] Error message shown for mismatched passwords
- [ ] Error message shown for empty required fields
- [ ] Cannot submit unless Terms checkbox is checked

## 3. Password Visibility Toggle

- [ ] Clicking the eye icon toggles password visibility for Password
- [ ] Clicking the eye icon toggles password visibility for Confirm Password

## 4. Role and Gender Selection

- [ ] Can select Tasker or Customer role
- [ ] Can select Male or Female gender

## 5. Form Submission

- [ ] Submitting valid data triggers registration API call
- [ ] Submitting invalid data shows error message
- [ ] Loading indicator appears during registration request
- [ ] On successful registration, OTP modal appears
- [ ] On failed registration, error message is displayed
- [ ] Create Account button is disabled during loading

## 6. OTP Modal

- [ ] OTP modal appears after successful registration
- [ ] Can enter 6-digit OTP code
- [ ] Can submit OTP for verification
- [ ] Can resend OTP
- [ ] Error message shown for invalid OTP
- [ ] On successful OTP, success modal appears

## 7. Success Modal

- [ ] Success modal appears after OTP verification
- [ ] Success message is displayed
- [ ] Continue to Login button is present
- [ ] Clicking Continue navigates to Login page

## 8. Navigation Links

- [ ] Clicking Sign In link navigates to Login page

## 9. Accessibility

- [ ] All form fields have proper labels
- [ ] Error messages use aria attributes for accessibility
- [ ] All interactive elements are keyboard accessible

## 10. Edge Cases

- [ ] Submitting form with spaces in input trims input
- [ ] Submitting form with very long input handles gracefully
- [ ] Multiple rapid submissions are prevented

---

_Last updated: November 19, 2025_
