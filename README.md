# Infinite Runner 🏃

A mobile-friendly endless runner game built with pure HTML5, CSS3, and JavaScript. No external dependencies required!

## Features

✨ **Complete gameplay experience:**
- Simple tap-to-jump controls (with optional double-tap for a second jump)
- Progressive difficulty that increases over time
- Obstacles spawn more frequently as you progress
- Score tracking with persistent best score using localStorage
- Smooth animations and responsive design

📱 **Mobile optimized:**
- Works perfectly on iPhone, iPad, and Android devices
- Touch controls optimized for mobile gameplay
- Prevents page scrolling during gameplay
- Responsive canvas that adapts to any screen size
- Landscape and portrait mode support

🎮 **Game mechanics:**
- Three game states: Start Screen → Playing → Game Over
- Player represented as a rounded rectangle
- Obstacles approach from the right
- Collision detection
- Difficulty ramping system
- Share button with fallback to clipboard copy

🎨 **Design:**
- Beautiful gradient backgrounds
- Smooth animations and transitions
- No external CSS framework
- Fully responsive layout
- Works on screens from 320px to 4K

## How to Play

1. **Start**: Tap anywhere on the screen to begin
2. **Jump**: Tap anywhere to jump
3. **Double Jump**: Tap twice quickly to perform a double jump
4. **Avoid**: Don't hit the obstacles!
5. **Score**: Your score increases over time
6. **Game Over**: When you hit an obstacle, tap to restart

## Controls

- **Tap**: Jump
- **Double-tap**: Second jump
- **Share button**: Share your score with friends

## Installation

### Run Locally

1. Clone the repository:
```bash
git clone https://github.com/Arankarthikeyan/Infinite-runner.git
cd Infinite-runner
```

2. Open `index.html` in your browser:
   - Double-click `index.html`, or
   - Use a local server for best results:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (using http-server)
   npx http-server
   ```

3. Open your browser to:
   - `http://localhost:8000` (if using Python)
   - `http://localhost:8080` (if using http-server)

### Deploy on GitHub Pages

1. **Fork or create a repository** on GitHub named `Infinite-runner`

2. **Push the files** to the repository:
```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

3. **Enable GitHub Pages**:
   - Go to your repository settings
   - Scroll down to "GitHub Pages" section
   - Select `main` branch as source
   - Click Save

4. **Access your game** at: `https://your-username.github.io/Infinite-runner/`

## File Structure

```
Infinite-runner/
├── index.html      # HTML structure and UI
├── style.css       # Responsive styling
├── game.js         # Game logic and mechanics
└── README.md       # This file
```

## Browser Compatibility

- Chrome (Desktop & Mobile) ✅
- Firefox (Desktop & Mobile) ✅
- Safari (Desktop & Mobile) ✅
- Edge ✅
- Opera ✅

## Technical Details

### No Dependencies
This game uses **only** vanilla JavaScript, HTML5 Canvas, and CSS3. No external libraries or frameworks are required.

### Responsive Design
- Canvas automatically resizes to fit the screen
- Touch controls work on all devices
- Optimized for all screen sizes (320px to 4K)
- Landscape and portrait orientation support

### Performance
- 60 FPS gameplay
- Efficient collision detection
- Optimized drawing pipeline
- Minimal memory footprint

### Storage
- Best score saved in `localStorage`
- Persists across browser sessions
- Works offline

## Difficulty Scaling

The game becomes progressively harder:
- **Speed**: Obstacles move faster (increases by 15% every 10 seconds)
- **Frequency**: Obstacles spawn more frequently (from 2.5s to 1.2s intervals)
- **Score**: Your score increases based on survival time

## Sharing

### Native Share (Mobile)
If your device supports the Web Share API, tap the share button to:
- Share via Messages, Email, Social Media, etc.
- Your current score is included

### Fallback (Desktop/Older devices)
- Copies game link to clipboard
- Shows "Copied!" confirmation

## Tips & Tricks

1. **Timing is everything**: Tap at the right moment to avoid obstacles
2. **Use double-jump strategically**: Save your second jump for tricky situations
3. **Stay calm**: The game gets faster, but it's always beatable
4. **Practice makes perfect**: Your reflexes will improve with time

## Future Enhancements (Possible)

- Power-ups system
- Different player skins
- Sound effects and music
- Leaderboard system
- Multiplayer competitive mode
- Different obstacle types
- Special visual effects

## License

This project is provided as-is for learning and entertainment purposes.

## Credits

Created with ❤️ using vanilla web technologies.

---

**Enjoy the game and challenge your friends!** 🎮✨
