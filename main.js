// Main Application Handler
class ElizaChat {
    constructor() {
        // Initialize variables
        this.conversationHistory = [];
        this.API_KEY = localStorage.getItem('openRouterApiKey') || '';
        
        // Initialize DOM elements
        this.initializeDOMElements();
        
        // Initialize voice handlers
        this.initializeVoiceHandlers();
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Initialize audio visualizer
        this.visualizer = new AudioVisualizer(document.getElementById('audioVisualizer'));
        
        // Initialize voices
        this.initializeVoices();
        
        // Check for API key on load
        this.checkApiKey();
    }
    
    // Initialize DOM elements
    initializeDOMElements() {
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.voiceButton = document.getElementById('voiceButton');
        this.settingsButton = document.getElementById('settingsButton');
        this.clearButton = document.getElementById('clearButton');
        this.chatInterface = document.getElementById('chatInterface');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.voiceSpeedSelect = document.getElementById('voiceSpeed');
        this.apiKeyModal = document.getElementById('apiKeyModal');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.changeApiKeyButton = document.getElementById('changeApiKeyButton');
        this.apiKeyDisplay = document.getElementById('apiKeyDisplay');
    }
    
    // Initialize voice handlers
    initializeVoiceHandlers() {
        // Initialize voice input handler
        this.voiceInput = new VoiceInputHandler({
            onStart: () => {
                this.voiceButton.classList.add('listening');
                this.voiceButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                this.updateStatus('Listening...');
            },
            onResult: (transcript) => {
                this.addMessage(transcript, 'user');
                this.processMessage(transcript);
            },
            onError: (error) => {
                this.addMessage("Sorry, I couldn't hear you properly. Please try again.", 'ai');
            },
            onEnd: () => {
                this.voiceButton.classList.remove('listening');
                this.voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
                this.updateStatus('Ready to assist');
            }
        });
        
        // Initialize speech handler
        this.speechHandler = new SpeechHandler({
            speed: 1,
            onSpeakStart: () => {
                this.updateStatus('Speaking...');
                this.visualizer.start();
            },
            onSpeakEnd: () => {
                this.updateStatus('Ready to assist');
                this.visualizer.stop();
            }
        });
    }
    
    // Initialize event listeners
    initializeEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        this.voiceButton.addEventListener('click', () => this.voiceInput.toggleListening());
        this.settingsButton.addEventListener('click', () => this.toggleSettings());
        this.clearButton.addEventListener('click', () => this.clearChat());
        this.changeApiKeyButton.addEventListener('click', () => this.changeApiKey());
        
        this.voiceSelect.addEventListener('change', (e) => {
            this.speechHandler.setVoice(e.target.value);
        });
        
        this.voiceSpeedSelect.addEventListener('change', (e) => {
            this.speechHandler.setSpeed(e.target.value);
        });
    }
    
    // Initialize voices
    initializeVoices() {
        if ('speechSynthesis' in window) {
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = () => this.populateVoiceSelect();
            }
            this.populateVoiceSelect();
        }
    }
    
    // Populate voice select dropdown
    populateVoiceSelect() {
        const voices = this.speechHandler.getVoices();
        this.voiceSelect.innerHTML = '';
        
        const defaultOption = document.createElement('option');
        defaultOption.value = 'default';
        defaultOption.textContent = 'Default Voice';
        this.voiceSelect.appendChild(defaultOption);
        
        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            this.voiceSelect.appendChild(option);
        });
    }
    
    // Check API key on load
    checkApiKey() {
        if (!this.API_KEY) {
            this.apiKeyModal.style.display = 'flex';
        } else {
            this.addMessage("Hello! I'm ELIZA. How can I help you today?", 'ai');
        }
    }
    
    // Handle API key change
    changeApiKey() {
        this.apiKeyModal.style.display = 'flex';
    }

    // Save API key
    saveApiKey() {
        const key = this.apiKeyInput.value.trim();
        if (key) {
            this.API_KEY = key;
            localStorage.setItem('openRouterApiKey', key);
            this.apiKeyModal.style.display = 'none';
            this.apiKeyInput.value = '';
            this.apiKeyDisplay.value = '••••••••••••••••';
            this.addMessage("API key updated successfully. How can I help you?", 'ai');
        } else {
            alert('Please enter a valid API key');
        }
    }
    
    // Toggle settings panel
    toggleSettings() {
        if (this.settingsPanel.style.display === 'block') {
            this.settingsPanel.style.display = 'none';
            this.settingsButton.innerHTML = '<i class="fas fa-cog"></i> Settings';
        } else {
            this.settingsPanel.style.display = 'block';
            this.settingsButton.innerHTML = '<i class="fas fa-times"></i> Close';
            // Update API key display with masked value
            const apiKey = localStorage.getItem('openRouterApiKey');
            if (apiKey) {
                this.apiKeyDisplay.value = '••••••••••••••••';
            } else {
                this.apiKeyDisplay.value = 'No API key set';
            }
        }
    }
    
    // Clear chat history
    clearChat() {
        this.chatMessages.innerHTML = '';
        this.conversationHistory = [];
        this.addMessage("Chat cleared. How can I help you?", 'ai');
    }
    
    // Send message
    async sendMessage() {
        const message = this.userInput.value.trim();
        if (message === '') return;
        
        this.addMessage(message, 'user');
        this.userInput.value = '';
        
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
        
        try {
            await this.processMessage(message);
        } catch (error) {
            console.error('Error processing message:', error);
            this.addMessage("Sorry, I encountered an error. Please try again.", 'ai');
        }
        
        this.typingIndicator.style.display = 'none';
    }
    
    // Process message and get AI response
    async processMessage(message) {
        if (!this.API_KEY) {
            this.apiKeyModal.style.display = 'flex';
            this.addMessage("Please enter your OpenRouter API key to continue.", 'ai');
            return;
        }

        try {
            this.updateStatus('Processing your request...');
            
            // First try with DeepSeek
            const deepseekResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'ELIZA ChatBot',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'deepseek/deepseek-r1:free',
                    messages: [
                        ...this.conversationHistory.map(msg => ({ 
                            role: msg.role === 'user' ? 'user' : 'assistant', 
                            content: msg.text 
                        })),
                        { role: 'user', content: message }
                    ],
                }),
            });
            
            let aiResponse;
            let modelUsed = 'deepseek';
            
            if (deepseekResponse.ok) {
                const data = await deepseekResponse.json();
                aiResponse = data.choices?.[0]?.message?.content;
                if (aiResponse) {
                    console.log('Response generated by DeepSeek model');
                } else {
                    console.log('DeepSeek failed to generate a response, trying Mistral...');
                }
            } else {
                console.log('DeepSeek API request failed, trying Mistral...');
            }
            
            // If DeepSeek failed or didn't generate a response, try Mistral
            if (!aiResponse) {
                const mistralResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.API_KEY}`,
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'ELIZA ChatBot',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'mistralai/mistral-7b-instruct',
                        messages: [
                            ...this.conversationHistory.map(msg => ({ 
                                role: msg.role === 'user' ? 'user' : 'assistant', 
                                content: msg.text 
                            })),
                            { role: 'user', content: message }
                        ],
                    }),
                });
                
                if (!mistralResponse.ok) {
                    throw new Error(`Mistral API request failed: ${mistralResponse.statusText}`);
                }
                
                const mistralData = await mistralResponse.json();
                aiResponse = mistralData.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
                modelUsed = 'mistral';
                console.log('Response generated by Mistral model');
            }
            
            this.addMessage(aiResponse, 'ai');
            this.speechHandler.speak(aiResponse);
            
            this.updateStatus('Ready to assist');
            console.log(`Final response was generated by ${modelUsed} model`);
        } catch (error) {
            console.error('API Error:', error);
            this.updateStatus('Error occurred');
            throw error;
        }
    }
    
    // Add message to chat interface
    addMessage(message, role) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${role}-message`;
        
        const time = new Date();
        const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        
        if (role === 'ai') {
            bubble.innerHTML = marked.parse(message);
        } else {
            bubble.textContent = message;
        }
        
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = timeStr;
        bubble.appendChild(timeElement);
        
        messageElement.appendChild(bubble);
        this.chatMessages.appendChild(messageElement);
        
        this.conversationHistory.push({ role: role === 'user' ? 'user' : 'assistant', text: message });
        
        this.scrollToBottom();
    }
    
    // Update status indicator
    updateStatus(status) {
        const statusText = document.querySelector('#statusIndicator span');
        statusText.textContent = status;
        
        const statusIcon = document.querySelector('#statusIndicator i');
        
        if (status.includes('Listening')) {
            statusIcon.className = 'fas fa-microphone pulse';
        } else if (status.includes('Speaking')) {
            statusIcon.className = 'fas fa-volume-up pulse';
        } else if (status.includes('Processing')) {
            statusIcon.className = 'fas fa-cog fa-spin';
        } else if (status.includes('Error')) {
            statusIcon.className = 'fas fa-exclamation-circle';
        } else {
            statusIcon.className = 'fas fa-circle';
        }
    }
    
    // Scroll chat to bottom
    scrollToBottom() {
        this.chatInterface.scrollTop = this.chatInterface.scrollHeight;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.elizaChat = new ElizaChat();
    
    // Make saveApiKey available globally after ElizaChat is instantiated
    window.saveApiKey = () => window.elizaChat.saveApiKey();
});

// Show/hide settings panel
window.addEventListener('click', (event) => {
    const settingsPanel = document.getElementById('settingsPanel');
    if (event.target === settingsPanel) {
        settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
        // Update API key display with masked value
        const apiKey = localStorage.getItem('openRouterApiKey');
        if (apiKey) {
            document.getElementById('apiKeyDisplay').value = '••••••••••••••••';
        } else {
            document.getElementById('apiKeyDisplay').value = 'No API key set';
        }
    }
});

// Clear chat history
window.addEventListener('click', (event) => {
    const clearButton = document.getElementById('clearButton');
    if (event.target === clearButton) {
        if (confirm('Are you sure you want to clear the chat history?')) {
            document.getElementById('chatMessages').innerHTML = '';
            localStorage.removeItem('chatHistory');
        }
    }
});

// Handle API key change
window.addEventListener('click', (event) => {
    const apiKeyModal = document.getElementById('apiKeyModal');
    if (event.target === apiKeyModal) {
        apiKeyModal.style.display = 'none';
    }
});

// Load chat history