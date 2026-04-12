# 📊 BentaBoard Backend API

The core server-side logic for the BentaBoard Sales and Task Management System. Built with **Node.js**, **Express**, and **MongoDB**.

---

## ⚙️ Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- dotenv, cors, nodemon

---

## 📁 Folder Structure

```
/backend
├── server.js
├── package.json
├── .env
├── /config
│   └── db.js
├── /models
│   ├── Expense.js
│   └── Product.js
│   └── Purchase.js
│   └──Sale.js
│   └──User.js
├── /controllers
│   ├── authControllers.js
│   ├── expenseController.js
│   └── productControllers.js
│   └──saleController.js
│   └──userController.js
├── /routes
│   ├── auth.js
│   ├── expenseRoutes.js
│   ├── productRoutes.js
│   └── purchaseRoutes.js
│   └── saleRoutes.js
│   └── userRoutes.js
├── /middleware
│   └── authMiddleware.js
└── README.md
```

---

## 🛠 Routes Implemented

All routes are prefixed with `/api`.

### 👤 User & Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/users/register` | Register a new user |
| `POST` | `/api/users/login` | Login & receive JWT token |
| `GET` | `/api/users/` | Get all registered users |
| `PUT` | `/api/users/:id` | Update user details |
| `DELETE` | `/api/users/:id` | Remove a user |
| `POST` | `/api/auth/login` | Simple login (No JWT) |

### 📦 Inventory & Transactions
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products/` | Fetch all products |
| `POST` | `/api/products/` | Add a new product to inventory |
| `POST` | `/api/sales/` | Record a sale (auto-updates stock) |
| `POST` | `/api/expenses/` | Log a business expense |
| `GET` | `/api/purchases/` | Get all purchase history |
| `POST` | `/api/purchases/add` | Record purchase & update stock |

### 🏥 System
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | API Health check |

---

## 🏗 Data Models

| Model | Fields |
| :--- | :--- |
| **User** | `username`, `email`, `password`, `full_name`, `role` (Admin/Seller/Buyer) |
| **Product** | `name`, `price`, `stock`, `createdAt` |
| **Sale** | `productName`, `quantity`, `total`, `saleDate` |
| **Expense** | `category`, `amount`, `dateLogged` |
| **Purchase** | `productName`, `supplierName`, `quantity`, `unitCost`, `totalCost` |

---

---

## 🔌 Connection Setup

1. Create a `.env` file inside `/backend`:

```
PORT=3000
MONGO_URI=mongodb+srv://BentaBoard:gUJo6bpA8548fCTn@beantaboard.7sigzcx.mongodb.net/test
JWT_SECRET=BentaBoard_BSIT2A_PeNiHAMiNo_2026_!@#123
```

2. Install dependencies:

```bash
npm install
```

3. Run server:

```bash
npm start        # Production
```
```bash
npm run dev      # Development (auto-restart)
```

4. Verify:

```Open your browser or Postman and go to:
[http://localhost:3000/api/health](http://localhost:3000/api/health)
```
Expected Response:
```json
 {
  "status": "ok",
  "message": "BentaBoard API is active"
}
```
---


## 👥 Group

**PeNiHaMiNo** — BSIT-2A | Bicol University Polangui

