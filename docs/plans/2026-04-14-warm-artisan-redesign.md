# MULTIPRINTS Warm Artisan Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform MULTIPRINTS from a cold, monochrome admin panel into a warm, inviting workspace that feels like a real print shop with earth tones, natural materials aesthetic, and the tactile quality of paper and vinyl.

**Architecture:** Create a new CSS theme file with design tokens (CSS variables) that defines the warm color palette, then systematically update all components, pages, and layouts. The redesign preserves all existing functionality while replacing the visual layer.

**Tech Stack:** Tailwind CSS (via CDN), Inter font (body), DM Serif Display (headings), vanilla CSS

---

## Design Tokens (Reference)

### Color Palette
```css
/* Primary Colors */
--color-primary: #B45309;           /* Terracotta/Brick - ink and craft */
--color-primary-dark: #92400E;      /* Darker terracotta for hover */
--color-primary-light: #D97706;     /* Lighter terracotta */

/* Secondary Colors */
--color-secondary: #166534;         /* Forest green - success, accents */
--color-secondary-light: #22C55E;   /* Light green */
--color-secondary-dark: #14532D;    /* Dark green */

/* Background Colors */
--color-bg-base: #FFFBF5;           /* Warm cream - main background */
--color-bg-elevated: #FEFCF7;       /* Off-white - cards, panels */
--color-bg-muted: #F5F0E8;          /* Warm gray - sections */
--color-bg-dark: #8B5A2B;           /* Warm brown - sidebar */

/* Text Colors */
--color-text-primary: #3D2314;      /* Dark brown - main text */
--color-text-secondary: #78716C;    /* Warm gray - secondary text */
--color-text-muted: #A8A29E;        /* Lighter gray - hints */
--color-text-inverse: #FFFBF5;      /* Cream - text on dark bg */

/* Border Colors */
--color-border: #D6CCC2;            /* Warm taupe */
--color-border-light: #E8DFD5;      /* Lighter taupe */

/* Status Colors */
--color-success: #166534;           /* Forest green */
--color-warning: #B45309;           /* Terracotta */
--color-error: #DC2626;             /* Keep red for errors */
--color-info: #2563EB;              /* Blue for info */
```

### Shadows (Warm tint)
```css
--shadow-sm: 0 1px 2px rgba(139, 90, 43, 0.06);
--shadow-md: 0 4px 6px rgba(139, 90, 43, 0.08);
--shadow-lg: 0 10px 25px rgba(139, 90, 43, 0.12);
--shadow-xl: 0 20px 40px rgba(139, 90, 43, 0.15);
```

---

## Task 1: Create Theme CSS File

**Files:**
- Create: `app/renderer/assets/css/theme.css`

**Step 1: Create the theme.css file with all design tokens**

```css
/**
 * MULTIPRINTS Theme - Warm Artisan
 * Design tokens for the warm, print-shop aesthetic
 */

:root {
  /* ==================== COLORS ==================== */
  
  /* Primary - Terracotta/Brick (ink and craft) */
  --color-primary: #B45309;
  --color-primary-dark: #92400E;
  --color-primary-light: #D97706;
  --color-primary-50: #FFFBEB;
  --color-primary-100: #FEF3C7;
  --color-primary-200: #FDE68A;
  
  /* Secondary - Forest Green */
  --color-secondary: #166534;
  --color-secondary-dark: #14532D;
  --color-secondary-light: #22C55E;
  --color-secondary-50: #F0FDF4;
  --color-secondary-100: #DCFCE7;
  
  /* Backgrounds - Warm tones */
  --color-bg-base: #FFFBF5;
  --color-bg-elevated: #FEFCF7;
  --color-bg-muted: #F5F0E8;
  --color-bg-subtle: #FAF7F2;
  --color-bg-dark: #8B5A2B;
  --color-bg-darker: #6B4423;
  
  /* Text */
  --color-text-primary: #3D2314;
  --color-text-secondary: #78716C;
  --color-text-muted: #A8A29E;
  --color-text-inverse: #FFFBF5;
  --color-text-on-dark: #FFFBF5;
  
  /* Borders */
  --color-border: #D6CCC2;
  --color-border-light: #E8DFD5;
  --color-border-dark: #B8A99A;
  
  /* Status Colors */
  --color-success: #166534;
  --color-success-bg: #F0FDF4;
  --color-success-border: #BBF7D0;
  
  --color-warning: #B45309;
  --color-warning-bg: #FFFBEB;
  --color-warning-border: #FDE68A;
  
  --color-error: #DC2626;
  --color-error-bg: #FEF2F2;
  --color-error-border: #FECACA;
  
  --color-info: #2563EB;
  --color-info-bg: #EFF6FF;
  --color-info-border: #BFDBFE;
  
  /* ==================== SHADOWS ==================== */
  --shadow-sm: 0 1px 2px rgba(139, 90, 43, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(139, 90, 43, 0.08), 0 2px 4px -1px rgba(139, 90, 43, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(139, 90, 43, 0.1), 0 4px 6px -2px rgba(139, 90, 43, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(139, 90, 43, 0.12), 0 10px 10px -5px rgba(139, 90, 43, 0.04);
  --shadow-inner: inset 0 2px 4px 0 rgba(139, 90, 43, 0.06);
  
  /* ==================== SPACING ==================== */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* ==================== RADIUS ==================== */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;
  
  /* ==================== TYPOGRAPHY ==================== */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'DM Serif Display', Georgia, serif;
  
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  
  /* ==================== TRANSITIONS ==================== */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
  
  /* ==================== Z-INDEX ==================== */
  --z-dropdown: 50;
  --z-sticky: 100;
  --z-modal: 200;
  --z-tooltip: 300;
  --z-toast: 400;
}
```

**Step 2: Commit**

```bash
git add app/renderer/assets/css/theme.css
git commit -m "feat(ui): add warm artisan theme design tokens"
```

---

## Task 2: Add Display Font

**Files:**
- Download: DM Serif Display font (regular weight)
- Create: `app/renderer/assets/fonts/dm-serif-display-regular.woff2`
- Modify: `app/renderer/assets/css/fonts.css`

**Step 1: Download DM Serif Display font**

Run: Download from Google Fonts and place in fonts directory (or use system fallback)
- If offline: Use Georgia as fallback, the font stack already handles this

**Step 2: Add font-face to fonts.css**

Add to the beginning of `app/renderer/assets/css/fonts.css`:

```css
/* DM Serif Display - For Headings */
@font-face {
  font-family: 'DM Serif Display';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('DM Serif Display'), local('DMSerifDisplay'), 
       url('../fonts/dm-serif-display-regular.woff2') format('woff2');
}

/* Inter Font - Local */
/* ... existing Inter font-faces remain unchanged */
```

**Step 3: Commit**

```bash
git add app/renderer/assets/css/fonts.css
git commit -m "feat(ui): add DM Serif Display font for headings"
```

---

## Task 3: Redesign Sidebar

**Files:**
- Modify: `app/renderer/index.html` (lines 52-155 - sidebar section)
- Modify: `app/renderer/assets/css/components.css` (nav styles)

**Step 1: Update sidebar HTML in index.html**

Replace the sidebar section (lines 52-155) with:

```html
    <!-- Sidebar -->
    <aside class="sidebar">
      <!-- Logo Area -->
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="32" height="32" rx="4" stroke="currentColor" stroke-width="2"/>
              <path d="M12 12h16M12 20h16M12 28h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="sidebar-logo-text">MULTIPRINTS</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <!-- Main Menu Section -->
        <div class="sidebar-section">
          <span class="sidebar-section-label">Main Menu</span>
          <ul class="sidebar-nav-list">
            <li>
              <a href="#" class="sidebar-nav-item active" data-page="dashboard">
                <svg class="sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a href="#" class="sidebar-nav-item" data-page="products">
                <svg class="sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <span>Products</span>
              </a>
            </li>
            <li>
              <a href="#" class="sidebar-nav-item" data-page="stock">
                <svg class="sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                <span>Stock</span>
              </a>
            </li>
            <li>
              <a href="#" class="sidebar-nav-item" data-page="sales">
                <svg class="sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <span>Sales</span>
              </a>
            </li>
            <li>
              <a href="#" class="sidebar-nav-item" data-page="printing">
                <svg class="sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                <span>Printing</span>
              </a>
            </li>
            <li>
              <a href="#" class="sidebar-nav-item" data-page="debts">
                <svg class="sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <span>Debts</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Account Section -->
        <div class="sidebar-section">
          <span class="sidebar-section-label">Account</span>
          <ul class="sidebar-nav-list">
            <li>
              <a href="#" class="sidebar-nav-item" data-page="settings">
                <svg class="sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>Settings</span>
              </a>
            </li>
            <li>
              <a href="#" id="logout-btn" class="sidebar-nav-item sidebar-nav-item--logout">
                <svg class="sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                <span>Log Out</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
```

**Step 2: Add sidebar styles to components.css**

Add after the existing nav-item-monochrome styles:

```css
/* ==================== Sidebar - Warm Theme ==================== */
.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #8B5A2B 0%, #6B4423 100%);
  display: flex;
  flex-direction: column;
  height: 100vh;
  flex-shrink: 0;
  position: relative;
}

.sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 251, 245, 0.1);
  position: relative;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sidebar-logo-icon {
  width: 36px;
  height: 36px;
  color: #FFFBF5;
}

.sidebar-logo-text {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 400;
  color: #FFFBF5;
  letter-spacing: 0.02em;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
  position: relative;
}

.sidebar-section {
  margin-bottom: 0.5rem;
}

.sidebar-section-label {
  display: block;
  padding: 0.75rem 1.5rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 251, 245, 0.5);
}

.sidebar-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  margin: 0.125rem 0.75rem;
  border-radius: var(--radius-md);
  color: rgba(255, 251, 245, 0.7);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition-base);
  text-decoration: none;
}

.sidebar-nav-item:hover {
  background: rgba(255, 251, 245, 0.1);
  color: #FFFBF5;
}

.sidebar-nav-item.active {
  background: #FFFBF5;
  color: #B45309;
  box-shadow: var(--shadow-md);
}

.sidebar-nav-item.active .sidebar-nav-icon {
  color: #B45309;
}

.sidebar-nav-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.sidebar-nav-item--logout {
  margin-top: auto;
}

.sidebar-nav-item--logout:hover {
  background: rgba(220, 38, 38, 0.2);
  color: #FCA5A5;
}
```

**Step 3: Commit**

```bash
git add app/renderer/index.html app/renderer/assets/css/components.css
git commit -m "feat(ui): redesign sidebar with warm artisan theme"
```

---

## Task 4: Redesign Header

**Files:**
- Modify: `app/renderer/index.html` (lines 158-211 - header section)
- Modify: `app/renderer/assets/css/components.css`

**Step 1: Update header HTML in index.html**

Replace the header section (lines 158-211) with:

```html
    <!-- Main Content -->
    <div class="main-wrapper">
      <!-- Header -->
      <header class="main-header">
        <div class="header-left">
          <!-- Breadcrumb or page title can go here -->
        </div>

        <div class="header-right">
          <!-- Notification Bell -->
          <div class="header-notification" id="notification-container">
            <button id="notification-bell" class="header-icon-btn">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <span id="notification-badge" class="notification-badge hidden">0</span>
            </button>

            <!-- Notification Dropdown -->
            <div id="notification-dropdown" class="notification-dropdown hidden">
              <div class="notification-dropdown-header">
                <h3>Notifications</h3>
                <span id="notification-count-text">0 overdue</span>
              </div>
              <div id="notification-list" class="notification-dropdown-list">
                <div class="notification-empty">No notifications</div>
              </div>
              <div class="notification-dropdown-footer">
                <button onclick="navigateToPage('debts')">View All Debts</button>
              </div>
            </div>
          </div>

          <!-- Help Button -->
          <button class="header-icon-btn" title="Help">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </button>
        </div>
      </header>
```

**Step 2: Add header styles to components.css**

```css
/* ==================== Header - Warm Theme ==================== */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: var(--color-bg-base);
}

.main-header {
  height: 64px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-icon-btn {
  position: relative;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.header-icon-btn:hover {
  background: var(--color-bg-muted);
  color: var(--color-text-primary);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 18px;
  height: 18px;
  background: var(--color-error);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.notification-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 320px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: var(--z-dropdown);
}

.notification-dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border-light);
}

.notification-dropdown-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.notification-dropdown-header span {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.notification-dropdown-list {
  max-height: 320px;
  overflow-y: auto;
}

.notification-empty {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.notification-dropdown-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--color-border-light);
}

.notification-dropdown-footer button {
  width: 100%;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-primary);
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0;
}

.notification-dropdown-footer button:hover {
  color: var(--color-primary-dark);
}
```

**Step 3: Commit**

```bash
git add app/renderer/index.html app/renderer/assets/css/components.css
git commit -m "feat(ui): redesign header with warm artisan theme"
```

---

## Task 5: Update Page Container and Base Styles

**Files:**
- Modify: `app/renderer/index.html` (page container section)
- Modify: `app/renderer/assets/css/components.css`

**Step 1: Update page container in index.html**

Replace the page container section:

```html
      <!-- Page Container -->
      <main id="page-container" class="page-container">
        <div class="page-loading">
          <div class="page-loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </main>
    </div>
  </div>
```

**Step 2: Add page container and loading styles to components.css**

```css
/* ==================== Page Container ==================== */
.page-container {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background: var(--color-bg-base);
}

.page-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
}

.page-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.page-loading p {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

/* Page Content Animation */
.page-content {
  animation: fadeIn var(--transition-base);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Step 3: Commit**

```bash
git add app/renderer/index.html app/renderer/assets/css/components.css
git commit -m "feat(ui): update page container and loading styles"
```

---

## Task 6: Update Buttons and Form Elements

**Files:**
- Modify: `app/renderer/assets/css/components.css`

**Step 1: Replace button styles in components.css**

Replace the existing button styles with:

```css
/* ==================== Buttons - Warm Theme ==================== */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  font-weight: 500;
  border: none;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-secondary {
  background-color: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background-color: var(--color-bg-muted);
  border-color: var(--color-border-dark);
}

.btn-danger {
  background-color: var(--color-error);
  color: white;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-danger:hover {
  background-color: #B91C1C;
}

/* Icon Button */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: var(--color-bg-muted);
  color: var(--color-text-primary);
}
```

**Step 2: Replace input styles**

```css
/* ==================== Inputs - Warm Theme ==================== */
input[type="text"],
input[type="number"],
input[type="email"],
input[type="password"],
input[type="date"],
input[type="search"],
select,
textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background-color: var(--color-bg-elevated);
  transition: all var(--transition-fast);
  outline: none;
}

input[type="text"]::placeholder,
input[type="number"]::placeholder,
input[type="email"]::placeholder,
input[type="password"]::placeholder,
input[type="search"]::placeholder,
textarea::placeholder {
  color: var(--color-text-muted);
}

input[type="text"]:hover,
input[type="number"]:hover,
input[type="email"]:hover,
input[type="password"]:hover,
input[type="date"]:hover,
input[type="search"]:hover,
select:hover,
textarea:hover {
  border-color: var(--color-border-dark);
}

input[type="text"]:focus,
input[type="number"]:focus,
input[type="email"]:focus,
input[type="password"]:focus,
input[type="date"]:focus,
input[type="search"]:focus,
select:focus,
textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(180, 83, 9, 0.1);
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
}

/* Select styling */
select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2378716C'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  padding-right: 2.5rem;
}

/* Checkbox and Radio */
input[type="checkbox"],
input[type="radio"] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
}

/* Form Labels */
label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 0.375rem;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}
```

**Step 3: Commit**

```bash
git add app/renderer/assets/css/components.css
git commit -m "feat(ui): update buttons and form elements with warm theme"
```

---

## Task 7: Update Cards and Panels

**Files:**
- Modify: `app/renderer/assets/css/components.css`

**Step 1: Replace card and panel styles**

```css
/* ==================== Cards & Panels - Warm Theme ==================== */
.stat-card-modern {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.stat-card-modern:hover {
  border-color: var(--color-border);
  box-shadow: var(--shadow-md);
}

.stat-card-modern .stat-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
}

.stat-card-modern .stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.stat-card-modern .stat-change {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--radius-full);
}

.stat-change--up {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.stat-change--down {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.stat-change--neutral {
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
}

/* Icon Frame */
.icon-frame {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-50);
  color: var(--color-primary);
}

/* Dashboard Panel */
.dashboard-panel {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.dashboard-panel-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.dashboard-panel-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
```

**Step 2: Commit**

```bash
git add app/renderer/assets/css/components.css
git commit -m "feat(ui): update cards and panels with warm theme"
```

---

## Task 8: Update Tables

**Files:**
- Modify: `app/renderer/assets/css/components.css`

**Step 1: Replace table styles**

```css
/* ==================== Tables - Warm Theme ==================== */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 0.875rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-subtle);
}

.data-table td {
  padding: 1rem;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-light);
  vertical-align: middle;
}

.data-table tbody tr {
  transition: background-color var(--transition-fast);
}

.data-table tbody tr:hover {
  background-color: var(--color-bg-subtle);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* Table variants */
.data-table--striped tbody tr:nth-child(even) {
  background-color: var(--color-bg-subtle);
}

.data-table--striped tbody tr:nth-child(even):hover {
  background-color: var(--color-bg-muted);
}

/* Table cell styles */
.table-cell-primary {
  font-weight: 600;
  color: var(--color-text-primary);
}

.table-cell-secondary {
  color: var(--color-text-secondary);
}

.table-cell-muted {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.table-cell-number {
  font-variant-numeric: tabular-nums;
}
```

**Step 2: Commit**

```bash
git add app/renderer/assets/css/components.css
git commit -m "feat(ui): update tables with warm theme"
```

---

## Task 9: Update Status Badges

**Files:**
- Modify: `app/renderer/assets/css/components.css`

**Step 1: Replace status badge styles**

```css
/* ==================== Status Badges - Warm Theme ==================== */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--radius-full);
  border: 1px solid transparent;
}

.status-badge--success {
  background: var(--color-success-bg);
  color: var(--color-success);
  border-color: var(--color-success-border);
}

.status-badge--warning {
  background: var(--color-warning-bg);
  color: var(--color-warning);
  border-color: var(--color-warning-border);
}

.status-badge--error {
  background: var(--color-error-bg);
  color: var(--color-error);
  border-color: var(--color-error-border);
}

.status-badge--info {
  background: var(--color-info-bg);
  color: var(--color-info);
  border-color: var(--color-info-border);
}

.status-badge--neutral {
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}

/* Status dot indicator */
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot--success {
  background: var(--color-success);
}

.status-dot--warning {
  background: var(--color-warning);
}

.status-dot--error {
  background: var(--color-error);
}

.status-dot--info {
  background: var(--color-info);
}
```

**Step 2: Commit**

```bash
git add app/renderer/assets/css/components.css
git commit -m "feat(ui): update status badges with warm theme"
```

---

## Task 10: Update Modal System

**Files:**
- Modify: `app/renderer/assets/css/components.css`

**Step 1: Replace modal styles**

```css
/* ==================== Modal System - Warm Theme ==================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(61, 35, 20, 0.5);
  backdrop-filter: blur(4px);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-base);
}

.modal-overlay.open {
  opacity: 1;
  visibility: visible;
}

.modal-container {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  transform: scale(0.95) translateY(10px);
  transition: transform var(--transition-base);
  border: 1px solid var(--color-border-light);
}

.modal-overlay.open .modal-container {
  transform: scale(1) translateY(0);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.modal-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--color-text-primary);
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  background: transparent;
  border: none;
}

.modal-close-btn:hover {
  background: var(--color-bg-muted);
  color: var(--color-text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: var(--color-bg-subtle);
  border-top: 1px solid var(--color-border-light);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
}

/* Modal variants */
.modal-container--lg {
  max-width: 720px;
}

.modal-container--sm {
  max-width: 400px;
}
```

**Step 2: Commit**

```bash
git add app/renderer/assets/css/components.css
git commit -m "feat(ui): update modal system with warm theme"
```

---

## Task 11: Update Typography Styles

**Files:**
- Modify: `app/renderer/assets/css/components.css`

**Step 1: Add typography styles**

```css
/* ==================== Typography - Warm Theme ==================== */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  color: var(--color-text-primary);
  font-weight: 400;
  line-height: 1.3;
}

h1 { font-size: 2rem; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.25rem; }
h4 { font-size: 1.125rem; }
h5 { font-size: 1rem; }
h6 { font-size: 0.875rem; }

.page-title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-muted { color: var(--color-text-muted); }
.text-accent { color: var(--color-primary); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }
```

**Step 2: Commit**

```bash
git add app/renderer/assets/css/components.css
git commit -m "feat(ui): add typography styles with warm theme"
```

---

## Task 12: Update Dropdown Styles

**Files:**
- Modify: `app/renderer/assets/css/components.css`

**Step 1: Replace dropdown styles**

```css
/* ==================== Custom Dropdown - Warm Theme ==================== */
.custom-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.875rem;
  color: var(--color-text-primary);
  text-align: left;
}

.dropdown-trigger:hover {
  border-color: var(--color-border-dark);
}

.dropdown-trigger:focus,
.custom-dropdown.open .dropdown-trigger {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(180, 83, 9, 0.1);
}

.dropdown-selected {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.dropdown-placeholder {
  color: var(--color-text-muted);
}

.dropdown-selected-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: transform var(--transition-base);
}

.custom-dropdown.open .dropdown-arrow {
  transform: rotate(180deg);
  color: var(--color-primary);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  list-style: none;
  padding: 0.25rem;
  margin: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

.dropdown-item:hover {
  background: var(--color-bg-muted);
}

.dropdown-item.selected {
  background: var(--color-primary-50);
  color: var(--color-primary-dark);
  font-weight: 500;
}

.dropdown-item.selected::after {
  content: '✓';
  margin-left: auto;
  color: var(--color-primary);
}

.dropdown-item-empty {
  color: var(--color-text-muted);
  cursor: default;
  font-style: italic;
}

.dropdown-color-swatch {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  border: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.dropdown-item-badge {
  margin-left: auto;
  padding: 0.125rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 600;
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
  border-radius: var(--radius-full);
}

.dropdown-item-label {
  flex: 1;
}
```

**Step 2: Commit**

```bash
git add app/renderer/assets/css/components.css
git commit -m "feat(ui): update dropdown styles with warm theme"
```

---

## Task 13: Update Login Page

**Files:**
- Modify: `app/renderer/pages/login.html`

**Step 1: Update login page styles**

Replace the `<style>` section in login.html with:

```html
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #F5F0E8 0%, #FFFBF5 50%, #FAF7F2 100%);
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            position: relative;
        }

        body::before {
            content: '';
            position: absolute;
            inset: 0;
            background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
            pointer-events: none;
        }

        .login-container {
            background: #FEFCF7;
            border: 1px solid #E8DFD5;
            border-radius: 16px;
            box-shadow: 0 4px 6px rgba(139, 90, 43, 0.04), 0 20px 40px rgba(139, 90, 43, 0.08);
            width: 100%;
            max-width: 420px;
            padding: 48px 40px;
            animation: slideIn 0.4s ease-out;
            position: relative;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .login-header {
            text-align: center;
            margin-bottom: 40px;
        }

        .login-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 8px;
        }

        .login-logo-icon {
            width: 40px;
            height: 40px;
            color: #B45309;
        }

        .login-header h1 {
            font-family: 'DM Serif Display', Georgia, serif;
            font-size: 28px;
            font-weight: 400;
            color: #3D2314;
            margin: 0;
            letter-spacing: 0.02em;
        }

        .login-header p {
            font-size: 14px;
            color: #78716C;
            margin: 8px 0 0 0;
        }

        .form-group {
            margin-bottom: 24px;
        }

        label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #3D2314;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        input[type="text"],
        input[type="password"] {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid #D6CCC2;
            border-radius: 8px;
            font-size: 14px;
            font-family: 'Inter', system-ui, sans-serif;
            transition: all 150ms ease;
            background-color: #FEFCF7;
            color: #3D2314;
        }

        input[type="text"]::placeholder,
        input[type="password"]::placeholder {
            color: #A8A29E;
        }

        input[type="text"]:hover,
        input[type="password"]:hover {
            border-color: #B8A99A;
        }

        input[type="text"]:focus,
        input[type="password"]:focus {
            outline: none;
            border-color: #B45309;
            background-color: #FEFCF7;
            box-shadow: 0 0 0 3px rgba(180, 83, 9, 0.1);
        }

        .password-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        .password-input-wrapper input {
            width: 100%;
            padding-right: 44px;
        }

        .password-toggle {
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            cursor: pointer;
            color: #78716C;
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 150ms ease;
        }

        .password-toggle:hover {
            color: #B45309;
        }

        .password-toggle.active {
            color: #B45309;
        }

        .password-toggle svg {
            width: 20px;
            height: 20px;
            stroke-width: 1.5px;
        }

        .login-button {
            width: 100%;
            padding: 14px 16px;
            background: linear-gradient(135deg, #B45309 0%, #92400E 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 250ms ease;
            margin-top: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 4px rgba(180, 83, 9, 0.2);
        }

        .login-button:hover {
            background: linear-gradient(135deg, #92400E 0%, #78350F 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(180, 83, 9, 0.25);
        }

        .login-button:active {
            transform: translateY(0);
        }

        .login-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .error-message {
            color: #DC2626;
            font-size: 12px;
            margin-top: 6px;
            display: none;
            animation: shake 0.3s ease-in-out;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }

        .error-message.show {
            display: block;
        }

        .login-footer {
            text-align: center;
            margin-top: 32px;
            font-size: 12px;
            color: #A8A29E;
        }

        .spinner {
            display: none;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .button-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
    </style>
```

**Step 2: Update login header HTML**

Replace the login-header div with:

```html
        <div class="login-header">
            <div class="login-logo">
                <svg class="login-logo-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="32" height="32" rx="4" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 12h16M12 20h16M12 28h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <h1>MULTIPRINTS</h1>
            </div>
            <p>Management System</p>
        </div>
```

**Step 3: Commit**

```bash
git add app/renderer/pages/login.html
git commit -m "feat(ui): redesign login page with warm artisan theme"
```

---

## Task 14: Update Dashboard Page

**Files:**
- Modify: `app/renderer/pages/dashboard.html`

**Step 1: Update dashboard HTML structure**

Update the page wrapper and add warm theme classes. Replace the opening div with:

```html
<!-- Dashboard Page Content -->
<div id="page-dashboard" class="page-content">
    <!-- Welcome Section -->
    <div class="mb-8">
        <h1 class="page-title" id="welcome-message">Good Morning, Admin</h1>
        <p class="page-subtitle">Here's what's happening with your store today.</p>
    </div>
```

**Step 2: Update chart filter buttons**

Replace the chart filter buttons with warm theme versions:

```html
                    <div class="flex bg-[var(--color-bg-muted)] rounded-lg p-1">
                        <button id="btn-chart-week"
                            class="chart-filter-btn px-3 py-1.5 text-xs font-medium rounded-md transition-all bg-[var(--color-primary)] text-white shadow-sm">Week</button>
                        <button id="btn-chart-month"
                            class="chart-filter-btn px-3 py-1.5 text-xs font-medium rounded-md transition-all text-[var(--color-text-secondary)]">Month</button>
                        <button id="btn-chart-year"
                            class="chart-filter-btn px-3 py-1.5 text-xs font-medium rounded-md transition-all text-[var(--color-text-secondary)]">Year</button>
                    </div>
```

**Step 3: Update view all button**

```html
                    <button class="text-sm text-[var(--color-primary)] font-medium hover:text-[var(--color-primary-dark)]"
                        onclick="navigateToPage('sales')">View All</button>
```

**Step 4: Commit**

```bash
git add app/renderer/pages/dashboard.html
git commit -m "feat(ui): update dashboard page with warm theme"
```

---

## Task 15: Update Chart Filter Button Styles

**Files:**
- Modify: `app/renderer/assets/css/components.css`

**Step 1: Update chart filter button styles**

```css
/* ==================== Chart Filter Buttons - Warm Theme ==================== */
.chart-filter-btn {
  cursor: pointer;
  outline: none;
  border: none;
  font-family: var(--font-sans);
}

.chart-filter-btn:hover:not(.bg-\[var\(--color-primary\)\]) {
  background-color: var(--color-bg-elevated);
  box-shadow: var(--shadow-sm);
}

.chart-filter-btn.active,
.chart-filter-btn[style*="background-color: var(--color-primary)"],
.chart-filter-btn[style*="background: var(--color-primary)"] {
  color: white !important;
  background: var(--color-primary) !important;
  box-shadow: var(--shadow-sm);
}

.chart-filter-btn:focus {
  outline: none;
}
```

**Step 2: Commit**

```bash
git add app/renderer/assets/css/components.css
git commit -m "feat(ui): update chart filter buttons with warm theme"
```

---

## Task 16: Link Theme CSS to All Pages

**Files:**
- Modify: `app/renderer/index.html` (add theme.css link)
- Modify: `app/renderer/pages/login.html` (add theme.css link)

**Step 1: Add theme.css to index.html**

Add before the components.css link:

```html
  <link href="assets/css/theme.css" rel="stylesheet">
  <link href="assets/css/components.css" rel="stylesheet">
```

**Step 2: Add theme.css to login.html**

Add after fonts.css link:

```html
    <link rel="stylesheet" href="../assets/css/fonts.css">
    <link rel="stylesheet" href="../assets/css/theme.css">
```

**Step 3: Commit**

```bash
git add app/renderer/index.html app/renderer/pages/login.html
git commit -m "feat(ui): link theme.css to all pages"
```

---

## Task 17: Update Tailwind Config for Custom Colors

**Files:**
- Modify: `app/renderer/index.html`

**Step 1: Update Tailwind config in index.html**

Replace the tailwind.config script with:

```html
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            display: ['DM Serif Display', 'Georgia', 'serif'],
          },
          colors: {
            'warm': {
              50: '#FFFBEB',
              100: '#FEF3C7',
              200: '#FDE68A',
              300: '#FCD34D',
              400: '#FBBF24',
              500: '#B45309',
              600: '#92400E',
              700: '#78350F',
              800: '#6B4423',
              900: '#3D2314',
            },
            'forest': {
              50: '#F0FDF4',
              100: '#DCFCE7',
              200: '#BBF7D0',
              300: '#86EFAC',
              400: '#4ADE80',
              500: '#22C55E',
              600: '#166534',
              700: '#14532D',
              800: '#052E16',
              900: '#022C22',
            },
            'cream': '#FFFBF5',
            'paper': '#FEFCF7',
            'sand': '#F5F0E8',
            'taupe': '#D6CCC2',
            'brown': {
              light: '#A8A29E',
              DEFAULT: '#78716C',
              dark: '#3D2314',
            }
          }
        }
      }
    }
  </script>
```

**Step 2: Commit**

```bash
git add app/renderer/index.html
git commit -m "feat(ui): update Tailwind config with warm color palette"
```

---

## Task 18: Final Cleanup and Testing

**Step 1: Run the app and verify**

Start the Electron app and check:
- [ ] Login page displays with warm theme
- [ ] Sidebar shows warm brown gradient
- [ ] Navigation items highlight correctly with terracotta accent
- [ ] Dashboard cards have warm backgrounds and shadows
- [ ] Buttons show terracotta primary color
- [ ] Tables have warm alternating rows
- [ ] Modals have warm backgrounds
- [ ] All pages load without CSS errors

**Step 2: Fix any issues found**

If any visual issues are found, fix them in components.css or the specific page HTML.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(ui): complete warm artisan theme redesign"
```

---

## Summary

This plan transforms the MULTIPRINTS app from a cold, monochrome interface to a warm, artisan print shop aesthetic while preserving all existing functionality. The key changes are:

1. **Color Palette**: Terracotta primary, forest green secondary, warm cream backgrounds
2. **Sidebar**: Warm brown gradient with cream text
3. **Typography**: DM Serif Display for headings, warm brown text colors
4. **Components**: Warm shadows, terracotta accents, taupe borders
5. **Login Page**: Warm gradient background, branded logo, artisan feel

The redesign creates a cohesive, inviting interface that reflects the craft and quality of a professional printing business.
