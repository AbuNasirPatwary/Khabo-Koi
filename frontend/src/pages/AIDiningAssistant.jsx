import { useState } from 'react'
import { Link } from 'react-router-dom'

import { askDiningAssistant } from '../api/aiApi'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'


const EXAMPLE_PROMPTS = [
    'I want a burger under 400 taka in Banani.',
    'Where can I eat kacchi in Dhanmondi?',
    'Suggest something under 600 taka in Uttara.',
]


function AIDiningAssistant() {
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const isLoggedIn = Boolean(
        localStorage.getItem('access_token')
        || localStorage.getItem('refresh_token')
    )

    async function handleSubmit(event) {
        event.preventDefault()

        const trimmedMessage = message.trim()

        if (!trimmedMessage || isLoading) return

        setError('')
        setMessage('')

        setMessages((current) => [
            ...current,
            {
                id: `user-${Date.now()}`,
                role: 'user',
                text: trimmedMessage,
            },
        ])

        setIsLoading(true)

        try {
            const response = await askDiningAssistant(trimmedMessage)

            setMessages((current) => [
                ...current,
                {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    text: response.answer,
                },
            ])
        } catch (requestError) {
            setError(
                requestError.message
                || 'Unable to contact the AI dining assistant.',
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
                    <div>
                        <Link
                            to="/"
                            className="text-xl font-black text-orange-500"
                        >
                            Khabo-Koi
                        </Link>

                        <p className="text-xs font-medium text-slate-500">
                            AI Dining Assistant
                        </p>
                    </div>

                    <Link
                        to="/restaurants"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        Browse restaurants
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-5 py-10">
                <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
                        <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-600">
                            AI powered
                        </span>

                        <h1 className="mt-3 text-3xl font-black text-slate-900">
                            What do you feel like eating?
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Ask about restaurants, branches, food choices, locations,
                            and budgets using real Khabo-Koi restaurant data.
                        </p>
                    </div>

                    {!isLoggedIn ? (
                        <div className="px-6 py-10 text-center sm:px-8">
                            <h2 className="text-xl font-bold text-slate-900">
                                Sign in to use the AI assistant
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                The dining assistant is available to logged-in Khabo-Koi
                                customers.
                            </p>

                            <Link
                                to="/login"
                                className="mt-5 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                            >
                                Sign in
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="min-h-[360px] space-y-4 px-6 py-6 sm:px-8">
                                {messages.length === 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">
                                            Try asking:
                                        </p>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {EXAMPLE_PROMPTS.map((prompt) => (
                                                <button
                                                    key={prompt}
                                                    type="button"
                                                    onClick={() => setMessage(prompt)}
                                                    className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-left text-sm font-medium text-orange-700 transition hover:bg-orange-100"
                                                >
                                                    {prompt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map((chatMessage) => (
                                    <div
                                        key={chatMessage.id}
                                        className={`flex ${chatMessage.role === 'user'
                                            ? 'justify-end'
                                            : 'justify-start'
                                            }`}
                                    >
                                        <div
                                            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${chatMessage.role === 'user'
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-slate-100 text-slate-800'
                                                }`}
                                        >
                                            {chatMessage.role === 'assistant' ? (
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        table: ({ children }) => (
                                                            <div className="my-4 overflow-x-auto">
                                                                <table className="w-full border-collapse text-left text-sm">
                                                                    {children}
                                                                </table>
                                                            </div>
                                                        ),

                                                        th: ({ children }) => (
                                                            <th className="border border-slate-300 bg-slate-200 px-3 py-2 font-bold">
                                                                {children}
                                                            </th>
                                                        ),

                                                        td: ({ children }) => (
                                                            <td className="border border-slate-300 px-3 py-2">
                                                                {children}
                                                            </td>
                                                        ),
                                                    }}
                                                >
                                                    {chatMessage.text}
                                                </ReactMarkdown>
                                            ) : (
                                                chatMessage.text
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                                            Khabo-Koi AI is thinking...
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div
                                        role="alert"
                                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                    >
                                        {error}
                                    </div>
                                )}
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="border-t border-slate-100 p-5 sm:p-6"
                            >
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(event) => setMessage(event.target.value)}
                                        maxLength={500}
                                        placeholder="Ask for food, restaurants, locations or a budget..."
                                        disabled={isLoading}
                                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
                                    />

                                    <button
                                        type="submit"
                                        disabled={isLoading || !message.trim()}
                                        className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Send
                                    </button>
                                </div>

                                <p className="mt-2 text-xs text-slate-400">
                                    Recommendations are based only on available Khabo-Koi data.
                                </p>
                            </form>
                        </>
                    )}
                </section>
            </main>
        </div>
    )
}


export default AIDiningAssistant