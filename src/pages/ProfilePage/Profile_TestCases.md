# Profile Page Test Cases (Client Interactable Features)

## 1. UI Elements
- [ ] Profile loads successfully after navigation
- [ ] Profile hero section is visible (name, avatar, cover, stats)
- [ ] Edit Profile button is present (if viewing own profile)
- [ ] Upload Avatar button is present
- [ ] Upload Cover button is present
- [ ] Tabs for Posts, Portfolio, Reviews, Education, Schedule are present
- [ ] Create Post button is present (if viewing own profile)
- [ ] Create Review button is present (if allowed)
- [ ] Portfolio section is visible
- [ ] Education section is visible
- [ ] Reviews section is visible
- [ ] Schedule section is visible

## 2. Data Loading
- [ ] Profile data is fetched and displayed
- [ ] Posts are fetched and displayed
- [ ] Portfolio items are fetched and displayed
- [ ] Education records are fetched and displayed
- [ ] Reviews are fetched and displayed
- [ ] Schedule data is fetched and displayed
- [ ] Loading indicator appears while data is loading
- [ ] Error message shown if data fails to load

## 3. Modals and Interactions

### 3.1 Edit Profile Modal
- [ ] Edit Profile modal opens when button is clicked
- [ ] All profile fields are present and editable
- [ ] Validation errors shown for required/invalid fields
- [ ] Save button updates profile and closes modal
- [ ] Cancel button closes modal without saving
- [ ] Error message shown if save fails
- [ ] Success message shown on successful save
- [ ] Modal closes on outside click or ESC key

### 3.2 Upload Avatar Modal
- [ ] Upload Avatar modal opens when button is clicked
- [ ] Avatar image preview is shown
- [ ] File type/size validation for avatar upload
- [ ] Save button uploads avatar and updates profile
- [ ] Cancel button closes modal without saving
- [ ] Error message shown if upload fails
- [ ] Success message shown on successful upload
- [ ] Modal closes on outside click or ESC key

### 3.3 Upload Cover Modal
- [ ] Upload Cover modal opens when button is clicked
- [ ] Cover image preview is shown
- [ ] File type/size validation for cover upload
- [ ] Save button uploads cover and updates profile
- [ ] Cancel button closes modal without saving
- [ ] Error message shown if upload fails
- [ ] Success message shown on successful upload
- [ ] Modal closes on outside click or ESC key

### 3.4 Portfolio Modal
- [ ] Portfolio modal opens when add/edit button is clicked
- [ ] All portfolio fields are present and editable
- [ ] Validation errors for required/invalid fields
- [ ] Save button adds/edits portfolio item
- [ ] Delete button removes portfolio item
- [ ] Cancel button closes modal without saving
- [ ] Error message shown if save/delete fails
- [ ] Success message shown on successful save/delete
- [ ] Modal closes on outside click or ESC key

### 3.5 Education Modal
- [ ] Education modal opens when add/edit button is clicked
- [ ] All education fields are present and editable
- [ ] Validation errors for required/invalid fields
- [ ] Save button adds/edits education record
- [ ] Delete button removes education record
- [ ] Cancel button closes modal without saving
- [ ] Error message shown if save/delete fails
- [ ] Success message shown on successful save/delete
- [ ] Modal closes on outside click or ESC key

### 3.6 Create Review Modal
- [ ] Create Review modal opens when button is clicked
- [ ] All review fields are present and editable
- [ ] Validation errors for required/invalid fields
- [ ] Save button submits review
- [ ] Cancel button closes modal without saving
- [ ] Error message shown if save fails
- [ ] Success message shown on successful save
- [ ] Modal closes on outside click or ESC key

### 3.7 Schedule Modal
- [ ] Schedule modal opens when button is clicked
- [ ] All schedule fields are present and editable
- [ ] Validation errors for required/invalid fields
- [ ] Save button updates schedule
- [ ] Cancel button closes modal without saving
- [ ] Error message shown if save fails
- [ ] Success message shown on successful save
- [ ] Modal closes on outside click or ESC key

### 3.8 Other Interactions
- [ ] Can click on post to view details
- [ ] Can click on review to view details

## 4. Tabs Navigation
- [ ] Can switch between Posts, Portfolio, Reviews, Education, Schedule tabs
- [ ] Active tab is highlighted

## 5. Auth State
- [ ] If not authenticated, user is redirected to login page
- [ ] If viewing another user's profile, only public info is shown

## 6. Accessibility
- [ ] All main elements have proper labels
- [ ] All interactive elements are keyboard accessible

## 7. Edge Cases
- [ ] Profile loads with no posts/portfolio/education/reviews/schedule and displays empty state message
- [ ] Profile loads with large number of items and handles gracefully
- [ ] Multiple rapid navigation actions are handled correctly

---
_Last updated: November 19, 2025_
