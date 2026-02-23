"use client";

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, RotateCcw } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { ChatMessage } from "@/components/chat-message"
import { TypingIndicator } from "@/components/typing-indicator"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

declare global {
  interface Window {
    puter: any
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi, I'm Claude! Ask me anything. I'm here to help with questions, creative tasks, analysis, coding, and much more.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [hasUserMessages, setHasUserMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!input.trim() || isTyping) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: "user",
    content: input.trim(),
    timestamp: new Date(),
  }

  setMessages((prev) => [...prev, userMessage])
  setInput("")
  setIsTyping(true)

  if (!hasUserMessages) setHasUserMessages(true)

  const assistantMessage: Message = {
    id: (Date.now() + 1).toString(),
    role: "assistant",
    content: "",
    timestamp: new Date(),
  }

  setMessages((prev) => [...prev, assistantMessage])

  // ✅ Wait for window.puter to be ready
  const waitForPuter = () =>
    new Promise<void>((resolve, reject) => {
      const maxWaitTime = 3000
      const interval = 100
      let waited = 0
      const check = setInterval(() => {
        if (typeof window !== "undefined" && window.puter) {
          clearInterval(check)
          resolve()
        } else if ((waited += interval) >= maxWaitTime) {
          clearInterval(check)
          reject(new Error("Puter SDK not loaded"))
        }
      }, interval)
    })

  try {
    await waitForPuter()
    const response = await window.puter.ai.chat(userMessage.content, {
      model: "claude-sonnet-4-6",
      stream: true,
    })

    for await (const part of response) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: msg.content + (part?.text || "") }
            : msg
        )
      )
    }
  } catch (error) {
    console.error("❌ Error:", error)
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessage.id
          ? {
              ...msg,
              content:
                "⚠️ There was an error fetching the response. Please try again.",
            }
          : msg
      )
    )
  } finally {
    setIsTyping(false)
  }
}


  const handleNewChat = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content:
          "Hi, I'm Claude! Ask me anything. I'm here to help with questions, creative tasks, analysis, coding, and much more.",
        timestamp: new Date(),
      },
    ])
    setInput("")
    setIsTyping(false)
    setHasUserMessages(false)
  }

  const ChatUI = (
    <div className="flex-1 overflow-hidden">
      <div className="h-full container mx-auto px-4 max-w-4xl flex flex-col">
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </AnimatePresence>
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <div className="py-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-[#1d1836] border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/20"
              disabled={isTyping}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-screen flex flex-col"
    >
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <img src="/Icon Logo.svg" alt="Bot Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Claude 3.7 Sonnet</h1>
                <p className="text-xs text-white/60">Powered by Puter.js</p>
              </div>
            </div>

            <Button
              onClick={handleNewChat}
              variant="outline"
              size="sm"
              className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>
      </div>

      {ChatUI}
    </motion.div>
  )
}
