<div align="center">

# 👜 The Hazel — Haute Couture ERP

**A high-precision, production-grade ERP system built for luxury fashion import and e-commerce operations.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.2-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

</div>

## 📖 Overview

**The Hazel ERP** is a dedicated enterprise resource planning platform engineered specifically for women's luxury handbag imports and direct-to-consumer retail. It integrates accurate landed cost calculations, real-time warehouse inventory, sales order dispatching, business expense tracking, and top-level financial KPI analytics into a unified, responsive interface.

---

## ✨ Key Features

### 1. 📊 Executive Command Center (Dashboard)
* **Real-Time Financial Intelligence**: Automatically aggregates business metrics:
  * **Total Investment**: Sum of all product batch acquisition, freight, and landed costs.
  * **Total Sales**: Gross revenue from fulfilled and delivered customer orders.
  * **Total Expenses**: Sum of general operating, marketing, and overhead expenditures.
  * **COGS (Cost of Goods Sold)**: Direct unit-cost summation of sold inventory.
  * **Gross Profit**: `Total Sales - COGS`.
  * **Net Profit**: `Gross Profit - Total Expenses`.
* **Operational Overview**: Total order volumes, pending shipments, physical warehouse stock units, and low-stock alerts.

### 2. 👜 Product Catalog & True Landed Costing
* **Comprehensive Import Cost Calculation**:
  * Total batch weight (kg), batch quantities, shipping routes, and freight rates (BDT/kg).
  * Automated **Shipping Cost** computation: `Total Weight × Shipping Rate`.
  * Automated **Unit Weight** computation: `Total Weight / Quantity`.
  * Total Landed Cost modeling: `Quantity × Buying Price + Shipping Cost + Other Import Cost`.
  * Real-time **Calculated Unit Cost**: `Total Cost / Quantity`.
* **Multi-Currency Pricing**:
  * RMB Price (¥) & RMB Exchange Rate manual entry.
  * Auto-calculated Buying Price (BDT): `RMB Price × RMB Rate`.
* **Variant Management**: Multi-color SKU variants with dedicated pricing and current stock levels.

### 3. 📦 Warehouse Inventory & Stock Control
* **Physical Stock Tracking**: Live inventory counts (`Current Stock`), reserved preorder allocations (`Reserved`), and confirmed sales deductions (`Stock Out`).
* **Automated Stock Synchronization**:
  * Direct order placement deducts physical stock and increments total stock out.
  * Preorder booking reserves stock and releases upon delivery.
* **Manual Adjustment Auditing**: Controlled manual stock increments/decrements with reason logging.

### 4. 🛒 Sales Order Management
* **Flexible Order Modes**: Support for **In-Stock Fulfillment** and **Pre-Order Reservations**.
* **Streamlined Customer Entry**: Direct customer name, contact phone, delivery address, and order notes saved per transaction.
* **Integrated Payment Processing**: Support for Cash on Delivery (COD), bKash, Nagad, Bank Transfer, Rocket, and Card payments.
* **Order Lifecycle Workflow**: Order states (`Pending` → `Processing` → `Delivered` / `Cancelled`) with automated status history audit logs.

### 5. 💸 Business Expenses & Cost Allocation
* **Expense Categorization**: Track operating expenses, platform marketing fees (Meta Ads, Google Ads), courier bills, and packaging costs.
* **Product Cost Distribution**: Option to mark expenses as **Product Related** to automatically distribute the cost equally across all units of a target product batch, adjusting its landed unit cost.

### 6. 🔒 Role-Based Access Control (RBAC)
* **Administrator**: Complete system control, user management, global business parameters, and financial reporting.
* **Staff**: Catalog management, order processing, and stock adjustments.
* **Viewer**: Read-only access to catalog and operational summaries.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (App Router + Turbopack)](https://nextjs.org/) |
| **Frontend** | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/) |
| **Data Tables** | [@tanstack/react-table](https://tanstack.com/table) |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) |
| **Database** | [MySQL 8 / MariaDB](https://www.mysql.com/) |
| **ORM & Migrations** | [Drizzle ORM](https://orm.drizzle.team/), [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) |
| **Authentication** | [NextAuth.js (Auth.js)](https://next-auth.js.org/) + [bcryptjs](https://www.npmjs.com/package/bcryptjs) |
| **Validation** | [Zod](https://zod.dev/) |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
* **Node.js**: `v20.x` or higher
* **npm** or **pnpm** / **yarn**
* **MySQL** or **MariaDB** server (local or hosted)

---

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mubasshirarnab/The-Hazel.git
   cd The-Hazel
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   # NextAuth Configuration
   NEXTAUTH_SECRET=your_super_secret_jwt_key_here
   NEXTAUTH_URL=http://localhost:3000

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=hazel_erp
   ```

4. **Initialize Database Schema**:
   Run the migration script to configure database tables, views, and stored procedures:
   ```bash
   node scripts/run-migration.js
   ```

5. **Seed Default Admin User**:
   ```bash
   node lib/db/seed-admin.js
   ```

6. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
The-Hazel/
├── actions/                  # Next.js Server Actions (Mutations)
│   ├── business-expenses.ts  # Expense tracking & cost distribution
│   ├── inventory.ts          # Manual stock adjustments
│   ├── orders.ts             # Sales order creation & lifecycle
│   ├── products.ts           # Catalog & variant cost management
│   └── settings.ts           # Global business configuration
├── app/                      # Next.js App Router
│   ├── (dashboard)/          # Authenticated ERP views
│   │   ├── business-expenses/# Expense list & creation forms
│   │   ├── dashboard/        # Executive KPI dashboard
│   │   ├── inventory/        # Stock levels & valuation
│   │   ├── orders/           # Sales order registry & details
│   │   ├── products/         # Catalog, variant & landed cost tools
│   │   ├── settings/         # Exchange rates & business rules
│   │   └── layout.tsx        # Dashboard wrapper with Sidebar
│   ├── api/auth/             # NextAuth Route Handlers
│   ├── login/                # Authentication page
│   ├── layout.tsx            # Root HTML layout
│   └── globals.css           # Tailwind CSS v4 design tokens
├── components/               # UI & Shared Component Library
│   ├── shared/               # Data tables, sidebar, headers, badges
│   └── ui/                   # Luxury button, card, input primitives
├── lib/                      # Core Utilities & Backend
│   ├── auth/                 # NextAuth session configuration
│   ├── db/                   # Drizzle schema, connection pool & procedures
│   └── utils.ts              # Classname merger & helper functions
├── types/                    # TypeScript ambient declarations
└── drizzle.config.ts         # Drizzle ORM configuration
```

---

## 🧪 Quality & Verification

Run the test and verification suite:

```bash
# Type check all TypeScript files
npx tsc --noEmit

# Production build verification
npm run build
```

---

## 📄 License

This project is proprietary software developed for **Hazel Haute Couture**. All rights reserved.
