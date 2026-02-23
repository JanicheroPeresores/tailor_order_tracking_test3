// server/_core/index.ts
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
dotenv.config();
var app = express();
var PORT = process.env.PORT || 4e3;
var distPath = path.resolve(__dirname, "../../dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
