<!-- LOOMA Assistant Modal -->
<!-- All visual styling lives in css/looma-assistant.css (high-contrast,
     projector-legible). Keep this markup free of inline colours/sizes so the
     stylesheet stays the single source of truth.
     The assistant is a ZVEC (semantic) RAG: it searches Looma's ingested
     content and answers in its own words. See js/looma-assistant-button.js. -->
<div id="looma-assistant-modal" class="ai-modal" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="looma-assistant-modal-title">
  <div class="ai-modal-card">
    <div class="ai-modal-header">
      <h3 id="looma-assistant-modal-title">LOOMA Assistant</h3>
      <div class="ai-modal-header-actions">
        <button id="looma-assistant-rag-clear" class="black-border" type="button">Clear chat</button>
        <button id="looma-assistant-modal-close" class="ai-close-btn" type="button" aria-label="Close" title="Close">&times;</button>
      </div>
    </div>

    <div class="ai-chat">
      <div id="looma-assistant-rag-chat" class="ai-chat-messages" aria-label="Chat history"></div>

      <div class="ai-chat-controls">
        <label class="ai-chat-checkbox">
          <input id="looma-assistant-rag-use-filters" type="checkbox">
          <span id="looma-assistant-limit-label">Limit to selected chapter</span>
        </label>
        <span id="looma-assistant-rag-status" class="muted"></span>
      </div>

      <div class="ai-chat-compose">
        <textarea id="looma-assistant-rag-question" class="black-border ai-chat-input" placeholder="Ask me about anything..."></textarea>
        <button id="looma-assistant-rag-run" class="black-border ai-chat-send" type="button">Send</button>
      </div>
    </div>
  </div>
</div>
