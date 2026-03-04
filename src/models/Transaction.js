export class Transaction {
    constructor(id, data) {
        this.id = id;
        this.date = data.date;
        this.entity = data.entity;
        this.type = data.type; // 'income' or 'expense'
        this.concept = data.concept;
        this.totalAmount = Number(data.totalAmount) || 0;
        this.paidAmount = Number(data.paidAmount) || 0;
        this.status = data.status; // 'paid' or 'pending'
        this.createdAt = data.createdAt;
    }

    get isPaid() {
        return this.status === 'paid' || this.paidAmount >= this.totalAmount;
    }

    get remainingAmount() {
        return this.totalAmount - this.paidAmount;
    }

    get formattedTotal() {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(this.totalAmount);
    }

    get formattedPaid() {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(this.paidAmount);
    }

    get formattedRemaining() {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(this.remainingAmount);
    }

    toJSON() {
        return {
            date: this.date,
            entity: this.entity,
            type: this.type,
            concept: this.concept,
            totalAmount: this.totalAmount,
            paidAmount: this.paidAmount,
            status: this.isPaid ? 'paid' : 'pending',
            createdAt: this.createdAt || new Date().toISOString()
        };
    }
}
