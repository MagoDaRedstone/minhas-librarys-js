(function () {
    // Criação do console de erros
    const consoleContainer = document.createElement('div');
    consoleContainer.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        background-color: #1a1a1a;
        color: #f2f2f2;
        overflow-y: auto;
        max-height: 400px;
        z-index: 9999;
        padding: 10px;
        border-top: 1px solid #444;
        font-family: Arial, sans-serif;
        display: block;
    `;
    document.body.appendChild(consoleContainer);

    // Variável para armazenar logs em string
    let errorLogsString = '';

    // Função para adicionar e renderizar logs
    function logError(error) {
        const logs = JSON.parse(errorLogsString || '[]');
        logs.push(error);
        errorLogsString = JSON.stringify(logs);
        renderLogsTable(logs);
    }

    // Função para renderizar logs no console
    function renderLogsTable(logs) {
        consoleContainer.innerHTML = `
            <table style="width: 100%; color: #f2f2f2; border-collapse: collapse; border-spacing: 0;">
                <thead>
                    <tr style="border-bottom: 1px solid #444;">
                        <th style="padding: 5px;">Tipo</th>
                        <th style="padding: 5px;">Mensagem</th>
                        <th style="padding: 5px;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs
                        .map(
                            (log, index) => `
                        <tr style="border-bottom: 1px solid #444;" data-index="${index}" data-stack="${log.stack || 'N/A'}">
                            <td style="padding: 5px;">${log.type}</td>
                            <td style="padding: 5px;">${log.message}</td>
                            <td style="padding: 5px;">
                                <button style="margin-right: 5px; background-color: #2ecc71; color: white; border: none; padding: 5px; cursor: pointer;" onclick="markAsResolved(this)">✔️ Resolvido</button>
                                <button style="background-color: #e67e22; color: white; border: none; padding: 5px; cursor: pointer;" onclick="toggleDetails(this)">🔍 Detalhes</button>
                                <button style="background-color: #e74c3c; color: white; border: none; padding: 5px; cursor: pointer;" onclick="copyToClipboard('${log.stack || ''}')">📋 Copiar Stack</button>
                            </td>
                        </tr>
                    `
                        )
                        .join('')}
                </tbody>
            </table>
        `;
    }

    // Função para analisar stack trace e extrair informações detalhadas
    function parseStack(stack) {
        if (!stack) return { url: 'N/A', line: 'N/A', column: 'N/A' };

        // Regex para capturar URL, linha e coluna do stack trace
        const match = stack.match(/(https?:\/\/[^\s]+|file:\/\/[^\s]+):(\d+):(\d+)/);
        return match
            ? { url: match[1], line: match[2], column: match[3] }
            : { url: 'N/A', line: 'N/A', column: 'N/A' };
    }

    // Função global para registrar logs
    window.DetectError = {
        log: (error = {}) => {
            // Verificar se o parâmetro é válido
            if (typeof error !== 'object' || error === null) {
                console.warn('DetectError.log foi chamado sem parâmetros válidos.');
                error = {};
            }

            // Analisar o stack para extração de URL, linha e coluna
            const parsed = parseStack(error.stack);

            // Preencher valores padrão
            const log = {
                type: error.type || 'Erro Desconhecido',
                message: error.message || 'Mensagem não fornecida',
                stack: error.stack || 'Traço de pilha não disponível',
                url: error.url || parsed.url,
                line: error.line || parsed.line,
                column: error.column || parsed.column,
            };

            logError(log);
        },
    };

    // Captura de erros JavaScript
    window.addEventListener('error', (event) => {
        const error = {
            type: 'Erro',
            message: event.message,
            stack: event.error ? event.error.stack : null,
            url: event.filename || 'N/A',
            line: event.lineno || 'N/A',
            column: event.colno || 'N/A',
        };
        DetectError.log(error);
    });

    // Captura de promessas rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
        const error = {
            type: 'Rejeição de Promessa Não Tratada',
            message: event.reason?.message || 'Rejeitado sem razão',
            stack: event.reason?.stack || 'N/A',
            url: 'N/A',
            line: 'N/A',
            column: 'N/A',
        };
        DetectError.log(error);
    });

    // Captura de erros de fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        try {
            const response = await originalFetch(...args);
            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }
            return response;
        } catch (err) {
            const error = {
                type: 'Erro de Fetch',
                message: err.message,
                stack: err.stack,
                url: args[0],
                line: 'N/A',
                column: 'N/A',
            };
            DetectError.log(error);
            throw err;
        }
    };

    // Ações do console
    window.markAsResolved = function (button) {
        const row = button.closest('tr');
        row.style.textDecoration = 'line-through';
        row.style.backgroundColor = '#2ecc71';
        setTimeout(() => row.remove(), 300);

        // Verificar se todos os erros foram resolvidos e ocultar o console se verdadeiro
        const allResolved = Array.from(consoleContainer.querySelectorAll('tr')).every(row => row.style.textDecoration === 'line-through');
        if (allResolved) {
            consoleContainer.style.display = 'none';
        }
            window.toggleDetails(row);
    };

    window.toggleDetails = function (button) {
        const row = button.closest('tr');

        // Verifica se o detalhe já existe
        const existingDetailsRow = row.nextElementSibling;
        if (existingDetailsRow && existingDetailsRow.classList.contains('details-row')) {
            existingDetailsRow.remove();
            return;
        }

        // Caso contrário, cria e exibe o detalhe
        const detailsRow = document.createElement('tr');
        detailsRow.classList.add('details-row'); // Classe para identificar a linha de detalhe
        const parsed = parseStack(row.dataset.stack);
        detailsRow.innerHTML = `
            <td colspan="3" style="background-color: #333; color: white; padding: 5px;">
                <strong>Detalhes do Stack Trace:</strong><br>
                URL: ${parsed.url}<br>
                Linha: ${parsed.line}, Coluna: ${parsed.column}
            </td>
        `;
        row.insertAdjacentElement('afterend', detailsRow);
    };

    window.copyToClipboard = function (stack) {
        if (!stack) return;

        navigator.clipboard.writeText(stack).then(() => {
            alert('Stack trace copiado para área de transferência!');
        }).catch(err => {
            console.error('Falha ao copiar o stack trace: ', err);
        });
    };

    // Inicializar e carregar logs
    renderLogsTable([]);
})();
