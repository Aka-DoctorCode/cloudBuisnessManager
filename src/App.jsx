import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    PlusCircle, 
    History, 
    Bell, 
    Sun, 
    Moon, 
    Trash2, 
    CheckCircle, 
    Search,
    Settings
} from 'lucide-react';
import { firebaseManager } from './services/FirebaseManager';
import { transactionService } from './services/TransactionService';

// --- Components ---

const FirebaseSetup = ({ onSave }) => {
    const [configInput, setConfigInput] = useState('');
    const [error, setError] = useState('');

    const handleSave = (e) => {
        e.preventDefault();
        try {
            let configStr = configInput.trim();
            
            // Remove comments (// ...)
            configStr = configStr.replace(/\/\/.*$/gm, '');
            
            // Extract object if it looks like a JS declaration (find the first { and last })
            const firstBrace = configStr.indexOf('{');
            const lastBrace = configStr.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                configStr = configStr.substring(firstBrace, lastBrace + 1);
            }

            let config;
            try {
                // Try to parse as JSON first (strict)
                config = JSON.parse(configStr);
            } catch (jsonError) {
                // If JSON fails, try to parse as a JavaScript object (loose)
                // This handles unquoted keys like { apiKey: "..." } which is common in Firebase console output
                try {
                    // eslint-disable-next-line no-new-func
                    const parseJsValue = new Function(`return ${configStr}`);
                    config = parseJsValue();
                } catch (jsError) {
                    throw new Error("No se pudo interpretar la configuración. Asegúrate de copiar el objeto { ... } correctamente.");
                }
            }

            if (firebaseManager.isValidConfig(config)) {
                onSave(config);
            } else {
                setError("La configuración parece inválida o incompleta. Debe contener al menos apiKey y projectId.");
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Error al procesar la configuración.");
        }
    };

    return (
        <div className="setup-container" style={{
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            backgroundColor: 'var(--background-color)',
            color: 'var(--text-primary)'
        }}>
            <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <Settings size={48} color="var(--primary-color)" />
                    <h2 style={{ marginTop: '1rem' }}>Configuración de Firebase</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Para usar esta aplicación, necesitas conectar tu propia base de datos de Firebase.
                    </p>
                </div>
                
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label>Objeto de Configuración (JSON)</label>
                        <textarea 
                            value={configInput}
                            onChange={(e) => setConfigInput(e.target.value)}
                            placeholder='{ "apiKey": "...", "authDomain": "...", ... }'
                            style={{ 
                                width: '100%', 
                                height: '200px', 
                                padding: '0.75rem', 
                                fontFamily: 'monospace',
                                border: '1px solid var(--border-color)',
                                borderRadius: '0.5rem',
                                backgroundColor: 'var(--background-color)',
                                color: 'var(--text-primary)'
                            }}
                            required
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Copia esto desde la consola de Firebase: Project Settings &gt; General &gt; Your apps &gt; SDK setup and configuration &gt; Config
                        </p>
                    </div>
                    
                    {error && (
                        <div style={{ 
                            padding: '0.75rem', 
                            backgroundColor: '#fee2e2', 
                            color: '#991b1b', 
                            borderRadius: '0.5rem', 
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn-primary">Guardar y Conectar</button>
                </form>
            </div>
        </div>
    );
};

export default function App() {
    // --- State ---
    const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [user, setUser] = useState(null);
    const [showSetup, setShowSetup] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        entity: '',
        type: 'income',
        concept: '',
        totalAmount: '',
        paidAmount: ''
    });

    // Filter State
    const [filters, setFilters] = useState({
        search: '',
        type: 'all',
        status: 'all'
    });

    // --- Initialization Effect ---
    useEffect(() => {
        const init = async () => {
            const config = firebaseManager.loadConfig();
            if (config) {
                const success = await firebaseManager.initialize(config);
                if (success) {
                    setIsFirebaseInitialized(true);
                } else {
                    setShowSetup(true);
                }
            } else {
                setShowSetup(true);
            }
            setLoading(false);
        };
        init();
    }, []);

    // --- Auth & Data Subscription ---
    useEffect(() => {
        if (!isFirebaseInitialized) return;

        const unsubscribeAuth = firebaseManager.authenticate((currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                subscribeToTransactions();
            }
        });

        return () => unsubscribeAuth();
    }, [isFirebaseInitialized]);

    // Dark Mode Toggle
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

    const subscribeToTransactions = () => {
        setLoading(true);
        const unsubscribe = transactionService.subscribe(
            (data) => {
                setTransactions(data);
                setLoading(false);
            },
            (error) => {
                setLoading(false);
                if (error.code === 'permission-denied') {
                    alert("Permiso denegado. Verifica las reglas de seguridad de Firestore.");
                }
            }
        );
        return unsubscribe;
    };

    const handleSaveConfig = async (config) => {
        const success = await firebaseManager.initialize(config);
        if (success) {
            firebaseManager.saveConfig(config);
            setIsFirebaseInitialized(true);
            setShowSetup(false);
        } else {
            alert("Error al inicializar Firebase con esta configuración.");
        }
    };

    // --- Handlers ---

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || !isFirebaseInitialized) return;

        try {
            const total = parseFloat(formData.totalAmount);
            const paid = parseFloat(formData.paidAmount);

            await transactionService.addTransaction({
                ...formData,
                totalAmount: total,
                paidAmount: paid
            });

            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                entity: '',
                type: 'income',
                concept: '',
                totalAmount: '',
                paidAmount: ''
            });
            alert('Transacción registrada con éxito');
        } catch (error) {
            console.error("Error adding document: ", error);
            alert('Error al guardar la transacción: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!isFirebaseInitialized) return;
        if (window.confirm('¿Estás seguro de eliminar esta transacción?')) {
            try {
                await transactionService.deleteTransaction(id);
            } catch (error) {
                console.error("Error removing document: ", error);
                alert('Error al eliminar: ' + error.message);
            }
        }
    };

    const handleReminder = (transaction) => {
        const message = `Hola ${transaction.entity}, le recordamos que tiene un saldo pendiente de $${transaction.remainingAmount.toFixed(2)} por el concepto de "${transaction.concept}".`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleLogoutConfig = () => {
        if (window.confirm("¿Quieres desconectar esta base de datos? Tendrás que ingresar la configuración nuevamente.")) {
            firebaseManager.clearConfig();
            window.location.reload();
        }
    };

    // --- Computed Data ---

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.entity.toLowerCase().includes(filters.search.toLowerCase());
        const matchesType = filters.type === 'all' || t.type === filters.type;
        const matchesStatus = filters.status === 'all' || t.status === filters.status;
        return matchesSearch && matchesType && matchesStatus;
    });

    const pendingIncomes = transactions.filter(t => t.type === 'income' && t.status === 'pending');

    const summary = transactions.reduce((acc, curr) => {
        if (curr.type === 'income') {
            acc.realIncome += curr.paidAmount;
            acc.receivables += curr.remainingAmount;
        } else {
            acc.totalExpenses += curr.totalAmount;
        }
        return acc;
    }, { realIncome: 0, totalExpenses: 0, receivables: 0 });

    // --- Render Helpers ---

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    if (showSetup) {
        return <FirebaseSetup onSave={handleSaveConfig} />;
    }

    if (loading && !isFirebaseInitialized) {
        return <div className="loading-screen">Iniciando aplicación...</div>;
    }

    if (loading) {
        return <div className="loading-screen">Cargando datos...</div>;
    }

    return (
        <div className="app-container">
            {/* Sidebar / Navigation */}
            <nav className="sidebar">
                <div className="logo">
                    <h2>BizControl</h2>
                </div>
                <ul className="nav-links">
                    <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
                        <LayoutDashboard size={20} /> Dashboard
                    </li>
                    <li className={activeTab === 'new' ? 'active' : ''} onClick={() => setActiveTab('new')}>
                        <PlusCircle size={20} /> Nuevo Registro
                    </li>
                    <li className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
                        <History size={20} /> Historial
                    </li>
                    <li className={activeTab === 'reminders' ? 'active' : ''} onClick={() => setActiveTab('reminders')}>
                        <Bell size={20} /> Cobranza
                        {pendingIncomes.length > 0 && <span className="badge">{pendingIncomes.length}</span>}
                    </li>
                </ul>
                <div className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                </div>
                <div className="theme-toggle" onClick={handleLogoutConfig} style={{ borderTop: 'none', marginTop: 0, paddingTop: '0.5rem' }}>
                    <Settings size={20} />
                    <span>Configuración</span>
                </div>
            </nav>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-bar">
                    <h1>{activeTab === 'dashboard' && 'Resumen General'}
                        {activeTab === 'new' && 'Nueva Transacción'}
                        {activeTab === 'history' && 'Historial de Operaciones'}
                        {activeTab === 'reminders' && 'Gestión de Cobranza'}
                    </h1>
                    <div className="user-info">
                        <span>{user ? 'Conectado' : 'Desconectado'}</span>
                    </div>
                </header>

                <div className="content-area">
                    {/* Dashboard View */}
                    {activeTab === 'dashboard' && (
                        <div className="dashboard-grid">
                            <div className="card income-card">
                                <h3>Ingresos Reales</h3>
                                <p className="amount">{formatCurrency(summary.realIncome)}</p>
                            </div>
                            <div className="card expense-card">
                                <h3>Gastos Totales</h3>
                                <p className="amount">{formatCurrency(summary.totalExpenses)}</p>
                            </div>
                            <div className="card receivable-card">
                                <h3>Cuentas por Cobrar</h3>
                                <p className="amount">{formatCurrency(summary.receivables)}</p>
                            </div>
                        </div>
                    )}

                    {/* New Transaction Form */}
                    {activeTab === 'new' && (
                        <div className="form-container">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Fecha</label>
                                    <input 
                                        type="date" 
                                        name="date" 
                                        value={formData.date} 
                                        onChange={handleInputChange} 
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tipo de Operación</label>
                                    <select name="type" value={formData.type} onChange={handleInputChange}>
                                        <option value="income">Ingreso</option>
                                        <option value="expense">Gasto</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{formData.type === 'income' ? 'Cliente' : 'Proveedor'}</label>
                                    <input 
                                        type="text" 
                                        name="entity" 
                                        value={formData.entity} 
                                        onChange={handleInputChange} 
                                        placeholder="Nombre..." 
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Concepto</label>
                                    <input 
                                        type="text" 
                                        name="concept" 
                                        value={formData.concept} 
                                        onChange={handleInputChange} 
                                        placeholder="Descripción..." 
                                        required 
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Monto Total</label>
                                        <input 
                                            type="number" 
                                            name="totalAmount" 
                                            value={formData.totalAmount} 
                                            onChange={handleInputChange} 
                                            step="0.01" 
                                            min="0" 
                                            required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Monto Pagado</label>
                                        <input 
                                            type="number" 
                                            name="paidAmount" 
                                            value={formData.paidAmount} 
                                            onChange={handleInputChange} 
                                            step="0.01" 
                                            min="0" 
                                            required 
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary">Registrar Operación</button>
                            </form>
                        </div>
                    )}

                    {/* History View */}
                    {activeTab === 'history' && (
                        <div className="history-container">
                            <div className="filters-bar">
                                <div className="search-box">
                                    <Search size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por nombre..." 
                                        value={filters.search}
                                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                                    />
                                </div>
                                <div className="filter-selects">
                                    <select 
                                        value={filters.type} 
                                        onChange={(e) => setFilters({...filters, type: e.target.value})}
                                    >
                                        <option value="all">Todos los Tipos</option>
                                        <option value="income">Ingresos</option>
                                        <option value="expense">Gastos</option>
                                    </select>
                                    <select 
                                        value={filters.status} 
                                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                                    >
                                        <option value="all">Todos los Estados</option>
                                        <option value="paid">Pagado</option>
                                        <option value="pending">Pendiente</option>
                                    </select>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Entidad</th>
                                            <th>Concepto</th>
                                            <th>Tipo</th>
                                            <th>Total</th>
                                            <th>Pagado</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTransactions.map(t => (
                                            <tr key={t.id}>
                                                <td>{t.date}</td>
                                                <td>{t.entity}</td>
                                                <td>{t.concept}</td>
                                                <td>
                                                    <span className={`badge-type ${t.type}`}>
                                                        {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                                                    </span>
                                                </td>
                                                <td>{t.formattedTotal}</td>
                                                <td>{t.formattedPaid}</td>
                                                <td>
                                                    <span className={`badge-status ${t.status}`}>
                                                        {t.isPaid ? 'Pagado' : 'Pendiente'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="btn-icon danger" onClick={() => handleDelete(t.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredTransactions.length === 0 && (
                                            <tr>
                                                <td colSpan="8" className="text-center">No se encontraron registros</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Reminders View */}
                    {activeTab === 'reminders' && (
                        <div className="reminders-container">
                            {pendingIncomes.length === 0 ? (
                                <div className="empty-state">
                                    <CheckCircle size={48} />
                                    <h3>¡Todo al día!</h3>
                                    <p>No hay cobros pendientes por gestionar.</p>
                                </div>
                            ) : (
                                <div className="reminders-grid">
                                    {pendingIncomes.map(t => (
                                        <div key={t.id} className="reminder-card">
                                            <div className="reminder-header">
                                                <h4>{t.entity}</h4>
                                                <span className="date">{t.date}</span>
                                            </div>
                                            <p className="concept">{t.concept}</p>
                                            <div className="reminder-amounts">
                                                <div className="amount-row">
                                                    <span>Total:</span>
                                                    <span>{t.formattedTotal}</span>
                                                </div>
                                                <div className="amount-row pending">
                                                    <span>Pendiente:</span>
                                                    <span>{t.formattedRemaining}</span>
                                                </div>
                                            </div>
                                            <button className="btn-whatsapp" onClick={() => handleReminder(t)}>
                                                Recordar Pago
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
