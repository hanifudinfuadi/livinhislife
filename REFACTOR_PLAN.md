# ✨ Rekonfigurasi Template: Oriel Studio Template Integration

## 📋 Overview

Menggabungkan tampilan frontend yang ada dengan **Oriel Studio Template** - sebuah desain studio berbasis scroll horizontal dengan animasi GSAP yang imersif, tanpa mengubah fungsi teknis yang sudah berjalan.

---

## 🎯 Objectives

1. **Apply styling Oriel Studio** ke komponen portofolio yang ada
2. **Mempertahankan semua functionality** (API integration, routing, state management)
3. **Menjadi completely run until can run dev to local host**

---

## 📂 Structure Analysis

### Existing Frontend Structure
```
web porto hanif/
├── frontend/
│   ├── src/
│   │   ├── App.js                      # React + Router + Framer Motion
│   │   ├── App.css                      # Tailwind + Global styles
│   │   └── index.html                   # Standalone HTML fallback
│   │   ├── index.css                    # Global styles
│   │   └── index.js                     # Entry point
│   │
│   └── src/components/
│       ├── portfolio/
│       │   ├── WorksGrid.js/css          # Project gallery
│       │   ├── Novel3DShowcase.js/css    # Three.js viewer
│       │   ├── JournalSection.js/css      # Quotes display
│       │   ├── PortfolioNav.js/css        # Navigation
│       │   ├── PortfolioHero.js/css       # Hero section
│       │   ├── SideNav.js/css             # Sticky sidebar
│       │   ├── AboutSection.js/css        # Bio content
│       │   ├── ContactSection.js/css      # Form
│       │   └── ... (more components)
│       └── admin/
│           └── AdminDashboard.js/css
```

### Oriel Studio Template Structure
- **Single file**: `oriel-studio-template.tsx` (~2481 lines)
- **GSAP + Three.js heavy** with scroll-driven animations
- **9 scenes**: Home → About → Make → People → Quote → Work → Proof → Rope → Contact
- **Responsive**: Deck mode (desktop) / Stacked mode (mobile)

---

## 🔄 Migration Strategy

### Phase 1: CSS Integration (Non-breaking)
1. Copy CSS dari `oriel-studio-template.tsx` ke file baru `src/styles/oriel-tailwind.css`
2. Apply melalui Tailwind config atau inline styles
3. Override component-specific classes dengan Oriel's design tokens

### Phase 2: Component Layering
- **Home**: Oriel hero + showreel overlay → PortfolioHero + PreLanding
- **About**: Oriel cards layout → AboutSection
- **What we make**: Oriel work preview → WorksGrid
- **People**: Oriel team section → SideNav
- **Work**: Oriel portfolio grid → WorkDetail
- **Contact**: Oriel form → ContactSection

### Phase 3: Animation & Interaction
1. Replace Framer Motion with GSAP ScrollTrigger where applicable
2. Maintain smooth scroll behavior across all sections
3. Preserve existing animations, add Oriel's polish

---

## 🎨 Design Tokens Extraction

From `oriel-studio-template.tsx`:

### Colors (CSS Custom Properties)
```css
:root {
  --or-paper: #fafaf9;              /* Archival paper */
  --or-ink: #0b0b0c;                /* Deep black */
  --or-warm: #17161a;               /* Warm dark */
  --or-mint: #10211d;               /* Mint green */
  --or-lilac: #2a2442;              /* Lilac purple */
  --or-lilac-soft: #1c1926;         /* Soft lilac */
  --or-mute: #8f8d96;               /* Muted gray */
  --or-line: #2a2a2f;               /* Line color */
  --or-hi: #b9a9ff;                 /* Highlight */
}

.dark {
  --or-paper: #101012;
  --or-ink: #f2f0ec;
  --or-warm: #17161a;
  --or-mute: #8f8d96;
}
```

### Typography Scale
```css
font-family: "Inter Tight", "Bricolage Grotesque", sans-serif;
--r: min(calc(100vw / 24.375), 17px)  /* Responsive unit */
```

### Spacing
- `R` = responsive unit (≈ 17px base, scales with viewport)
- Grid system based on 24.375rem grid

---

## 📝 Implementation Steps

### Step 1: Setup Oriel CSS System
```bash
# Add to frontend/src/styles/
# Copy from oriel-studio-template.tsx (lines ~2080-2481)
# Extract into oriel-tailwind.css
```

### Step 2: Apply to Components (Iterative)
Each component gets Oriel styling applied WITHOUT changing props/API logic.

### Step 3: Testing & Validation
1. Run `cd frontend && yarn start`
2. Verify all sections render with Oriel styling
3. Check responsive behavior (deck vs stacked modes)
4. Test scroll animations across all sections

---

## ✅ Success Criteria

- [x] Frontend runs without errors on localhost:5173
- [ ] All existing functionality preserved (API, routing, state)
- [ ] Oriel Studio styling applied consistently
- [ ] Responsive behavior works correctly
- [ ] No breaking changes to existing code

---

## 🎬 Execution Plan

### Timeline Estimate
- **CSS Integration**: 45 minutes
- **Component Styling**: 2 hours (1.5h per component)
- **Testing & Validation**: 1 hour
- **Total**: ~4 hours

### Priority Order
1. Foundation CSS (oriel-tailwind.css) - MUST HAVE
2. Hero section styling - visual anchor
3. WorksGrid styling - main content area
4. Navigation components - user flow
5. Remaining sections - polish & detail

---
