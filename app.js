/* Configuration: see SETUP.md. A Google OAuth client ID is public, but must be
   restricted to this site's GitHub Pages URL in Google Cloud Console. */
const CONFIG = {
  googleClientId: 'PASTE_YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com',
  driveFolderId: '1ibnzz1dmUOoxzwic8alT6WG3hEFgKj4r',
  scope: 'https://www.googleapis.com/auth/drive.file'
};

const $ = (id) => document.getElementById(id);
const recordButton = $('recordButton'), stopButton = $('stopButton');
let recorder, audioBlob, audioUrl, timerId, seconds = 0, tokenClient, accessToken;

function setStatus(message) { $('recordingStatus').textContent = message; }
function formatTime(value) { return `${String(Math.floor(value / 60)).padStart(2,'0')}:${String(value % 60).padStart(2,'0')}`; }
function safeTitle() { return ($('storyTitle').value.trim() || 'Life story').replace(/[^a-z0-9 _-]/gi, '').slice(0,80); }
function formatForBlob(blob) { return blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'm4a' : 'webm'; }
// A multipart boundary needs to be unique for this request, not cryptographically
// secret. This deliberately avoids crypto.randomUUID(), which older phones lack.
function multipartBoundary() { return `family-story-${Date.now()}-${Math.random().toString(36).slice(2)}`; }

recordButton.addEventListener('click', async () => {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setStatus('This browser cannot record audio. Please try the latest Chrome or Safari.'); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      audioUrl = URL.createObjectURL(audioBlob);
      $('audioPlayer').src = audioUrl; $('reviewCard').classList.remove('hidden');
      setStatus('Recording ready to listen to or save.');
    };
    recorder.start(1000); seconds = 0; $('timer').textContent = '00:00';
    timerId = setInterval(() => { seconds += 1; $('timer').textContent = formatTime(seconds); }, 1000);
    recordButton.disabled = true; stopButton.disabled = false; $('reviewCard').classList.add('hidden'); setStatus('Recording now. Speak normally.');
  } catch (error) { setStatus(error.name === 'NotAllowedError' ? 'Microphone permission was not allowed. Please allow it and try again.' : `Could not start recording: ${error.message}`); }
});
stopButton.addEventListener('click', () => { if (recorder?.state === 'recording') recorder.stop(); clearInterval(timerId); recordButton.disabled = false; stopButton.disabled = true; });

function ensureGoogleLoaded() {
  if (!window.google?.accounts?.oauth2) throw new Error('Google sign-in has not loaded. Check your connection, then try again.');
  if (CONFIG.googleClientId.startsWith('PASTE_')) throw new Error('This site still needs its Google sign-in setup. Ask the site owner to complete SETUP.md.');
  if (!tokenClient) tokenClient = google.accounts.oauth2.initTokenClient({ client_id: CONFIG.googleClientId, scope: CONFIG.scope, callback: '' });
}
function getAccessToken() {
  return new Promise((resolve, reject) => {
    try {
      ensureGoogleLoaded();
      tokenClient.callback = (response) => response.error ? reject(new Error(response.error)) : resolve(response.access_token);
      tokenClient.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
    } catch (error) { reject(error); }
  });
}
async function uploadToDrive(blob) {
  accessToken = await getAccessToken();
  const filename = `${safeTitle()} — ${new Date().toISOString().slice(0,10)}.${formatForBlob(blob)}`;
  const metadata = { name: filename, parents: [CONFIG.driveFolderId] };
  const boundary = multipartBoundary();
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: ${blob.type || 'audio/webm'}\r\n\r\n`, blob, `\r\n--${boundary}--`
  ]);
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size', { method:'POST', headers:{ Authorization:`Bearer ${accessToken}`, 'Content-Type':`multipart/related; boundary=${boundary}` }, body });
  const data = await response.json();
  if (!response.ok || !data.id) throw new Error(data.error?.message || 'Google Drive did not confirm the upload.');
  // Confirm Drive can retrieve the exact new file before reporting success.
  const check = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(data.id)}?fields=id,name,size,webViewLink`, { headers:{ Authorization:`Bearer ${accessToken}` } });
  const confirmed = await check.json();
  if (!check.ok || confirmed.id !== data.id) throw new Error('Upload was not confirmed by Google Drive. Please download a copy and try again.');
  return confirmed;
}
$('saveButton').addEventListener('click', async () => {
  if (!audioBlob) return;
  const button = $('saveButton'); button.disabled = true; $('saveStatus').textContent = 'Connecting securely to Google Drive…'; $('driveLinkWrap').classList.add('hidden');
  try { const file = await uploadToDrive(audioBlob); $('saveStatus').textContent = `Saved safely to Google Drive as “${file.name}”.`; $('driveLink').href = file.webViewLink; $('driveLinkWrap').classList.remove('hidden'); }
  catch (error) { $('saveStatus').textContent = `Not saved to Drive: ${error.message} Download a copy now, then use Retry to try again.`; }
  finally { button.disabled = false; }
});
$('downloadButton').addEventListener('click', () => { if (!audioBlob) return; const link=document.createElement('a'); link.href=audioUrl; link.download=`${safeTitle()} — ${new Date().toISOString().slice(0,10)}.${formatForBlob(audioBlob)}`; link.click(); });
$('newButton').addEventListener('click', () => { if (audioUrl) URL.revokeObjectURL(audioUrl); audioBlob=audioUrl=null; $('audioPlayer').removeAttribute('src'); $('reviewCard').classList.add('hidden'); $('saveStatus').textContent=''; $('driveLinkWrap').classList.add('hidden'); $('timer').textContent='00:00'; setStatus('Ready when you are.'); });
