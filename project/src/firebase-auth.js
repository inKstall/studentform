// This file is for reference only and should be run in a secure environment
// Do not include this in your production code

// IMPORTANT: To set up the admin user for this application, follow these steps:

// 1. Go to the Firebase Console: https://console.firebase.google.com/
// 2. Select your project
// 3. Go to Authentication in the left sidebar
// 4. Click on "Add user" 
// 5. Enter the email: admin@questo.com
// 6. Enter the password: libral@500
// 7. Click "Add user"

// IMPORTANT: Then update your Firestore security rules to restrict access to admin only:
// Go to Firestore Database > Rules and add these rules:

/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public access to enrollments for writing only
    match /enrollments/{document=**} {
      // Only admin can read enrollments
      allow read: if request.auth != null && request.auth.token.email == 'admin@questo.com';
      
      // Anyone can write to enrollments (for form submissions)
      allow write: if request.auth != null;
    }
    
    // Default deny for everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
*/

// This application has the following security measures:
// 1. Only admin@questo.com can log in to the admin panel
// 2. The AdminLogin component checks if the email is admin@questo.com before attempting login
// 3. The AdminPage component verifies the user is authenticated and has the admin email
// 4. The AdminDashboard component performs an additional check to ensure the user is admin
// 5. Firestore security rules restrict data access to the admin user only

// Note: For a production application, consider implementing:
// - Custom claims to designate admin roles instead of email checks
// - Multi-factor authentication for admin accounts
// - IP restrictions for admin access
// - Activity logging for all admin actions
