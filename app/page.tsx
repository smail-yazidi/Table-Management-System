"use client"

import { useState } from "react"
import ImprovedTutorPage from "../improved-tutor-page"
import Dashboard from "../dashboard"
import Navigation from "../navigation"

export default function Page() {
  const [currentPage, setCurrentPage] = useState<"home" | "tutor" | "dashboard">("home")

  if (currentPage === "tutor") {
    return <ImprovedTutorPage />
  }

  if (currentPage === "dashboard") {
    return <Dashboard />
  }

  return <Navigation />
}
