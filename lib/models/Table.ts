// lib/models/Table.ts
import mongoose from "mongoose";

const TableSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true, unique: true }, // Added unique and required for tableNumber
});

export default mongoose.models.Table || mongoose.model("Table", TableSchema);
