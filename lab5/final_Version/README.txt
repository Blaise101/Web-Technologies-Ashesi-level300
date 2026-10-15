WEEK 5 HANGMAN - FINAL IMPLEMENTATION

Files:
- index.html: interface and controls
- style.css: responsive light/dark themes
- script.js: account demo, cookie session, localStorage, JSON fetching, gameplay, scoring, profile image upload and leaderboards
- data/easy.json and data/normal.json: five word/hint objects each
- hangman/stage1.png through stage7.png: the seven supplied Hangman images from Week 4

Run locally:
1. Extract this ZIP.
2. Open the extracted folder in VS Code.
3. Start Live Server, OR open a terminal in this folder and run:
   py -m http.server 8000
4. Visit http://localhost:8000
Do not open index.html directly through file:// because fetch() may be blocked.

Features in this build:
- Create a player with matching passcodes or sign in.
- Remember the signed-in username in a cookie.
- Save profiles, themes, profile pictures and scores in localStorage.
- Load word/hint objects from the selected JSON file with fetch().
- Use the seven supplied Hangman images for zero to six incorrect guesses.
- Award one point per occurrence of a correctly guessed letter.
- Allow one hint per round, costing one point but never lowering score below zero.
- Save points from wins, losses and early-ended rounds; separate Easy and Normal point totals.
- Display the top three players for each difficulty.
- Reject profile pictures larger than 500 KB.

Important limitations:
- This is a browser-only classroom project. Passcodes are stored in localStorage and are visible to someone who can inspect the browser storage. Real applications must verify credentials on a server and store passwords securely.
- Data is local to this browser and does not synchronize across devices.
- localStorage has limited capacity; many large images may eventually fill it.
- The JSON word lists are replacement lists created for this project because official files were not available.

Testing checklist:
1. Create an account with matching passcodes.
2. Try creating an account with non-matching passcodes.
3. Try signing in with a wrong passcode and then the correct one.
4. Refresh the page and check cookie-based session restoration; then log out.
5. Start Easy and Normal rounds to test both JSON files.
6. Guess correct and incorrect letters, including a letter that occurs more than once.
7. Use a hint when the round score is zero and when it is greater than zero.
8. Test losing and pressing End; check that points are saved.
9. Upload an image below 500 KB and one above 500 KB.
10. Temporarily rename a JSON file to confirm the game displays a useful loading error.
11. Inspect DevTools > Application > Local Storage and Cookies.
