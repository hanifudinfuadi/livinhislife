# ✨ Oriel Studio Portfolio - Complete Setup

Based on **Oriel Studio Template** design system from [atelier-website.com](https://atelier-website.com)

## 🚀 Quick Start

### Run Local Development Server

```bash
# Navigate to frontend folder
cd /Users/hanifudin/Documents/GitHub/web\ porto\ hanif/frontend

# Install dependencies (only if not already done)
yarn install

# Run development server with Oriel Studio styling
yarn start
```

**Expected Output:** 
```
Application running on: http://localhost:5173
```

## 🎨 Design System Integration

Oriel Studio template applies premium design styling from the Atelier portfolio aesthetic:

- **Typography**: Bricolage Grotesque (display) + Inter Tight (body)
- **Colors**: Archival paper (#fafaf9) with warm tones and deep blacks
- **Responsive Scale**: Fluid typography with CSS custom properties
- **Animation**: GSAP scroll-driven animations with smooth transitions

## 📂 Project Structure

```
web porto hanif/
├── frontend/                    [React App + Oriel Studio]
│   ├── src/
│   │   ├── components/portfolio/ [Portfolio Components]
│   │   ├── App.js               [React + Router + Framer Motion]
│   │   ├── App.css              [Global styles + Oriel integration]
│   │   └── index.js             [Entry point]
│   └── styles/
│       ├── oriel-tailwind.css    ✨ Oriel design system
│       ├── tailwind.input.css    [Tailwind config input]
│       └── tailwind.output.css   [Compiled Tailwind]
├── backend/                     [Python FastAPI]
├── index.html                   [Standalone HTML fallback]
└── vercel.json                  [Vercel deployment config]
```

## 📋 Files Created/Modified

### New Files ✨

| File | Purpose | Description |
|------|---------|-------------|
| `frontend/src/styles/oriel-tailwind.css` | Design System | Oriel Studio CSS custom properties and tokens |
| `ORIEL_SETUP.md` | Documentation | Integration details and deployment guide |
| `REFACTOR_PLAN.md` | Planning | Refactoring timeline and strategy |

### Modified Files 🔧

| File | Change | Description |
|------|--------|-------------|
| `App.css` | Enhanced | Added Oriel Studio global styles import chain |
| `README-FINAL.md` | Updated | Integration documentation with Oriel styling details |
| `package.json` | Verified | Compatible with existing dependencies (React 19, Three.js 0.187) |

## 🚀 Running Commands Reference

| Command | Purpose | Result |
|---------|---------|--------|
| `yarn start` | Run dev server | http://localhost:5173 |
| `yarn build` | Create production build | frontend/build/ directory |
| `open index.html` | View standalone HTML | Root project in browser |

## ✅ Verification Checklist

Before running, verify these are in place:

- [x] All component files have proper error handling
- [x] Three.js has WebGL fallbacks
- [x] Responsive breakpoints work on mobile
- [x] Oriel design tokens applied globally
- [x] Typography scales properly (70-84px hero, responsive body)
- [x] Color theme follows Oriel palette (light/dark mode)

## 🔥 Quick Test Commands

### Check if React runs properly:
```bash
cd /Users/hanifudin/Documents/GitHub/web\ porto\ hanif/frontend && yarn start
```

### View index.html directly in browser:
```bash
open /Users/hanifudin/Documents/GitHub/web\ porto\ hanif/index.html
```

## 🎨 Design System Tokens

### Color Palette
- `--or-paper`: #fafaf9 (Light) / #101012 (Dark) - Archival paper background
- `--or-ink`: #0b0b0c (Light) / #f2f0ec (Dark) - Primary text color
- `--or-warm`: #f6f3f1 / #17161a - Warm accents for cards and sections
- `--or-mute`: #8b8a90 / #8f8d96 - Muted secondary text

### Typography Scale
| Size | Use Case | Font Family |
|------|----------|-------------|
| 70-84px | Hero Title | Bricolage Grotesque |
| 52-64px | Section Heading | Bricolage Grotesque |
| 40-52px | Card Title | Inter Tight |
| 19px | Body Text | Inter Tight |

### Responsive Unit `--r`
```css
--r: min(calc(100cqw / 90), calc(100cqh / 56.25));
```
This creates a responsive scale that adapts to both viewport width and height.

## 📚 Resources

- **Design Inspiration**: https://atelier-website.com (Oriel Studio)
- **Three.js Docs**: https://threejs.org/docs/
- **GSAP Animations**: https://greenshot.org/gsap/

## 📝 Notes

- **Non-Breaking Integration**: All Oriel styles are applied WITHOUT changing existing API, routing, or state management logic
- **Responsive Design**: The responsive unit `--r` enables consistent sizing across all breakpoints
- **GSAP Integration**: Scroll-driven animations work on desktop (deck mode) and mobile (stacked mode)
- **Dark Mode Support**: Full dark mode theming based on CSS custom properties
# livinhislife
# livinhislife
# livinhislife
# narative-storyteller
# livinhislife
# livinhislife
