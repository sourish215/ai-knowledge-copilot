"use client"

import { useState } from "react"

export default function Upload() {

  const [file, setFile] = useState(null)

  const uploadFile = async () => {
    if (!file) return;

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("http://localhost:8000/upload", {
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
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={uploadFile}>
        Upload
      </button>

    </div>
  )
}