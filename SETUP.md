# My Life Stories — phone download setup and testing

This is a static GitHub Pages site. Audio is recorded in the browser and downloaded directly to the phone when recording stops. No Google account or Drive setup is required for this version.

## Publish and test

1. Publish the files to GitHub Pages and open the final HTTPS page on the phone. A plain `file://` page cannot request the microphone.
2. Allow microphone access, make a 10–15 second recording, and press **Stop and save to phone**.
3. Open the phone's **Downloads** or **Files** app and play the saved recording. It will be named with the date and time.
4. Test the 20-minute limit later with a short trial only; the timer and warning beeps confirm it is active.

## Publish on GitHub Pages

1. Create a private or public GitHub repository and add `index.html`, `styles.css`, `app.js`, and this file to its root.
2. In repository **Settings → Pages**, select **Deploy from a branch**, then select `main` and `/ (root)` and Save.
3. Repeat the phone test above on the final Pages URL.
