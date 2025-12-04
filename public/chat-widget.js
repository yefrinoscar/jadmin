/**
 * JAdmin Chat Widget - Embeddable Script
 * 
 * Usage:
 * <script src="https://your-jadmin-domain.com/chat-widget.js" data-api-url="https://your-jadmin-domain.com"></script>
 * 
 * Or with custom options:
 * <script>
 *   window.JAdminChatConfig = {
 *     apiUrl: 'https://your-jadmin-domain.com',
 *     title: 'Soporte',
 *     primaryColor: '#3b82f6',
 *     position: 'bottom-right'
 *   };
 * </script>
 * <script src="https://your-jadmin-domain.com/chat-widget.js"></script>
 */

(function() {
  'use strict';

  // ============================================================================
  // Configuration
  // ============================================================================

  const scriptTag = document.currentScript;
  const defaultConfig = {
    apiUrl: scriptTag?.getAttribute('data-api-url') || window.location.origin,
    title: 'Soporte',
    subtitleAI: 'Asistente Virtual',
    subtitleHuman: 'Agente de Soporte',
    primaryColor: '#6366f1',
    welcomeMessage: '¡Hola! 👋 ¿En qué puedo ayudarte hoy?',
    placeholder: 'Escribe tu mensaje...',
    position: 'bottom-right',
    zIndex: 9999,
    storageKey: 'jadmin_chat_conversation_id'
  };

  const config = { ...defaultConfig, ...(window.JAdminChatConfig || {}) };

  // ============================================================================
  // Styles
  // ============================================================================

  const styles = `
    .jadmin-widget-button {
      position: fixed;
      bottom: 24px;
      ${config.position === 'bottom-left' ? 'left: 24px;' : 'right: 24px;'}
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${config.primaryColor};
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      z-index: ${config.zIndex};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .jadmin-widget-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
    }
    
    .jadmin-widget-button:active {
      transform: scale(0.95);
    }
    
    .jadmin-widget-button svg {
      width: 28px;
      height: 28px;
    }
    
    .jadmin-widget-button .pulse {
      position: absolute;
      top: 0;
      right: 0;
      width: 12px;
      height: 12px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.1); }
    }
    
    .jadmin-widget-container {
      position: fixed;
      bottom: 24px;
      ${config.position === 'bottom-left' ? 'left: 24px;' : 'right: 24px;'}
      width: 400px;
      max-width: calc(100vw - 32px);
      height: 600px;
      max-height: calc(100vh - 100px);
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: ${config.zIndex};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .jadmin-widget-header {
      padding: 16px;
      background: ${config.primaryColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .jadmin-widget-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .jadmin-widget-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .jadmin-widget-avatar svg {
      width: 22px;
      height: 22px;
    }
    
    .jadmin-widget-status {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid ${config.primaryColor};
    }
    
    .jadmin-widget-status.connected {
      background: #10b981;
    }
    
    .jadmin-widget-status.disconnected {
      background: #f59e0b;
    }
    
    .jadmin-widget-header-title {
      font-weight: 600;
      font-size: 15px;
      margin-bottom: 2px;
    }
    
    .jadmin-widget-header-subtitle {
      font-size: 12px;
      opacity: 0.9;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .jadmin-widget-header-subtitle svg {
      width: 12px;
      height: 12px;
    }
    
    .jadmin-widget-header-actions {
      display: flex;
      gap: 4px;
    }
    
    .jadmin-widget-header-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    
    .jadmin-widget-header-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .jadmin-widget-header-btn svg {
      width: 18px;
      height: 18px;
    }
    
    .jadmin-widget-handoff {
      padding: 10px 16px;
      background: #dcfce7;
      color: #166534;
      font-size: 12px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .jadmin-widget-handoff svg {
      width: 14px;
      height: 14px;
    }
    
    .jadmin-widget-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .jadmin-widget-welcome {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
    }
    
    .jadmin-widget-welcome-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: ${config.primaryColor}15;
      color: ${config.primaryColor};
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    
    .jadmin-widget-welcome-icon svg {
      width: 32px;
      height: 32px;
    }
    
    .jadmin-widget-welcome h4 {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 8px 0;
    }
    
    .jadmin-widget-welcome p {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
      max-width: 260px;
    }
    
    .jadmin-widget-message {
      display: flex;
      flex-direction: column;
      max-width: 85%;
    }
    
    .jadmin-widget-message.visitor {
      align-self: flex-end;
      align-items: flex-end;
    }
    
    .jadmin-widget-message.ai,
    .jadmin-widget-message.agent {
      align-self: flex-start;
      align-items: flex-start;
    }
    
    .jadmin-widget-message-header {
      font-size: 10px;
      color: #9ca3af;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .jadmin-widget-message-bubble {
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      word-break: break-word;
    }
    
    .jadmin-widget-message.visitor .jadmin-widget-message-bubble {
      background: ${config.primaryColor};
      color: white;
      border-bottom-right-radius: 4px;
    }
    
    .jadmin-widget-message.ai .jadmin-widget-message-bubble {
      background: #f3e8ff;
      color: #6b21a8;
      border-bottom-left-radius: 4px;
    }
    
    .jadmin-widget-message.agent .jadmin-widget-message-bubble {
      background: #dcfce7;
      color: #166534;
      border-bottom-left-radius: 4px;
    }
    
    .jadmin-widget-typing {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      background: #f3f4f6;
      border-radius: 16px;
      border-bottom-left-radius: 4px;
      width: fit-content;
    }
    
    .jadmin-widget-typing span {
      width: 8px;
      height: 8px;
      background: #9ca3af;
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }
    
    .jadmin-widget-typing span:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .jadmin-widget-typing span:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }
    
    .jadmin-widget-input-area {
      padding: 12px 16px;
      border-top: 1px solid #e5e7eb;
    }
    
    .jadmin-widget-human-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: #f3f4f6;
      border: none;
      border-radius: 20px;
      font-size: 12px;
      color: #6b7280;
      cursor: pointer;
      margin-bottom: 10px;
      transition: background 0.2s;
    }
    
    .jadmin-widget-human-btn:hover {
      background: #e5e7eb;
    }
    
    .jadmin-widget-human-btn svg {
      width: 12px;
      height: 12px;
    }
    
    .jadmin-widget-input-form {
      display: flex;
      gap: 8px;
    }
    
    .jadmin-widget-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      font-size: 14px;
      resize: none;
      outline: none;
      font-family: inherit;
      background: #f9fafb;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    .jadmin-widget-input:focus {
      border-color: ${config.primaryColor};
      box-shadow: 0 0 0 3px ${config.primaryColor}20;
    }
    
    .jadmin-widget-input::placeholder {
      color: #9ca3af;
    }
    
    .jadmin-widget-send-btn {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: ${config.primaryColor};
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, opacity 0.2s;
    }
    
    .jadmin-widget-send-btn:hover {
      opacity: 0.9;
    }
    
    .jadmin-widget-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .jadmin-widget-send-btn svg {
      width: 20px;
      height: 20px;
    }
    
    .jadmin-widget-hint {
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
      margin-top: 8px;
    }
    
    .jadmin-widget-closed {
      padding: 24px 16px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .jadmin-widget-closed p {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 12px 0;
    }
    
    .jadmin-widget-closed button {
      padding: 10px 20px;
      background: ${config.primaryColor};
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    
    .jadmin-widget-closed button:hover {
      opacity: 0.9;
    }
    
    @media (max-width: 480px) {
      .jadmin-widget-container {
        width: calc(100vw - 16px);
        height: calc(100vh - 80px);
        bottom: 8px;
        ${config.position === 'bottom-left' ? 'left: 8px;' : 'right: 8px;'}
        border-radius: 12px;
      }
      
      .jadmin-widget-button {
        width: 56px;
        height: 56px;
        bottom: 16px;
        ${config.position === 'bottom-left' ? 'left: 16px;' : 'right: 16px;'}
      }
    }
  `;

  // ============================================================================
  // Icons (SVG)
  // ============================================================================

  const icons = {
    chat: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
    send: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>',
    refresh: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>',
    bot: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
    user: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
    sparkles: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>'
  };

  // ============================================================================
  // State
  // ============================================================================

  let state = {
    isOpen: false,
    messages: [],
    conversationId: localStorage.getItem(config.storageKey),
    managedBy: 'ai',
    status: 'active',
    isSending: false,
    isConnected: false,
    supabase: null,
    channel: null
  };

  // ============================================================================
  // DOM Elements
  // ============================================================================

  let widgetButton = null;
  let widgetContainer = null;

  // ============================================================================
  // Supabase Initialization
  // ============================================================================

  async function initSupabase() {
    try {
      const res = await fetch(`${config.apiUrl}/api/chat/public?config=supabase`);
      const data = await res.json();
      
      if (data.url && data.anonKey && window.supabase) {
        state.supabase = window.supabase.createClient(data.url, data.anonKey);
        if (state.conversationId) {
          subscribeToMessages();
          loadMessages();
        }
      }
    } catch (err) {
      console.error('JAdmin Widget: Error initializing Supabase', err);
    }
  }

  // ============================================================================
  // Supabase Subscriptions
  // ============================================================================

  function subscribeToMessages() {
    if (!state.supabase || !state.conversationId) return;

    // Unsubscribe from previous channel
    if (state.channel) {
      state.supabase.removeChannel(state.channel);
    }

    state.channel = state.supabase
      .channel(`widget:${state.conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${state.conversationId}`
        },
        (payload) => {
          const newMsg = payload.new;
          if (!state.messages.some(m => m.id === newMsg.id)) {
            state.messages.push(newMsg);
            renderMessages();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_conversations',
          filter: `id=eq.${state.conversationId}`
        },
        (payload) => {
          state.managedBy = payload.new.managed_by || 'ai';
          state.status = payload.new.status || 'active';
          render();
        }
      )
      .subscribe((status) => {
        state.isConnected = status === 'SUBSCRIBED';
        render();
      });
  }

  async function loadMessages() {
    if (!state.supabase || !state.conversationId) return;

    try {
      const { data, error } = await state.supabase
        .from('chat_messages')
        .select('id, content, sender_type, created_at')
        .eq('conversation_id', state.conversationId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        state.messages = data;
        renderMessages();
      }

      // Also load conversation state
      const { data: convData } = await state.supabase
        .from('chat_conversations')
        .select('managed_by, status')
        .eq('id', state.conversationId)
        .single();

      if (convData) {
        state.managedBy = convData.managed_by || 'ai';
        state.status = convData.status || 'active';
        render();
      }
    } catch (err) {
      console.error('JAdmin Widget: Error loading messages', err);
    }
  }

  // ============================================================================
  // API Functions
  // ============================================================================

  async function sendMessage(content) {
    if (!content.trim() || state.isSending) return;

    state.isSending = true;
    render();

    try {
      const response = await fetch(`${config.apiUrl}/api/chat/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: state.conversationId,
          message: content.trim(),
          sourceUrl: window.location.href
        })
      });

      const data = await response.json();

      if (data.conversationId && !state.conversationId) {
        state.conversationId = data.conversationId;
        localStorage.setItem(config.storageKey, data.conversationId);
        subscribeToMessages();
      }

      if (data.managedBy) {
        state.managedBy = data.managedBy;
      }
    } catch (err) {
      console.error('JAdmin Widget: Error sending message', err);
    } finally {
      state.isSending = false;
      render();
    }
  }

  function startNewConversation() {
    localStorage.removeItem(config.storageKey);
    if (state.channel && state.supabase) {
      state.supabase.removeChannel(state.channel);
    }
    state.conversationId = null;
    state.messages = [];
    state.managedBy = 'ai';
    state.status = 'active';
    state.channel = null;
    render();
  }

  // ============================================================================
  // Render Functions
  // ============================================================================

  function renderMessages() {
    if (!widgetContainer) return;

    const messagesArea = widgetContainer.querySelector('.jadmin-widget-messages');
    if (!messagesArea) return;

    if (state.messages.length === 0 && !state.conversationId) {
      messagesArea.innerHTML = `
        <div class="jadmin-widget-welcome">
          <div class="jadmin-widget-welcome-icon">${icons.chat}</div>
          <h4>¡Bienvenido!</h4>
          <p>${config.welcomeMessage}</p>
        </div>
      `;
      return;
    }

    let html = '';
    state.messages.forEach((msg, i) => {
      const prev = state.messages[i - 1];
      const showHeader = !prev || prev.sender_type !== msg.sender_type;
      
      let label = '';
      let icon = '';
      if (msg.sender_type === 'visitor') {
        label = 'Tú';
      } else if (msg.sender_type === 'ai') {
        label = '🤖 Asistente';
      } else {
        label = '👤 Agente';
      }

      html += `
        <div class="jadmin-widget-message ${msg.sender_type}">
          ${showHeader ? `<div class="jadmin-widget-message-header">${label}</div>` : ''}
          <div class="jadmin-widget-message-bubble">${escapeHtml(msg.content)}</div>
        </div>
      `;
    });

    if (state.isSending) {
      html += `
        <div class="jadmin-widget-typing">
          <span></span><span></span><span></span>
        </div>
      `;
    }

    messagesArea.innerHTML = html;
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  function render() {
    if (state.isOpen) {
      if (!widgetContainer) {
        createContainer();
      }
      widgetButton.style.display = 'none';
      widgetContainer.style.display = 'flex';
      renderMessages();
      updateHeader();
      updateInputArea();
    } else {
      if (widgetContainer) {
        widgetContainer.style.display = 'none';
      }
      widgetButton.style.display = 'flex';
    }
  }

  function updateHeader() {
    if (!widgetContainer) return;

    const avatar = widgetContainer.querySelector('.jadmin-widget-avatar');
    const subtitle = widgetContainer.querySelector('.jadmin-widget-header-subtitle');
    const status = widgetContainer.querySelector('.jadmin-widget-status');
    const handoff = widgetContainer.querySelector('.jadmin-widget-handoff');

    if (avatar) {
      avatar.innerHTML = state.managedBy === 'human' ? icons.user : icons.bot;
      avatar.innerHTML += `<div class="jadmin-widget-status ${state.isConnected ? 'connected' : 'disconnected'}"></div>`;
    }

    if (subtitle) {
      subtitle.innerHTML = state.managedBy === 'human'
        ? `${icons.user} ${config.subtitleHuman}`
        : `${icons.sparkles} ${config.subtitleAI}`;
    }

    if (handoff) {
      handoff.style.display = state.managedBy === 'human' ? 'flex' : 'none';
    }
  }

  function updateInputArea() {
    if (!widgetContainer) return;

    const inputArea = widgetContainer.querySelector('.jadmin-widget-input-area');
    const closedArea = widgetContainer.querySelector('.jadmin-widget-closed');
    const humanBtn = widgetContainer.querySelector('.jadmin-widget-human-btn');

    if (state.status === 'closed') {
      if (inputArea) inputArea.style.display = 'none';
      if (closedArea) closedArea.style.display = 'block';
    } else {
      if (inputArea) inputArea.style.display = 'block';
      if (closedArea) closedArea.style.display = 'none';
    }

    if (humanBtn) {
      humanBtn.style.display = state.managedBy === 'ai' && state.messages.length > 2 ? 'inline-flex' : 'none';
    }
  }

  function createContainer() {
    widgetContainer = document.createElement('div');
    widgetContainer.className = 'jadmin-widget-container';
    widgetContainer.innerHTML = `
      <div class="jadmin-widget-header">
        <div class="jadmin-widget-header-info">
          <div class="jadmin-widget-avatar">
            ${icons.bot}
            <div class="jadmin-widget-status disconnected"></div>
          </div>
          <div>
            <div class="jadmin-widget-header-title">${config.title}</div>
            <div class="jadmin-widget-header-subtitle">${icons.sparkles} ${config.subtitleAI}</div>
          </div>
        </div>
        <div class="jadmin-widget-header-actions">
          ${state.conversationId ? `<button class="jadmin-widget-header-btn jadmin-new-btn" title="Nueva conversación">${icons.refresh}</button>` : ''}
          <button class="jadmin-widget-header-btn jadmin-close-btn" title="Cerrar">${icons.close}</button>
        </div>
      </div>
      <div class="jadmin-widget-handoff" style="display: none;">
        ${icons.user} Un agente está atendiendo tu consulta
      </div>
      <div class="jadmin-widget-messages"></div>
      <div class="jadmin-widget-input-area">
        <button class="jadmin-widget-human-btn" style="display: none;">
          ${icons.user} Hablar con un agente
        </button>
        <form class="jadmin-widget-input-form">
          <textarea class="jadmin-widget-input" placeholder="${config.placeholder}" rows="1"></textarea>
          <button type="submit" class="jadmin-widget-send-btn" disabled>${icons.send}</button>
        </form>
        <div class="jadmin-widget-hint">Enter para enviar • Shift+Enter nueva línea</div>
      </div>
      <div class="jadmin-widget-closed" style="display: none;">
        <p>Esta conversación ha sido cerrada</p>
        <button>Iniciar nueva conversación</button>
      </div>
    `;

    document.body.appendChild(widgetContainer);

    // Event listeners
    const closeBtn = widgetContainer.querySelector('.jadmin-close-btn');
    closeBtn.addEventListener('click', () => {
      state.isOpen = false;
      render();
    });

    const newBtn = widgetContainer.querySelector('.jadmin-new-btn');
    if (newBtn) {
      newBtn.addEventListener('click', startNewConversation);
    }

    const form = widgetContainer.querySelector('.jadmin-widget-input-form');
    const input = widgetContainer.querySelector('.jadmin-widget-input');
    const sendBtn = widgetContainer.querySelector('.jadmin-widget-send-btn');

    input.addEventListener('input', () => {
      sendBtn.disabled = !input.value.trim();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (input.value.trim()) {
          sendMessage(input.value);
          input.value = '';
          sendBtn.disabled = true;
        }
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (input.value.trim()) {
        sendMessage(input.value);
        input.value = '';
        sendBtn.disabled = true;
      }
    });

    const humanBtn = widgetContainer.querySelector('.jadmin-widget-human-btn');
    humanBtn.addEventListener('click', () => {
      sendMessage('Deseo hablar con un agente humano');
    });

    const closedBtn = widgetContainer.querySelector('.jadmin-widget-closed button');
    closedBtn.addEventListener('click', startNewConversation);

    // Focus input
    setTimeout(() => input.focus(), 100);
  }

  function createButton() {
    widgetButton = document.createElement('button');
    widgetButton.className = 'jadmin-widget-button';
    widgetButton.innerHTML = `${icons.chat}<span class="pulse"></span>`;
    widgetButton.addEventListener('click', () => {
      state.isOpen = true;
      render();
    });
    document.body.appendChild(widgetButton);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  // ============================================================================
  // Initialize
  // ============================================================================

  function init() {
    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Create button
    createButton();

    // Load Supabase if not already loaded
    if (!window.supabase) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = initSupabase;
      document.head.appendChild(script);
    } else {
      initSupabase();
    }

    // Initial render
    render();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for external control
  window.JAdminChat = {
    open: () => { state.isOpen = true; render(); },
    close: () => { state.isOpen = false; render(); },
    toggle: () => { state.isOpen = !state.isOpen; render(); },
    newConversation: startNewConversation,
    sendMessage: sendMessage
  };

})();

