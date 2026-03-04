"use client"

import { useState } from "react"

export default function Upload() {

  const [file, setFile] = useState<File | null>(null)

  const uploadFile = async () => {
    if (!file) return;

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
      method: "POST",
      body: formData
    })

    const data = await res.json()
    console.log(data)
  }

  return (
    <div>

      <h2>Upload Document</h2>

      <input
        type="file"
        onChange={(e) => {
            const files = e.target.files

            if (!files || files.length === 0) return

            setFile(files[0])
        }}
        />

      <button onClick={uploadFile}>
        Upload
      </button>

    </div>
  )
}