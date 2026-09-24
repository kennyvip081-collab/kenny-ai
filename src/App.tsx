import {
  useEffect,
  useRef,
  useState,
} from 'react'
import './App.css'

type Message = {
  id: number
  text: string
  sender: 'user' | 'ai'
  image?: string
  generatedImage?: string
}

type Chat = {
  id: number
  title: string
  messages: Message[]
}

function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] =
    useState<Message[]>([])
  const [isThinking, setIsThinking] =
    useState(false)
  const [
    isGeneratingImage,
    setIsGeneratingImage,
  ] = useState(false)

  const [openMenuId, setOpenMenuId] =
    useState<number | null>(null)

  const [showSettings, setShowSettings] =
    useState(false)

  const [
    showMobileSidebar,
    setShowMobileSidebar,
  ] = useState(false)

  const [attachedImage, setAttachedImage] =
    useState<string | null>(null)

  const messagesContainerRef =
    useRef<HTMLElement | null>(null)

  const inputRef =
    useRef<HTMLInputElement | null>(null)

  const shouldAutoScrollRef =
    useRef(true)

  const [darkMode, setDarkMode] =
    useState<boolean>(() => {
      const savedTheme =
        localStorage.getItem(
          'kenny-ai-theme'
        )

      return savedTheme !== 'light'
    })

  const [chats, setChats] =
    useState<Chat[]>(() => {
      try {
        const savedChats =
          localStorage.getItem(
            'kenny-ai-chats'
          )

        return savedChats
          ? JSON.parse(savedChats)
          : []
      } catch {
        return []
      }
    })

  const [activeChatId, setActiveChatId] =
    useState<number | null>(() => {
      try {
        const savedActiveChat =
          localStorage.getItem(
            'kenny-ai-active-chat'
          )

        return savedActiveChat
          ? Number(savedActiveChat)
          : null
      } catch {
        return null
      }
    })

  useEffect(() => {
    localStorage.setItem(
      'kenny-ai-chats',
      JSON.stringify(chats)
    )
  }, [chats])

  useEffect(() => {
    if (activeChatId !== null) {
      localStorage.setItem(
        'kenny-ai-active-chat',
        activeChatId.toString()
      )
    } else {
      localStorage.removeItem(
        'kenny-ai-active-chat'
      )
    }
  }, [activeChatId])

  useEffect(() => {
    localStorage.setItem(
      'kenny-ai-theme',
      darkMode ? 'dark' : 'light'
    )
  }, [darkMode])

  const scrollToBottom = (
    behavior: ScrollBehavior = 'smooth'
  ) => {
    const container =
      messagesContainerRef.current

    if (!container) return

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    })
  }

  useEffect(() => {
    const container =
      messagesContainerRef.current

    if (!container) return

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight -
        container.scrollTop -
        container.clientHeight

      shouldAutoScrollRef.current =
        distanceFromBottom < 120
    }

    container.addEventListener(
      'scroll',
      handleScroll,
      { passive: true }
    )

    handleScroll()

    return () => {
      container.removeEventListener(
        'scroll',
        handleScroll
      )
    }
  }, [])

  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return
    }

    const container =
      messagesContainerRef.current

    if (!container) return

    const frame =
      window.requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'auto',
        })
      })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [
    messages,
    isThinking,
    isGeneratingImage,
  ])

  useEffect(() => {
    const handleResize = () => {
      if (
        shouldAutoScrollRef.current
      ) {
        window.requestAnimationFrame(() => {
          scrollToBottom('auto')
        })
      }
    }

    window.addEventListener(
      'resize',
      handleResize
    )

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      )
    }
  }, [])

  const toggleTheme = () => {
    setDarkMode((prev) => !prev)
  }

  const createNewChat = () => {
    if (
      isThinking ||
      isGeneratingImage
    ) {
      return
    }

    setMessages([])
    setInput('')
    setAttachedImage(null)
    setActiveChatId(null)
    setOpenMenuId(null)
    setShowSettings(false)
    setShowMobileSidebar(false)

    shouldAutoScrollRef.current = true

    window.setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const openChat = (chat: Chat) => {
    if (
      isThinking ||
      isGeneratingImage
    ) {
      return
    }

    setMessages(chat.messages)
    setActiveChatId(chat.id)
    setInput('')
    setAttachedImage(null)
    setOpenMenuId(null)
    setShowSettings(false)
    setShowMobileSidebar(false)

    shouldAutoScrollRef.current = true

    window.setTimeout(() => {
      scrollToBottom('auto')
    }, 100)
  }

  const deleteChat = (
    event: React.MouseEvent,
    chatId: number
  ) => {
    event.stopPropagation()

    setChats((prevChats) =>
      prevChats.filter(
        (chat) => chat.id !== chatId
      )
    )

    if (activeChatId === chatId) {
      setMessages([])
      setInput('')
      setAttachedImage(null)
      setActiveChatId(null)
      shouldAutoScrollRef.current = true
    }

    setOpenMenuId(null)
  }

  const renameChat = (
    chatId: number
  ) => {
    const chat = chats.find(
      (item) => item.id === chatId
    )

    if (!chat) return

    const newTitle = window.prompt(
      'Rename this chat:',
      chat.title
    )

    if (!newTitle?.trim()) return

    setChats((prevChats) =>
      prevChats.map((item) =>
        item.id === chatId
          ? {
              ...item,
              title: newTitle.trim(),
            }
          : item
      )
    )

    setOpenMenuId(null)
  }

  const clearAllChats = () => {
    if (
      isThinking ||
      isGeneratingImage
    ) {
      return
    }

    const confirmed =
      window.confirm(
        'Are you sure you want to delete all conversations? This cannot be undone.'
      )

    if (!confirmed) return

    setChats([])
    setMessages([])
    setActiveChatId(null)
    setInput('')
    setAttachedImage(null)
    setOpenMenuId(null)
    setShowMobileSidebar(false)

    shouldAutoScrollRef.current = true
  }

  const saveMessagesToChat = (
    chatId: number,
    updatedMessages: Message[]
  ) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages:
                updatedMessages,
            }
          : chat
      )
    )
  }

  const createChatIfNeeded = (
    userText: string,
    updatedMessages: Message[]
  ) => {
    if (activeChatId !== null) {
      saveMessagesToChat(
        activeChatId,
        updatedMessages
      )

      return activeChatId
    }

    const newChatId = Date.now()

    const chatTitle = userText
      ? userText
      : 'Image conversation'

    const newChat: Chat = {
      id: newChatId,
      title:
        chatTitle.length > 30
          ? chatTitle.substring(0, 30) +
            '...'
          : chatTitle,
      messages: updatedMessages,
    }

    setChats((prevChats) => [
      newChat,
      ...prevChats,
    ])

    setActiveChatId(newChatId)

    return newChatId
  }

  const generateImage = async (
    prompt: string,
    currentChatId: number
  ) => {
    try {
      setIsGeneratingImage(true)

      shouldAutoScrollRef.current = true

      console.log(
        'IMAGE GENERATION REQUEST DETECTED'
      )

      console.log(
        'Sending request to:',
        'https://kenny-ai-81co.onrender.com/api/generate-image'
      )

      const response = await fetch(
        'https://kenny-ai-81co.onrender.com/api/generate-image',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            prompt,
          }),
        }
      )

      const data =
        await response.json()

      console.log(
        'Image generation response:',
        response.status
      )

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Image generation failed.'
        )
      }

      if (!data.image) {
        throw new Error(
          'No generated image was returned.'
        )
      }

      const generatedImageMessage: Message =
        {
          id: Date.now() + 2,
          text:
            'Here is the image I generated for you:',
          sender: 'ai',
          generatedImage:
            data.image,
        }

      setMessages(
        (prevMessages) => {
          const updatedMessages = [
            ...prevMessages,
            generatedImageMessage,
          ]

          saveMessagesToChat(
            currentChatId,
            updatedMessages
          )

          return updatedMessages
        }
      )
    } catch (error) {
      console.error(
        'Image generation error:',
        error
      )

      const errorMessage: Message = {
        id: Date.now() + 2,
        text:
          error instanceof Error
            ? `I couldn't generate the image. ${error.message}`
            : 'I could not generate the image right now.',
        sender: 'ai',
      }

      setMessages(
        (prevMessages) => {
          const updatedMessages = [
            ...prevMessages,
            errorMessage,
          ]

          saveMessagesToChat(
            currentChatId,
            updatedMessages
          )

          return updatedMessages
        }
      )
    } finally {
      setIsGeneratingImage(false)
      shouldAutoScrollRef.current = true

      window.setTimeout(() => {
        scrollToBottom('smooth')
      }, 100)
    }
  }

  const sendMessage = async () => {
    if (
      (!input.trim() &&
        !attachedImage) ||
      isThinking ||
      isGeneratingImage
    ) {
      return
    }

    const userText = input.trim()
    const imageToSend = attachedImage

    const userMessage: Message = {
      id: Date.now(),
      text: userText,
      sender: 'user',
      image:
        imageToSend || undefined,
    }

    const updatedMessages = [
      ...messages,
      userMessage,
    ]

    setMessages(updatedMessages)
    setInput('')
    setAttachedImage(null)

    shouldAutoScrollRef.current = true

    const currentChatId =
      createChatIfNeeded(
        userText,
        updatedMessages
      )

    const generationWords =
      /\b(generate|create|make|draw|design|produce|render|imagine)\b/i

    const imageWords =
      /\b(image|picture|photo|illustration|artwork|portrait|logo|wallpaper|drawing|painting)\b/i

    const generationRequest =
      generationWords.test(userText) &&
      imageWords.test(userText)

    console.log(
      'User request:',
      userText
    )

    console.log(
      'Generation request:',
      generationRequest
    )

    if (
      generationRequest &&
      !imageToSend
    ) {
      await generateImage(
        userText,
        currentChatId
      )

      return
    }

    setIsThinking(true)

    shouldAutoScrollRef.current = true

    const aiMessageId =
      Date.now() + 1

    try {
      const conversationHistory =
        messages.map((message) => ({
          role:
            message.sender === 'user'
              ? 'user'
              : 'assistant',
          content:
            message.text ||
            (
              message.generatedImage
                ? '[Generated image]'
                : message.image
                ? '[User uploaded an image]'
                : ''
            ),
        }))

      const response = await fetch(
        'https://kenny-ai-81co.onrender.com/api/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            message: userText,
            image: imageToSend,
            history:
              conversationHistory,
          }),
        }
      )

      if (!response.ok) {
        const errorText =
          await response.text()

        let errorMessage =
          'Something went wrong'

        try {
          const errorData =
            JSON.parse(errorText)

          errorMessage =
            errorData.error ||
            errorMessage
        } catch {
          errorMessage =
            errorText ||
            errorMessage
        }

        throw new Error(
          errorMessage
        )
      }

      if (!response.body) {
        throw new Error(
          'No response stream received'
        )
      }

      setIsThinking(false)

      const messagesWithAi: Message[] =
        [
          ...updatedMessages,
          {
            id: aiMessageId,
            text: '',
            sender: 'ai',
          },
        ]

      setMessages(messagesWithAi)

      saveMessagesToChat(
        currentChatId,
        messagesWithAi
      )

      const reader =
        response.body.getReader()

      const decoder =
        new TextDecoder()

      let fullResponse = ''

      while (true) {
        const {
          value,
          done,
        } = await reader.read()

        if (done) break

        const chunk =
          decoder.decode(value, {
            stream: true,
          })

        if (!chunk) continue

        fullResponse += chunk

        setMessages((prev) =>
          prev.map((message) =>
            message.id ===
            aiMessageId
              ? {
                  ...message,
                  text: fullResponse,
                }
              : message
          )
        )

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id ===
            currentChatId
              ? {
                  ...chat,
                  messages:
                    chat.messages.map(
                      (message) =>
                        message.id ===
                        aiMessageId
                          ? {
                              ...message,
                              text: fullResponse,
                            }
                          : message
                    ),
                }
              : chat
          )
        )
      }

      const finalChunk =
        decoder.decode()

      if (finalChunk) {
        fullResponse += finalChunk
      }

      if (
        !fullResponse.trim()
      ) {
        fullResponse =
          'I received an empty response.'
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === aiMessageId
            ? {
                ...message,
                text: fullResponse,
              }
            : message
        )
      )

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages:
                  chat.messages.map(
                    (message) =>
                      message.id ===
                      aiMessageId
                        ? {
                            ...message,
                            text: fullResponse,
                          }
                        : message
                  ),
              }
            : chat
        )
      )

      shouldAutoScrollRef.current = true

      window.setTimeout(() => {
        scrollToBottom('smooth')
      }, 100)
    } catch (error) {
      console.error(
        'Kenny AI error:',
        error
      )

      setIsThinking(false)

      const errorMessage: Message = {
        id: aiMessageId,
        text:
          error instanceof Error
            ? `Sorry, I could not connect to Kenny AI right now. ${error.message}`
            : 'Sorry, I could not connect to Kenny AI right now. Make sure the AI server is running.',
        sender: 'ai',
      }

      setMessages((prev) => [
        ...prev,
        errorMessage,
      ])

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  errorMessage,
                ],
              }
            : chat
        )
      )

      shouldAutoScrollRef.current = true

      window.setTimeout(() => {
        scrollToBottom('smooth')
      }, 100)
    }
  }

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) return

    if (
      !file.type.startsWith('image/')
    ) {
      alert(
        'Please select an image file.'
      )

      event.target.value = ''

      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result

      if (
        typeof result === 'string'
      ) {
        setAttachedImage(result)

        window.setTimeout(() => {
          inputRef.current?.focus()
        }, 50)
      }
    }

    reader.readAsDataURL(file)

    event.target.value = ''
  }

  const removeAttachedImage = () => {
    setAttachedImage(null)
  }

  const copyResponse = async (
    text: string
  ) => {
    if (!text) return

    try {
      await navigator.clipboard.writeText(
        text
      )
    } catch (error) {
      console.error(
        'Could not copy response:',
        error
      )
    }
  }

  const downloadGeneratedImage = (
    image: string
  ) => {
    try {
      const link =
        document.createElement('a')

      link.href = image
      link.download = `kenny-ai-${Date.now()}.png`

      document.body.appendChild(link)

      link.click()

      document.body.removeChild(link)
    } catch (error) {
      console.error(
        'Could not download image:',
        error
      )
    }
  }

  const handleSuggestion = (
    suggestion: string
  ) => {
    setInput(suggestion)

    window.setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  return (
    <div
      className={`app ${
        darkMode
          ? 'dark'
          : 'light'
      }`}
      onClick={() => {
        setOpenMenuId(null)
      }}
    >
      {showMobileSidebar && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() =>
            setShowMobileSidebar(false)
          }
        />
      )}

      <aside
        className={`sidebar ${
          showMobileSidebar
            ? 'mobile-open'
            : ''
        }`}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-icon">
              K
            </div>

            <div>
              <h2>Kenny AI</h2>

              <span>
                AI Assistant
              </span>
            </div>

            <button
              className="mobile-sidebar-close"
              onClick={() =>
                setShowMobileSidebar(
                  false
                )
              }
              title="Close menu"
            >
              ×
            </button>
          </div>

          <button
            className="new-chat"
            onClick={(event) => {
              event.stopPropagation()
              createNewChat()
            }}
          >
            <span>＋</span>
            New Chat
          </button>
        </div>

        <div className="history">
          <p className="history-title">
            Recent Chats
          </p>

          {chats.length === 0 ? (
            <div className="chat-empty">
              No conversations yet
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item-wrapper ${
                  chat.id ===
                  activeChatId
                    ? 'active'
                    : ''
                }`}
              >
                <button
                  className="chat-item"
                  onClick={(
                    event
                  ) => {
                    event.stopPropagation()
                    openChat(chat)
                  }}
                >
                  {chat.title}
                </button>

                <button
                  className="chat-menu-button"
                  title="Chat options"
                  onClick={(
                    event
                  ) => {
                    event.stopPropagation()

                    setOpenMenuId(
                      openMenuId ===
                        chat.id
                        ? null
                        : chat.id
                    )
                  }}
                >
                  ⋮
                </button>

                {openMenuId ===
                  chat.id && (
                  <div
                    className="chat-menu"
                    onClick={(
                      event
                    ) =>
                      event.stopPropagation()
                    }
                  >
                    <button
                      onClick={() =>
                        renameChat(
                          chat.id
                        )
                      }
                    >
                      ✏️ Rename
                    </button>

                    <button
                      className="danger"
                      onClick={(
                        event
                      ) =>
                        deleteChat(
                          event,
                          chat.id
                        )
                      }
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="sidebar-bottom">
          <button
            onClick={toggleTheme}
          >
            {darkMode
              ? '☀️'
              : '🌙'}

            <span>
              {darkMode
                ? 'Light Mode'
                : 'Dark Mode'}
            </span>
          </button>

          <button
            onClick={(event) => {
              event.stopPropagation()
              setShowSettings(true)
              setShowMobileSidebar(false)
            }}
          >
            ⚙
            <span>Settings</span>
          </button>
        </div>
      </aside>

      <main className="chat-area">
        <header className="chat-header">
          <button
            className="mobile-menu-button"
            onClick={(event) => {
              event.stopPropagation()
              setShowMobileSidebar(true)
            }}
            title="Open menu"
          >
            ☰
          </button>

          <div className="chat-header-info">
            <h3>Kenny AI</h3>

            <span className="online-status">
              <span></span>
              Online
            </span>
          </div>

          <button
            className="mobile-new-chat"
            onClick={createNewChat}
            title="New chat"
          >
            ＋
          </button>
        </header>

        <section
          className="messages"
          ref={messagesContainerRef}
        >
          {messages.length === 0 &&
          !isThinking &&
          !isGeneratingImage ? (
            <div className="welcome">
              <div className="welcome-icon">
                ✨
              </div>

              <h1>
                How can I help you?
              </h1>

              <p>
                Ask me anything. I'm here
                to help you learn, create
                and solve problems.
              </p>

              <div className="suggestions">
                <button
                  onClick={() =>
                    handleSuggestion(
                      'Explain React to me'
                    )
                  }
                >
                  Explain React
                </button>

                <button
                  onClick={() =>
                    handleSuggestion(
                      'Help me write some code'
                    )
                  }
                >
                  Help me code
                </button>

                <button
                  onClick={() =>
                    handleSuggestion(
                      'Give me a project idea'
                    )
                  }
                >
                  Project ideas
                </button>
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map(
                (message) => (
                  <div
                    key={message.id}
                    className={`message ${message.sender}`}
                  >
                    {message.sender ===
                      'ai' && (
                      <div className="ai-avatar">
                        K
                      </div>
                    )}

                    <div className="message-wrapper">
                      {message.image && (
                        <div className="uploaded-image-container">
                          <img
                            src={
                              message.image
                            }
                            alt="Uploaded"
                            className="uploaded-image"
                          />
                        </div>
                      )}

                      {message.text && (
                        <div className="message-content">
                          {message.text}
                        </div>
                      )}

                      {message.generatedImage && (
                        <div className="generated-image-container">
                          <div className="generated-image-frame">
                            <img
                              src={
                                message.generatedImage
                              }
                              alt="AI generated"
                              className="generated-image"
                            />
                          </div>

                          <div className="generated-image-actions">
                            <button
                              type="button"
                              onClick={() =>
                                downloadGeneratedImage(
                                  message.generatedImage!
                                )
                              }
                            >
                              <span>
                                ↓
                              </span>
                              Download image
                            </button>
                          </div>
                        </div>
                      )}

                      {message.sender ===
                        'ai' && (
                        <div className="message-actions">
                          <button
                            title="Copy"
                            onClick={() =>
                              copyResponse(
                                message.text
                              )
                            }
                            disabled={
                              !message.text
                            }
                          >
                            ⧉
                          </button>

                          <button title="Good response">
                            👍
                          </button>

                          <button title="Bad response">
                            👎
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {isThinking && (
                <div className="message ai thinking-message">
                  <div className="ai-avatar">
                    K
                  </div>

                  <div className="thinking thinking-chat">
                    <div className="thinking-top">
                      <span>
                        Kenny AI is thinking
                      </span>

                      <span className="sparkle">
                        ✦
                      </span>
                    </div>

                    <div className="loader">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              {isGeneratingImage && (
                <div className="message ai thinking-message">
                  <div className="ai-avatar generating-avatar">
                    K
                  </div>

                  <div className="thinking thinking-image">
                    <div className="image-loader-icon">
                      ✨
                    </div>

                    <div className="image-loading-content">
                      <div className="thinking-top">
                        <span>
                          Kenny AI is creating
                          your image
                        </span>

                        <span className="sparkle">
                          ✦
                        </span>
                      </div>

                      <div className="image-loader">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>

                      <small>
                        This may take a
                        little while...
                      </small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="input-container">
          <div className="input-area">
            {attachedImage && (
              <div className="image-attachment">
                <img
                  src={attachedImage}
                  alt="Selected"
                />

                <button
                  type="button"
                  className="remove-image"
                  title="Remove image"
                  onClick={
                    removeAttachedImage
                  }
                >
                  ×
                </button>
              </div>
            )}

            <label
              className="upload-button"
              title="Upload image"
            >
              📎

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={
                  handleImageUpload
                }
              />
            </label>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey
                ) {
                  event.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={
                attachedImage
                  ? 'Describe what you want me to do with this image...'
                  : 'Ask Kenny AI anything...'
              }
            />

            <button
              className="send-button"
              onClick={sendMessage}
              disabled={
                (!input.trim() &&
                  !attachedImage) ||
                isThinking ||
                isGeneratingImage
              }
            >
              ➤
            </button>
          </div>

          <p className="input-note">
            Kenny AI can make mistakes.
            Check important information.
          </p>
        </div>
      </main>

      {showSettings && (
        <div
          className="settings-overlay"
          onClick={() =>
            setShowSettings(false)
          }
        >
          <div
            className="settings-panel"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="settings-header">
              <div>
                <h2>Settings</h2>

                <p>
                  Customize your Kenny AI
                  experience.
                </p>
              </div>

              <button
                className="settings-close"
                onClick={() =>
                  setShowSettings(false)
                }
              >
                ×
              </button>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">
                Appearance
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <strong>
                    Theme
                  </strong>

                  <span>
                    Choose how Kenny AI
                    looks.
                  </span>
                </div>

                <button
                  className="settings-action"
                  onClick={toggleTheme}
                >
                  {darkMode
                    ? '☀️ Light'
                    : '🌙 Dark'}
                </button>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">
                Conversations
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <strong>
                    Clear all chats
                  </strong>

                  <span>
                    Delete all saved
                    conversations.
                  </span>
                </div>

                <button
                  className="settings-action danger-action"
                  onClick={
                    clearAllChats
                  }
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">
                About
              </div>

              <div className="settings-about">
                <div className="settings-about-icon">
                  K
                </div>

                <div>
                  <strong>
                    Kenny AI
                  </strong>

                  <span>
                    Your personal AI
                    assistant for
                    learning, coding,
                    creating and solving
                    problems.
                  </span>

                  <small>
                    Version 1.0.0
                  </small>
                </div>
              </div>
            </div>

            <button
              className="settings-done"
              onClick={() =>
                setShowSettings(false)
              }
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App