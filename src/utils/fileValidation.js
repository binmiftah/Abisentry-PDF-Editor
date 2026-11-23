const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024

export function validatePdfFile(file) {
  if (!file) {
    return 'No file selected.'
  }

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return 'Only PDF files are supported.'
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'PDF is too large. Please use a file smaller than 100MB.'
  }

  return null
}
