# MULTICAL

A modern offline desktop inventory and sales management application built with **Electron.js** and **SQLite**. MULTICAL provides a complete business management solution for tracking products, stock (sticker rolls), sales, and customer debts with an intuitive dashboard interface.

## Features

- **Dashboard**: Real-time overview of revenue, sales, products, and outstanding debts with analytics charts
- **Product Management**: Track Life Savers and Chevrons with customizable colors, sizes, and pricing
- **Stock Management**: Manage sticker rolls inventory with color variants, sizes, and usage tracking
- **Sales Tracking**: Record product and sticker sales with payment methods and customer information
- **Debt Management**: Track customer debts with due dates, payment status, and overdue alerts
- **Notifications**: Real-time alerts for overdue debts and important updates
- **Analytics**: Visual revenue analytics with Chart.js integration
- **Offline-First**: Full functionality without internet connection using local SQLite database

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Electron Desktop Application          │
├─────────────────────────────────────────────────┤
│                                                 │
│  Main Process          Renderer Process         │
│  ├── Window Management ├── Dashboard            │
│  ├── IPC Handlers      ├── Products Page        │
│  ├── Database Manager  ├── Stock Page           │
│  ├── Menu System       ├── Sales Page           │
│  └── Preload API       └── Debts Page           │
│                                                 │
└─────────────────┬───────────────────────────────┘
                  │
                  │ IPC Communication
                  │
        ┌─────────▼──────────┐
        │  better-sqlite3    │
        │  (SQLite Database) │
        └────────────────────┘
             multical.db
```

## Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**

## Project Structure

```
MULTICAL/
└── app/
    ├── main/                    # Electron main process
    │   ├── handlers/
    │   │   └── index.js         # IPC message handlers
    │   ├── index.js             # Main entry point
    │   ├── menu.js              # Application menu
    │   └── preload.js           # Context bridge API
    │
    ├── renderer/                # Electron renderer process
    │   ├── assets/
    │   │   ├── css/
    │   │   │   ├── components.css
    │   │   │   └── main.css
    │   │   └── js/
    │   │       ├── api/
    │   │       │   └── client.js
    │   │       ├── components/
    │   │       │   ├── confirm-modal.js
    │   │       │   ├── dropdown.js
    │   │       │   ├── notifications.js
    │   │       │   └── toast.js
    │   │       ├── pages/
    │   │       │   ├── dashboard.js
    │   │       │   └── debts.js
    │   │       └── app.js       # Main app controller
    │   ├── pages/
    │   │   ├── dashboard.html
    │   │   ├── debts.html
    │   │   ├── sales.html
    │   │   └── stock.html
    │   └── index.html           # Main window
    │
    ├── shared/
    │   └── constants.js         # Shared constants
    │
    ├── database.js              # SQLite database manager
    ├── electron.config.js       # Electron configuration
    └── package.json
```

## Quick Start

### 1. Installation

```bash
cd app
npm install
```

### 2. Development

```bash
# Start in development mode with DevTools
npm run dev

# Start normally
npm start
```

### 3. Database

The SQLite database is automatically created at first launch in the user data directory:
- **Linux**: `~/.config/multical/multical.db`
- **macOS**: `~/Library/Application Support/multical/multical.db`
- **Windows**: `%APPDATA%/multical/multical.db`

## Database Schema

### Products Table
Stores Life Savers and Chevrons inventory.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Product name |
| product_type | TEXT | life_saver or chevron |
| color | TEXT | Product color |
| size | TEXT | Product size |
| selling_price | REAL | Price per unit |
| stock | INTEGER | Current stock quantity |
| min_sale_qty | INTEGER | Minimum sale quantity |
| sale_unit | TEXT | Unit of sale |

### Stock Table
Manages sticker rolls inventory.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| color | TEXT | Sticker color |
| size | TEXT | Sticker size (default: '1') |
| sticker_type | TEXT | colored or monochrome |
| rolls | INTEGER | Number of rolls |
| metres_per_roll | REAL | Metres per roll (default: 50) |
| total_metres | REAL | Total metres available |
| metres_used | REAL | Metres consumed |

### Sales Table
Records all sales transactions.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| type | TEXT | product or sticker |
| product_id | INTEGER | FK to products |
| stock_id | INTEGER | FK to stock |
| product_name | TEXT | Product name snapshot |
| quantity | TEXT | Quantity sold |
| amount | REAL | Sale amount |
| payment_method | TEXT | cash, mpesa, card |
| customer_name | TEXT | Customer name |
| timestamp | DATETIME | Sale timestamp |

### Debts Table
Tracks customer debts.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| customer_name | TEXT | Customer name |
| phone | TEXT | Contact number |
| amount | REAL | Debt amount |
| due_date | TEXT | Payment due date |
| description | TEXT | Debt notes |
| status | TEXT | pending or paid |
| paid_at | DATETIME | Payment timestamp |
| created_at | DATETIME | Record creation time |

## IPC API

The application uses Electron's IPC for secure communication between main and renderer processes.

### Database Operations

```javascript
// Products
await window.db.products.getAll()
await window.db.products.get(id)
await window.db.products.add(product)
await window.db.products.update(id, updates)
await window.db.products.delete(id)

// Stock
await window.db.stock.getAll()
await window.db.stock.getByColorSizeType(color, size, type)
await window.db.stock.add(stockItem)
await window.db.stock.update(id, updates)

// Sales
await window.db.sales.getAll()
await window.db.sales.getToday()
await window.db.sales.add(sale)
await window.db.sales.getTodayTotal()

// Debts
await window.db.debts.getAll()
await window.db.debts.getPending()
await window.db.debts.add(debt)
await window.db.debts.markPaid(id)
await window.db.debts.getTotalOutstanding()
await window.db.debts.getOverdue()
```

### Utility APIs

```javascript
// App info
await window.electronAPI.getAppVersion()
const platform = window.electronAPI.getPlatform()

// File dialogs
await window.electronAPI.selectFile(options)
await window.electronAPI.selectDirectory(options)
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop Framework | Electron.js v39.2.6 |
| Frontend | HTML5, CSS3 (Tailwind), Vanilla JavaScript |
| Database | SQLite (better-sqlite3 v12.5.0) |
| Charts | Chart.js |
| UI Components | Custom components with Tailwind CSS |
| Process Communication | IPC (Inter-Process Communication) |
| Security | Context Isolation, Preload Scripts |

## Development

### Adding New Pages

1. Create HTML in `renderer/pages/your-page.html`
2. Create controller in `renderer/assets/js/pages/your-page.js`
3. Add navigation link in `renderer/index.html`
4. Register controller in `renderer/assets/js/app.js`

### Adding New IPC Handlers

1. Define handler in `main/handlers/index.js`
2. Expose API in `main/preload.js`
3. Call from renderer using `window.electronAPI` or `window.db`

### Database Migrations

For migrating data from localStorage:

```javascript
const data = {
  products: [...],
  stock: [...],
  sales: [...],
  debts: [...]
};

await window.db.migrate(data);
```

## Security Features

- **Context Isolation**: Enabled for security
- **Node Integration**: Disabled in renderer
- **Preload Scripts**: Secure API exposure via contextBridge
- **CSP**: Content Security Policy configured
- **Foreign Keys**: Enabled in SQLite for referential integrity

## License

MIT License
