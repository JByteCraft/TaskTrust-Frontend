# Posts & Feed Module Test Cases

This document outlines comprehensive test cases for the Posts/Feed flows in the TaskTrust application. It covers UI, interactions, validations, edge cases, and error handling for all major features related to posts and the feed.

## 1. Feed Loading & Display

- [ ] Feed loads successfully after navigation
- [ ] Loading indicator appears while posts are loading
- [ ] Error message shown if posts fail to load
- [ ] Posts are displayed as cards/list
- [ ] Each post shows author, content, images/videos, likes, comments, shares, timestamp
- [ ] Pagination or infinite scroll works as expected
- [ ] Feed loads with no posts and displays empty state
- [ ] Feed loads with large number of posts and handles gracefully

## 2. Create Post Flow

- [ ] Create Post button is visible and enabled
- [ ] Create Post modal opens when button is clicked
- [ ] All fields (content, images, visibility) are present and editable
- [ ] Validation errors for empty content
- [ ] Validation for image type/size
- [ ] Visibility options are selectable
- [ ] Uploading state is shown during image upload
- [ ] Posting state is shown during post creation
- [ ] Save button creates post and closes modal
- [ ] Cancel button closes modal without saving
- [ ] Error message shown if post creation fails
- [ ] Success message shown on successful post
- [ ] Modal closes on outside click or ESC key

## 3. Post Card Interactions

- [ ] Like button toggles reaction and updates count
- [ ] User's reaction is highlighted
- [ ] Comment button opens comments section/modal
- [ ] Share button triggers share dialog/modal
- [ ] Edit button (if owner) opens edit modal
- [ ] Delete button (if owner) opens confirmation dialog and deletes post
- [ ] More options menu opens and closes
- [ ] Clicking author navigates to profile
- [ ] Clicking post opens post details (if applicable)

## 4. Edit Post Flow

- [ ] Edit Post modal opens when edit button is clicked
- [ ] All fields are pre-filled and editable
- [ ] Validation errors for empty/invalid content
- [ ] Validation for image type/size
- [ ] Save button updates post and closes modal
- [ ] Cancel button closes modal without saving
- [ ] Error message shown if update fails
- [ ] Success message shown on successful update
- [ ] Modal closes on outside click or ESC key

## 5. Delete Post Flow

- [ ] Delete confirmation dialog opens when delete button is clicked
- [ ] Confirm button deletes post
- [ ] Cancel button closes dialog without deleting
- [ ] Error message shown if delete fails
- [ ] Success message shown on successful delete

## 6. Comments Flow

- [ ] Comments section/modal opens when comment button is clicked
- [ ] All comments are displayed with author, content, timestamp
- [ ] Add comment field is present and editable
- [ ] Validation errors for empty comment
- [ ] Post comment button adds comment and updates list
- [ ] Delete comment button (if owner) deletes comment
- [ ] Error message shown if comment action fails
- [ ] Success message shown on successful comment action
- [ ] Replies to comments are displayed and can be added

## 7. Share Flow

- [ ] Share dialog/modal opens when share button is clicked
- [ ] Share options (copy link, social, etc.) are present
- [ ] Share action works and gives feedback
- [ ] Error message shown if share fails
- [ ] Success message shown on successful share
- [ ] Modal closes on outside click or ESC key

## 8. Validations

- [ ] All required fields in modals/forms are validated
- [ ] Image uploads are validated for type/size
- [ ] Error messages are clear and actionable
- [ ] Success messages are shown for all successful actions

## 9. Edge Cases & Robustness

- [ ] Multiple rapid actions (like, comment, post) are handled correctly
- [ ] Unauthorized actions are blocked and show error
- [ ] Network errors are handled gracefully

---

_Last updated: November 20, 2025_
