# Verification Walkthrough

## Prerequisites
- .NET API running on `http://localhost:5017` (or configured port).
- Next.js frontend running on `http://localhost:3000`.

## Verification Steps

### 1. User Registration
- Navigate to `http://localhost:3000/register`.
- Fill in the form with valid details.
- Submit.
- **Expected**: Redirect to Home or Login.

### 2. User Login
- Navigate to `http://localhost:3000/login`.
- Enter credentials used in registration.
- Submit.
- **Expected**: Redirect to Home. Navbar shows "Welcome, [Name]".

### 3. Create Videogame
- Click "Add New Game" on Home page.
- Fill in details (English Name, Console, Release Date required).
- Submit.
- **Expected**: Redirect to Home. New game appears in the list.

### 4. List Videogames
- Verify the newly created game is displayed on the Home page.
- Verify details (Name, Console, State) are correct.

### 5. Update User Profile
- Click "Profile" in Navbar.
- Change First Name or Last Name.
- Click "Update Profile".
- **Expected**: Success message. Navbar updates with new name (might need refresh or re-login if state isn't reactive immediately, but context should handle it).

### 6. Delete Videogame
- On Home page, click "Delete" on a game.
- Confirm dialog.
- **Expected**: Game is removed from the list.

## Notes
- Ensure API CORS is configured to allow `http://localhost:3000`.
- If API calls fail, check browser console and API logs.
