'use client'

import { useState, useRef, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useXMTP } from '@/hooks/use-xmtp'

interface XMTPChatProps {
  domain: string
  sellerAddress?: string
  onClose: () => void
}

export function XMTPChat({ domain, sellerAddress = "0x1234567890123456789012345678901234567890", onClose }: XMTPChatProps) {
  const { address, isConnected } = useAccount()
  const { connectors, connect } = useConnect()
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    xmtpClient,
    conversation,
    messages,
    isLoading,
    error,
    isConnected: xmtpConnected,
    initializeXMTP,
    startConversation,
    sendMessage
  } = useXMTP()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle wallet connection
  const handleConnectWallet = () => {
    const injectedConnector = connectors.find(c => c.type === 'injected')
    if (injectedConnector) {
      connect({ connector: injectedConnector })
    }
  }

  // Handle XMTP initialization
  const handleInitializeXMTP = async () => {
    if (!isConnected) {
      handleConnectWallet()
      return
    }
    await initializeXMTP()
  }

  // Handle starting conversation
  const handleStartConversation = async () => {
    await startConversation(sellerAddress)
  }

  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return

    await sendMessage(messageInput.trim())
    setMessageInput('')
  }

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Chat about {domain}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!isConnected ? (
            // Wallet Connection State
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="text-4xl mb-4">🔗</div>
                <h4 className="text-lg font-semibold mb-2">Connect Wallet</h4>
                <p className="text-gray-600 mb-4">Connect your wallet to start messaging</p>
                <button
                  onClick={handleConnectWallet}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          ) : !xmtpConnected ? (
            // XMTP Initialization State
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <h4 className="text-lg font-semibold mb-2">Enable XMTP</h4>
                <p className="text-gray-600 mb-4">Initialize secure messaging</p>
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <button
                    onClick={handleInitializeXMTP}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                  >
                    Enable XMTP
                  </button>
                )}
                {error && (
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
              </div>
            </div>
          ) : !conversation ? (
            // Start Conversation State
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h4 className="text-lg font-semibold mb-2">Start Conversation</h4>
                <p className="text-gray-600 mb-4">Begin chatting with the seller</p>
                <button
                  onClick={handleStartConversation}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Starting...' : 'Start Chat'}
                </button>
              </div>
            </div>
          ) : (
            // Chat Interface
            <>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-2">👋</div>
                    <p>Say hello to start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.senderAddress.toLowerCase() === address?.toLowerCase()
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderAddress.toLowerCase() === address?.toLowerCase()
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {message.sentAt.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}