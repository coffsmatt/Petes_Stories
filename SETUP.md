# My Life Stories — Google Drive setup and testing

This is a static GitHub Pages site. Audio is recorded in the browser and uploaded **directly to Google Drive after the person signs in with Google**. No password, Drive token, or unrestricted upload URL is placed in the site. This is more secure and more reliable than a public Google Apps Script upload endpoint.

## Before publishing

1. In Google Drive, share the target folder `1ibnzz1dmUOoxzwic8alT6WG3hEFgKj4r` with the Google account that will be used on the phone. Give it **Editor** access. (If it is a Shared Drive, ensure the account can add files.)
2. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project, then enable **Google Drive API**.
3. Configure the OAuth consent screen. Select **External** unless every recorder is in one Google Workspace. Add the intended Google account as a **Test user** while the app is in testing. The only requested scope is `drive.file`, which allows this app to create and manage files that it creates.
4. Create an OAuth client: **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
5. Add these **Authorized JavaScript origins** exactly (replace placeholders):
   - `https://YOUR-GITHUB-USERNAME.github.io`
   - `http://localhost:8000` (only for a local test)
   Do not add broad or untrusted origins. Redirect URIs are not needed for this popup-token flow.
6. Copy the client ID (it ends in `.apps.googleusercontent.com`) into `app.js`, replacing `PASTE_YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com`.

The client ID is intentionally visible in browser code; its protection comes from the permitted JavaScript origins, Google consent, and the signed-in user. Never put a client secret or Google service-account key in this repository.

## Test before publishing

1. Test on a phone over HTTPS. GitHub Pages is HTTPS; a plain `file://` page will not be able to request the microphone.
2. Open the site, allow microphone access, make a 10–15 second recording, stop, and play it back.
3. Press **Save to family Drive**. Choose the Google account that has access to the shared folder and approve the limited Drive permission.
4. Wait for the exact success message, then use **Open saved recording in Google Drive**. Check it is in the specified folder and that it plays.
5. Record another short clip and press **Download a copy**. Verify it appears in the phone's downloads. This proves the backup path works.
6. For a failure test, turn on airplane mode after recording and press Save. The site must say it was not saved; download the copy, restore connectivity, then press Save again. Do not discard the recording until Drive confirms it.

The site intentionally does **not** claim an upload worked until the Drive API returns the new file and the site reads that same file back. A failed save leaves the recording in the page for retrying and downloading.

## Publish on GitHub Pages

1. Create a private or public GitHub repository and add `index.html`, `styles.css`, `app.js`, and this file to its root.
2. In repository **Settings → Pages**, select **Deploy from a branch**, then select `main` and `/ (root)` and Save.
3. Wait for GitHub Pages to give the final URL. Add that site's origin (normally `https://YOUR-GITHUB-USERNAME.github.io`) to the OAuth client if it is not already there.
4. Repeat the phone test above on the final Pages URL. Do not rely on a local successful test alone.

## If Google sign-in is blocked

Check the browser's displayed origin against the OAuth client origins, confirm the user is a consent-screen test user, and verify that user has Editor access to the Drive folder. The recording can still be downloaded immediately while this is fixed.

## Why there is no Apps Script backend

An Apps Script web app that accepts anonymous browser uploads would make the Drive folder a spam/upload target. Restricting it to a Google account still requires cross-origin and session handling. Direct OAuth uses Google's own authenticated upload API, eliminates an application-held Drive credential, and limits the account's grant to `drive.file`.
