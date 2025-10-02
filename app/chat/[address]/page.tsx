'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Wallet, MessageCircle, Loader2, RefreshCw } from "lucide-react";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useWalletClient } from 'wagmi';
import { formatDistanceToNow } from 'date-fns';
import { Client, type Signer, type Dm, type DecodedMessage, type AsyncStreamProxy } from '@xmtp/browser-sdk';
import { toBytes } from 'viem';

// Conversation list item component
function ConversationItem({ 
  conversation, 
  isActive, 
  onClick 
}: { 
  conversation: Dm; 
  isActive: boolean; 
  onClick: () => void;
}) {
  const [lastMessage, setLastMessage] = useState<DecodedMessage | null>(null);
  const [peerInboxId, setPeerInboxId] = useState<string>('');

  useEffect(() => {
    // Load the last message and peer info
    const load = async () => {
      try {
        const msg = await conversation.lastMessage();
        setLastMessage(msg || null);
        const peerId = await conversation.peerInboxId();
        setPeerInboxId(peerId);
      } catch (err) {
        console.error('Error loading conversation info:', err);
      }
    };
    load();
  }, [conversation]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (ns: bigint) => {
    const date = new Date(Number(ns / BigInt(1000000)));
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        isActive ? 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-600' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <p className="font-medium text-sm">{formatAddress(peerInboxId)}</p>
        {lastMessage && (
          <p className="text-xs text-muted-foreground">
            {formatTime(lastMessage.sentAtNs)}
          </p>
        )}
      </div>
      {lastMessage && (
        <p className="text-sm text-muted-foreground truncate">
          {String(lastMessage.content)}
        </p>
      )}
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const recipientAddress = (params.address as string).toLowerCase();
  
  // Wallet connection
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  // XMTP state
  const [client, setClient] = useState<Client | null>(null);
  const [conversation, setConversation] = useState<Dm | null>(null);
  const [allConversations, setAllConversations] = useState<Dm[]>([]);
  const [messages, setMessages] = useState<DecodedMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<AsyncStreamProxy<DecodedMessage> | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize XMTP client when wallet is connected
  useEffect(() => {
    if (isConnected && address && walletClient) {
      initializeXMTP();
    } else {
      setClient(null);
      setConversation(null);
      setMessages([]);
    }
  }, [isConnected, address, walletClient]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stream messages when conversation is ready
  useEffect(() => {
    if (conversation && client) {
      streamMessages();
    }
    
    // Cleanup stream when conversation changes or component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.end();
        streamRef.current = null;
      }
    };
  }, [conversation, client]); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeXMTP = async () => {
    if (!address || !walletClient) return;

    setIsLoadingClient(true);
    setError(null);

    try {
      console.log('Initializing XMTP V3 client for:', address);

      // V3 Signer using viem/wagmi
      const signer: Signer = {
        type: 'EOA',
        getIdentifier: () => ({
          identifier: address.toLowerCase(),
          identifierKind: 'Ethereum',
        }),
        signMessage: async (message: string) => {
          const sig = await walletClient.signMessage({
            account: address as `0x${string}`,
            message,
          });
          return toBytes(sig);
        },
      };

      // Create XMTP V3 client
      const xmtp = await Client.create(signer, {
        env: 'production',
        appVersion: 'domayne/1.0.0',
      });

      setClient(xmtp);
      console.log('XMTP V3 client created successfully');

      // Load all existing conversations
      await loadAllConversations(xmtp);

      // Create or get conversation with recipient
      await setupConversation(xmtp);
    } catch (err) {
      console.error('Failed to initialize XMTP:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize XMTP client');
    } finally {
      setIsLoadingClient(false);
    }
  };

  const loadAllConversations = async (xmtpClient: Client) => {
    setIsLoadingConversations(true);
    try {
      console.log('Syncing conversations...');
      // Sync conversations to get latest from network
      await xmtpClient.conversations.sync();
      console.log('Conversations synced, loading list...');
      
      const convos = await xmtpClient.conversations.listDms();
      setAllConversations(convos);
      console.log(`Loaded ${convos.length} conversations`);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const setupConversation = async (xmtpClient: Client) => {
    try {
      console.log('Setting up conversation with:', recipientAddress);

      // Check if recipient can receive messages (V3 API)
      const identifiers = [{ 
        identifier: recipientAddress, 
        identifierKind: 'Ethereum' as const 
      }];
      
      const canMessageMap = await Client.canMessage(identifiers);
      if (!canMessageMap.get(recipientAddress)) {
        setError('This address has not enabled XMTP messaging yet. They need to connect with an XMTP-compatible app first.');
        return;
      }

      // Create DM directly with identifier (easier than getting inbox ID first)
      const conv = await xmtpClient.conversations.newDmWithIdentifier(identifiers[0]);
      setConversation(conv);
      console.log('Conversation established');

      // Load existing messages
      await loadMessages(conv);
    } catch (err) {
      console.error('Failed to setup conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup conversation');
    }
  };

  const loadMessages = async (conv: Dm) => {
    setIsLoadingMessages(true);
    try {
      console.log('Syncing messages for conversation...');
      // Sync messages to get latest from network
      await conv.sync();
      console.log('Messages synced, loading...');
      
      const msgs = await conv.messages();
      setMessages(msgs);
      console.log(`Loaded ${msgs.length} messages`);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const streamMessages = async () => {
    if (!conversation) return;

    // Clean up any existing stream before creating a new one
    if (streamRef.current) {
      await streamRef.current.end();
      streamRef.current = null;
    }

    try {
      const stream = await conversation.stream({
        onValue: (message: DecodedMessage) => {
          setMessages((prev) => [...prev, message]);
        },
        onError: (err: Error) => {
          console.error('Error streaming messages:', err);
        },
      });
      
      // Store the stream for cleanup
      streamRef.current = stream;
      console.log('Message stream established');
    } catch (err) {
      console.error('Error setting up message stream:', err);
    }
  };

  const sendMessage = async () => {
    if (!conversation || !messageInput.trim()) return;

    setIsSending(true);
    try {
      await conversation.send(messageInput);
      setMessageInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleConnectWallet = () => {
    const connector = connectors.find(c => c.name === 'MetaMask') || connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {isConnected && address ? (
              <>
                <Badge variant="secondary" className="gap-1">
                  <Wallet className="w-3 h-3" />
                  {formatAddress(address)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnect()}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="gap-2"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>

        {/* Main Chat Layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Conversations List - Left Sidebar */}
          <Card className="col-span-12 md:col-span-4 shadow-xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Conversations
                </CardTitle>
                {client && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadAllConversations(client)}
                    disabled={isLoadingConversations}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingConversations ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : allConversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No conversations yet. Start chatting to see them here.
                  </div>
                ) : (
                  <div className="divide-y">
                    {allConversations.map((conv, idx) => (
                      <ConversationItem
                        key={idx}
                        conversation={conv}
                        isActive={conv.id === conversation?.id}
                        onClick={() => {
                          setConversation(conv);
                          loadMessages(conv);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area - Right Side */}
          <Card className="col-span-12 md:col-span-8 shadow-xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Chat with Seller
                    </CardTitle>
                    {conversation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadMessages(conversation)}
                        disabled={isLoadingMessages}
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recipient: {formatAddress(recipientAddress)}
                  </p>
                </div>
                <Badge variant="outline" className="gap-1">
                  <div className={`w-2 h-2 rounded-full ${conversation ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  {conversation ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
            {!isConnected ? (
              // Not connected state
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  To send messages via XMTP, please connect your Ethereum wallet. Messages are encrypted end-to-end for your privacy.
                </p>
                <Button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="gap-2"
                  size="lg"
                >
                  <Wallet className="w-4 h-4" />
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              </div>
            ) : isLoadingClient ? (
              // Loading XMTP client
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Initializing XMTP</h3>
                <p className="text-muted-foreground max-w-md">
                  Setting up secure messaging... You may need to sign a message to verify your identity.
                </p>
              </div>
            ) : error ? (
              // Error state
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">Connection Error</h3>
                <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
                <Button
                  onClick={() => {
                    setError(null);
                    initializeXMTP();
                  }}
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              // Chat interface
              <>
                {/* Messages area */}
                <div className="h-[500px] overflow-y-auto p-4 space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message, idx) => {
                      // Check if this message is from the current user
                      const isSender = message.senderInboxId === client?.inboxId;
                      // Convert nanoseconds to Date
                      const sentDate = new Date(Number(message.sentAtNs / BigInt(1000000)));
                      
                      return (
                        <div
                          key={idx}
                          className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isSender
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            <p className="break-words">{String(message.content)}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isSender
                                  ? 'text-blue-100'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {formatDistanceToNow(sentDate, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      disabled={isSending || !conversation}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={isSending || !messageInput.trim() || !conversation}
                      className="gap-2"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              </>
            )}
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mt-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  About XMTP Messaging
                </p>
                <ul className="text-blue-700 dark:text-blue-200 space-y-1 text-xs">
                  <li>• End-to-end encrypted messages via XMTP protocol</li>
                  <li>• Messages are stored on decentralized XMTP network</li>
                  <li>• Works with any wallet that supports XMTP</li>
                  <li>• No central server - truly peer-to-peer</li>
                  <li>• Your wallet signature is used for authentication</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

