"use client"

import { useState, useEffect } from "react"

const TypingDots = () => (
  <div className="flex gap-1 items-center">
    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
  </div>
)

export default function Chat() {

  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([])

  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [showUpload, setShowUpload] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const [documents, setDocuments] = useState<{ id: string; name: string }[]>([])

  const uploadFile = async () => {

    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    setUploading(true)

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
      method: "POST",
      body: formData
    })

    setFile(null)
    setUploading(false)
    setShowUpload(false)

    fetchDocuments()
  }

  const ask = async () => {

    if (!question.trim()) return

    const userMessage = { role: "user" as const, content: question }
    const assistantMessage = { role: "assistant" as const, content: "" }

    setMessages((prev) => [...prev, userMessage, assistantMessage])

    setQuestion("")
    setLoading(true)
    setStreaming(false)

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    })

    if (!res.body) throw new Error("No response body")

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    let result = ""

    while (true) {

      const { done, value } = await reader.read()

      if (done) break

      const chunk = decoder.decode(value, { stream: true })

      if (!streaming) {
        setStreaming(true)
        setLoading(false)
      }

      result += chunk

      setMessages((prev) => {

        const copy = [...prev]
        const lastIndex = copy.length - 1

        if (copy[lastIndex].role === "assistant") {
          copy[lastIndex] = {
            ...copy[lastIndex],
            content: result
          }
        }

        return copy
      })
    }

    setStreaming(false)
    setLoading(false)
  }

  const fetchDocuments = async () => {

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`)

    const data = await res.json()

    setDocuments(data)
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* HEADER */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">

        <h1 className="text-lg font-semibold text-gray-800">
          AI Knowledge Copilot
        </h1>

        <span className="text-sm text-gray-400">
          RAG Assistant
        </span>

      </div>

      <div className="flex flex-1 min-h-0">

        {/* SIDEBAR */}
        <div className="w-64 bg-white border-r flex flex-col p-4">

          <h2 className="text-lg font-semibold mb-4">
            Documents
          </h2>

          <div className="space-y-2 flex-1 overflow-y-auto min-h-0">

            {documents.map((doc, i) => (
              <div
                key={doc.id}
                title={doc.name}
                className="group flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-200 transition"
              >
                <span className="text-gray-500 shrink-0">📄</span>

                <span className="flex-1 truncate text-gray-700 group-hover:text-gray-900">
                  {doc.name}
                </span>
              </div>
            ))}

          </div>

          <button
            onClick={() => setShowUpload(true)}
            className="mt-4 bg-blue-600 text-white py-2 rounded-lg cursor-pointer hover:bg-blue-700"
          >
            Upload
          </button>

        </div>


        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-lg max-w-[70%] ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >

                  {m.role === "assistant" && loading && i === messages.length - 1 ? (
                    <TypingDots />
                  ) : (
                    <>
                      {m.content}

                      {streaming && i === messages.length - 1 && (
                        <span className="animate-pulse">▌</span>
                      )}
                    </>
                  )}

                </div>
              </div>
            ))}

          </div>


          {/* INPUT */}
          <div className="border-t bg-white p-4 flex gap-2">

            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e)=> e.key === "Enter" && ask()}
              placeholder="Ask a question..."
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={ask}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Thinking..." : "Ask"}
            </button>

          </div>

        </div>


        {/* UPLOAD MODAL */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

            <div className="bg-white rounded-xl shadow-lg p-6 w-[400px]">

              <h3 className="text-lg font-semibold mb-4">
                Upload Document
              </h3>

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

              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  📄 {file.name}
                </p>
              )}

              <div className="flex justify-end gap-2 mt-4">

                <button
                  onClick={() => setShowUpload(false)}
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg border cursor-pointer hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  onClick={uploadFile}
                  disabled={!file || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
                >
                  Upload
                </button>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  )
}