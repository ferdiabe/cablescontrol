import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = '/api';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [tiposCabo, setTiposCabo] = useState([]);
  const [caixas, setCaixas] = useState([]);
  const [projetos, setProjetos] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tiposRes, caixasRes, projetosRes] = await Promise.all([
        fetch(`${API_BASE}/tipos-cabo`),
        fetch(`${API_BASE}/caixas`),
        fetch(`${API_BASE}/projetos`)
      ]);
      
      setTiposCabo(await tiposRes.json());
      setCaixas(await caixasRes.json());
      setProjetos(await projetosRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const Dashboard = () => (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="stats">
        <div className="stat-card">
          <h3>Tipos de Cabo</h3>
          <p>{tiposCabo.length}</p>
        </div>
        <div className="stat-card">
          <h3>Caixas</h3>
          <p>{caixas.length}</p>
        </div>
        <div className="stat-card">
          <h3>Projetos</h3>
          <p>{projetos.length}</p>
        </div>
      </div>
    </div>
  );

  const TiposCaboPage = () => {
    const [formData, setFormData] = useState({
      nome: '',
      prefixo: '',
      descricao: '',
      unidade_medida: 'metros'
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(`${API_BASE}/tipos-cabo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          alert('Tipo de cabo criado com sucesso!');
          setFormData({ nome: '', prefixo: '', descricao: '', unidade_medida: 'metros' });
          fetchData();
        }
      } catch (error) {
        alert('Erro ao criar tipo de cabo');
      }
    };

    return (
      <div className="tipos-cabo">
        <h2>Tipos de Cabo</h2>
        
        <form onSubmit={handleSubmit} className="form">
          <input
            type="text"
            placeholder="Nome do cabo"
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Prefixo (1-4 chars)"
            maxLength="4"
            value={formData.prefixo}
            onChange={(e) => setFormData({...formData, prefixo: e.target.value.toUpperCase()})}
            required
          />
          <textarea
            placeholder="Descrição"
            value={formData.descricao}
            onChange={(e) => setFormData({...formData, descricao: e.target.value})}
          />
          <select
            value={formData.unidade_medida}
            onChange={(e) => setFormData({...formData, unidade_medida: e.target.value})}
          >
            <option value="metros">Metros</option>
            <option value="unidades">Unidades</option>
          </select>
          <button type="submit">Criar Tipo</button>
        </form>

        <div className="lista">
          {tiposCabo.map(tipo => (
            <div key={tipo.id} className="item-card">
              <h3>{tipo.nome}</h3>
              <p><strong>Prefixo:</strong> {tipo.prefixo}</p>
              <p>{tipo.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CaixasPage = () => {
    const [formData, setFormData] = useState({
      tipo_cabo_id: '',
      quantidade_inicial: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(`${API_BASE}/caixas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            quantidade_inicial: parseFloat(formData.quantidade_inicial)
          })
        });
        
        if (response.ok) {
          alert('Caixa criada com sucesso!');
          setFormData({ tipo_cabo_id: '', quantidade_inicial: '' });
          fetchData();
        }
      } catch (error) {
        alert('Erro ao criar caixa');
      }
    };

    return (
      <div className="caixas">
        <h2>Caixas de Cabo</h2>
        
        <form onSubmit={handleSubmit} className="form">
          <select
            value={formData.tipo_cabo_id}
            onChange={(e) => setFormData({...formData, tipo_cabo_id: e.target.value})}
            required
          >
            <option value="">Selecione o tipo de cabo</option>
            {tiposCabo.map(tipo => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.prefixo} - {tipo.nome}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.1"
            placeholder="Quantidade inicial"
            value={formData.quantidade_inicial}
            onChange={(e) => setFormData({...formData, quantidade_inicial: e.target.value})}
            required
          />
          <button type="submit">Criar Caixa</button>
        </form>

        <div className="lista">
          {caixas.map(caixa => (
            <div key={caixa.id} className="item-card">
              <h3>{caixa.numero}</h3>
              <p><strong>Tipo:</strong> {caixa.tipo_nome}</p>
              <p><strong>Quantidade:</strong> {caixa.quantidade_atual}/{caixa.quantidade_inicial}</p>
              <p><strong>Status:</strong> {caixa.status}</p>
              <p><a href={`${API_BASE}/caixas/${caixa.id}/qrcode`} target="_blank" rel="noopener noreferrer">QR Code</a></p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🔌 Sistema de Controle de Cabos</h1>
        <nav>
          <button onClick={() => setCurrentPage('dashboard')}>Dashboard</button>
          <button onClick={() => setCurrentPage('tipos')}>Tipos de Cabo</button>
          <button onClick={() => setCurrentPage('caixas')}>Caixas</button>
        </nav>
      </header>

      <main className="main">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'tipos' && <TiposCaboPage />}
        {currentPage === 'caixas' && <CaixasPage />}
      </main>
    </div>
  );
}

export default App;
