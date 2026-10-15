WEEK 5 HANGMAN - INITIAL IMPLEMENTATION

Files:
- index.html: page structure and controls
- style.css: basic layout and styling
- script.js: account demo, cookie session, localStorage, fetch, gameplay and scoreboards
- data/easy.json and data/normal.json: external word lists

Run locally:
1. Extract this folder.
2. Open the folder in VS Code.
3. Use the Live Server extension to open index.html, OR run a local server from this folder:
   py -m http.server 8000
4. Visit http://localhost:8000 in your browser.
Do not open index.html directly using file:// because fetch() may be blocked.

Initial-version limitations:
- Profile picture uploads and saved per-player themes are not included yet.
- Passcodes are stored in localStorage as a classroom demonstration only. This is not secure authentication.
- Scores are stored in the current browser, not shared across devices.
- The Hangman drawing is text-based for this first version.

Testing suggestion:
1. Create a player with matching passcodes.
2. Refresh the page and check whether the cookie restores the signed-in player.
3. Start an Easy or Normal game and guess letters.
4. Use the hint and verify that the round score cannot fall below zero.
5. End a round and check the total points and leaderboards.
6. Open DevTools > Application (Chrome/Edge) > Local Storage and Cookies to inspect saved data.
