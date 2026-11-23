// Minimal path helper retained for the reference engine's emoji asset resolver.
// Abysentry serves these assets from its own Vite base path.
export function publicUrl(file) {
  return `${import.meta.env.BASE_URL}${String(file).replace(/^\//, '')}`
}
