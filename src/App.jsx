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

const FirebaseSetup = ({ onSave, initialError }) => {
    const [configInput, setConfigInput] = useState({
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        measurementId: ''
    });
    const [error, setError] = useState(initialError || '');
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    useEffect(() => {
        if (initialError) setError(initialError);
    }, [initialError]);

    useEffect(() => {
        const currentConfig = firebaseManager.loadConfig();
        if (currentConfig) {
            setConfigInput(prev => ({
                ...prev,
                apiKey: currentConfig.apiKey || '',
                authDomain: currentConfig.authDomain || '',
                projectId: currentConfig.projectId || '',
                storageBucket: currentConfig.storageBucket || '',
                messagingSenderId: currentConfig.messagingSenderId || '',
                appId: currentConfig.appId || '',
                measurementId: currentConfig.measurementId || ''
            }));
        }
    }, []);

    const cleanInput = (val) => {
        if (!val) return '';
        return val.trim().replace(/^["']|["']$/g, '');
    };

    const getConfigFromInputs = () => {
        return {
            apiKey: cleanInput(configInput.apiKey),
            authDomain: cleanInput(configInput.authDomain),
            projectId: cleanInput(configInput.projectId),
            storageBucket: cleanInput(configInput.storageBucket),
            messagingSenderId: cleanInput(configInput.messagingSenderId),
            appId: cleanInput(configInput.appId),
            measurementId: cleanInput(configInput.measurementId)
        };
    };

    const getFriendlyErrorMessage = (error) => {
        const message = error.message || error.toString();
        if (message.includes('auth/configuration-not-found') || message.includes('auth/admin-restricted-operation')) {
            return (
                <span>
                    <strong>Error de configuración en Firebase:</strong> La autenticación anónima no está habilitada.
                    <br/><br/>
                    Por favor ve a la <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>Consola de Firebase</a>:
                    <ol style={{marginLeft: '1.5rem', marginTop: '0.5rem'}}>
                        <li>Selecciona tu proyecto</li>
                        <li>Ve a <strong>Authentication</strong> {'>'} <strong>Sign-in method</strong></li>
                        <li>Habilita el proveedor <strong>Anonymous</strong> (Anónimo)</li>
                    </ol>
                </span>
            );
        }
        if (message.includes('auth/api-key-not-valid')) {
            return "La API Key es inválida. Verifica que la hayas copiado correctamente.";
        }
        if (message.includes('auth/invalid-api-key')) {
            return "La API Key es inválida. Verifica que la hayas copiado correctamente.";
        }
        if (message.includes('auth/project-not-found')) {
            return "No se encontró el proyecto. Verifica el Project ID.";
        }
        return "Error de conexión: " + message;
    };

    const handleTest = async () => {
        setError('');
        setTestResult(null);
        const config = getConfigFromInputs();

        if (!firebaseManager.isValidConfig(config)) {
            setError("Configuración incompleta. Se requieren al menos apiKey, authDomain y projectId.");
            return;
        }

        setIsTesting(true);
        try {
            const result = await firebaseManager.testConfig(config);
            if (result.success) {
                setTestResult({ type: 'success', message: '¡Conexión exitosa! La configuración es válida.' });
            } else {
                setTestResult({ type: 'error', message: getFriendlyErrorMessage(result.error) });
            }
        } catch (e) {
            setTestResult({ type: 'error', message: 'Error inesperado: ' + e.message });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setTestResult(null);
        
        const config = getConfigFromInputs();

        if (firebaseManager.isValidConfig(config)) {
            // Optional: Test before saving if not already tested successfully
            if (!testResult || testResult.type !== 'success') {
                setIsTesting(true);
                const result = await firebaseManager.testConfig(config);
                setIsTesting(false);
                if (!result.success) {
                    setError(getFriendlyErrorMessage(result.error));
                    return;
                }
            }
            onSave(config);
        } else {
            setError("La configuración parece inválida o incompleta. Debe contener al menos apiKey, authDomain y projectId.");
        }
    };

    return (
        <div className="setup-container" style={{
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh', 
            backgroundColor: 'var(--background-color)',
            color: 'var(--text-primary)',
            padding: '2rem'
        }}>
            <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <Settings size={48} color="var(--primary-color)" />
                    <h2 style={{ marginTop: '1rem' }}>Configuración de Firebase</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Ingresa los datos de tu proyecto Firebase. Asegúrate de habilitar la <strong>Autenticación Anónima</strong> en la consola de Firebase.
                    </p>
                </div>
                
                <form onSubmit={handleSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>API Key <span style={{color: 'red'}}>*</span></label>
                            <input 
                                type="text" 
                                name="apiKey"
                                value={configInput.apiKey || ''}
                                onChange={(e) => setConfigInput({...configInput, apiKey: e.target.value})}
                                placeholder="AIzaSy..."
                                required
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Auth Domain <span style={{color: 'red'}}>*</span></label>
                            <input 
                                type="text" 
                                name="authDomain"
                                value={configInput.authDomain || ''}
                                onChange={(e) => setConfigInput({...configInput, authDomain: e.target.value})}
                                placeholder="project-id.firebaseapp.com"
                                required
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Project ID <span style={{color: 'red'}}>*</span></label>
                            <input 
                                type="text" 
                                name="projectId"
                                value={configInput.projectId || ''}
                                onChange={(e) => setConfigInput({...configInput, projectId: e.target.value})}
                                placeholder="project-id"
                                required
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Storage Bucket</label>
                            <input 
                                type="text" 
                                name="storageBucket"
                                value={configInput.storageBucket || ''}
                                onChange={(e) => setConfigInput({...configInput, storageBucket: e.target.value})}
                                placeholder="project-id.appspot.com"
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Messaging Sender ID</label>
                            <input 
                                type="text" 
                                name="messagingSenderId"
                                value={configInput.messagingSenderId || ''}
                                onChange={(e) => setConfigInput({...configInput, messagingSenderId: e.target.value})}
                                placeholder="123456789"
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>App ID</label>
                            <input 
                                type="text" 
                                name="appId"
                                value={configInput.appId || ''}
                                onChange={(e) => setConfigInput({...configInput, appId: e.target.value})}
                                placeholder="1:123456789:web:abcdef"
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Measurement ID</label>
                            <input 
                                type="text" 
                                name="measurementId"
                                value={configInput.measurementId || ''}
                                onChange={(e) => setConfigInput({...configInput, measurementId: e.target.value})}
                                placeholder="G-ABCDEF123"
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                    </div>
                    
                    <div className="form-group" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <label style={{ fontSize: '0.9rem' }}>O pega el código de configuración aquí (JS o JSON)</label>
                        <textarea 
                            onChange={(e) => {
                                try {
                                    let val = e.target.value;
                                    // Remove comments
                                    val = val.replace(/\/\/.*$/gm, '');
                                    // Extract object part if it looks like code
                                    const openBrace = val.indexOf('{');
                                    const closeBrace = val.lastIndexOf('}');
                                    if (openBrace !== -1 && closeBrace !== -1) {
                                        val = val.substring(openBrace, closeBrace + 1);
                                    }
                                    
                                    // Try to handle JS object syntax to JSON
                                    // 1. Quote keys
                                    let jsonString = val.replace(/(\w+)\s*:/g, '"$1":');
                                    // 2. Replace single quotes with double quotes for values
                                    jsonString = jsonString.replace(/'/g, '"');
                                    // 3. Remove trailing commas (common in JS objects but invalid in JSON)
                                    jsonString = jsonString.replace(/,\s*}/g, '}');
                                    
                                    const parsed = JSON.parse(jsonString);
                                    setConfigInput({
                                        apiKey: parsed.apiKey || '',
                                        authDomain: parsed.authDomain || '',
                                        projectId: parsed.projectId || '',
                                        storageBucket: parsed.storageBucket || '',
                                        messagingSenderId: parsed.messagingSenderId || '',
                                        appId: parsed.appId || '',
                                        measurementId: parsed.measurementId || ''
                                    });
                                    setError(null);
                                    setTestResult({ type: 'success', message: 'Configuración parseada correctamente. Verifica los campos arriba.' });
                                } catch (err) {
                                    // Ignore parse errors while typing
                                }
                            }}
                            placeholder='const firebaseConfig = { apiKey: "...", ... };'
                            style={{ 
                                width: '100%', 
                                height: '80px', 
                                padding: '0.5rem', 
                                fontFamily: 'monospace',
                                fontSize: '0.8rem'
                            }}
                        />
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

                    {testResult && (
                        <div style={{ 
                            padding: '0.75rem', 
                            backgroundColor: testResult.type === 'success' ? '#dcfce7' : '#fee2e2', 
                            color: testResult.type === 'success' ? '#166534' : '#991b1b', 
                            borderRadius: '0.5rem', 
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {testResult.message}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={handleTest}
                            disabled={isTesting}
                            style={{ flex: 1 }}
                        >
                            {isTesting ? 'Probando...' : 'Probar Conexión'}
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={isTesting}
                            style={{ flex: 1 }}
                        >
                            Guardar y Continuar
                        </button>
                    </div>
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
    const [authError, setAuthError] = useState('');

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

        const unsubscribeAuth = firebaseManager.authenticate(
            (currentUser) => {
                setUser(currentUser);
                if (currentUser) {
                    subscribeToTransactions();
                }
            },
            (error) => {
                console.error("Auth error in App:", error);
                setAuthError("Error de autenticación: " + error.message + ". Por favor verifica tu configuración.");
                setShowSetup(true);
            }
        );

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
        return <FirebaseSetup onSave={handleSaveConfig} initialError={authError} />;
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
