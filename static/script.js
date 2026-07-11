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
