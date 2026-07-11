-- Tabela 1: Cargos Industriais e Administrativos
CREATE TABLE IF NOT EXISTS cargos (
    id SERIAL PRIMARY KEY,
    nome_cargo VARCHAR(100) UNIQUE NOT NULL
);

-- Inserções padrão para o fluxo inicial do projeto
INSERT INTO cargos (nome_cargo) VALUES ('Operador'), ('Supervisor'), ('Gerente') ON CONFLICT DO NOTHING;

-- Tabela 2: Quadro Corporativo e Jornadas (CLT)
CREATE TABLE IF NOT EXISTS funcionarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    data_admissao DATE NOT NULL,
    cargo_id INT REFERENCES cargos(id),
    salario_base NUMERIC(10,2) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    horas_contratuais INT DEFAULT 220,
    regime_he VARCHAR(20) DEFAULT 'pagar',
    turno VARCHAR(20) DEFAULT 'diurno',
    hora_entrada TIME DEFAULT '08:00:00',
    he_semana INT DEFAULT 0,
    he_sabado INT DEFAULT 0,
    he_domingo INT DEFAULT 0,
    beneficios NUMERIC(10,2) DEFAULT 0.00,
    qtd_filhos INT DEFAULT 0,
    plano_saude NUMERIC(10,2) DEFAULT 0.00,
    plano_odonto NUMERIC(10,2) DEFAULT 0.00,
    vale_farmacia NUMERIC(10,2) DEFAULT 0.00,
    sindicato NUMERIC(10,2) DEFAULT 0.00,
    adiantamento VARCHAR(5) DEFAULT 'nao',
    vt_desconto VARCHAR(5) DEFAULT 'nao',
    observacoes TEXT,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela 3: Controle Imobiliário da Planta Fabril
CREATE TABLE IF NOT EXISTS investimentos_iniciais (
    id SERIAL PRIMARY KEY,
    descricao_terreno VARCHAR(255) DEFAULT 'Galpão Industrial Metalúrgico',
    valor_terreno NUMERIC(12,2) NOT NULL,
    custo_edificacao NUMERIC(12,2) NOT NULL,
    impostos_transferencia NUMERIC(12,2) NOT NULL,
    data_aquisicao DATE DEFAULT CURRENT_DATE
);

-- Tabela 4: Parque de Máquinas e Equipamentos CNC
CREATE TABLE IF NOT EXISTS maquinas (
    id SERIAL PRIMARY KEY,
    nome_maquina VARCHAR(100) NOT NULL,
    preco_compra NUMERIC(12,2) NOT NULL,
    tempo_vida_util_anos INT NOT NULL,
    valor_revenda_estimado NUMERIC(12,2) NOT NULL,
    custo_manutencao_anual NUMERIC(12,2) NOT NULL,
    horas_actives_ano INT NOT NULL,
    custo_minuto_maquina NUMERIC(10,4) NOT NULL
);
