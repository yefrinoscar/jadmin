/**
 * JAdmin Chat Widget
 * 
 * Embed this script in your website to add AI-powered support chat.
 * 
 * Usage:
 * <script src="https://your-jadmin-domain.com/chat-widget.js" data-api="https://your-jadmin-domain.com"></script>
 * 
 * Or initialize manually:
 * <script>
 *   window.JAdminChat = { apiUrl: 'https://your-jadmin-domain.com' };
 * </script>
 * <script src="https://your-jadmin-domain.com/chat-widget.js"></script>
 */

(function() {
  'use strict';

  // Get configuration
  const scriptTag = document.currentScript;
  const apiUrl = scriptTag?.getAttribute('data-api') || window.JAdminChat?.apiUrl || '';
  
  if (!apiUrl) {
    console.error('JAdmin Chat: API URL not configured. Add data-api attribute to script tag.');
    return;
  }

  // State
  let isOpen = false;
  let isStarted = false;
  let conversationId = null;
  let visitorInfo = {};
  let messages = [];
  let isLoading = false;

  // Styles
  const styles = `
    #jadmin-chat-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
    }

    #jadmin-chat-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    #jadmin-chat-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 25px rgba(99, 102, 241, 0.5);
    }

    #jadmin-chat-button svg {
      width: 28px;
      height: 28px;
      fill: white;
    }

    #jadmin-chat-window {
      display: none;
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 380px;
      height: 550px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      flex-direction: column;
    }

    #jadmin-chat-window.open {
      display: flex;
    }

    #jadmin-chat-header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    #jadmin-chat-header-avatar {
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #jadmin-chat-header-avatar svg {
      width: 24px;
      height: 24px;
      fill: white;
    }

    #jadmin-chat-header-info h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    #jadmin-chat-header-info p {
      margin: 4px 0 0;
      font-size: 12px;
      opacity: 0.9;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    #jadmin-chat-header-info p::before {
      content: '';
      width: 8px;
      height: 8px;
      background: #34d399;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    #jadmin-chat-close {
      margin-left: auto;
      background: rgba(255,255,255,0.2);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    #jadmin-chat-close:hover {
      background: rgba(255,255,255,0.3);
    }

    #jadmin-chat-close svg {
      width: 18px;
      height: 18px;
      stroke: white;
      fill: none;
    }

    #jadmin-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f8fafc;
    }

    .jadmin-message {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .jadmin-message.visitor {
      flex-direction: row-reverse;
    }

    .jadmin-message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .jadmin-message.ai .jadmin-message-avatar {
      background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
    }

    .jadmin-message.visitor .jadmin-message-avatar {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    }

    .jadmin-message.agent .jadmin-message-avatar {
      background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
    }

    .jadmin-message-avatar svg {
      width: 18px;
      height: 18px;
      fill: white;
    }

    .jadmin-message-content {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
    }

    .jadmin-message.ai .jadmin-message-content {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px 16px 16px 4px;
    }

    .jadmin-message.visitor .jadmin-message-content {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      border-radius: 16px 16px 4px 16px;
    }

    .jadmin-message.agent .jadmin-message-content {
      background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
      color: white;
      border-radius: 16px 16px 16px 4px;
    }

    .jadmin-message-time {
      font-size: 11px;
      opacity: 0.6;
      margin-top: 4px;
    }

    .jadmin-typing {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      width: fit-content;
    }

    .jadmin-typing span {
      width: 8px;
      height: 8px;
      background: #94a3b8;
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;
    }

    .jadmin-typing span:nth-child(2) { animation-delay: 0.2s; }
    .jadmin-typing span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    #jadmin-chat-form-container {
      padding: 16px;
      background: white;
      border-top: 1px solid #e2e8f0;
    }

    #jadmin-chat-start-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    #jadmin-chat-start-form h4 {
      margin: 0;
      font-size: 15px;
      color: #1e293b;
    }

    #jadmin-chat-start-form input {
      width: 100%;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    #jadmin-chat-start-form input:focus {
      outline: none;
      border-color: #6366f1;
    }

    #jadmin-chat-start-form button {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    #jadmin-chat-start-form button:hover {
      opacity: 0.9;
    }

    #jadmin-chat-input-form {
      display: flex;
      gap: 8px;
    }

    #jadmin-chat-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    #jadmin-chat-input:focus {
      outline: none;
      border-color: #6366f1;
    }

    #jadmin-chat-send {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;
    }

    #jadmin-chat-send:hover {
      opacity: 0.9;
    }

    #jadmin-chat-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    #jadmin-chat-send svg {
      width: 20px;
      height: 20px;
      fill: white;
    }

    #jadmin-chat-powered {
      text-align: center;
      padding: 8px;
      font-size: 11px;
      color: #94a3b8;
      background: #f8fafc;
    }

    @media (max-width: 480px) {
      #jadmin-chat-window {
        width: calc(100vw - 40px);
        height: calc(100vh - 100px);
        bottom: 70px;
        right: 0;
      }
    }
  `;

  // Icons
  const icons = {
    chat: '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>',
    close: '<svg viewBox="0 0 24 24" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    bot: '<svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5z"/></svg>',
    user: '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
    agent: '<svg viewBox="0 0 24 24"><path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/></svg>'
  };

  // Create widget HTML
  function createWidget() {
    const widget = document.createElement('div');
    widget.id = 'jadmin-chat-widget';
    widget.innerHTML = `
      <button id="jadmin-chat-button" aria-label="Abrir chat de soporte">
        ${icons.chat}
      </button>
      <div id="jadmin-chat-window">
        <div id="jadmin-chat-header">
          <div id="jadmin-chat-header-avatar">${icons.bot}</div>
          <div id="jadmin-chat-header-info">
            <h3>Soporte</h3>
            <p>En línea</p>
          </div>
          <button id="jadmin-chat-close" aria-label="Cerrar chat">${icons.close}</button>
        </div>
        <div id="jadmin-chat-messages"></div>
        <div id="jadmin-chat-form-container"></div>
        <div id="jadmin-chat-powered">Powered by JAdmin</div>
      </div>
    `;
    return widget;
  }

  // Render start form
  function renderStartForm() {
    const container = document.getElementById('jadmin-chat-form-container');
    container.innerHTML = `
      <form id="jadmin-chat-start-form">
        <h4>👋 ¡Hola! Antes de comenzar...</h4>
        <input type="text" id="jadmin-visitor-name" placeholder="Tu nombre" required>
        <input type="email" id="jadmin-visitor-email" placeholder="Tu correo electrónico" required>
        <input type="text" id="jadmin-visitor-company" placeholder="Empresa (opcional)">
        <button type="submit">Iniciar conversación</button>
      </form>
    `;
    
    document.getElementById('jadmin-chat-start-form').addEventListener('submit', handleStartChat);
  }

  // Render input form
  function renderInputForm() {
    const container = document.getElementById('jadmin-chat-form-container');
    container.innerHTML = `
      <form id="jadmin-chat-input-form">
        <input type="text" id="jadmin-chat-input" placeholder="Escribe tu mensaje..." autocomplete="off">
        <button type="submit" id="jadmin-chat-send" ${isLoading ? 'disabled' : ''}>${icons.send}</button>
      </form>
    `;
    
    document.getElementById('jadmin-chat-input-form').addEventListener('submit', handleSendMessage);
  }

  // Render messages
  function renderMessages() {
    const container = document.getElementById('jadmin-chat-messages');
    let html = '';
    
    messages.forEach(msg => {
      const time = new Date(msg.created_at || Date.now()).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const typeClass = msg.sender_type || 'ai';
      const icon = typeClass === 'visitor' ? icons.user : typeClass === 'agent' ? icons.agent : icons.bot;
      
      html += `
        <div class="jadmin-message ${typeClass}">
          <div class="jadmin-message-avatar">${icon}</div>
          <div>
            <div class="jadmin-message-content">${escapeHtml(msg.content)}</div>
            <div class="jadmin-message-time">${time}</div>
          </div>
        </div>
      `;
    });
    
    if (isLoading) {
      html += `
        <div class="jadmin-message ai">
          <div class="jadmin-message-avatar">${icons.bot}</div>
          <div class="jadmin-typing">
            <span></span><span></span><span></span>
          </div>
        </div>
      `;
    }
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Handle start chat
  async function handleStartChat(e) {
    e.preventDefault();
    
    visitorInfo = {
      visitorName: document.getElementById('jadmin-visitor-name').value,
      visitorEmail: document.getElementById('jadmin-visitor-email').value,
      visitorCompany: document.getElementById('jadmin-visitor-company').value,
      sourceUrl: window.location.href
    };
    
    isStarted = true;
    renderInputForm();
    
    // Add welcome message
    messages.push({
      content: `¡Hola ${visitorInfo.visitorName}! 👋 Soy el asistente virtual de soporte. ¿En qué puedo ayudarte hoy?`,
      sender_type: 'ai',
      created_at: new Date().toISOString()
    });
    renderMessages();
  }

  // Handle send message
  async function handleSendMessage(e) {
    e.preventDefault();
    
    const input = document.getElementById('jadmin-chat-input');
    const message = input.value.trim();
    
    if (!message || isLoading) return;
    
    // Add visitor message
    messages.push({
      content: message,
      sender_type: 'visitor',
      created_at: new Date().toISOString()
    });
    
    input.value = '';
    isLoading = true;
    renderMessages();
    renderInputForm();
    
    try {
      const response = await fetch(`${apiUrl}/api/chat/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message,
          ...visitorInfo
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        conversationId = data.conversationId;
        
        // Add AI response
        messages.push({
          content: data.message,
          sender_type: 'ai',
          created_at: new Date().toISOString()
        });
      } else {
        messages.push({
          content: 'Lo siento, hubo un error. Por favor intenta de nuevo.',
          sender_type: 'ai',
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      messages.push({
        content: 'Lo siento, hubo un error de conexión. Por favor intenta de nuevo.',
        sender_type: 'ai',
        created_at: new Date().toISOString()
      });
    }
    
    isLoading = false;
    renderMessages();
    renderInputForm();
    document.getElementById('jadmin-chat-input')?.focus();
  }

  // Toggle chat window
  function toggleChat() {
    isOpen = !isOpen;
    document.getElementById('jadmin-chat-window').classList.toggle('open', isOpen);
    
    if (isOpen && !isStarted) {
      renderStartForm();
    }
  }

  // Initialize
  function init() {
    // Add styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    // Add widget
    const widget = createWidget();
    document.body.appendChild(widget);
    
    // Event listeners
    document.getElementById('jadmin-chat-button').addEventListener('click', toggleChat);
    document.getElementById('jadmin-chat-close').addEventListener('click', toggleChat);
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

