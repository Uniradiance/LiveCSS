'use strict';

// Listen for when the user clicks the extension's action icon (toolbar button).
chrome.action.onClicked.addListener((tab) => {
  // Ensure the tab has an ID before trying to send a message.
  if (tab.id) {
    // Send a message to the content script in the active tab.
    // We add a catch block to prevent an error from being thrown if the
    // content script is not available on the page (e.g., on chrome:// pages).
    chrome.tabs.sendMessage(tab.id, { action: "toggle_panel" }).catch(err => {
        // This error is expected if the content script isn't injected, so we can ignore it.
        // We can check the message to be sure we're only ignoring the expected error.
        if (err.message.includes('Could not establish connection. Receiving end does not exist.')) {
            // Expected error, do nothing.
        } else {
            console.error('sendMessage failed:', err);
        }
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Execute user-provided scripts
  if (request.action === "execute_script") {
    // Check if the message is from a tab and has an ID
    if (sender.tab && sender.tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        // By specifying 'MAIN', the script runs in the page's context,
        // bypassing the extension's CSP. It will now be subject to the
        // page's own CSP, which is the correct behavior.
        world: 'MAIN',
        func: (scriptToExecute) => {
          try {
            // This code is now executed in the main world (the page's context).
            new Function(scriptToExecute)();
          } catch (e) {
            console.error('CSS Style Editor: Error executing custom script.', e);
          }
        },
        args: [request.script]
      });
    }
    // Return true to indicate you wish to send a response asynchronously.
    return true; 
  }
});
