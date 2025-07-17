const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const cron = require("node-cron")

const app = express()
app.use(cors())
app.use(express.json())

// MongoDB Models
const TutorSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  image: String,
})

const TableSchema = new mongoose.Schema({
  tableNumber: Number,
})

const ReservationSchema = new mongoose.Schema({
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: "Tutor", required: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
  datetime: { type: Date, required: true },
})

const Tutor = mongoose.model("Tutor", TutorSchema)
const Table = mongoose.model("Table", TableSchema)
const Reservation = mongoose.model("Reservation", ReservationSchema)

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "public/avatars/"
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  },
})

const upload = multer({ storage })
app.use("/avatars", express.static(path.join(__dirname, "public/avatars")))

// Connect to MongoDB Atlas
mongoose.connect(
  "mongodb+srv://smailyazidivip:mHBz0x9p3kmVqqd7@animovcluster.dg52jym.mongodb.net/studyhall?retryWrites=true&w=majority&appName=AnimovCluster",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
)

mongoose.connection.on("connected", () => {
  console.log("🔗 Connected to MongoDB Atlas")
})

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err)
})

mongoose.connection.on("disconnected", () => {
  console.log("🔌 Disconnected from MongoDB Atlas")
})

// API Routes
app.get("/api/tables", async (req, res) => {
  try {
    const tables = await Table.find()
    res.json(tables)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get("/api/tables-with-reservations", async (req, res) => {
  try {
    const now = new Date()
    const allReservations = await Reservation.find().populate("tutorId").populate("tableId")

    const activeReservations = allReservations.filter((r) => {
      const start = new Date(r.datetime)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      return now >= start && now < end
    })

    const tables = await Table.find()
    const tablesWithTutors = tables.map((table) => {
      const reservation = activeReservations.find((r) => r.tableId._id.toString() === table._id.toString())
      return {
        ...table.toObject(),
        reservedTutor: reservation ? reservation.tutorId : null,
      }
    })

    res.json(tablesWithTutors)
  } catch (err) {
    console.error("Error fetching tables with reservations:", err)
    res.status(500).json({ error: err.message })
  }
})

app.get("/api/tutors", async (req, res) => {
  try {
    const tutors = await Tutor.find()
    res.json(tutors)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/tutors", upload.single("image"), async (req, res) => {
  try {
    const { firstName, lastName } = req.body
    const imagePath = req.file ? `/avatars/${req.file.filename}` : null
    const newTutor = new Tutor({
      firstName,
      lastName,
      image: imagePath,
    })
    await newTutor.save()
    console.log(`✅ Added new tutor: ${firstName} ${lastName}`)
    res.status(201).json(newTutor)
  } catch (err) {
    console.error("❌ Error adding tutor:", err)
    res.status(500).json({ message: "Server error adding tutor" })
  }
})

app.put("/api/tutors/:id", upload.single("image"), async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id)
    if (!tutor) {
      return res.status(404).json({ error: "Tutor not found" })
    }

    if (req.file && tutor.image) {
      const oldPath = path.join(__dirname, "public", tutor.image)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }

    const updatedData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    }

    if (req.file) {
      updatedData.image = `/avatars/${req.file.filename}`
    }

    const updatedTutor = await Tutor.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    })
    console.log(`✅ Updated tutor: ${updatedTutor.firstName} ${updatedTutor.lastName}`)
    res.json(updatedTutor)
  } catch (err) {
    console.error("❌ Error updating tutor:", err)
    res.status(500).json({ error: err.message })
  }
})

app.delete("/api/tutors/:id", async (req, res) => {
  try {
    const tutorId = req.params.id
    const tutor = await Tutor.findById(tutorId)
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" })
    }

    if (tutor.image) {
      const avatarPath = path.join(__dirname, "public", tutor.image)
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath)
      }
    }

    await Reservation.deleteMany({ tutorId: tutorId })
    await Tutor.findByIdAndDelete(tutorId)
    console.log(`🗑️ Deleted tutor: ${tutor.firstName} ${tutor.lastName}`)
    res.json({ message: "Tutor, avatar, and reservations deleted" })
  } catch (err) {
    console.error("❌ Failed to delete tutor:", err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/tables", async (req, res) => {
  try {
    const table = new Table(req.body)
    await table.save()
    console.log(`✅ Added new table: ${table.tableNumber}`)
    res.json(table)
  } catch (err) {
    console.error("❌ Error adding table:", err)
    res.status(500).json({ error: err.message })
  }
})

app.delete("/api/tables/:id", async (req, res) => {
  try {
    const tableId = req.params.id
    const table = await Table.findById(tableId)
    await Reservation.deleteMany({ tableId })
    await Table.findByIdAndDelete(tableId)
    console.log(`🗑️ Deleted table: ${table?.tableNumber}`)
    res.json({ message: "Table and related reservations deleted" })
  } catch (err) {
    console.error("❌ Error deleting table:", err)
    res.status(500).json({ error: err.message })
  }
})

app.get("/api/reservations", async (req, res) => {
  try {
    const reservations = await Reservation.find().populate("tutorId").populate("tableId")
    res.json(
      reservations.map((r) => ({
        _id: r._id,
        datetime: r.datetime,
        tutor: r.tutorId,
        table: r.tableId,
      })),
    )
  } catch (err) {
    console.error("❌ Error fetching reservations:", err)
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/reservations", async (req, res) => {
  try {
    const { tableId, tutorId } = req.body
    const now = new Date()
    const datetime = now

    const existing = await Reservation.findOne({ tutorId, datetime })
    if (existing) {
      return res.status(400).json({ error: "Tutor already has a reservation at this moment" })
    }

    const taken = await Reservation.findOne({ tableId, datetime })
    if (taken) {
      return res.status(400).json({ error: "Table already reserved at this moment" })
    }

    const newReservation = new Reservation({ tutorId, tableId, datetime })
    await newReservation.save()

    const tutor = await Tutor.findById(tutorId)
    const table = await Table.findById(tableId)
    console.log(`📅 New reservation: ${tutor?.firstName} ${tutor?.lastName} at Table ${table?.tableNumber}`)

    res.json({ message: "Reservation successful" })
  } catch (err) {
    console.error("❌ Error making reservation:", err)
    res.status(500).json({ error: err.message })
  }
})

app.delete("/api/reservations/:id", async (req, res) => {
  try {
    const { id } = req.params
    const reservation = await Reservation.findById(id).populate("tutorId").populate("tableId")
    await Reservation.findByIdAndDelete(id)
    console.log(
      `🗑️ Deleted reservation: ${reservation?.tutorId?.firstName} ${reservation?.tutorId?.lastName} at Table ${reservation?.tableId?.tableNumber}`,
    )
    res.status(200).json({ message: "Reservation deleted" })
  } catch (error) {
    console.error("❌ Error deleting reservation:", error)
    res.status(500).json({ error: "Failed to delete reservation" })
  }
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  })
})

// Cron job to delete old reservations (every minute)
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date()
    const cutoff = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago
    const deleted = await Reservation.deleteMany({
      datetime: { $lt: cutoff },
    })
    if (deleted.deletedCount > 0) {
      console.log(`🗑️ Auto-cleanup: Deleted ${deleted.deletedCount} old reservations`)
    }
  } catch (err) {
    console.error("❌ Failed to delete old reservations:", err.message)
  }
})

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...")
  await mongoose.connection.close()
  process.exit(0)
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🌐 API Health Check: http://localhost:${PORT}/api/health`)
  console.log(`📊 Database: MongoDB Atlas`)
})
