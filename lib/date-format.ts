/** Convert ISO date (yyyy-mm-dd) to display format (dd/mm/yyyy) */
export function formatDateDisplay(isoDate: string): string {
  if (!isoDate) return ""
  const [year, month, day] = isoDate.split("-")
  return `${day}/${month}/${year}`
}

/** Convert dd/mm/yyyy to ISO format (yyyy-mm-dd) */
export function parseDateDisplay(display: string): string {
  if (!display) return ""
  const parts = display.split("/")
  if (parts.length !== 3) return display // Return as-is if invalid
  const [day, month, year] = parts
  return `${year}-${month}-${day}`
}
