// /lib/models/Table.ts
import mongoose from "mongoose"

const TableSchema = new mongoose.Schema({
  tableNumber: Number,
})

export default mongoose.models.Table || mongoose.model("Table", TableSchema)
