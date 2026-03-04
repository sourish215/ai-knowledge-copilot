"use client"

import { useState } from "react"
import axios from "axios"

export default function Chat() {

  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")

  const ask = async () => {

  const res = await fetch("http://localhost:8000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ question })
  })

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  let result = ""

  while (true) {
    const { done, value } = await reader.read()

    if (done) break

    const chunk = decoder.decode(value)

    result += chunk

    setAnswer(result)   // update UI as tokens arrive
  }
}

  return (
    <div>

      <input
        value={question}
        onChange={(e)=>setQuestion(e.target.value)}
      />

      <button onClick={ask}>Ask</button>

      <p>{answer}</p>

    </div>
  )
}