import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import './MainWindow.css'
import { HfInference } from "@huggingface/inference"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { FaUser, FaCopy, FaDownload, FaExpand, FaCompress } from 'react-icons/fa'
import { RiRobotFill } from 'react-icons/ri'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import ReactMarkdown from 'react-markdown'
import OpenAI from "openai"
import alvanLogo from '../assets/alvan.png'

interface Message {
  role: 'user' | 'ai'
  content: string
  type: 'text' | 'image'
  imageUrl?: string
  isGenerating?: boolean
}

interface IdeogramResponse {
  data: Array<{
    url: string;
    is_image_safe: boolean;
  }>;
}

export interface MainWindowRef {
  generateResponse: (message: string, model: string) => void
  hideLogo: () => void  // Add this line
}

const openai = new OpenAI({
  apiKey: "lm-studio",
  baseURL: "http://localhost:1234/v1",
  dangerouslyAllowBrowser: true
});

const IDEOGRAM_API_KEY = import.meta.env.VITE_IDEOGRAM_API_KEY;

const MainWindow = forwardRef<MainWindowRef, Record<string, never>>((props, ref) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null)
  const [showLogo, setShowLogo] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentResponse])

  const simulateStreaming = (text: string, callback: (chunk: string) => void) => {
    const words = text.split(' ');
    let i = 0;
    const intervalId = setInterval(() => {
      if (i < words.length) {
        callback(words[i] + ' ');
        i++;
      } else {
        clearInterval(intervalId);
      }
    }, 50);
  };

  const generateResponse = async (userMessage: string, model: string) => {
    if (showLogo) {
      setShowLogo(false)
    }
    setMessages(prev => [...prev, { role: 'user', content: userMessage, type: 'text' }])
    setCurrentResponse('')

    if (model === 'Alvan-IDEOGRAM') {
      if (!IDEOGRAM_API_KEY) {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: 'Error: Ideogram API key not found. Please add VITE_IDEOGRAM_API_KEY to your environment variables.', 
          type: 'text' 
        }]);
        return;
      }

      setMessages(prev => [...prev, { role: 'ai', content: '', type: 'image', isGenerating: true }])
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
        
        if (data.data?.[0]?.url) {
          // Fetch the image from the URL and create a blob URL
          const imageResponse = await fetch(data.data[0].url);
          if (!imageResponse.ok) {
            throw new Error('Failed to fetch generated image');
          }
          
          const imageBlob = await imageResponse.blob();
          const imageUrl = URL.createObjectURL(imageBlob);
          
          setMessages(prev => prev.map((msg, index) => 
            index === prev.length - 1 ? { ...msg, imageUrl, isGenerating: false } : msg
          ));
        } else {
          throw new Error('No image URL in response');
        }
      } catch (error) {
        console.error("Error generating image with Ideogram:", error);
        setMessages(prev => prev.map((msg, index) => 
          index === prev.length - 1 ? { 
            ...msg, 
            content: `Error generating image with Ideogram: ${error instanceof Error ? error.message : 'Unknown error'}`, 
            type: 'text', 
            isGenerating: false 
          } : msg
        ));
      }
    } else if (model === 'Alvan-IMAGE') {
      setMessages(prev => [...prev, { role: 'ai', content: '', type: 'image', isGenerating: true }])
      try {
        const imageBlob = await query({ "inputs": userMessage })
        const imageUrl = URL.createObjectURL(imageBlob)
        setMessages(prev => prev.map((msg, index) => 
          index === prev.length - 1 ? { ...msg, imageUrl, isGenerating: false } : msg
        ))
      } catch (error) {
        console.error("Error generating image:", error)
        setMessages(prev => prev.map((msg, index) => 
          index === prev.length - 1 ? { ...msg, content: 'Error generating image', type: 'text', isGenerating: false } : msg
        ))
      }
    } else if (model === 'AlvanLocal') {
      try {
        const response = await openai.chat.completions.create({
          model: "alvan-local",
          messages: [{ role: "user", content: userMessage }],
          max_tokens: 500,
        });
        const fullResponse = response.choices[0].message.content || '';
        
        // Simulate streaming for AlvanLocal
        simulateStreaming(fullResponse, (chunk) => {
          setCurrentResponse(prev => prev + chunk);
        });

        // After simulated streaming is complete, add the message to the list
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'ai', content: fullResponse, type: 'text' }]);
          setCurrentResponse('');
        }, fullResponse.split(' ').length * 50); // Adjust this timing to match the simulateStreaming function
      } catch (error) {
        console.error("Error generating response:", error)
        setMessages(prev => [...prev, { role: 'ai', content: 'Error generating response', type: 'text' }])
      }
    } else {
      const inference = new HfInference("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")

      try {
        let fullResponse = ''
        for await (const chunk of inference.chatCompletionStream({
          model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
          messages: [{ role: "user", content: userMessage }],
          max_tokens: 500,
        })) {
          const newContent = chunk.choices[0]?.delta?.content || ""
          fullResponse += newContent
          setCurrentResponse(fullResponse)
        }
        setMessages(prev => [...prev, { role: 'ai', content: fullResponse, type: 'text' }])
        setCurrentResponse('')
      } catch (error) {
        console.error("Error generating response:", error)
        setMessages(prev => [...prev, { role: 'ai', content: 'Error generating response', type: 'text' }])
      }
    }
  }

  const hideLogo = () => {
    setShowLogo(false)
  }

  useImperativeHandle(ref, () => ({
    generateResponse,
    hideLogo
  }))

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Code copied to clipboard')
    }, (err) => {
      console.error('Could not copy text: ', err)
    })
  }

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    event.currentTarget.classList.add('loaded');
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
          {message.isGenerating ? (
            <div className="grow-spinner-container">
              <div className="grow-spinner"></div>
            </div>
          ) : message.imageUrl ? (
            <div className="image-wrapper">
              <img 
                src={message.imageUrl} 
                alt="Generated" 
                className="generated-image" 
                onLoad={handleImageLoad}
              />
              <button 
                className="download-button" 
                onClick={() => handleDownload(message.imageUrl!)}
              >
                <FaDownload />
              </button>
              <button 
                className="fullscreen-button" 
                onClick={() => handleFullScreen(message.imageUrl!)}
              >
                <FaExpand />
              </button>
            </div>
          ) : (
            <div>Error generating image</div>
          )}
        </div>
      )
    }

    return (
      <ReactMarkdown
        components={{
          code({inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <div className="code-block">
                <div className="code-header">
                  <span>Code Example</span>
                  <button className="copy-button" onClick={() => copyToClipboard(String(children))}>
                    <FaCopy />
                  </button>
                </div>
                <SyntaxHighlighter
                  language={match[1]}
                  style={vscDarkPlus}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
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
    )
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
          <div key={index} className={`message ${message.role}`}>
            <div className="avatar-container">
              <div className="avatar">
                {message.role === 'user' ? <FaUser /> : <RiRobotFill />}
              </div>
            </div>
            <div className="content">{renderMessageContent(message)}</div>
          </div>
        ))}
        {currentResponse && (
          <div className="message ai">
            <div className="avatar-container">
              <div className="avatar">
                <RiRobotFill />
              </div>
            </div>
            <div className="content">{renderMessageContent({ role: 'ai', content: currentResponse, type: 'text' })}</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {fullScreenImage && (
        <div className="fullscreen-overlay" onClick={() => setFullScreenImage(null)}>
          <img src={fullScreenImage} alt="Full Screen" />
          <button className="close-fullscreen" onClick={() => setFullScreenImage(null)}>
            <FaCompress />
          </button>
        </div>
      )}
    </div>
  )
})

async function query(data: { inputs: string }) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
    {
      headers: {
        Authorization: "Bearer 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",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  const result = await response.blob();
  return result;
}

export default MainWindow
