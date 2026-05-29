import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { API } from '../config'

interface Message { role: 'user' | 'assistant'; text: string }

export default function Simulate() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [booked, setBooked] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const reset = () => {
    setMessages([])
    setInput('')
    setBooked(false)
  }

  const send = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', text: input.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post(`${API}/simulate`, next.map(m => ({ role: m.role, text: m.text })))
      const aiMsg: Message = { role: 'assistant', text: res.data.reply }
      setMessages(prev => [...prev, aiMsg])
      if (res.data.isBookingReady) setBooked(true)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Error — is the Anthropic API key configured?' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex flex-col h-screen p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Test AI Chat</h2>
          <p className="text-sm text-slate-500 mt-0.5">Simulate a patient WhatsApp conversation — no messages are sent or saved</p>
        </div>
        <button
          onClick={reset}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Reset
        </button>
      </div>

      {/* Chat window */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
        <div className="bg-green-600 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">AI</div>
          <div>
            <p className="text-white text-sm font-semibold">AI Receptionist</p>
            <p className="text-green-200 text-xs">WhatsApp · Simulation mode</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3 bg-[#ece5dd]">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 text-sm mt-8">
              <p className="text-2xl mb-2">👋</p>
              <p>Type a message below to start the conversation.</p>
              <p className="text-xs mt-1 text-slate-400">Try: "Hi, I have a toothache"</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-green-500 text-white rounded-tr-sm'
                  : 'bg-white text-slate-700 rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-2 rounded-2xl rounded-tl-sm shadow-sm text-slate-400 text-sm">
                <span className="animate-pulse">typing…</span>
              </div>
            </div>
          )}

          {booked && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 text-center font-medium">
              ✅ Booking complete — AI has collected all required info
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 p-3 bg-white flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading || booked}
            placeholder={booked ? 'Booking complete — press Reset to start again' : 'Type a message…'}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim() || booked}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
