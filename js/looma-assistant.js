'use strict';

/**
 * looma-assistant.js
 * Handles the LOOMA Assistant button and modal across all pages.
 * The actual chat functionality is managed by looma-ai.js when on the AI page.
 */

(function() {
  function initAssistantButton() {
    const assistantBtn = document.querySelector('button.looma-assistant');
    const assistantModal = document.getElementById('looma-assistant-modal');
    const modalClose = document.getElementById('looma-assistant-modal-close');

    if (!assistantBtn || !assistantModal) return;

    // Open modal on button click
    assistantBtn.addEventListener('click', function(e) {
      e.preventDefault();
      assistantModal.style.display = 'flex';
      assistantModal.style.position = 'fixed';
      assistantModal.style.top = '0';
      assistantModal.style.left = '0';
      assistantModal.style.width = '100vw';
      assistantModal.style.height = '100vh';
      assistantModal.style.zIndex = '999999';
      assistantModal.style.alignItems = 'center';
      assistantModal.style.justifyContent = 'center';
    });

    // Close modal on close button
    if (modalClose) {
      modalClose.addEventListener('click', function(e) {
        e.preventDefault();
        assistantModal.style.display = 'none';
      });
    }

    // Close modal on background click (outside the card)
    assistantModal.addEventListener('click', function(e) {
      if (e.target === assistantModal) {
        assistantModal.style.display = 'none';
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && assistantModal.style.display !== 'none') {
        assistantModal.style.display = 'none';
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAssistantButton);
  } else {
    initAssistantButton();
  }
})();
