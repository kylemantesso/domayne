'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, X, Send, Loader2, AlertTriangle, Check, ExternalLink } from 'lucide-react'
import { Client } from '@xmtp/browser-sdk'
import { Conversation } from '@xmtp/browser-sdk'
import type { SellerConfig } from '@/lib/xmtp-static'
import {
  discoverSellerConfig,
  resolveEnsToAddress,
  connectWallet,
  switchToSepolia,
  getCurrentChainId,
} from '@/lib/xmtp-static'

interface Message {
  id: string
  content: string
  senderAddress: string
  sentAt: Date
  isFromSelf: boolean
}

interface XMTPChatWidgetProps {
  domain: string
  className?: string
}

type ChatState = 'hidden' | 'connecting' | 'connected' | 'error' | 'no-seller'

export function XMTPChatWidget({ domain, className }: XMTPChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [chatState, setChatState] = useState<ChatState>('hidden')
  const [sellerConfig, setSellerConfig] = useState<SellerConfig | null>(null)
  const [resolvedSellerAddress, setResolvedSellerAddress] = useState<string | null>(null)
  const [currentAccount, setCurrentAccount] = useState<string | null>(null)
  const [xmtpClient, setXmtpClient] = useState<Client | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [networkBannerDismissed, setNetworkBannerDismissed] = useState(false)
  const [chainId, setChainId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializationRef = useRef(false)

  // Initialize seller config on mount
  useEffect(() => {
    const initializeSellerConfig = async () => {
      try {
        const config = await discoverSellerConfig(domain)
        setSellerConfig(config)

        if (!config || (!config.sellerAddress && !config.sellerEns)) {
          setChatState('no-seller')
          return
        }

        // Resolve ENS if needed
        if (config.sellerEns && !config.sellerAddress) {
          // For static implementation, we'll need to handle ENS resolution client-side
          // This would typically require an Ethereum provider
          setResolvedSellerAddress(config.sellerEns) // Placeholder - in real implementation, resolve this
        } else if (config.sellerAddress) {
          setResolvedSellerAddress(config.sellerAddress)
        }
      } catch (error) {
        console.error('Failed to initialize seller config:', error)
        setChatState('no-seller')
      }
    }

    initializeSellerConfig()
  }, [domain])

  // Check network status
  useEffect(() => {
    const checkNetwork = async () => {
      const currentChainId = await getCurrentChainId()
      setChainId(currentChainId)
    }

    checkNetwork()

    // Listen for network changes
    if (window.ethereum) {
      const handleChainChanged = (chainId: string) => {
        setChainId(chainId)
      }

      window.ethereum.on('chainChanged', handleChainChanged)
      return () => {
        window.ethereum?.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isOnSepolia = chainId === '0xaa36a7'
  const showNetworkBanner = chatState === 'connected' && !isOnSepolia && !networkBannerDismissed

  const handleChatClick = async () => {
    if (!sellerConfig || (!sellerConfig.sellerAddress && !sellerConfig.sellerEns)) {
      setChatState('no-seller')
      setIsOpen(true)
      return
    }

    setIsOpen(true)
    await initializeChat()
  }

  const initializeChat = async () => {
    if (initializationRef.current) return
    initializationRef.current = true

    try {
      setChatState('connecting')
      setError(null)

      // Connect wallet
      const account = await connectWallet()
      if (!account) {
        throw new Error('Failed to connect wallet')
      }
      setCurrentAccount(account)

      // Check if on Sepolia, but don't block if not
      const currentChainId = await getCurrentChainId()
      setChainId(currentChainId)

      // Initialize XMTP client
      setIsLoading(true)

      // Get signer from wallet
      const provider = new (window as any).ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      // Initialize XMTP client
      const client = await Client.create(signer, {
        env: 'production', // or 'dev' for testing
      })

      setXmtpClient(client)

      // Create or get existing conversation
      if (resolvedSellerAddress) {
        let conv = await client.conversations.newConversation(resolvedSellerAddress)
        setConversation(conv)

        // Load existing messages
        const existingMessages = await conv.messages()
        const formattedMessages: Message[] = existingMessages.map((msg, index) => ({
          id: `${msg.sent.getTime()}-${index}`,
          content: msg.content as string,
          senderAddress: msg.senderAddress,
          sentAt: msg.sent,
          isFromSelf: msg.senderAddress.toLowerCase() === account.toLowerCase(),
        }))

        setMessages(formattedMessages)
      }

      setChatState('connected')
    } catch (error: any) {
      console.error('Failed to initialize chat:', error)
      setError(error.message || 'Failed to initialize chat')
      setChatState('error')
    } finally {
      setIsLoading(false)
      initializationRef.current = false
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || !xmtpClient) return

    try {
      setIsLoading(true)

      // Send message
      await conversation.send(newMessage)

      // Add message to local state
      const message: Message = {
        id: `${Date.now()}`,
        content: newMessage,
        senderAddress: currentAccount!,
        sentAt: new Date(),
        isFromSelf: true,
      }

      setMessages(prev => [...prev, message])
      setNewMessage('')
    } catch (error: any) {
      console.error('Failed to send message:', error)
      setError('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchNetwork = async () => {
    try {
      const success = await switchToSepolia()
      if (success) {
        setNetworkBannerDismissed(true)
      }
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getSellerDisplayName = () => {
    if (!sellerConfig) return 'Seller'
    if (sellerConfig.sellerEns) return sellerConfig.sellerEns
    if (sellerConfig.sellerAddress) {
      return `${sellerConfig.sellerAddress.slice(0, 6)}...${sellerConfig.sellerAddress.slice(-4)}`
    }
    return 'Seller'
  }

  const renderChatButton = () => {
    if (chatState === 'no-seller' || !sellerConfig) {
      // Show fallback contact if available
      if (sellerConfig?.contactEmail) {
        return (
          <Button
            onClick={() => window.open(`mailto:${sellerConfig.contactEmail}?subject=Interested in ${domain}`, '_blank')}
            className={`gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 ${className}`}
          >
            <ExternalLink className="w-4 h-4" />
            Contact Seller
          </Button>
        )
      }
      return null
    }

    return (
      <Button
        onClick={handleChatClick}
        className={`gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 ${className}`}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MessageCircle className="w-4 h-4" />
        )}
        Chat with Seller
      </Button>
    )
  }

  const renderChatContent = () => {
    switch (chatState) {
      case 'connecting':
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connecting to Chat</h3>
            <p className="text-sm text-gray-600">
              Please connect your wallet and sign the message to start chatting
            </p>
          </div>
        )

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connection Failed</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={() => initializeChat()} size="sm">
              Try Again
            </Button>
          </div>
        )

      case 'no-seller':
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chat Unavailable</h3>
            <p className="text-sm text-gray-600 mb-4">
              The seller hasn't configured XMTP messaging for this domain.
            </p>
            {sellerConfig?.contactEmail && (
              <Button
                onClick={() =>
                  window.open(`mailto:${sellerConfig.contactEmail}?subject=Interested in ${domain}`, '_blank')
                }
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Email Instead
              </Button>
            )}
          </div>
        )

      case 'connected':
        return (
          <div className="flex flex-col h-96">
            {/* Network Banner */}
            {showNetworkBanner && (
              <div className="bg-yellow-50 border-b border-yellow-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Switch to Sepolia for optimal messaging
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSwitchNetwork}
                      className="text-yellow-800 border-yellow-300"
                    >
                      Switch Network
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setNetworkBannerDismissed(true)}
                      className="text-yellow-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{domain}</h3>
                  <p className="text-sm text-gray-600">
                    Chatting with {getSellerDisplayName()}
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Check className="w-3 h-3" />
                  Encrypted
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Say hi 👋</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isFromSelf ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isFromSelf
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.isFromSelf ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {message.sentAt.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isLoading}
                  size="sm"
                  className="px-3"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {renderChatButton()}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>XMTP Chat</DialogTitle>
          </DialogHeader>
          {renderChatContent()}
        </DialogContent>
      </Dialog>
    </>
  )
}