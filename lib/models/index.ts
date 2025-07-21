// lib/models/index.ts

// Import all your Mongoose model files here.
// The act of importing them ensures their schemas are registered with Mongoose.
import './Tutor';
import './Table';
import './Reservation';

/**
 * This function ensures all Mongoose models are loaded and registered.
 * It's crucial for Next.js API routes where each route might be a separate
 * serverless function instance, and models need to be registered in that context.
 */
export function loadMongooseModels() {
  // This function doesn't need to do anything specific inside.
  // Its purpose is to be imported and executed, which in turn
  // triggers the imports above, registering the models.
console.log("All Mongoose models loaded/checked."); // Optional: for debugging
}
