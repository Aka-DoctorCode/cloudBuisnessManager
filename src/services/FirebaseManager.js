import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';

class FirebaseManager {
    constructor() {
        this.app = null;
        this.db = null;
        this.auth = null;
        this.user = null;
        this.configKey = 'firebase_config';
    }

    /**
     * Validates the configuration object.
     * @param {Object} config 
     * @returns {boolean}
     */
    isValidConfig(config) {
        return config && 
               typeof config.apiKey === 'string' && config.apiKey.length > 0 && config.apiKey !== "YOUR_API_KEY" &&
               typeof config.projectId === 'string' && config.projectId.length > 0 &&
               // authDomain is often required for some auth flows, though not strictly for all. 
               // Adding it as a requirement helps ensure a complete config.
               typeof config.authDomain === 'string' && config.authDomain.length > 0;
    }

    /**
     * Initializes Firebase with the provided configuration.
     * Handles re-initialization by deleting existing apps.
     * @param {Object} config 
     * @returns {Promise<boolean>} Success status
     */
    async initialize(config) {
        try {
            if (!this.isValidConfig(config)) {
                console.error("Invalid configuration object:", config);
                throw new Error("Invalid configuration object. Missing apiKey, projectId, or authDomain.");
            }

            // Check if an app already exists and delete it to ensure clean initialization with new config
            if (getApps().length > 0) {
                const existingApp = getApps()[0];
                await deleteApp(existingApp);
            }

            this.app = initializeApp(config);
            this.db = getFirestore(this.app);
            this.auth = getAuth(this.app);
            return true;
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            return false;
        }
    }

    /**
     * Attempts to initialize from environment variables or local storage.
     * @returns {Object|null} The loaded configuration or null.
     */
    loadConfig() {
        // 1. Try Environment Variables
        const envConfig = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID
        };

        if (this.isValidConfig(envConfig)) {
            return envConfig;
        }

        // 2. Try Local Storage
        const storedConfigStr = localStorage.getItem(this.configKey);
        if (storedConfigStr) {
            try {
                const storedConfig = JSON.parse(storedConfigStr);
                if (this.isValidConfig(storedConfig)) {
                    return storedConfig;
                }
            } catch (e) {
                console.error("Failed to parse stored config:", e);
            }
        }

        return null;
    }

    /**
     * Saves configuration to local storage.
     * @param {Object} config 
     */
    saveConfig(config) {
        localStorage.setItem(this.configKey, JSON.stringify(config));
    }

    /**
     * Clears configuration from local storage.
     */
    clearConfig() {
        localStorage.removeItem(this.configKey);
        // Also try to delete the app if possible, though this method is sync
        // We rely on reload to clear memory state usually
    }

    /**
     * Authenticates the user anonymously.
     * @param {Function} onUserChanged Callback for user state changes.
     * @returns {Function} Unsubscribe function.
     */
    authenticate(onUserChanged) {
        if (!this.auth) return () => {};

        const unsubscribe = onAuthStateChanged(this.auth, (user) => {
            if (user) {
                this.user = user;
                onUserChanged(user);
            } else {
                signInAnonymously(this.auth).catch((error) => {
                    console.error("Anonymous auth failed:", error);
                    if (error.code === 'auth/configuration-not-found' || error.code === 'auth/api-key-not-valid' || error.code === 'auth/internal-error') {
                        this.clearConfig();
                        alert("Error crítico de autenticación: " + error.message + "\n\nLa configuración guardada parece inválida y ha sido eliminada. Por favor, recarga la página e ingresa la configuración nuevamente.");
                        window.location.reload(); // Force reload to clear any bad state
                    }
                    onUserChanged(null);
                });
            }
        });

        return unsubscribe;
    }
}

export const firebaseManager = new FirebaseManager();
