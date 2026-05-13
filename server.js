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

function ensureFile(file, fallback){
  if(!fs.existsSync(DATA_DIR)){
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if(!fs.existsSync(file)){
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
  }
}

ensureFile(PRODUCTS_FILE, []);
ensureFile(ORDERS_FILE, []);

function readJSON(file, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJSON(file, data) {
  ensureFile(file, []);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
  res.redirect("/market.html");
});

app.get("/api/products", (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);

  const activeProducts = products
    .filter(p => p.status === "active" && !p.deleted)
    .sort((a, b) => b.createdAt - a.createdAt);

  res.json(activeProducts);
});

app.get("/api/product/:id", (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const product = products.find(p => p.id === req.params.id && !p.deleted);

  if (!product) {
    return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
  }

  res.json(product);
});

app.post("/api/product/create", (req, res) => {
  const { sellerUid, name, price, image, description, category, stock } = req.body;

  if(!name || Number(price) <= 0){
    return res.status(400).json({
      error: "Thiếu tên hoặc giá sản phẩm không hợp lệ"
    });
  }

  const products = readJSON(PRODUCTS_FILE, []);

  const product = {
    id: "prd_" + Date.now(),
    sellerUid: sellerUid || "demo-user",
    sellerName: "User",
    name: String(name).trim(),
    price: Number(price),
    image: image || "/assets/default-product.png",
    description: description || "",
    category: category || "Khác",
    stock: Number(stock || 1),
    status: "active",
    views: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deleted: false
  };

  products.unshift(product);
  writeJSON(PRODUCTS_FILE, products);

  res.json({ ok: true, product });
});

app.post("/api/products", (req, res) => {
  const { uid } = req.headers;
  const body = req.body || {};

  body.sellerUid = uid || body.sellerUid || "demo-user";

  const products = readJSON(PRODUCTS_FILE, []);

  if(!body.name || Number(body.price) <= 0){
    return res.status(400).json({
      error: "Thiếu tên hoặc giá sản phẩm không hợp lệ"
    });
  }

  const product = {
    id: "prd_" + Date.now(),
    sellerUid: body.sellerUid,
    sellerName: "User",
    name: String(body.name).trim(),
    price: Number(body.price),
    image: body.image || "/assets/default-product.png",
    description: body.description || "",
    category: body.category || "Khác",
    stock: Number(body.stock || 1),
    status: "active",
    views: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deleted: false
  };

  products.unshift(product);
  writeJSON(PRODUCTS_FILE, products);

  res.json({ ok: true, product });
});

app.get("/api/my-products", (req, res) => {
  const uid = req.headers.uid || req.query.uid || "demo-user";
  const products = readJSON(PRODUCTS_FILE, []);

  const mine = products
    .filter(p => p.sellerUid === uid && !p.deleted)
    .sort((a, b) => b.createdAt - a.createdAt);

  res.json(mine);
});

app.delete("/api/products/:id", (req, res) => {
  const uid = req.headers.uid || req.query.uid || "demo-user";
  const products = readJSON(PRODUCTS_FILE, []);
  const product = products.find(p => p.id === req.params.id && !p.deleted);

  if(!product){
    return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
  }

  if(product.sellerUid !== uid){
    return res.status(403).json({ error: "Không có quyền xoá sản phẩm này" });
  }

  product.deleted = true;
  product.updatedAt = Date.now();

  writeJSON(PRODUCTS_FILE, products);

  res.json({ ok: true });
});

app.post("/api/order/create", (req, res) => {
  const orders = readJSON(ORDERS_FILE, []);

  const order = {
    id: "ord_" + Date.now(),
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