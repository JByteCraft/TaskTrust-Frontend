# Login Page Test Cases (Client Interactable Features)

## Login (client)

        [ ] Login form
            [ ] Email input
            [ ] Password input
            [ ] Remember Me checkbox
            [ ] Sign In button (enabled by default)
            [ ] Password visibility toggle
            [ ] Forgot Password link
            [ ] Sign Up link
    [ ] Forgot Password
    [ ] Reset Password

## 2. Input Validation

- [ ] Email field requires input (cannot submit empty)
- [ ] Email field validates correct email format
- [ ] Password field requires input (cannot submit empty)
- [ ] Error message shown for invalid email format
- [ ] Error message shown for empty password
- [ ] Error message shown for empty email

## 3. Password Visibility Toggle

- [ ] Clicking the eye icon toggles password visibility
- [ ] Password field switches between text and password type

## 4. Remember Me

- [ ] Checking "Remember Me" persists login session
- [ ] Unchecking "Remember Me" does not persist session

## 5. Form Submission

- [ ] Submitting valid credentials triggers login API call
- [ ] Submitting invalid credentials shows error message
- [ ] Loading indicator appears during login request
- [ ] On successful login, user is redirected to home/dashboard
- [ ] On failed login, error message is displayed
- [ ] Login button is disabled during loading

## 6. Navigation Links

- [ ] Clicking "Forgot password?" navigates to Forgot Password page
- [ ] Clicking "Sign up here" navigates to Register page

## 7. Auth State

- [ ] If already authenticated, user is redirected to home/dashboard

## 8. Accessibility

- [ ] All form fields have proper labels
- [ ] Error messages use aria attributes for accessibility
- [ ] All interactive elements are keyboard accessible

## 9. Edge Cases

- [ ] Submitting form with spaces in email/password trims input
- [ ] Submitting form with very long email/password handles gracefully
- [ ] Multiple rapid submissions are prevented

---

_Last updated: November 19, 2025_
