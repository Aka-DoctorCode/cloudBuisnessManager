import { collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firebaseManager } from './FirebaseManager';
import { Transaction } from '../models/Transaction';

class TransactionService {
    constructor() {
        this.collectionPath = `artifacts/business-app-v1/public/data/transactions`;
    }

    /**
     * Subscribes to transaction updates.
     * @param {Function} onDataChanged Callback for data changes.
     * @param {Function} onError Callback for errors.
     * @returns {Function} Unsubscribe function.
     */
    subscribe(onDataChanged, onError) {
        if (!firebaseManager.db) return () => {};

        const q = query(collection(firebaseManager.db, this.collectionPath), orderBy('date', 'desc'));
        
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => new Transaction(doc.id, doc.data()));
            onDataChanged(data);
        }, (error) => {
            console.error("Data subscription error:", error);
            if (onError) onError(error);
        });
    }

    /**
     * Adds a new transaction.
     * @param {Object} transactionData 
     * @returns {Promise<void>}
     */
    async addTransaction(transactionData) {
        if (!firebaseManager.db) throw new Error("Database not initialized.");

        // Create a temporary Transaction object to handle logic
        const transaction = new Transaction(null, transactionData);
        
        await addDoc(collection(firebaseManager.db, this.collectionPath), transaction.toJSON());
    }

    /**
     * Deletes a transaction by ID.
     * @param {string} id 
     * @returns {Promise<void>}
     */
    async deleteTransaction(id) {
        if (!firebaseManager.db) throw new Error("Database not initialized.");
        await deleteDoc(doc(firebaseManager.db, this.collectionPath, id));
    }
}

export const transactionService = new TransactionService();
