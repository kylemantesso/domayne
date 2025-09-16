'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWalletClient } from 'wagmi'

interface XMTPMessage {
  content: string
  senderAddress: string
  sentAt: Date
}

export function useXMTP() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()

  const [xmtpClient, setXmtpClient] = useState<any>(null)
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<XMTPMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize XMTP client
  const initializeXMTP = async () => {
    if (!walletClient || !address || !window.XMTP) {
      setError('Wallet not connected or XMTP SDK not loaded')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Initializing XMTP client...')

      // Create XMTP client
      const client = await window.XMTP.Client.create(walletClient, {
        env: 'production' // or 'dev' for testing
      })

      setXmtpClient(client)
      console.log('XMTP client initialized successfully')

    } catch (err) {
      console.error('XMTP initialization failed:', err)
      setError('Failed to initialize XMTP client')
    } finally {
      setIsLoading(false)
    }
  }

  // Start conversation with seller
  const startConversation = async (sellerAddress: string) => {
    if (!xmtpClient) {
      await initializeXMTP()
      return
    }

    setIsLoading(true)
    try {
      console.log('Starting conversation with:', sellerAddress)

      const newConversation = await xmtpClient.conversations.newConversation(sellerAddress)
      setConversation(newConversation)

      // Load existing messages
      const existingMessages = await newConversation.messages()
      setMessages(existingMessages.map((msg: any) => ({
        content: msg.content,
        senderAddress: msg.senderAddress,
        sentAt: msg.sent
      })))

      console.log('Conversation started successfully')

    } catch (err) {
      console.error('Failed to start conversation:', err)
      setError('Failed to start conversation')
    } finally {
      setIsLoading(false)
    }
  }

  // Send message
  const sendMessage = async (content: string) => {
    if (!conversation) {
      setError('No active conversation')
      return
    }

    try {
      console.log('Sending message:', content)
      await conversation.send(content)

      // Add message to local state
      const newMessage: XMTPMessage = {
        content,
        senderAddress: address!,
        sentAt: new Date()
      }
      setMessages(prev => [...prev, newMessage])

    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Failed to send message')
    }
  }

  // Listen for new messages
  useEffect(() => {
    if (!conversation) return

    const streamMessages = async () => {
      for await (const message of await conversation.streamMessages()) {
        if (message.senderAddress.toLowerCase() !== address?.toLowerCase()) {
          const newMessage: XMTPMessage = {
            content: message.content,
            senderAddress: message.senderAddress,
            sentAt: message.sent
          }
          setMessages(prev => [...prev, newMessage])
        }
      }
    }

    streamMessages().catch(console.error)
  }, [conversation, address])

  return {
    xmtpClient,
    conversation,
    messages,
    isLoading,
    error,
    isConnected: !!xmtpClient,
    initializeXMTP,
    startConversation,
    sendMessage
  }
}