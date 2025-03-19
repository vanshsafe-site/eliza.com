// Voice Input Handler Module
class VoiceInputHandler {
    constructor(options = {}) {
        // Initialize variables
        this.isListening = false;
        this.recognition = null;
        this.options = {
            language: options.language || 'en-US',
            onStart: options.onStart || (() => {}),
            onResult: options.onResult || (() => {}),
            onError: options.onError || (() => {}),
            onEnd: options.onEnd || (() => {})
        };
        
        // Initialize speech recognition
        this.initSpeechRecognition();
    }
    
    // Initialize Web Speech API
    initSpeechRecognition() {
        // Check browser compatibility
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
        } else if ('SpeechRecognition' in window) {
            this.recognition = new SpeechRecognition();
        } else {
            console.error('Speech recognition not supported in this browser');
            return false;
        }

        // Configure recognition
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = this.options.language;

        // Setup event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            this.options.onStart();
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.options.onResult(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.options.onError(event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.options.onEnd();
        };
        
        return true;
    }
    
    // Start listening
    startListening() {
        if (!this.recognition) {
            if (!this.initSpeechRecognition()) {
                this.options.onError('Speech recognition not supported');
                return false;
            }
        }
        
        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.options.onError(error.message);
            return false;
        }
    }
    
    // Stop listening
    stopListening() {
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        }
        this.isListening = false;
    }
    
    // Toggle listening state
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
            return false;
        } else {
            return this.startListening();
        }
    }
    
    // Check if currently listening
    isCurrentlyListening() {
        return this.isListening;
    }
    
    // Update recognition language
    setLanguage(language) {
        this.options.language = language;
        if (this.recognition) {
            this.recognition.lang = language;
        }
    }
}

// Speech synthesis handler
class SpeechHandler {
    constructor(options = {}) {
        this.currentVoice = null;
        this.voiceSpeed = options.speed || 1;
        this.onSpeakStart = options.onSpeakStart || (() => {});
        this.onSpeakEnd = options.onSpeakEnd || (() => {});
        this.isSpeaking = false;
        
        // Initialize if supported
        this.isSupported = 'speechSynthesis' in window;
    }
    
    // Get available voices
    getVoices() {
        if (!this.isSupported) return [];
        return speechSynthesis.getVoices();
    }
    
    // Set voice by index
    setVoice(voiceIndex) {
        if (!this.isSupported) return false;
        
        const voices = this.getVoices();
        if (voiceIndex === 'default') {
            this.currentVoice = null;
        } else if (voices[voiceIndex]) {
            this.currentVoice = voices[voiceIndex];
        }
        return true;
    }
    
    // Set speech rate
    setSpeed(speed) {
        this.voiceSpeed = parseFloat(speed);
    }
    
    // Speak text
    speak(text) {
        if (!this.isSupported) return false;
        
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        this.isSpeaking = true;
        this.onSpeakStart();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set selected voice if available
        if (this.currentVoice) {
            utterance.voice = this.currentVoice;
        }
        
        // Set speech rate
        utterance.rate = this.voiceSpeed;
        
        utterance.onend = () => {
            this.isSpeaking = false;
            this.onSpeakEnd();
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.isSpeaking = false;
            this.onSpeakEnd();
        };
        
        speechSynthesis.speak(utterance);
        return true;
    }
    
    // Stop speaking
    stop() {
        if (!this.isSupported) return;
        speechSynthesis.cancel();
        this.isSpeaking = false;
    }
    
    // Check if currently speaking
    isCurrentlySpeaking() {
        return this.isSpeaking;
    }
}

// Audio visualizer class
class AudioVisualizer {
    constructor(container, numBars = 20) {
        this.container = container;
        this.numBars = numBars;
        this.bars = [];
        this.animationFrame = null;
        this.isActive = false;
        
        this.initVisualizer();
    }
    
    // Initialize visualizer bars
    initVisualizer() {
        this.container.innerHTML = '';
        this.bars = [];
        
        for (let i = 0; i < this.numBars; i++) {
            const bar = document.createElement('div');
            bar.className = 'visualizer-bar';
            this.container.appendChild(bar);
            this.bars.push(bar);
        }
        
        this.hide();
    }
    
    // Show visualizer
    show() {
        this.container.style.display = 'flex';
    }
    
    // Hide visualizer
    hide() {
        this.container.style.display = 'none';
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    // Start animation
    start() {
        this.isActive = true;
        this.show();
        this.animate();
    }
    
    // Stop animation
    stop() {
        this.isActive = false;
        this.hide();
    }
    
    // Animate bars
    animate() {
        if (!this.isActive) return;
        
        this.bars.forEach(bar => {
            const height = Math.floor(Math.random() * 25) + 5;
            bar.style.height = `${height}px`;
        });
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
}

// Export classes
window.VoiceInputHandler = VoiceInputHandler;
window.SpeechHandler = SpeechHandler;
window.AudioVisualizer = AudioVisualizer;