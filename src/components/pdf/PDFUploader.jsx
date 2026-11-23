import { UploadCloud } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

export function PDFUploader({ onFileSelected, disabled = false }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    disabled,
    accept: {
      'application/pdf': ['.pdf'],
    },
    onDrop: (acceptedFiles) => {
      if (!acceptedFiles.length) {
        return
      }
      onFileSelected(acceptedFiles[0])
    },
  })

  return (
    <div
      {...getRootProps()}
      className={[
        'mx-auto flex max-w-xl cursor-pointer flex-col items-center rounded-xl border border-dashed p-10 text-center transition',
        isDragActive ? 'border-cyan-300 bg-cyan-300/10' : 'border-slate-700 bg-slate-900/50 hover:border-cyan-300/50',
      ].join(' ')}
    >
      <input {...getInputProps()} />
      <UploadCloud size={32} className="mb-3 text-cyan-300" />
      <h2 className="font-heading text-lg text-slate-100">Drop PDF here or click to upload</h2>
      <p className="mt-2 text-sm text-slate-400">No file leaves your device. Maximum size: 100MB.</p>
    </div>
  )
}
