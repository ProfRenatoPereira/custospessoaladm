// Variáveis Globais de Estado do Sistema
let funcionarios = [];
let supervisorNivel = 1;
let limiteCargos = {};

// Configurações Globais de Formatação
const FORMATO_MOEDA = { style: 'currency', currency: 'BRL' };

function formatarMoeda(valor) {
    if (valor === undefined || valor === null || isNaN(valor)) return "R$ 0,00";
    return Number(valor).toLocaleString('pt-BR', FORMATO_MOEDA);
}

// Inicialização do DOM e Eventos Principais
document.addEventListener('DOMContentLoaded', function() {
    console.log("Painel Fiscal Inicializado. Carregando dados...");
    
    // Carrega dados iniciais da API do backend
    atualizarDadosFiscais();
    
    // Configura os ouvintes de eventos para os formulários principais
    const formContratar = document.getElementById('formContratar');
    if (formContratar) {
        formContratar.addEventListener('submit', executarContratacao);
    }

    const formConfig = document.getElementById('formConfig');
    if (formConfig) {
        formConfig.addEventListener('submit', salvarConfiguracoesCaixa);
    }
    
    // Atualiza periodicamente os dados do dashboard em background (a cada 30 segundos)
    setInterval(atualizarDadosFiscais, 30000);
});




// Função para buscar os dados fiscais e funcionários do servidor backend
async function atualizarDadosFiscais() {
    try {
        const response = await fetch('/api/dados-fiscais');
        if (!response.ok) throw new Error('Falha na resposta do servidor.');
        
        const dados = await response.json();
        
        // Atualiza o estado global
        funcionarios = dados.funcionarios || [];
        supervisorNivel = dados.supervisor_nivel || 1;
        limiteCargos = dados.limites || {};
        
        // Dispara as atualizações de interface
        renderizarCardsDashboard(dados.metricas);
        renderizarTabela();
        renderizarGraficos(dados.graficos);
        
    } catch (erro) {
        console.error('Erro ao atualizar painel fiscal:', erro);
        exibirMensagemAlerta('Erro ao conectar com o servidor de dados.', 'erro');
    }
}

// Envia as configurações globais de caixa e supervisão para o backend
async function salvarConfiguracoesCaixa(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/configurar-caixa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const resultado = await response.json();
        if (response.ok) {
            exibirMensagemAlerta('Configurações de caixa atualizadas!', 'sucesso');
            atualizarDadosFiscais();
        } else {
            exibirMensagemAlerta(resultado.erro || 'Erro ao salvar configurações.', 'erro');
        }
    } catch (erro) {
        console.error('Erro na requisição de configuração:', erro);
    }
}



// Manipula o envio do formulário para contratar um novo colaborador
async function executarContratacao(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData.entries());

    // Validações básicas no lado do cliente
    if (!payload.nome || !payload.cargo || !payload.salario) {
        exibirMensagemAlerta('Por favor, preencha todos os campos obrigatórios.', 'erro');
        return;
    }

    try {
        const response = await fetch('/api/contratar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const resultado = await response.json();
        if (response.ok) {
            exibirMensagemAlerta('Colaborador contratado com sucesso!', 'sucesso');
            event.target.reset(); // Limpa os campos do formulário
            atualizarDadosFiscais();
        } else {
            exibirMensagemAlerta(resultado.erro || 'Erro ao processar contratação.', 'erro');
        }
    } catch (erro) {
        console.error('Erro ao enviar contratação:', erro);
        exibirMensagemAlerta('Não foi possível conectar ao servidor.', 'erro');
    }
}

// Utilitário para exibir notificações temporárias na interface
function exibirMensagemAlerta(texto, tipo) {
    const alertBox = document.getElementById('alerta-sistema') || criarElementoAlerta();
    alertBox.textContent = texto;
    alertBox.className = `alert-box ${tipo}`;
    alertBox.style.display = 'block';

    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 4000);
}

function criarElementoAlerta() {
    const div = document.createElement('div');
    div.id = 'alerta-sistema';
    div.style.position = 'fixed';
    div.style.top = '20px';
    div.style.right = '20px';
    div.style.padding = '15px 25px';
    div.style.borderRadius = '5px';
    div.style.color = '#fff';
    div.style.fontWeight = 'bold';
    div.style.zIndex = '9999';
    document.body.appendChild(div);
    return div;
}


// Renderiza os valores numéricos nos cards superiores do dashboard
function renderizarCardsDashboard(metricas) {
    if (!metricas) return;

    const elContratados = document.getElementById('card-contratados');
    const elFolhaBruta = document.getElementById('card-folha-bruta');
    const elImpostos = document.getElementById('card-impostos');
    const elMargem = document.getElementById('card-margem');

    if (elContratados) {
        elContratados.textContent = (metricas.total_contratados || 0) + ' / ' + (metricas.limite_total || 10);
    }
    if (elFolhaBruta) {
        elFolhaBruta.textContent = formatarMoeda(metricas.total_folha || 0);
    }
    if (elImpostos) {
        elImpostos.textContent = formatarMoeda(metricas.total_impostos || 0);
    }
    if (elMargem) {
        const margem = metricas.margem_operacional || 0;
        elMargem.textContent = margem.toFixed(2) + '%';
        
        // Altera a cor do texto dinamicamente baseado na saúde financeira
        if (margem < 10) {
            elMargem.style.color = '#ef4444'; // Vermelho (Alerta)
        } else if (margem < 25) {
            elMargem.style.color = '#f59e0b'; // Laranja (Atenção)
        } else {
            elMargem.style.color = '#10b981'; // Verde (Saudável)
        }
    }
}


// Renderiza dinamicamente as linhas da tabela de colaboradores correntes
function renderizarTabela() {
    const tbody = document.getElementById('tabela-funcionarios-corpo');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (funcionarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#6b7280;">Nenhum colaborador ativo cadastrado.</td></tr>';
        return;
    }

    funcionarios.forEach(f => {
        const tr = document.createElement('tr');
        
        // Formatação das colunas de dados do funcionário
        const colNome = '<td><div style="font-weight:600; color:#1f2937;">' + f.nome + '</div><small style="color:#6b7280;">ID: ' + f.id + '</small></td>';
        const colCargo = '<td><span class="badge-cargo">' + f.cargo + '</span></td>';
        const colJornada = '<td>' + (f.jornada || '44h') + ' / ' + (f.turno || 'Diurno') + '</td>';
        const colLiquido = '<td style="font-weight:600; color:#059669;">' + formatarMoeda(f.salario_liquido || (f.salario * 0.82)) + '</td>';
        
        // Montagem da célula de ações incluindo o novo botão de 13º Individual intercalado
        let colAcoes = '<td class="action-buttons">';
        colAcoes += '  <a onclick="abrirHoleriteMensal(' + f.id + ')" class="btn-link" style="color:#3b82f6; margin-right:8px;">📄 Mensal</a>';
        colAcoes += '  <a onclick="abrirFerias(' + f.id + ')" class="btn-link" style="color:#10b981; margin-right:8px;">🌴 Férias</a>';
        colAcoes += '  <a onclick="abrirDecimoTerceiroIndividual(' + f.id + ')" class="btn-link" style="color:#f59e0b; margin-right:8px; font-weight:bold;">💰 13º</a>';
        colAcoes += '  <a onclick="abrirRescisao(' + f.id + ')" class="btn-link" style="color:#ef4444;">❌ Demitir</a>';
        colAcoes += '</td>';

        tr.innerHTML = colNome + colCargo + colJornada + colLiquido + colAcoes;
        tbody.appendChild(tr);
    });
}



// Abre a janela de holerite de salário mensal padrão
function abrirHoleriteMensal(id) {
    const f = funcionarios.find(emp => emp.id === id);
    if (!f) return;

    const proventos = f.salario;
    const descontoInss = proventos * 0.09; 
    const liquido = proventos - descontoInss;

    const janela = window.open('', '_blank', 'width=800,height=900');
    if (!janela) { alert("Pop-up bloqueado pelo navegador!"); return; }

    let html = '<html><head><title>Holerite Mensal - ' + f.nome + '</title><style>' + obterEstiloHolerite() + '</style></head><body>';
    html += '<div class="recibo-box">';
    html += '  <div class="header"><h2>TERCEIRO ADM ASSOCIADOS</h2><p>DEMONSTRATIVO DE PAGAMENTO MENSAL</p></div>';
    html += '  <div class="dados"><strong>Colaborador:</strong> ' + f.nome + ' | <strong>Cargo:</strong> ' + f.cargo + '</div>';
    html += '  <table class="tabela-recibo">';
    html += '    <thead><tr><th>Cód</th><th>Descrição</th><th>Ref</th><th>Proventos</th><th>Descontos</th></tr></thead>';
    html += '    <tbody>';
    html += '      <tr><td>001</td><td>Salário Base</td><td>30 Dias</td><td>' + formatarMoeda(proventos) + '</td><td>-</td></tr>';
    html += '      <tr><td>100</td><td>INSS Mensal</td><td>9.00%</td><td>-</td><td>' + formatarMoeda(descontoInss) + '</td></tr>';
    html += '    </tbody>';
    html += '    <tfoot>';
    html += '      <tr><td colspan="3">Totais</td><td>' + formatarMoeda(proventos) + '</td><td>' + formatarMoeda(descontoInss) + '</td></tr>';
    html += '      <tr class="linha-liquido"><td colspan="3">LÍQUIDO A RECEBER</td><td colspan="2" class="valor-liquido">' + formatarMoeda(liquido) + '</td></tr>';
    html += '    </tfoot>';
    html += '  </table>';
    html += '</div></body></html>';

    janela.document.write(html);
    janela.document.close();
}

// Executa a demissão/rescisão de um colaborador chamando a API backend
async function abrirRescisao(id) {
    const f = funcionarios.find(emp => emp.id === id);
    if (!f) return;

    if (!confirm('Tem certeza de que deseja demitir o colaborador ' + f.nome + '?')) return;

    try {
        const response = await fetch('/api/demitir/' + id, { method: 'DELETE' });
        const resultado = await response.json();

        if (response.ok) {
            exibirMensagemAlerta('Colaborador desligado com sucesso.', 'sucesso');
            atualizarDadosFiscais();
        } else {
            exibirMensagemAlerta(resultado.erro || 'Erro ao processar desligamento.', 'erro');
        }
    } catch (erro) {
        console.error('Erro na requisição de demissão:', erro);
    }
}



// Abre a janela de recibo de férias do colaborador
function abrirFerias(id) {
    const f = funcionarios.find(emp => emp.id === id);
    if (!f) return;

    const baseCalculo = f.salario;
    const umTerco = baseCalculo / 3;
    const totalProventos = baseCalculo + umTerco;
    const descontoInss = totalProventos * 0.09;
    const liquido = totalProventos - descontoInss;

    const janela = window.open('', '_blank', 'width=800,height=900');
    if (!janela) { alert("Pop-up bloqueado pelo navegador!"); return; }

    let html = '<html><head><title>Recibo de Férias - ' + f.nome + '</title><style>' + obterEstiloHolerite() + '</style></head><body>';
    html += '<div class="recibo-box">';
    html += '  <div class="header"><h2>TERCEIRO ADM ASSOCIADOS</h2><p>AVISO E RECIBO DE FÉRIAS</p></div>';
    html += '  <div class="dados"><strong>Colaborador:</strong> ' + f.nome + ' | <strong>Cargo:</strong> ' + f.cargo + '</div>';
    html += '  <table class="tabela-recibo">';
    html += '    <thead><tr><th>Cód</th><th>Descrição</th><th>Ref</th><th>Proventos</th><th>Descontos</th></tr></thead>';
    html += '    <tbody>';
    html += '      <tr><td>020</td><td>Férias Regulamentares</td><td>30 Dias</td><td>' + formatarMoeda(baseCalculo) + '</td><td>-</td></tr>';
    html += '      <tr><td>021</td><td>1/3 Constitucional de Férias</td><td>33.33%</td><td>' + formatarMoeda(umTerco) + '</td><td>-</td></tr>';
    html += '      <tr><td>100</td><td>INSS sobre Férias</td><td>9.00%</td><td>-</td><td>' + formatarMoeda(descontoInss) + '</td></tr>';
    html += '    </tbody>';
    html += '    <tfoot>';
    html += '      <tr><td colspan="3">Totais</td><td>' + formatarMoeda(totalProventos) + '</td><td>' + formatarMoeda(descontoInss) + '</td></tr>';
    html += '      <tr class="linha-liquido"><td colspan="3">LÍQUIDO A RECEBER</td><td colspan="2" class="valor-liquido">' + formatarMoeda(liquido) + '</td></tr>';
    html += '    </tfoot>';
    html += '  </table>';
    html += '</div></body></html>';

    janela.document.write(html);
    janela.document.close();
}

// Lógica para processamento em lote (Geral) via cabeçalho/dashboard
async function abrirDecimoTerceiroGeral() {
    if (funcionarios.length === 0) {
        exibirMensagemAlerta('Não há colaboradores para processamento coletivo.', 'erro');
        return;
    }
    if (!confirm('Deseja gerar o relatório de 13º salário de TODOS os funcionários ativos?')) return;
    
    // Abre janela com consolidação de toda a folha corporativa de 13º
    const janela = window.open('', '_blank', 'width=800,height=900');
    if (!janela) return;
    
    let html = '<html><head><title>Folha Geral - 13º Salário</title><style>' + obterEstiloHolerite() + '</style></head><body>';
    html += '<div class="recibo-box"><h2>FOLHA GERAL - 13º SALÁRIO CORPORATIVO</h2><hr>';
    funcionarios.forEach(f => {
        html += '<p><strong>' + f.nome + '</strong> - ' + f.cargo + ': ' + formatarMoeda(f.salario) + '</p>';
    });
    html += '</div></body></html>';
    janela.document.write(html);
    janela.document.close();
}



// Abre a janela de recibo de 13º Salário Individual Proporcional
function abrirDecimoTerceiroIndividual(id) {
    const f = funcionarios.find(emp => emp.id === id);
    if (!f) return;

    // Cálculo dos meses trabalhados no ano corrente para proporcionalidade
    const dataAdmissao = f.data_admissao ? new Date(f.data_admissao) : new Date();
    const anoAtual = new Date().getFullYear();
    let mesesTrabalhados = 12;

    // Se o colaborador foi admitido no ano corrente, calcula a proporção correta
    if (dataAdmissao.getFullYear() === anoAtual) {
        mesesTrabalhados = 12 - dataAdmissao.getMonth();
        if (mesesTrabalhados < 1) mesesTrabalhados = 1;
    }

    const valorProporcional = (f.salario / 12) * mesesTrabalhados;
    const descontoInss = valorProporcional * 0.09; // Alíquota fixa de 9% para o simulador
    const liquido = valorProporcional - descontoInss;

    const janela = window.open('', '_blank', 'width=800,height=900');
    if (!janela) { 
        alert("Pop-up bloqueado pelo navegador! Ative as permissões."); 
        return; 
    }

    let html = '<html><head><title>13º Salário - ' + f.nome + '</title><style>' + obterEstiloHolerite() + '</style></head><body>';
    html += '<div class="recibo-box">';
    html += '  <div class="header"><h2>TERCEIRO ADM ASSOCIADOS</h2><p>RECIBO DE 13º SALÁRIO INDIVIDUAL</p></div>';
    html += '  <div class="dados"><strong>Colaborador:</strong> ' + f.nome + ' | <strong>Cargo:</strong> ' + f.cargo + '</div>';
    html += '  <table class="tabela-recibo">';
    html += '    <thead><tr><th>Cód</th><th>Descrição</th><th>Ref</th><th>Proventos</th><th>Descontos</th></tr></thead>';
    html += '    <tbody>';
    html += '      <tr><td>050</td><td>13º Salário Proporcional</td><td>' + mesesTrabalhados + '/12 avos</td><td>' + formatarMoeda(valorProporcional) + '</td><td>-</td></tr>';
    html += '      <tr><td>110</td><td>INSS sobre 13º Salário</td><td>9.00%</td><td>-</td><td>' + formatarMoeda(descontoInss) + '</td></tr>';
    html += '    </tbody>';
    html += '    <tfoot>';
    html += '      <tr><td colspan="3">Totais</td><td>' + formatarMoeda(valorProporcional) + '</td><td>' + formatarMoeda(descontoInss) + '</td></tr>';
    html += '      <tr class="linha-liquido"><td colspan="3">LÍQUIDO A RECEBER</td><td colspan="2" class="valor-liquido">' + formatarMoeda(liquido) + '</td></tr>';
    html += '    </tfoot>';
    html += '  </table>';
    html += '  <div class="assinatura"><br><br><p>________________________________________</p><p>Assinatura do Colaborador</p></div>';
    html += '</div></body></html>';

    janela.document.write(html);
    janela.document.close();
}



// Renderiza os gráficos estatísticos do painel utilizando as bibliotecas padrão
function renderizarGraficos(dadosGraficos) {
    if (!dadosGraficos) return;
    console.log("Atualizando representações gráficas macroeconômicas...");
    // A lógica de desenho dos gráficos do seu painel se aplica aqui
}

// Retorna as definições estéticas de CSS compartilhadas para a abertura de novas abas
function obterEstiloHolerite() {
    return `
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 40px; 
            background-color: #f3f4f6; 
            color: #1f2937; 
        }
        .recibo-box { 
            max-width: 700px; 
            margin: 0 auto; 
            background: #fff; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
            border: 1px solid #e5e7eb;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px dashed #d1d5db; 
            padding-bottom: 15px; 
            margin-bottom: 20px; 
        }
        .header h2 { margin: 0; color: #111827; font-size: 1.6rem; }
        .header p { margin: 5px 0 0 0; color: #4b5563; font-weight: 600; letter-spacing: 0.5px; }
        .dados { 
            background: #f9fafb; 
            padding: 12px; 
            border-radius: 6px; 
            margin-bottom: 25px; 
            font-size: 0.95rem; 
            border-left: 4px solid #3b82f6;
        }
        .tabela-recibo { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px; 
        }
        .tabela-recibo th { 
            background: #f3f4f6; 
            text-align: left; 
            padding: 10px; 
            font-size: 0.85rem; 
            text-transform: uppercase; 
            color: #4b5563;
        }
        .tabela-recibo td { 
            padding: 12px 10px; 
            border-bottom: 1px solid #f3f4f6; 
            font-size: 0.95rem; 
        }
        .tabela-recibo tfoot td { 
            font-weight: bold; 
            background: #fafafa; 
            border-top: 2px solid #e5e7eb; 
        }
        .linha-liquido { background: #ecfdf5 !important; }
        .linha-liquido td { color: #065f46; font-size: 1.05rem; }
        .valor-liquido { text-align: right; font-size: 1.25rem !important; color: #047857; font-weight: 800; }
        .assinatura { 
            text-align: center; 
            margin-top: 50px; 
            font-size: 0.9rem; 
            color: #4b5563; 
        }
    `;
}
