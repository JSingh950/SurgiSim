# Person C - 3D & UX Lead Instructions

## 🎯 Your Responsibilities

As Person C (3D & UX Lead), you own the visual and interactive experience of SurgiSim. This includes:

1. **React Three Fiber Canvas** - The 3D brain visualization
2. **Brain Model Integration** - Loading and working with real brain.glb models
3. **Raycasting System** - Precise click detection on 3D objects
4. **Camera Animation** - Smooth camera movements and transitions
5. **Surgery UI** - Tool dock, progress bars, and step orchestration
6. **Celebration Animation** - Particle effects and 3D certificate reveal

## 🚀 Quick Start

### Current Status
All three major priorities are **IMPLEMENTED** and ready to use:

✅ **Real Brain Model Support** - Infrastructure for loading .glb files
✅ **Surgery UI** - Complete surgical flow with tools and progress
✅ **Mint Celebration** - 3D certificate with particle effects

### Testing the New Features

1. **Start the development servers:**
```bash
npm run dev:frontend
npm run dev:backend
```

2. **Try the Surgery UI:**
- Login with Auth0
- Click on different brain regions to get AI guidance
- Watch the surgical steps progress automatically
- Select different surgical tools from the dock
- Complete all 8 steps and click "Complete & Mint Certificate"

3. **Experience the Celebration:**
- After completing surgery, click the mint button
- Watch the 3D certificate reveal with particle effects
- See the animated neural network decoration

## 🧠 Working with Real Brain Models

### Finding a Brain Model

Great sources for free brain 3D models:

- **[Sketchfab](https://sketchfab.com)** - Search "brain" + filter by "Downloadable" → "Free"
- **[Poly Haven](https://polyhaven.com)** - Open-source 3D assets
- **[Free3D](https://free3d.com)** - Free brain anatomy models
- **[Clara.io](https://clara.io)** - Community 3D library
- **[GitHub](https://github.com)** - Search "brain 3d model glb" or "medical anatomy gltf"

**Important:** Look for models with **CC0** or **CC BY** licenses and separate meshes for brain regions.

### Installing a Brain Model

1. **Download the model** (.glb or .gltf format)

2. **Create the models directory:**
```bash
mkdir -p frontend/public/models
```

3. **Place your brain model:**
```bash
# Copy your downloaded brain.glb to:
frontend/public/models/brain.glb
```

4. **Enable real model mode:**
Edit `frontend/src/components/BrainCanvas.jsx`:
```javascript
const BRAIN_MODEL_CONFIG = {
  useRealModel: true, // Change this to true
  modelPath: "/models/brain.glb",
  fallbackToGeometric: true,
};
```

### Preparing Your Brain Model

For best results, your brain model should have:

1. **Separate meshes for each region** (frontal lobe, parietal lobe, etc.)
2. **Named objects** that can be identified by the raycaster
3. **Reasonable polygon count** (under 100k polygons for performance)
4. **Proper materials** (prefer PBR materials for better lighting)

**If your model doesn't have separate regions:**
- Use a 3D modeling tool (Blender, Maya) to separate meshes
- Name each mesh appropriately (e.g., "Frontal_Lobe", "Parietal_Lobe")
- Export as .glb format

### Customizing Raycasting

The enhanced raycasting system is configured in `BrainCanvas.jsx`:

```javascript
raycaster={{
  params: {
    Points: { threshold: 0.1 },
    Line: { threshold: 0.1 },
  },
}}
```

**Adjust thresholds** for better precision:
- Lower values = more precise but harder to click
- Higher values = easier to click but less precise

## 🏥 Surgery UI Customization

### Modifying Surgical Steps

Edit `frontend/src/components/SurgeryUI.jsx`:

```javascript
const SURGICAL_STEPS = [
  {
    id: 1,
    name: "Patient Assessment",
    description: "Review patient history and vital signs",
    icon: "📋",
    duration: "2 min",
    status: "pending",
  },
  // Add more steps as needed...
];
```

### Customizing Surgical Tools

Edit the `SURGICAL_TOOLS` array in the same file:

```javascript
const SURGICAL_TOOLS = [
  { id: "scalpel", name: "Scalpel", icon: "🔪", description: "Precision cutting instrument" },
  // Add more tools...
];
```

### Changing UI Behavior

The surgery flow is controlled in `SurgerySimulator.jsx`:

- **Auto-advance steps:** Currently advances after receiving AI guidance
- **Manual step control:** Click steps in the UI to advance
- **Tool selection:** Click tools in the dock to select them

## 🎉 Celebration Animation

### Customizing the Certificate

Edit `frontend/src/components/MintCelebration.jsx`:

1. **Certificate text:** Modify the `Text` components in `Certificate3D`
2. **Colors:** Change the gold border and text colors
3. **3D effects:** Adjust the `Float` component for animation
4. **Particles:** Modify the `ParticleField` for different emoji effects

### Certificate Data Structure

The certificate displays this data:
```javascript
{
  recipient: "Dr. Surgeon",      // User's name
  achievement: "Neurosurgical Mastery", // Achievement title
  date: "4/25/2026",             // Issue date
  tokenId: "CERT-2024-001",     // Blockchain token ID
  transactionId: "..."          // Solana transaction ID
}
```

## 🎨 Visual Enhancements

### Camera Animations

Camera movements use anime.js in `BrainCanvas.jsx`:

```javascript
anime({
  targets: camera.position,
  x: focusTarget.cameraPosition[0],
  y: focusTarget.cameraPosition[1],
  z: focusTarget.cameraPosition[2],
  duration: 1000,
  easing: "easeOutExpo",
});
```

**Adjust these parameters:**
- `duration`: Animation speed (ms)
- `easing`: Animation curve
- `cameraPosition`: Target coordinates for each region

### Color Themes

Current medical color scheme:
- **Primary:** Cyan (#4dd0ff, #79e9ff)
- **Secondary:** Teal (#5bffc8, #74ffc9)
- **Accent:** Gold/Amber (#ffd700, #f59e0b)
- **Background:** Dark Slate (#020711, #0f172a)

### Lighting Setup

Three.js lighting in `BrainCanvas.jsx`:

```javascript
<ambientLight intensity={1.1} />
<directionalLight position={[6, 8, 6]} intensity={1.6} color="#d5fbff" />
<directionalLight position={[-6, -3, 2]} intensity={0.45} color="#1ed7b4" />
<pointLight position={[0, 4, -6]} intensity={0.55} color="#74f7ff" />
```

## 🛠️ Development Workflow

### Your Branch
```bash
git checkout feature/person-c-3d-ux-enhancements
```

### Making Changes
1. Edit files in `frontend/src/components/`
2. Test locally with `npm run dev:frontend`
3. Commit changes with descriptive messages
4. Push and create PR when ready

### Key Files to Edit

- `frontend/src/components/BrainCanvas.jsx` - 3D brain and camera
- `frontend/src/components/SurgeryUI.jsx` - Surgical interface
- `frontend/src/components/MintCelebration.jsx` - Certificate animation
- `frontend/src/components/SurgerySimulator.jsx` - Main coordinator
- `frontend/src/hooks/use-anime-entrance.ts` - Animation utilities

## 🐛 Troubleshooting

### Brain Model Not Loading

**Problem:** Model doesn't appear or shows error

**Solutions:**
1. Check file path is correct: `/models/brain.glb`
2. Ensure file is in `frontend/public/models/`
3. Check browser console for errors
4. Verify model format is .glb or .gltf
5. Enable `fallbackToGeometric: true` to use placeholders

### Click Detection Not Working

**Problem:** Clicks on brain regions don't register

**Solutions:**
1. Check raycaster thresholds in `BrainCanvas.jsx`
2. Ensure meshes have proper materials
3. Verify `onSelect` callback is passed correctly
4. Check if `isBusy` state is preventing clicks

### Animation Issues

**Problem:** Animations are choppy or not working

**Solutions:**
1. Check anime.js is imported correctly
2. Verify target elements exist when animation runs
3. Check for conflicting animations
4. Ensure `useEffect` cleanup functions are present

### Performance Issues

**Problem:** App is slow or laggy

**Solutions:**
1. Reduce polygon count in brain model
2. Lower `dpr` in Canvas (currently `[1, 2]`)
3. Reduce number of lights
4. Use simpler materials
5. EnableSuspense fallback for better loading

## 🎯 Demo Preparation

### Before the Hackathon Demo

1. **Test all features:**
   - [ ] Brain model loads correctly
   - [ ] Click detection works on all regions
   - [ ] Camera animations are smooth
   - [ ] Surgery UI progresses through all steps
   - [ ] Tool selection works
   - [ ] Mint celebration triggers
   - [ ] Certificate displays correctly

2. **Optimize performance:**
   - [ ] Check load times
   - [ ] Test on different screen sizes
   - [ ] Verify mobile responsiveness
   - [ ] Check for console errors

3. **Prepare fallbacks:**
   - [ ] Ensure geometric placeholders work
   - [ ] Test error handling
   - [ ] Verify graceful degradation

### Demo Script

1. **Introduction:** Show the landing page and login
2. **3D Brain:** Demonstrate rotation, zoom, and region selection
3. **AI Guidance:** Click a region and show the mentor response
4. **Surgery Flow:** Progress through surgical steps
5. **Tool Selection:** Show different tools and their effects
6. **Completion:** Complete surgery and show certificate minting
7. **Celebration:** Highlight the 3D certificate and particle effects

## 📦 Dependencies

All required dependencies are already installed:

```json
{
  "@react-three/fiber": "^8.18.0",
  "@react-three/drei": "^9.122.0",
  "three": "^0.184.0",
  "animejs": "^3.2.2",
  "react": "^18.3.1"
}
```

## 🤝 Coordination with Team

### Person A (Auth & Identity)
- They handle Auth0 configuration
- You integrate with their protected routes
- Certificate minting uses their Solana setup

### Person B (AI Pipeline)
- They provide `/api/mentor` and `/api/neuro-data`
- Your UI calls their endpoints
- Audio streaming uses their ElevenLabs integration

### Shared Coordination
- **API contracts:** Agreed request/response shapes
- **Environment variables:** Shared `.env.example`
- **Feature branches:** No direct pushes to main
- **Daily standups:** Progress updates and blockers

## 🎨 Creative Freedom

As the 3D & UX Lead, you have creative control over:

- Visual style and color schemes
- Animation timing and effects
- User interaction patterns
- 3D model presentation
- UI component design

**Make it wow the judges!** The visual experience is often what sets hackathon projects apart.

---

**Good luck with your 3D & UX work!** Remember: the goal is to create an impressive, smooth, and intuitive surgical simulation experience.