import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function getPageTips(pathname) {
  if (pathname === '/') {
    return [
      'Use the quick action cards to jump to registration, scanning, or history.',
      "If stats look empty, make sure the backend is running on port 5000.",
      'Register at least one student before scanning attendance.',
    ]
  }

  if (pathname === '/students/new') {
    return [
      'Fill all fields then click “Register Student”.',
      'Student ID must be unique (example: CS2024005).',
      'After successful registration, you will be redirected to the dashboard.',
    ]
  }

  if (pathname === '/attendance/scan') {
    return [
      'Type or scan a Student ID then click “Scan Attendance”.',
      'After success you’ll see a confirmation and a QR receipt.',
      'If the ID is not found, register the student first.',
    ]
  }

  if (pathname === '/attendance') {
    return [
      'Use the filters to narrow results by date, department, or student ID.',
      'Use pagination to browse more records.',
      'Use export to CSV to download the current list.',
    ]
  }

  return [
    'Use the sidebar to navigate between pages.',
    'If something fails, check if the backend is running.',
  ]
}

function buildResponse(text, pathname) {
  const t = text.trim().toLowerCase()

  const quick = {
    register: { label: 'Open Student Registration', to: '/students/new' },
    scan: { label: 'Open Attendance Scanner', to: '/attendance/scan' },
    history: { label: 'Open Attendance History', to: '/attendance' },
    dashboard: { label: 'Open Dashboard', to: '/' },
  }

  if (!t) {
    return {
      answer: 'Type a question or pick a quick option below.',
      actions: [quick.register, quick.scan, quick.history],
    }
  }

  if (t.includes('how') && (t.includes('work') || t.includes('use') || t.includes('system'))) {
    return {
      answer:
        'Workflow: 1) Register students. 2) Scan attendance. 3) View history and export reports. Tell me what page you are on and what you want to do.',
      actions: [quick.register, quick.scan, quick.history],
    }
  }

  if (t.includes('register') || t.includes('student') || t.includes('add')) {
    return {
      answer:
        'To register: go to “Register Student”, fill full name, unique student ID, department, gender, and phone number, then submit. If Student ID exists, choose a new one.',
      actions: [quick.register],
    }
  }

  if (t.includes('scan') || t.includes('qr') || t.includes('attendance')) {
    return {
      answer:
        'To scan attendance: go to “Attendance Scanner”, enter the student ID, then click “Scan Attendance”. A success card appears with the student info and QR receipt.',
      actions: [quick.scan],
    }
  }

  if (t.includes('history') || t.includes('report') || t.includes('export') || t.includes('csv')) {
    return {
      answer:
        'To view reports: open “Attendance History”, filter by date/department/student ID, then use “Export CSV” to download.',
      actions: [quick.history],
    }
  }

  if (t.includes('error') || t.includes('failed') || t.includes('cors') || t.includes('network')) {
    return {
      answer:
        'If you see network/CORS errors: confirm backend is running at http://localhost:5000/api/v1 and frontend is running (5173/5174/5175). If you changed ports, refresh the page and restart backend.',
      actions: [quick.dashboard],
    }
  }

  const tips = getPageTips(pathname)
  return {
    answer: `Here are tips for this page:\n- ${tips.join('\n- ')}`,
    actions: [],
  }
}

export default function HelpAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I can help you use the Student Attendance System. Ask me how to register, scan attendance, or view reports.',
    },
  ])

  const navigate = useNavigate()
  const location = useLocation()
  const listRef = useRef(null)

  const quickActions = useMemo(() => {
    return [
      { label: 'How to register a student?', value: 'How to register a student?' },
      { label: 'How to scan attendance?', value: 'How to scan attendance?' },
      { label: 'How to view/export history?', value: 'How to view/export history?' },
      { label: 'Page tips', value: 'tips' },
    ]
  }, [])

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open])

  const send = (text) => {
    const trimmed = text.trim()

    const userMsg = {
      id: `${Date.now()}-u`,
      role: 'user',
      text: trimmed || text,
    }

    const nextMessages = [...messages, userMsg]
    const { answer, actions } = buildResponse(trimmed, location.pathname)

    const assistantMsg = {
      id: `${Date.now()}-a`,
      role: 'assistant',
      text: answer,
      actions,
    }

    setMessages([...nextMessages, assistantMsg])
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    send(input)
    setInput('')
  }

  const handleAction = (action) => {
    if (action?.to) {
      navigate(action.to)
      setOpen(false)
      return
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60]">
      {open ? (
        <div className="w-[360px] max-w-[92vw] glass rounded-2xl shadow-2xl border border-white/40 overflow-hidden animate-fadeIn">
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m2 4H7a4 4 0 01-4-4V6a4 4 0 014-4h10a4 4 0 014 4v10a4 4 0 01-4 4z" />
                </svg>
              </div>
              <div className="leading-tight">
                <div className="font-semibold">Assistant</div>
                <div className="text-xs text-white/80">Help & guidance</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg hover:bg-white/15 transition-colors"
              aria-label="Close assistant"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div ref={listRef} className="max-h-[360px] overflow-auto px-4 py-4 space-y-3 custom-scrollbar">
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    m.role === 'user'
                      ? 'max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-2 text-sm shadow'
                      : 'max-w-[85%] rounded-2xl rounded-tl-sm bg-white/80 px-3 py-2 text-sm text-gray-800 border border-white/60 shadow-sm'
                  }
                >
                  <div className="whitespace-pre-line">{m.text}</div>
                  {m.role === 'assistant' && Array.isArray(m.actions) && m.actions.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.actions.map((a) => (
                        <button
                          key={a.to}
                          type="button"
                          onClick={() => handleAction(a)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2 pb-3">
              {quickActions.map((qa) => (
                <button
                  key={qa.label}
                  type="button"
                  onClick={() => send(qa.value === 'tips' ? '' : qa.value)}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-white/70 hover:bg-white border border-white/60 shadow-sm transition-colors"
                >
                  {qa.label}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Ask: how do I scan attendance?"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg transition-shadow"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 w-14 h-14 rounded-2xl shadow-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="Open assistant"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l1.2-3A7.5 7.5 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </div>
  )
}
