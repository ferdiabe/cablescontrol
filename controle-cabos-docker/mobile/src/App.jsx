import React, { useState, useEffect } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [caixaData, setCaixaData] = useState(null);
  const [projetos, setProjetos] = useState([]);
  const [codigoManual, setCodigoManual] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    carregarProjetos();
  }, []);

  const carregarProjetos = async () => {
    try {
      const response = await fetch('/api/projetos');
      const data = await response.json();
      setProjetos(data);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  const buscarCaixaPorCodigo = async (codigo) => {
    if (!codigo.trim()) {
      setError('Digite um código válido');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/caixas/buscar/${codigo.trim()}`);
      
      if (response.ok) {
        const data = await response.json();
        setCaixaData(data);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Caixa não encontrada');
        setCaixaData(null);
      }
    } catch (error) {
      setError('Erro ao buscar caixa: ' + error.message);
      setCaixaData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarManual = (e) => {
    e.preventDefault();
    buscarCaixaPorCodigo(codigoManual);
  };

  const abrirCaixa = async (projetoId, tecnico) => {
    if (!projetoId || !tecnico.trim()) {
      alert('Selecione um projeto e informe o técnico responsável');
      return;
    }

    try {
      const response = await fetch(`/api/caixas/${caixaData.id}/abrir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projeto_id: projetoId,
          tecnico_responsavel: tecnico
        })
      });

      if (response.ok) {
        alert('Caixa aberta com sucesso!');
        buscarCaixaPorCodigo(caixaData.numero); // Recarregar dados
      } else {
        const error = await response.json();
        alert('Erro: ' + error.error);
      }
    } catch (error) {
      alert('Erro ao abrir caixa: ' + error.message);
    }
  };

  const fecharCaixa = async (projetoId, tecnico, quantidadeFinal, observacoes) => {
    if (!projetoId || !tecnico.trim() || quantidadeFinal === '') {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const response = await fetch(`/api/caixas/${caixaData.id}/fechar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projeto_id: projetoId,
          tecnico_responsavel: tecnico,
          quantidade_final: parseFloat(quantidadeFinal),
          observacoes: observacoes
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        buscarCaixaPorCodigo(caixaData.numero); // Recarregar dados
      } else {
        const error = await response.json();
        alert('Erro: ' + error.error);
      }
    } catch (error) {
      alert('Erro ao fechar caixa: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'nova': return '#28a745';
      case 'aberta': return '#ffc107';
      case 'fechada': return '#17a2b8';
      case 'encerrada': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'nova': return '🆕 Nova';
      case 'aberta': return '🔓 Aberta';
      case 'fechada': return '🔒 Fechada';
      case 'encerrada': return '❌ Encerrada';
      default: return status;
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        📱 Scanner QR Code - Cabos
      </h1>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '20px',
        backgroundColor: 'white',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => setActiveTab('scanner')}
          style={{
            flex: 1,
            padding: '15px',
            border: 'none',
            backgroundColor: activeTab === 'scanner' ? '#007bff' : 'white',
            color: activeTab === 'scanner' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          📷 Scanner QR
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          style={{
            flex: 1,
            padding: '15px',
            border: 'none',
            backgroundColor: activeTab === 'manual' ? '#007bff' : 'white',
            color: activeTab === 'manual' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          ⌨️ Código Manual
        </button>
      </div>

      {/* Scanner Tab */}
      {activeTab === 'scanner' && (
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ 
            border: '3px dashed #007bff',
            borderRadius: '10px',
            padding: '40px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📷</div>
            <p style={{ fontSize: '18px', color: '#6c757d', marginBottom: '20px' }}>
              Scanner QR Code em desenvolvimento
            </p>
            <p style={{ fontSize: '14px', color: '#6c757d' }}>
              Use a aba "Código Manual" para buscar caixas por enquanto
            </p>
          </div>
          
          <button 
            style={{ 
              padding: '15px 30px', 
              fontSize: '18px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'not-allowed',
              opacity: 0.6
            }}
            disabled
          >
            🚧 Em Desenvolvimento
          </button>
        </div>
      )}

      {/* Manual Tab */}
      {activeTab === 'manual' && (
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>🔍 Buscar Caixa por Código</h3>
          
          <form onSubmit={handleBuscarManual}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Código da Caixa:
              </label>
              <input
                type="text"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
                placeholder="Ex: C6001, P12002, UTP001"
                disabled={loading}
              />
              <small style={{ color: '#6c757d', display: 'block', marginTop: '5px' }}>
                Digite o código exato da caixa (ex: C6001)
              </small>
            </div>

            <button
              type="submit"
              disabled={loading || !codigoManual.trim()}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: loading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '🔍 Buscando...' : '🔍 Buscar Caixa'}
            </button>
          </form>

          {error && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              border: '1px solid #f5c6cb',
              borderRadius: '8px'
            }}>
              ❌ {error}
            </div>
          )}
        </div>
      )}

      {/* Dados da Caixa */}
      {caixaData && (
        <CaixaInfo 
          caixa={caixaData} 
          projetos={projetos}
          onAbrirCaixa={abrirCaixa}
          onFecharCaixa={fecharCaixa}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      )}

      {/* Links Úteis */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>🔗 Links Úteis</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="/" style={{ 
            color: '#007bff', 
            textDecoration: 'none',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '5px',
            display: 'block'
          }}>
            ← Voltar ao Sistema Principal
          </a>
          <a href="/api/health" style={{ 
            color: '#007bff', 
            textDecoration: 'none',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '5px',
            display: 'block'
          }}>
            🔧 Status da API
          </a>
        </div>
      </div>
    </div>
  );
};

// Componente para exibir informações da caixa
const CaixaInfo = ({ caixa, projetos, onAbrirCaixa, onFecharCaixa, getStatusColor, getStatusText }) => {
  const [projetoSelecionado, setProjetoSelecionado] = useState('');
  const [tecnicoResponsavel, setTecnicoResponsavel] = useState('');
  const [quantidadeFinal, setQuantidadeFinal] = useState('');
  const [observacoes, setObservacoes] = useState('');

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '25px',
      borderRadius: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginBottom: '20px', color: '#333' }}>📦 Informações da Caixa</h3>
      
      {/* Info da Caixa */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <strong>Número:</strong>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
              {caixa.numero}
            </div>
          </div>
          <div>
            <strong>Status:</strong>
            <div style={{ 
              color: getStatusColor(caixa.status),
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              {getStatusText(caixa.status)}
            </div>
          </div>
          <div>
            <strong>Tipo:</strong>
            <div>{caixa.tipo_nome}</div>
          </div>
          <div>
            <strong>Quantidade Atual:</strong>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {caixa.quantidade_atual}m
            </div>
          </div>
        </div>
      </div>

      {/* Ações baseadas no status */}
      {caixa.status === 'nova' && (
        <div>
          <h4>🔓 Abrir Caixa para Uso</h4>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Projeto:
            </label>
            <select
              value={projetoSelecionado}
              onChange={(e) => setProjetoSelecionado(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            >
              <option value="">Selecione um projeto</option>
              {projetos.map(projeto => (
                <option key={projeto.id} value={projeto.id}>
                  {projeto.nome}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Técnico Responsável:
            </label>
            <input
              type="text"
              value={tecnicoResponsavel}
              onChange={(e) => setTecnicoResponsavel(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
              placeholder="Nome do técnico"
            />
          </div>

          <button
            onClick={() => onAbrirCaixa(projetoSelecionado, tecnicoResponsavel)}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔓 Abrir Caixa
          </button>
        </div>
      )}

      {caixa.status === 'aberta' && (
        <div>
          <h4>🔒 Fechar Caixa após Uso</h4>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Projeto:
            </label>
            <select
              value={projetoSelecionado}
              onChange={(e) => setProjetoSelecionado(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            >
              <option value="">Selecione um projeto</option>
              {projetos.map(projeto => (
                <option key={projeto.id} value={projeto.id}>
                  {projeto.nome}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Técnico Responsável:
            </label>
            <input
              type="text"
              value={tecnicoResponsavel}
              onChange={(e) => setTecnicoResponsavel(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
              placeholder="Nome do técnico"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Quantidade Final (metros):
            </label>
            <input
              type="number"
              value={quantidadeFinal}
              onChange={(e) => setQuantidadeFinal(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
              placeholder="Quantidade restante"
              min="0"
              step="0.1"
            />
            <small style={{ color: '#6c757d' }}>
              Atual: {caixa.quantidade_atual}m
            </small>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Observações:
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px',
                minHeight: '80px'
              }}
              placeholder="Observações sobre o uso (opcional)"
            />
          </div>

          <button
            onClick={() => onFecharCaixa(projetoSelecionado, tecnicoResponsavel, quantidadeFinal, observacoes)}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔒 Fechar Caixa
          </button>
        </div>
      )}

      {(caixa.status === 'fechada' || caixa.status === 'encerrada') && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '18px', color: '#6c757d' }}>
            {caixa.status === 'fechada' 
              ? '✅ Caixa fechada. Pode ser reutilizada em outro projeto.'
              : '❌ Caixa encerrada. Cabo esgotado.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
