require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// IMPORT ROUTES 
const usersRouter = require("./routes/userRoutes");
const authRoutes = require("./routes/auth"); 
const productRouter = require("./routes/productRoutes");
const saleRouter = require("./routes/saleRoutes"); 
const expenseRouter = require("./routes/expenseRoutes");
const purchaseRouter = require("./routes/purchaseRoutes"); 
const dataRouter = require("./routes/dataRoutes");  

const app = express();

// MIDDLEWARE
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// API ROUTES
app.use("/api/users", usersRouter);
app.use("/api/auth", authRoutes); 
app.use("/api/products", productRouter);
app.use("/api/sales", saleRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/purchases", purchaseRouter); 
app.use("/api/data", dataRouter);  

// Test route
app.get("/api/health", (req, res) => res.json({ status: "ok", message: "BentaBoard API is active" }));

// Global Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong on the server!" });
});

// MONGODB CONNECTION & START 
async function start() {
  try {
    // If .env is missing, it will use the local bentaboard database
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/bentaboard';
    
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB!");
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 BentaBoard Server running on port ${PORT}`));

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  }
}

start();