import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import './MainWindow.css'
import { HfInference } from "@huggingface/inference"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { FaUser, FaCopy, FaDownload, FaExpand, FaCompress, FaCheck } from 'react-icons/fa'
import { RiRobotFill } from 'react-icons/ri'
import { SiOpenai } from 'react-icons/si'
import { BsFillPersonFill, BsStars } from 'react-icons/bs'
import ReactMarkdown from 'react-markdown'
import alvanLogo from '../assets/alvan.png'
import { apiService } from '../services/api'

interface Message {
  role: 'user' | 'ai'
  content: string
  type: 'text' | 'image'
  imageUrl?: string
  isGenerating?: boolean
  timestamp?: string
}

interface ApiMessage {
  role: 'user' | 'ai' | 'assistant'
  content: string
}

interface IdeogramResponse {
  data: Array<{
    url: string;
    is_image_safe: boolean;
  }>;
}

export interface MainWindowRef {
  generateResponse: (message: string, command?: string) => void
  hideLogo: () => void
}

interface MainWindowProps {
  model?: string
}

const MainWindow = forwardRef<MainWindowRef, MainWindowProps>((props, ref) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null)
  const [showLogo, setShowLogo] = useState(true)
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null)
  const [debouncedScroll] = useState(() => {
    let timeoutId: NodeJS.Timeout
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(scrollToBottom, 100)
    }
  })

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const behavior = document.body.clientWidth <= 768 ? 'auto' : 'smooth'
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' })
    }
  }

  useEffect(() => {
    if (messages.length > 0 || currentResponse) {
      setTimeout(scrollToBottom, 100)
    }
  }, [messages.length, currentResponse])

  const generateResponse = async (userMessage: string, command?: string) => {
    if (showLogo) {
      setShowLogo(false)
    }
    
    const timestamp = new Date().toLocaleTimeString()
    const newUserMessage: Message = { role: 'user', content: userMessage, type: 'text', timestamp }
    setMessages(prev => [...prev, newUserMessage])
    setCurrentResponse('')

    try {
      // Handle image generation commands
      if (command === '/image' || command === '/img') {
        const aiTimestamp = new Date().toLocaleTimeString()
        setMessages(prev => [...prev, { role: 'ai', content: '', type: 'image', isGenerating: true, timestamp: aiTimestamp }])
        
        const inference = new HfInference("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")
        const imageBlob = await inference.textToImage({
          inputs: userMessage,
          model: "stabilityai/stable-diffusion-2",
        })
        const imageUrl = URL.createObjectURL(imageBlob)
        setMessages(prev => prev.map((msg, index) => 
          index === prev.length - 1 ? { ...msg, imageUrl, isGenerating: false } : msg
        ))
      } 
      else if (command === '/imagine' || command === '/i') {
        const aiTimestamp = new Date().toLocaleTimeString()
        setIsImageLoaded(false); // Reset image loaded state
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: '', 
          type: 'image', 
          isGenerating: true, 
          timestamp: aiTimestamp 
        }])
        
        try {
          const response = await fetch('http://localhost:3001/api/ideogram/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image_request: {
                prompt: userMessage,
                aspect_ratio: "ASPECT_10_16",
                model: "V_2",
                magic_prompt_option: "AUTO"
              }
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data: IdeogramResponse = await response.json();
          console.log('Ideogram response:', data);
          
          if (!data.data?.[0]?.url) {
            throw new Error('No image URL in response');
          }

          // Set the image URL and keep isGenerating true until image loads
          setMessages(prev => prev.map((msg, index) => 
            index === prev.length - 1 ? { 
              ...msg, 
              imageUrl: data.data[0].url,
              isGenerating: true
            } : msg
          ));

        } catch (error) {
          console.error("Error generating image:", error);
          setMessages(prev => prev.map((msg, index) => 
            index === prev.length - 1 ? { 
              ...msg, 
              content: `Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`, 
              type: 'text', 
              isGenerating: false 
            } : msg
          ));
        }
      } 
      else {
        // Handle chat messages
        // Convert previous messages to the format expected by the API
        const conversationHistory: ApiMessage[] = messages.map(msg => ({
          role: msg.role === 'ai' ? 'assistant' : msg.role,
          content: msg.content
        }))

        // Add the new user message
        conversationHistory.push({
          role: 'user',
          content: userMessage
        })

        // Use the selected model from props or a default model
        const selectedModel = props.model || 'gpt-3.5-turbo'
        const stream = await apiService.generateChatCompletion(conversationHistory, selectedModel)
        
        if (!stream) {
          throw new Error('No response stream')
        }

        const reader = stream.getReader()
        let fullResponse = ''
        const aiTimestamp = new Date().toLocaleTimeString()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const text = new TextDecoder().decode(value)
            const lines = text.split('\n')
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(5).trim()
                if (data === '[DONE]') continue
                
                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices[0]?.delta?.content || ''
                  if (content) {
                    fullResponse += content
                    setCurrentResponse(fullResponse)
                    // Debounce the scroll to prevent glitches
                    debouncedScroll()
                  }
                } catch (e) {
                  console.debug('Skipping unparseable SSE data:', data)
                }
              }
            }
          }

          // Only add the final message once streaming is complete
          const newAiMessage: Message = { 
            role: 'ai', 
            content: fullResponse, 
            type: 'text', 
            timestamp: aiTimestamp 
          }
          setMessages(prev => [...prev, newAiMessage])
          setCurrentResponse('')
          // Ensure final scroll after message is added
          setTimeout(scrollToBottom, 100)

        } catch (error) {
          console.error("Error in stream processing:", error)
          const errorMessage: Message = { 
            role: 'ai', 
            content: `Error processing response: ${error instanceof Error ? error.message : 'Unknown error'}`, 
            type: 'text',
            timestamp: new Date().toLocaleTimeString()
          }
          setMessages(prev => [...prev, errorMessage])
        }
      }
    } catch (error) {
      console.error("Error generating response:", error)
      const errorTimestamp = new Date().toLocaleTimeString()
      const errorMessage: Message = { 
        role: 'ai', 
        content: `Error generating response: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'text',
        timestamp: errorTimestamp
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const hideLogo = () => {
    setShowLogo(false)
  }

  useImperativeHandle(ref, () => ({
    generateResponse,
    hideLogo
  }))

  const copyToClipboard = (text: string, index: string | number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates(prev => ({ ...prev, [index]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [index]: false }))
      }, 2000)
    }, (err) => {
      console.error('Could not copy text: ', err)
    })
  }

  const handleImageLoad = () => {
    setIsImageLoaded(true);
    setMessages(prev => prev.map((msg, index) => 
      index === prev.length - 1 ? {
        ...msg,
        isGenerating: false
      } : msg
    ));
  }

  const toggleFullscreen = (imageUrl: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreenImageUrl(imageUrl);
    setIsFullscreen(!isFullscreen);
  }

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = 'generated-image.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFullScreen = (imageUrl: string) => {
    setFullScreenImage(imageUrl)
  }

  const renderMessageContent = (message: Message) => {
    if (message.type === 'image') {
      return (
        <div className="image-container">
          <div className="image-wrapper">
            {message.isGenerating && !isImageLoaded && (
              <div className="grow-spinner-container">
                <div className="grow-spinner" />
              </div>
            )}
            {message.imageUrl && (
              <img
                src={message.imageUrl}
                alt="Generated"
                className={`generated-image ${isImageLoaded ? 'loaded' : ''}`}
                onClick={toggleFullscreen(message.imageUrl)}
                onLoad={handleImageLoad}
              />
            )}
          </div>
        </div>
      )
    }

    return message.content
  }

  return (
    <div className="main-window">
      {showLogo && (
        <div className="logo-overlay">
          <img src={alvanLogo} alt="Alvan Logo" className="alvan-logo" />
        </div>
      )}
      <div className="messages-container">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.role}`}
            data-time={message.timestamp}
          >
            <div className="avatar-container">
              <div className="avatar">
                {message.role === 'user' ? (
                  <div className="user-avatar">
                    <BsFillPersonFill />
                    <div className="avatar-glow" />
                  </div>
                ) : (
                  <div className="ai-avatar">
                    <BsStars className="stars-icon" />
                    <SiOpenai className="openai-icon" />
                  </div>
                )}
              </div>
            </div>
            <div className="content">
              {message.type === 'image' ? (
                renderMessageContent(message)
              ) : (
                <ReactMarkdown
                  components={{
                    code({inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '')
                      const language = match ? match[1] : ''
                      return !inline && match ? (
                        <div className="code-block">
                          <div className="code-header">
                            <span>{language.toUpperCase()}</span>
                            <button 
                              className={`copy-button ${copiedStates[message.timestamp || index] ? 'copied' : ''}`}
                              onClick={() => copyToClipboard(String(children), message.timestamp || index)}
                            >
                              {copiedStates[message.timestamp || index] ? <FaCheck /> : <FaCopy />}
                            </button>
                          </div>
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={language}
                            showLineNumbers={true}
                            wrapLines={true}
                            customStyle={{
                              margin: 0,
                              background: '#1a1a1a',
                              padding: '16px',
                            }}
                          >
                            {String(children).trim()}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {currentResponse && (
          <div className="message ai" data-time={new Date().toLocaleTimeString()}>
            <div className="avatar-container">
              <div className="avatar">
                <RiRobotFill />
              </div>
            </div>
            <div className="content">
              <ReactMarkdown
                components={{
                  code({inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <div className="code-block">
                        <div className="code-header">
                          <span>{match[1].toUpperCase()}</span>
                          <button 
                            className="copy-button"
                            onClick={() => copyToClipboard(String(children), -1)}
                          >
                            <FaCopy />
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          showLineNumbers={true}
                          wrapLines={true}
                          customStyle={{
                            margin: 0,
                            background: '#1a1a1a',
                            padding: '16px',
                          }}
                        >
                          {String(children).trim()}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {currentResponse}
              </ReactMarkdown>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {fullScreenImage && (
        <div className="fullscreen-overlay" onClick={() => setFullScreenImage(null)}>
          <img src={fullScreenImage} alt="Full Screen" onClick={(e) => e.stopPropagation()} />
          <button className="close-fullscreen" onClick={() => setFullScreenImage(null)}>
            <FaCompress />
          </button>
        </div>
      )}
      {isFullscreen && fullscreenImageUrl && (
        <div className="fullscreen-overlay" onClick={() => setIsFullscreen(false)}>
          <img 
            src={fullscreenImageUrl} 
            alt="Generated" 
            onClick={(e) => e.stopPropagation()} 
          />
          <button 
            className="close-fullscreen"
            onClick={() => setIsFullscreen(false)}
            aria-label="Close fullscreen"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
})

export default MainWindow