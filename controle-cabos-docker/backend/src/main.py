from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import sqlite3
from datetime import datetime
import qrcode

app = Flask(__name__)
CORS(app)

# Configurações
DATABASE_PATH = '/app/database/controle_cabos.db'
UPLOAD_FOLDER = '/app/uploads'

# Criar diretórios se não existirem
os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def generate_qrcode(text):
    """Generate QR code image for given text and return file path"""
    filename = f"{text}.png"
    path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(path):
        img = qrcode.make(text)
        img.save(path)
    return path

def init_db():
    """Inicializar banco de dados"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Criar tabelas básicas
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tipos_cabo (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                prefixo TEXT NOT NULL UNIQUE,
                descricao TEXT,
                unidade_medida TEXT DEFAULT 'metros',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS caixas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero TEXT NOT NULL UNIQUE,
                tipo_cabo_id INTEGER,
                quantidade_inicial REAL,
                quantidade_atual REAL,
                status TEXT DEFAULT 'nova',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tipo_cabo_id) REFERENCES tipos_cabo (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS projetos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                descricao TEXT,
                status TEXT DEFAULT 'ativo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                caixa_id INTEGER,
                projeto_id INTEGER,
                quantidade_usada REAL,
                tecnico_responsavel TEXT,
                data_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                observacoes TEXT,
                FOREIGN KEY (caixa_id) REFERENCES caixas (id),
                FOREIGN KEY (projeto_id) REFERENCES projetos (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS configuracao_empresa (
                id INTEGER PRIMARY KEY,
                nome_empresa TEXT,
                logotipo_path TEXT,
                logotipo_posicao TEXT DEFAULT 'superior_esquerdo',
                logotipo_visivel BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ Banco de dados inicializado com sucesso!")
        return True
    except Exception as e:
        print(f"❌ Erro ao inicializar banco: {e}")
        return False

# Inicializar banco na inicialização
init_db()

# ==================== CONFIGURAÇÃO ====================
@app.route('/api/configuracao', methods=['GET'])
def get_configuracao():
    """Obter configuração da empresa"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM configuracao_empresa WHERE id = 1')
        config = cursor.fetchone()
        conn.close()
        
        if config:
            return jsonify({
                'nome_empresa': config[1] or 'Empresa',
                'logotipo_path': config[2],
                'logotipo_posicao': config[3],
                'logotipo_visivel': bool(config[4])
            })
        else:
            return jsonify({
                'nome_empresa': 'Sistema de Controle de Cabos',
                'logotipo_path': None,
                'logotipo_posicao': 'superior_esquerdo',
                'logotipo_visivel': True
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== TIPOS DE CABO ====================
@app.route('/api/tipos-cabo', methods=['GET'])
def get_tipos_cabo():
    """Listar tipos de cabo"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM tipos_cabo ORDER BY nome')
        tipos = cursor.fetchall()
        conn.close()
        
        result = []
        for tipo in tipos:
            result.append({
                'id': tipo[0],
                'nome': tipo[1],
                'prefixo': tipo[2],
                'descricao': tipo[3],
                'unidade_medida': tipo[4]
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tipos-cabo', methods=['POST'])
def create_tipo_cabo():
    """Criar novo tipo de cabo"""
    try:
        data = request.get_json()
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO tipos_cabo (nome, prefixo, descricao, unidade_medida)
            VALUES (?, ?, ?, ?)
        ''', (data['nome'], data['prefixo'].upper(), data.get('descricao', ''), data.get('unidade_medida', 'metros')))
        
        tipo_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({'id': tipo_id, 'message': 'Tipo de cabo criado com sucesso'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== CAIXAS ====================
@app.route('/api/caixas', methods=['GET'])
def get_caixas():
    """Listar caixas"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT c.*, tc.nome as tipo_nome, tc.prefixo 
            FROM caixas c 
            LEFT JOIN tipos_cabo tc ON c.tipo_cabo_id = tc.id 
            ORDER BY c.created_at DESC
        ''')
        caixas = cursor.fetchall()
        conn.close()
        
        result = []
        for caixa in caixas:
            result.append({
                'id': caixa[0],
                'numero': caixa[1],
                'tipo_cabo_id': caixa[2],
                'quantidade_inicial': caixa[3],
                'quantidade_atual': caixa[4],
                'status': caixa[5],
                'tipo_nome': caixa[7] if len(caixa) > 7 else None,
                'prefixo': caixa[8] if len(caixa) > 8 else None
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/caixas', methods=['POST'])
def create_caixa():
    """Criar nova caixa"""
    try:
        data = request.get_json()
        
        # Buscar tipo de cabo para gerar número
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT prefixo FROM tipos_cabo WHERE id = ?', (data['tipo_cabo_id'],))
        tipo = cursor.fetchone()
        
        if not tipo:
            return jsonify({'error': 'Tipo de cabo não encontrado'}), 400
        
        prefixo = tipo[0]
        
        # Gerar próximo número
        cursor.execute('SELECT COUNT(*) FROM caixas WHERE numero LIKE ?', (f'{prefixo}%',))
        count = cursor.fetchone()[0]
        numero = f'{prefixo}{count + 1:03d}'
        
        # Inserir caixa
        cursor.execute('''
            INSERT INTO caixas (numero, tipo_cabo_id, quantidade_inicial, quantidade_atual, status)
            VALUES (?, ?, ?, ?, ?)
        ''', (numero, data['tipo_cabo_id'], data['quantidade_inicial'], data['quantidade_inicial'], 'nova'))

        caixa_id = cursor.lastrowid
        conn.commit()
        conn.close()

        # Gerar QR Code
        generate_qrcode(numero)

        return jsonify({'id': caixa_id, 'numero': numero, 'message': 'Caixa criada com sucesso'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/caixas/buscar/<string:numero>', methods=['GET'])
def buscar_caixa(numero):
    """Buscar caixa pelo número"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT c.*, tc.nome as tipo_nome, tc.prefixo
            FROM caixas c
            LEFT JOIN tipos_cabo tc ON c.tipo_cabo_id = tc.id
            WHERE c.numero = ?
        ''', (numero.upper(),))
        caixa = cursor.fetchone()
        conn.close()

        if not caixa:
            return jsonify({'error': 'Caixa não encontrada'}), 404

        result = {
            'id': caixa[0],
            'numero': caixa[1],
            'tipo_cabo_id': caixa[2],
            'quantidade_inicial': caixa[3],
            'quantidade_atual': caixa[4],
            'status': caixa[5],
            'tipo_nome': caixa[7] if len(caixa) > 7 else None,
            'prefixo': caixa[8] if len(caixa) > 8 else None
        }

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/caixas/<int:caixa_id>/abrir', methods=['POST'])
def abrir_caixa(caixa_id):
    """Abrir caixa para uso"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT status FROM caixas WHERE id = ?', (caixa_id,))
        caixa = cursor.fetchone()

        if not caixa:
            conn.close()
            return jsonify({'error': 'Caixa não encontrada'}), 404

        if caixa[0] not in ('nova', 'fechada'):
            conn.close()
            return jsonify({'error': 'Caixa não pode ser aberta'}), 400

        cursor.execute('UPDATE caixas SET status = ? WHERE id = ?', ('aberta', caixa_id))
        conn.commit()
        conn.close()

        return jsonify({'message': 'Caixa aberta com sucesso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/caixas/<int:caixa_id>/fechar', methods=['POST'])
def fechar_caixa(caixa_id):
    """Fechar caixa após uso e registrar quantidade utilizada"""
    try:
        data = request.get_json()
        quantidade_final = float(data['quantidade_final'])
        projeto_id = data['projeto_id']
        tecnico = data['tecnico_responsavel']
        observacoes = data.get('observacoes', '')

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT quantidade_atual FROM caixas WHERE id = ?', (caixa_id,))
        caixa = cursor.fetchone()

        if not caixa:
            conn.close()
            return jsonify({'error': 'Caixa não encontrada'}), 404

        quantidade_atual = caixa[0]
        quantidade_usada = quantidade_atual - quantidade_final

        if quantidade_usada < 0:
            conn.close()
            return jsonify({'error': 'Quantidade final maior que quantidade atual'}), 400

        status = 'fechada'
        if quantidade_final <= 0:
            status = 'encerrada'

        cursor.execute('UPDATE caixas SET quantidade_atual = ?, status = ? WHERE id = ?',
                       (quantidade_final, status, caixa_id))
        cursor.execute('''
            INSERT INTO usos (caixa_id, projeto_id, quantidade_usada, tecnico_responsavel, observacoes)
            VALUES (?, ?, ?, ?, ?)
        ''', (caixa_id, projeto_id, quantidade_usada, tecnico, observacoes))
        conn.commit()
        conn.close()

        return jsonify({
            'message': 'Caixa fechada com sucesso',
            'quantidade_usada': quantidade_usada,
            'status': status
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/caixas/<int:caixa_id>/qrcode', methods=['GET'])
def get_caixa_qrcode(caixa_id):
    """Obter QR Code da caixa"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT numero FROM caixas WHERE id = ?', (caixa_id,))
        caixa = cursor.fetchone()
        conn.close()

        if not caixa:
            return jsonify({'error': 'Caixa não encontrada'}), 404

        path = generate_qrcode(caixa[0])
        return send_file(path, mimetype='image/png')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== PROJETOS ====================
@app.route('/api/projetos', methods=['GET'])
def get_projetos():
    """Listar projetos"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM projetos ORDER BY nome')
        projetos = cursor.fetchall()
        conn.close()
        
        result = []
        for projeto in projetos:
            result.append({
                'id': projeto[0],
                'nome': projeto[1],
                'descricao': projeto[2],
                'status': projeto[3]
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/projetos', methods=['POST'])
def create_projeto():
    """Criar novo projeto"""
    try:
        data = request.get_json()
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO projetos (nome, descricao, status)
            VALUES (?, ?, ?)
        ''', (data['nome'], data.get('descricao', ''), data.get('status', 'ativo')))
        
        projeto_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({'id': projeto_id, 'message': 'Projeto criado com sucesso'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== HEALTH CHECK ====================
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check"""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)
