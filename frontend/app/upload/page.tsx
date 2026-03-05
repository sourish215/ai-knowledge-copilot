"use client"

import { useState } from "react"

export default function Upload() {

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const uploadFile = async () => {
    if (!file) return

    setUploading(true)

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
      method: "POST",
      body: formData
    })

    const data = await res.json()
    console.log(data)

    setUploading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">

      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-md">

        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Upload Document
        </h2>

        {/* Upload area */}
        <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition">

          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const files = e.target.files
              if (!files || files.length === 0) return
              setFile(files[0])
            }}
          />

          <p className="text-gray-500 text-sm">
            Click to select a file
          </p>

          <p className="text-xs text-gray-400 mt-1">
            PDF, TXT, DOCX
          </p>

        </label>

        {/* Selected file */}
        {file && (
          <div className="mt-4 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
            📄 {file.name}
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={uploadFile}
          disabled={!file || uploading}
          className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>

      </div>

    </div>
  )
}