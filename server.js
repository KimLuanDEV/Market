const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const DATA_DIR = path.join(__dirname, "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

function readJSON(file, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.get("/api/products", (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  res.json(products.filter(p => p.status === "active"));
});

app.get("/api/product/:id", (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

app.post("/api/product/create", (req, res) => {
  const products = readJSON(PRODUCTS_FILE);

  const product = {
    id: Date.now().toString(),
    sellerUid: req.body.sellerUid || "demo-user",
    name: req.body.name,
    price: Number(req.body.price || 0),
    image: req.body.image || "",
    description: req.body.description || "",
    stock: Number(req.body.stock || 1),
    status: "active",
    createdAt: Date.now()
  };

  products.unshift(product);
  writeJSON(PRODUCTS_FILE, products);

  res.json({ ok: true, product });
});

app.post("/api/order/create", (req, res) => {
  const orders = readJSON(ORDERS_FILE);

  const order = {
    id: Date.now().toString(),
    buyerUid: req.body.buyerUid || "demo-buyer",
    productId: req.body.productId,
    qty: Number(req.body.qty || 1),
    total: Number(req.body.total || 0),
    status: "pending",
    createdAt: Date.now()
  };

  orders.unshift(order);
  writeJSON(ORDERS_FILE, orders);

  res.json({ ok: true, order });
});

app.listen(PORT, () => {
  console.log("LivePro Market running on port", PORT);
});