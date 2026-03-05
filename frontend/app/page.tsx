"use client"

import { useState } from "react"

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

  const ask = async () => {

    if (!question.trim()) return

    const userMessage = { role: "user" as const, content: question }
    const assistantMessage = { role: "assistant" as const, content: "" }

    // Add messages before streaming
    setMessages((prev) => [...prev, userMessage, assistantMessage])

    setQuestion("")
    setLoading(true)
    setStreaming(false)

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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

        if (prev.length === 0) return prev

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-3xl p-4">
        <h1 className="text-2xl font-bold text-gray-800">
          AI Knowledge Copilot
        </h1>
      </div>

      {/* Chat container */}
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg flex flex-col h-[70vh]">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

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

        {/* Input */}
        <div className="border-t p-4 flex gap-2">

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
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Thinking..." : "Ask"}
          </button>

        </div>

      </div>

    </div>
  )
}