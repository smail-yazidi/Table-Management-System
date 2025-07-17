const mongoose = require("mongoose")

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

async function setupDatabase() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(
      "mongodb+srv://smailyazidivip:mHBz0x9p3kmVqqd7@animovcluster.dg52jym.mongodb.net/studyhall?retryWrites=true&w=majority&appName=AnimovCluster",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    )

    console.log("🔗 Connected to MongoDB Atlas")

    // Clear existing data
    await Tutor.deleteMany({})
    await Table.deleteMany({})
    await Reservation.deleteMany({})

    console.log("🗑️ Cleared existing data")

    // Create sample tutors
    const sampleTutors = [
      { firstName: "John", lastName: "Smith" },
      { firstName: "Sarah", lastName: "Johnson" },
      { firstName: "Mike", lastName: "Brown" },
      { firstName: "Emily", lastName: "Davis" },
      { firstName: "David", lastName: "Wilson" },
      { firstName: "Lisa", lastName: "Anderson" },
      { firstName: "Tom", lastName: "Taylor" },
      { firstName: "Anna", lastName: "Martinez" },
    ]

    const createdTutors = await Tutor.insertMany(sampleTutors)
    console.log(`👨‍🏫 Created ${createdTutors.length} sample tutors`)

    // Create sample tables
    const sampleTables = []
    for (let i = 1; i <= 12; i++) {
      sampleTables.push({ tableNumber: i })
    }

    const createdTables = await Table.insertMany(sampleTables)
    console.log(`🪑 Created ${createdTables.length} tables`)

    // Create some sample reservations (current hour)
    const now = new Date()
    const sampleReservations = [
      {
        tutorId: createdTutors[0]._id,
        tableId: createdTables[0]._id,
        datetime: now,
      },
      {
        tutorId: createdTutors[1]._id,
        tableId: createdTables[2]._id,
        datetime: now,
      },
      {
        tutorId: createdTutors[2]._id,
        tableId: createdTables[5]._id,
        datetime: now,
      },
    ]

    const createdReservations = await Reservation.insertMany(sampleReservations)
    console.log(`📅 Created ${createdReservations.length} sample reservations`)

    console.log("✅ Database setup completed successfully!")
    console.log("📊 Summary:")
    console.log(`   - Tutors: ${createdTutors.length}`)
    console.log(`   - Tables: ${createdTables.length}`)
    console.log(`   - Active Reservations: ${createdReservations.length}`)
  } catch (error) {
    console.error("❌ Database setup failed:", error)
  } finally {
    await mongoose.connection.close()
    console.log("🔌 Database connection closed")
  }
}

// Run the setup
setupDatabase()
