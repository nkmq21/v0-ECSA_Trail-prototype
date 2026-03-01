'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Send, Mic, Sparkles, User, ChevronRight, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ECSATrailLogo } from '@/components/ecsa-logo'
import type { Landmark } from '@/lib/types'

interface ChatPanelProps {
  selectedLandmarks: Landmark[]
  onItineraryGenerated?: (itinerary: unknown) => void
  onFocusLandmark?: (id: string) => void
}

const SUGGESTED_PROMPTS = [
  'Plan a 3-day trip to Hanoi and Ninh Binh',
  'Best indoor activities for rainy days in Hoi An',
  'Optimize my selected landmarks into a 2-day trip',
  'What are the most verified landmarks in Da Nang?',
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

function MessageBubble({ role, parts, isLast }: {
  role: 'user' | 'assistant'
  parts: Array<{ type: string; text?: string }>
  isLast: boolean
}) {
  const text = parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('')

  const isUser = role === 'user'

  // Extract "Source Verified" mentions from AI text
  const hasVerifiedMention = !isUser && (text.includes('Source Verified') || text.includes('verified') || text.includes('credibility'))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className={cn('flex gap-3 px-4', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        ) : (
          <ECSATrailLogo size={32} thinking={false} />
        )}
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[80%] space-y-1', isUser ? 'items-end' : 'items-start', 'flex flex-col')}>
        <motion.div
          layout
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-card border border-border text-foreground rounded-tl-sm'
          )}
        >
          {text || <span className="opacity-50 italic">Processing...</span>}
        </motion.div>

        {/* Source Verified badge on AI messages */}
        {hasVerifiedMention && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full px-2.5 py-1 text-xs"
          >
            <ShieldCheck className="w-3 h-3" />
            <span className="font-medium">Source Verified data used</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export function ChatPanel({ selectedLandmarks, onItineraryGenerated, onFocusLandmark }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState('')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          id,
          messages,
          landmarks: selectedLandmarks.map(l => l.nameEn),
        },
      }),
    }),
  })

  const isStreaming = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, isStreaming])

  function handleSend() {
    const text = inputValue.trim()
    if (!text || isStreaming) return
    sendMessage({ text })
    setInputValue('')
  }

  function handleSuggest(prompt: string) {
    if (isStreaming) return
    sendMessage({ text: prompt })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border flex items-center gap-3">
        <ECSATrailLogo size={36} thinking={isStreaming} />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm text-foreground">AI Planner</h2>
            <div className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
              isStreaming ? 'bg-primary/10 text-primary' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            )}>
              <div className={cn(
                'w-1.5 h-1.5 rounded-full',
                isStreaming ? 'ecsa-thinking' : 'bg-green-500'
              )} />
              {isStreaming ? 'Thinking...' : 'Ready'}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Powered by Gemini · RAG-verified data</p>
        </div>
        {selectedLandmarks.length > 0 && (
          <div className="ml-auto flex items-center gap-1 bg-accent/20 text-accent-foreground rounded-full px-2.5 py-1 text-xs font-medium">
            <Sparkles className="w-3 h-3 text-accent" />
            {selectedLandmarks.length} on map
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef as React.RefObject<HTMLDivElement>}>
        <div className="py-4 space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 space-y-4"
            >
              {/* Welcome */}
              <div className="text-center space-y-2 py-4">
                <ECSATrailLogo size={48} className="mx-auto" />
                <h3 className="font-semibold text-foreground text-balance">Plan your Vietnam adventure</h3>
                <p className="text-sm text-muted-foreground text-balance leading-relaxed">
                  Select landmarks on the map or ask me to build your perfect itinerary.
                  All recommendations use RAG-verified data.
                </p>
              </div>

              {/* Suggested prompts */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suggestions</p>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSuggest(prompt)}
                    className="w-full text-left rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/30 transition-all duration-200 px-4 py-3 flex items-center gap-3 group"
                  >
                    <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    <span className="text-sm text-foreground">{prompt}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <LayoutGroup>
            {messages.map((message, i) => (
              <MessageBubble
                key={message.id}
                role={message.role as 'user' | 'assistant'}
                parts={message.parts ?? []}
                isLast={i === messages.length - 1}
              />
            ))}
          </LayoutGroup>

          {/* Typing indicator */}
          <AnimatePresence>
            {isStreaming && messages[messages.length - 1]?.role === 'user' && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex gap-3 px-4"
              >
                <ECSATrailLogo size={32} thinking={true} />
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        {selectedLandmarks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-3 flex flex-wrap gap-1.5"
          >
            {selectedLandmarks.map((l) => (
              <span
                key={l.id}
                className="inline-flex items-center gap-1 bg-accent/20 text-accent-foreground text-xs rounded-full px-2.5 py-1 font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {l.nameEn}
              </span>
            ))}
          </motion.div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask me to plan your Vietnam trip..."
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              disabled={isStreaming}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            size="sm"
            className="h-10 w-10 p-0 rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Gemini 2.0 Flash · Data from Facebook, Google Maps, travel blogs
        </p>
      </div>
    </div>
  )
}
