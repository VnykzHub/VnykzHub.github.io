import React, { useState } from 'react';
import '../styles/Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, { text: input, user: true }]);
      getAIResponse(input);
      setInput('');
    }
  };

  const getAIResponse = (userInput) => {
    // Simple AI-like response system
    const lowercaseInput = userInput.toLowerCase();
    let response = "I'm not sure how to respond to that. Can you please rephrase your question?";

    if (lowercaseInput.includes('hello') || lowercaseInput.includes('hi')) {
      response = "Hello! How can I assist you today?";
    } else if (lowercaseInput.includes('experience')) {
      response = "Vinayak has extensive experience in AI and machine learning, including work at Cognizant and Samsung R&D.";
    } else if (lowercaseInput.includes('skills')) {
      response = "Vinayak's key skills include Python, JavaScript, AI/ML technologies, and cloud platforms like Azure and AWS.";
    } else if (lowercaseInput.includes('education')) {
      response = "Vinayak holds a B.Tech in Computer Science from SRM University and is currently pursuing a Master's in Data Science.";
    } else if (lowercaseInput.includes('contact')) {
      response = "You can contact Vinayak via email at vinayak.k.mathur@gmail.com or through his LinkedIn profile.";
    }

    setTimeout(() => {
      setMessages(prevMessages => [...prevMessages, { text: response, user: false }]);
    }, 1000);
  };

  return (
    <div className="chatbot">
      <button className="chat-toggle" onClick={toggleChat}>
        {isOpen ? 'Close Chat' : 'Chat with AI'}
      </button>
      {isOpen && (
        <div className="chat-window">
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.user ? 'user' : 'bot'}`}>
                {message.text}
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;