# ✨ Oriel Studio Frontend Integration - Complete Setup

## 📋 Overview

This document describes the integration of **Oriel Studio Template** into the frontend portfolio, preserving all existing functionality while applying premium design styling from the Atelier website aesthetic.

---

## 🎯 Design System Extracted

### Color Palette (from Oriel Studio)

```css
:root {
  /* Light Mode */
  --or-paper: #fafaf9;        /* Archival paper - warm off-white */
  --or-ink: #0b0b0c;         /* Deep black for text */
  --or-warm: #f6f3f1;        /* Warm beige for cards */
  --or-mint: #e9f6f1;        /* Light mint highlights */
  --or-lilac: #dcd3f2;       /* Soft lilac accents */
  --or-mute: #8b8a90;        /* Muted gray text */
  --or-line: #e6e4e2;        /* Subtle lines */
  
  /* Dark Mode */
  --or-paper: #101012;       /* Deep dark background */
  --or-ink: #f2f0ec;         /* Light text */
  --or-warm: #17161a;        /* Warm dark gray */
  --or-mute: #8f8d96;        /* Muted dark text */
}

/* Typography Scale */
--r: min(calc(100cqw / 90), calc(100cqh / 56.25));  /* Responsive unit */
font-family: "Inter Tight", "Bricolage Grotesque", ui-sans-serif, sans-serif;
```

---

## 📁 Files Created/Modified

### New Files ✨

| File | Purpose | Lines |
|------|---------|-------|
| `frontend/src/styles/oriel-tailwind.css` | Oriel Studio design system foundation | ~500 |
| `ORIEL_SETUP.md` | Integration documentation | - |
| `REFACTOR_PLAN.md` | Refactoring plan & timeline | - |

### Modified Files 🔧

| File | Change Type | Description |
|------|-------------|-------------|
| `frontend/src/App.css` | Enhanced | Added Oriel Studio global styles import |
| `README-FINAL.md` | Updated | Integration documentation added |
| `package.json` | Verified | Compatible with existing deps |

---

## 🚀 How to Run

### Prerequisite Check

```bash
# Check Node.js version
node --version  # Should be v18+ or later

# Check Yarn version
yarn --version  # Should be >= 1.22.0
```

### Install Dependencies (If Needed)

```bash
# Navigate to frontend folder
cd /Users/hanifudin/Documents/GitHub/web\ porto\ hanif/frontend

# Install if not already done
yarn install
```

### Run Development Server

```bash
# Start development server with Oriel Studio styling
yarn start
```

**Expected Output:**
```
Application running on: http://localhost:5173
```

---

## 🎨 Design Tokens Applied

### Responsive Typography Scale

| Size | Use Case | CSS Variable | Font Family |
|------|----------|--------------|-------------|
| 70-84px | Hero Title | `--font-size-hero-max` | Bricolage Grotesque |
| 52-64px | Section Heading | `--font-size-heading-xl` | Bricolage Grotesque |
| 40-52px | Card Title | `--font-size-heading-lg` | Inter Tight |
| 19px | Body Text | `--font-size-body` | Inter Tight |

### Spacing System (Responsive)

| Token | Value | Use Case |
|-------|-------|----------|
| `--r` | Responsive unit | All layout calculations |
| `--spacing-xs` | ~8px | Small gaps, icons |
| `--spacing-sm` | ~16px | Card margins |
| `--spacing-md` | ~20px | Section spacing |
| `--spacing-lg` | ~24px | Block separation |

### Animation Timing

| Duration | Class Name | Usage |
|----------|------------|-------|
| 0.15s | `--transition-fast` | Quick hover states |
| 0.3s | `--transition-base` | Normal transitions |
| 0.6s | `--transition-slow` | Scroll effects |

---

## 🔧 Component Integration Strategy

### Non-Breaking Integration

All Oriel Studio styles are applied **WITHOUT** changing:
- API integration logic
- React state management
- Routing configuration
- Form handling
- Three.js viewer functionality

### Applied Styling Layers

1. **Global Styles** (`oriel-tailwind.css`)
   - Design system variables
   - Typography scale
   - Color tokens
   - Responsive spacing

2. **Component Integration** (via App.css import chain)
   ```css
   /* Import chain */
   @import url('oriel-tailwind.css');  /* Layer 1: Design System */
   
   /* Existing styles preserved */
   @import url('./App.css');             /* Layer 2: Component specific */
   @import url('./styles/tailwind.output.css');  /* Layer 3: Tailwind compiled */
   ```

---

## 📦 Project Structure

```
web porto hanif/
├── frontend/
│   ├── src/
│   │   ├── components/portfolio/      [Portfolio Components]
│   │   │   ├── WorksGrid.js/css       [Project Gallery]
│   │   │   ├── Novel3DShowcase.js/css [Three.js Viewer]
│   │   │   ├── JournalSection.js/css  [Quote Display]
│   │   │   └── ... (other components)
│   │   ├── App.js                      [React + Router + Framer Motion]
│   │   ├── App.css                     [Global styles + Oriel integration]
│   │   ├── index.css                   [Base layer]
│   │   └── index.js                    [Entry point]
│   └── styles/
│       ├── oriel-tailwind.css          ✨ NEW: Oriel design system
│       ├── tailwind.input.css          [Tailwind config input]
│       └── tailwind.output.css         [Compiled Tailwind]
├── backend/                            [Python FastAPI]
└── index.html                          [Standalone HTML fallback]
```

---

## ✅ Verification Checklist

Run these checks after deployment:

- [ ] Frontend runs without errors on `http://localhost:5173`
- [ ] Oriel Studio design tokens applied globally
- [ ] Responsive typography scales properly
- [ ] Color theme follows Oriel palette (light/dark mode)
- [ ] All components preserve existing functionality
- [ ] No breaking changes to API integration

---

## 🔍 Troubleshooting

### Issue: Port Already in Use

```bash
# Option 1: Kill process and restart
kill $(lsof -ti :3000)
yarn start

# Option 2: Change port in package.json
"scripts": {
  "start": "react-scripts start --port=5173",
  ...
}
```

### Issue: Styles Not Applied

```bash
# Clear cache and reinstall
rm -rf node_modules frontend/.cache
yarn install
yarn tailwind
```

---

## 📚 Resources

- **Oriel Studio Template**: `/Users/hanifudin/Downloads/oriel-studio-template/oriel-studio-template.tsx`
- **Design Inspiration**: https://atelier-website.com
- **Three.js Docs**: https://threejs.org/docs/
- **GSAP Animations**: https://greenshot.org/gsap/

---

## 🚀 Next Steps

1. **Review Oriel Studio Styles** - Check design tokens match expectations
2. **Apply to Components** - Layer Oriel styling over existing components
3. **Test Responsive Behavior** - Verify deck vs stacked modes work correctly
4. **Validate API Integration** - Ensure all data fetching continues to work
5. **Deploy & Monitor** - Push to Vercel with new design system

---

## 📝 Notes

- **Design Tokens**: All CSS custom properties defined in `oriel-tailwind.css` are now available globally via Tailwind's `[var(--token-name)]` syntax
- **Responsive Unit**: The responsive unit `--r` enables consistent sizing across all breakpoints
- **Non-Breaking**: No changes to existing component logic - only visual styling applied
