// DEFAULT STATE
const getDefaultState = () => ({
    groupName: '',
    config: {
        natureza: '',
        modelo: '',
        abstracao: ''
    },
    entities: [], // {id, name, proposed_id, attributes: [{id, name, protection}]}
    relations: [] // {id, ent1, verb, ent2}
});

let appState = JSON.parse(localStorage.getItem('dba_split_state')) || getDefaultState();

// INIT ON LOAD
document.addEventListener("DOMContentLoaded", () => {
    if (appState.groupName) document.getElementById('input-group-name').value = appState.groupName;
    if (appState.config.natureza) document.getElementById('config-natureza').value = appState.config.natureza;
    if (appState.config.modelo) document.getElementById('config-modelo').value = appState.config.modelo;
    if (appState.config.abstracao) document.getElementById('config-abstracao').value = appState.config.abstracao;
    
    loadEvidence();
    renderEntities();
    renderRelations();
});

function saveState() {
    localStorage.setItem('dba_split_state', JSON.stringify(appState));
}

function saveHeaderInfo() {
    appState.groupName = document.getElementById('input-group-name').value;
    appState.config.natureza = document.getElementById('config-natureza').value;
    appState.config.modelo = document.getElementById('config-modelo').value;
    appState.config.abstracao = document.getElementById('config-abstracao').value;
    saveState();
}

function resetData() {
    if(confirm('Atenção: Isso irá apagar todo o seu banco de dados local. Deseja prosseguir com a Limpeza?')) {
        localStorage.removeItem('dba_split_state');
        location.reload();
    }
}

// -------------------------------------------------------------
// DADOS BRUTOS (EVIDENCE)
// -------------------------------------------------------------
async function loadEvidence() {
    try {
        const response = await fetch('data.json?timestamp=' + new Date().getTime());
        const data = await response.json();
        
        // Estimativa do mínimo de tabelas baseada nas chaves
        let possibleEntities = new Set();
        if(data.length > 0) {
            const keys = Object.keys(data[0]);
            keys.forEach(k => {
                if(k.includes('cliente')) possibleEntities.add('cliente');
                if(k.includes('peca')) possibleEntities.add('peca');
                if(k.includes('fabricante') || k.includes('fornecedor')) possibleEntities.add('fabricante');
                if(k.includes('transacao') || k.includes('pedido') || k.includes('venda')) possibleEntities.add('transacao');
            });
            const minTables = Math.max(3, possibleEntities.size); 
            const badge = document.getElementById('estimated-tables-badge');
            if(badge) {
                badge.innerHTML = `<i data-lucide="brain" class="inline w-3 h-3 mr-1"></i> Recomendação: Mín. ${minTables} Tabelas`;
                badge.classList.remove('hidden');
            }
        }

        const container = document.getElementById('evidence-container');
        container.innerHTML = '';

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'bg-black/40 border border-slate-800 p-3 rounded-lg text-[11px] relative shadow-sm hover:border-senai-lightblue/50 transition-colors font-mono';
            
            card.innerHTML = `
                <div class="absolute top-2 right-2 bg-slate-900 text-slate-500 text-[9px] px-2 py-0.5 rounded border border-slate-700">${item.id_transacao}</div>
                <div class="mb-2 border-b border-slate-800/80 pb-2 flex justify-between items-end">
                    <strong class="text-senai-text block uppercase tracking-wider text-[9px]">Origem: <span class="text-emerald-400">${item.origem_dado}</span></strong>
                    <div class="text-[8px] text-slate-600 flex items-center gap-1" title="Latência: ${item.metadata.latencia_ms}ms"><i data-lucide="network" class="w-3 h-3"></i> IP: ${item.metadata.ip_origem}</div>
                </div>
                <div class="space-y-1 text-slate-300">
                    <div class="flex"><span class="w-24 text-slate-500 shrink-0">Cliente:</span> <span class="text-senai-lightblue truncate hover:whitespace-normal hover:overflow-visible hover:bg-black hover:z-10 hover:p-1 hover:-m-1 hover:border hover:border-slate-700 hover:rounded cursor-help">${item.dados_cliente}</span></div>
                    <div class="flex"><span class="w-24 text-slate-500 shrink-0">Contato:</span> <span class="truncate hover:whitespace-normal hover:bg-black hover:z-10 hover:p-1 hover:-m-1 hover:border hover:border-slate-700 hover:rounded cursor-help">${item.contato_cliente}</span></div>
                    <div class="flex"><span class="w-24 text-slate-500 shrink-0">Peça:</span> <span class="text-purple-300 truncate hover:whitespace-normal cursor-help">${item.peca_vendida} <span class="text-slate-500 text-[9px]">(${item.num_serie_peca})</span></span></div>
                    <div class="flex"><span class="w-24 text-slate-500 shrink-0">Fornecedor:</span> <span class="truncate">${item.fabricante_peca}</span></div>
                    <div class="flex"><span class="w-24 text-slate-500 shrink-0">Status:</span> <span class="text-emerald-200 truncate">${item.status_logistico}</span></div>
                    <div class="flex"><span class="w-24 text-slate-500 shrink-0">Valores:</span> <span class="text-white truncate hover:whitespace-normal hover:bg-black hover:z-10 hover:p-1 hover:-m-1 hover:border hover:border-slate-700 hover:rounded cursor-help">${item.precos}</span></div>
                </div>
                <div class="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-senai-orange italic bg-senai-orange/5 p-2 rounded flex gap-2 items-start">
                    <i data-lucide="message-square-text" class="w-3 h-3 shrink-0 mt-0.5"></i>
                    <span>${item.notas_atendente}</span>
                </div>
            `;
            container.appendChild(card);
        });
        lucide.createIcons({ root: container });
        if(document.getElementById('estimated-tables-badge')) lucide.createIcons({ root: document.getElementById('estimated-tables-badge') });

    } catch (e) {
        const container = document.getElementById('evidence-container');
        container.innerHTML = `<div class="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex gap-2"><i data-lucide="triangle-alert" class="w-5 h-5"></i> Dados indisponíveis. Erro no arquivo data.json.</div>`;
        lucide.createIcons();
    }
}

// -------------------------------------------------------------
// DICAS DO INSTRUTOR (UX)
// -------------------------------------------------------------
function toggleTips() {
    const panel = document.getElementById('tips-panel');
    if (panel.classList.contains('translate-x-[120%]')) {
        panel.classList.remove('translate-x-[120%]', 'opacity-0');
    } else {
        panel.classList.add('translate-x-[120%]', 'opacity-0');
    }
}


// -------------------------------------------------------------
// GERENCIADOR DE ENTIDADES E ATRIBUTOS DÂMICOS
// -------------------------------------------------------------
function addEntity() {
    appState.entities.unshift({
        id: Date.now(),
        name: '',
        proposed_id: 'id_',
        attributes: []
    });
    saveState();
    renderEntities();
}

function removeEntity(id) {
    appState.entities = appState.entities.filter(e => e.id !== id);
    saveState();
    renderEntities();
}

function addAttribute(entId) {
    const ent = appState.entities.find(e => e.id === entId);
    if(ent) {
        ent.attributes.unshift({
            id: Date.now(),
            name: '',
            protection: 'nenhuma'
        });
        saveState();
        renderEntities();
    }
}

function removeAttribute(entId, attrId) {
    const ent = appState.entities.find(e => e.id === entId);
    if(ent) {
        ent.attributes = ent.attributes.filter(a => a.id !== attrId);
        saveState();
        renderEntities();
    }
}


// Validação Visual Passiva (Highlight Rules)
function validateNamingRules(elem, type='') {
    const val = elem.value;
    
    // Resetar alertas visuais
    elem.classList.remove('warn-space', 'warn-accent');
    let titleMsg = [];

    // Regra Espaço -> Underline
    if(/\s/.test(val)) {
        elem.classList.add('warn-space');
        titleMsg.push("O DBA recomenda: substitua espaços por UNDERLINE (_).");
    }

    // Regra Acento/Char Estranho
    if(/[áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/.test(val)) {
        elem.classList.add('warn-accent');
        titleMsg.push("O DBA alerta: acentos causam problemas graves em bancos SQL. Não utilize.");
    }

    // Se estiver validando ID, verificar CPF/RG
    if (type === 'id') {
        const check = val.toLowerCase();
        if(check === 'cpf' || check === 'rg') {
            alert("REGRA DE OURO DBA: Um dado que sofre mutações no mundo real ou que possa ser reutilizado indevidamente não deve atuar como Identificador Único do sistema. Crie um ID artificial!");
            elem.value = "id_";
        }
    }

    elem.title = titleMsg.join(" | ");
    saveEntityLive(elem);
}


function saveEntityLive(elem) {
    // Determine context (Entity Name, Entity ID, Attribute, Relation)
    const card = elem.closest('.ent-card');
    if(!card) return; // If is relation, we handle logic at save time, we only need visual warning above
    
    const entId = Number(card.getAttribute('data-id'));
    const ent = appState.entities.find(e => e.id === entId);
    if(!ent) return;

    if(elem.classList.contains('ent-name')) ent.name = elem.value;
    if(elem.classList.contains('ent-pid'))  ent.proposed_id = elem.value;
    
    if(elem.classList.contains('attr-name')) {
        const attrId = Number(elem.closest('li').getAttribute('data-attr-id'));
        const attr = ent.attributes.find(a => a.id === attrId);
        if(attr) attr.name = elem.value;
    }
    
    if(elem.classList.contains('attr-prot')) {
        const attrId = Number(elem.closest('li').getAttribute('data-attr-id'));
        const attr = ent.attributes.find(a => a.id === attrId);
        if(attr) {
            attr.protection = elem.value;
            // Dica proativa de LGPD se o nome sugerir risco e deixado sem protecao
            const nLower = attr.name.toLowerCase();
            if(attr.protection === 'nenhuma' && (nLower.includes('preco') || nLower.includes('custo') || nLower.includes('cpf') || nLower.includes('senha'))) {
                alert(`Dica de Negócio: Campos como "${attr.name}" carregam alto risco cibernético e segredo industrial. Tem certeza que o nível de proteção deve ser "Nenhuma"?`);
            }
        }
    }

    saveState();
}


function renderEntities() {
    const container = document.getElementById('entities-container');
    container.innerHTML = '';
    
    if (appState.entities.length === 0) {
        container.innerHTML = `
            <div class="col-span-1 md:col-span-2 flex flex-col justify-center items-center h-48 border-2 border-dashed border-senai-border rounded-xl text-slate-500 opacity-60">
                <i data-lucide="package-open" class="w-10 h-10 mb-2"></i>
                <p class="text-sm">Nenhuma tabela estruturada ainda.</p>
            </div>
        `;
        lucide.createIcons({ root: container });
        return;
    }

    appState.entities.forEach(ent => {
        let attrHtml = '';
        ent.attributes.forEach(a => {
            attrHtml += `
                <li class="flex gap-2 items-center bg-black/40 border border-slate-800 p-1 rounded group/attr" data-attr-id="${a.id}">
                    <input type="text" class="attr-name flex-1 bg-transparent border-b border-transparent focus:border-senai-lightblue text-slate-300 font-mono text-[10px] px-1 outline-none transition-colors" placeholder="nome_atributo" value="${a.name}" onkeyup="validateNamingRules(this)">
                    <select class="attr-prot bg-slate-900 border border-slate-700 text-slate-400 text-[9px] rounded p-1 outline-none cursor-pointer" onchange="saveEntityLive(this)">
                        <option value="nenhuma" ${a.protection==='nenhuma'?'selected':''}>🔓 Nenhuma</option>
                        <option value="mascarar" ${a.protection==='mascarar'?'selected':''}>🎭 Mascarar</option>
                        <option value="criptografar" ${a.protection==='criptografar'?'selected':''}>🔐 Cripto</option>
                    </select>
                    <button onclick="removeAttribute(${ent.id}, ${a.id})" class="text-slate-600 hover:text-red-400 opacity-0 group-hover/attr:opacity-100 transition-opacity">
                        <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                </li>
            `;
        });

        container.innerHTML += `
            <div class="ent-card bg-black/40 border border-slate-700 rounded-xl p-4 relative group hover:border-senai-blue/60 transition-colors shadow-lg flex flex-col h-auto overflow-hidden" data-id="${ent.id}">
                <button onclick="removeEntity(${ent.id})" class="absolute -top-3 -right-3 w-7 h-7 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-full flex justify-center items-center shadow-lg transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 z-10" title="Apagar Tabela">
                    <i data-lucide="trash" class="w-3 h-3"></i>
                </button>
                
                <div class="mb-3">
                    <label class="text-[10px] uppercase font-bold text-senai-text flex items-center gap-1 mb-1">
                        <i data-lucide="table-2" class="w-3 h-3"></i> Tabela
                    </label>
                    <input type="text" class="ent-name w-full bg-slate-900 border border-slate-800 focus:border-senai-lightblue rounded p-2 text-white font-mono text-sm placeholder-slate-700 outline-none uppercase transition-colors" placeholder="Ex: TB_FORNECEDORES" value="${ent.name}" onkeyup="validateNamingRules(this)">
                </div>
                
                <div class="mb-3">
                    <label class="text-emerald-500 text-[10px] font-bold uppercase flex items-center gap-1 mb-1">
                        <i data-lucide="key" class="w-3 h-3"></i> Identificador Único (ID)
                    </label>
                    <input type="text" class="ent-pid w-full bg-slate-900 border border-emerald-900/50 focus:border-emerald-500 rounded text-emerald-400 font-mono text-xs px-2 py-1.5 outline-none transition-colors" placeholder="id_tabela" value="${ent.proposed_id}" onkeyup="validateNamingRules(this, 'id')">
                </div>

                <div class="flex flex-col border-t border-slate-800/50 pt-2 mt-2 min-h-0">
                    <div class="flex justify-between items-center mb-2">
                        <label class="text-senai-text text-[10px] font-bold uppercase flex items-center gap-1">
                            <i data-lucide="list" class="w-3 h-3"></i> Atributos Simples
                        </label>
                        <button onclick="addAttribute(${ent.id})" class="text-[9px] bg-slate-800 hover:bg-senai-blue text-white px-2 py-1 rounded transition-colors flex items-center gap-1">
                            <i data-lucide="plus" class="w-3 h-3"></i> Adicionar
                        </button>
                    </div>
                    <ul class="space-y-1 overflow-y-auto max-h-[120px] min-h-0 custom-scrollbar pr-1">
                        ${attrHtml || '<li class="text-[10px] text-slate-600 text-center py-2 animate-pulse">Nenhum atributo mapeado</li>'}
                    </ul>
                </div>
            </div>
        `;
    });
    lucide.createIcons({ root: container });
}

// -------------------------------------------------------------
// MAPEADOR DE RELACIONAMENTOS
// -------------------------------------------------------------
function addRelation() {
    const e1 = document.getElementById('rel-ent1');
    const vb = document.getElementById('rel-verb');
    const e2 = document.getElementById('rel-ent2');
    
    const ent1 = e1.value.trim();
    const verb = vb.value.trim();
    const ent2 = e2.value.trim();

    if(!ent1 || !verb || !ent2) {
        alert("Preencha todos os 3 campos obrigatórios para formular uma ligação (Entidade -> Ação -> Entidade).");
        return;
    }

    appState.relations.push({ id: Date.now(), ent1, verb, ent2 });
    saveState();
    
    e1.value = '';
    vb.value = '';
    e2.value = '';
    e1.classList.remove('warn-space', 'warn-accent');
    vb.classList.remove('warn-space', 'warn-accent');
    e2.classList.remove('warn-space', 'warn-accent');
    e1.title = ''; vb.title = ''; e2.title = '';

    renderRelations();
}

function removeRelation(id) {
    appState.relations = appState.relations.filter(r => r.id !== id);
    saveState();
    renderRelations();
}

function renderRelations() {
    const list = document.getElementById('relations-container');
    list.innerHTML = '';
    
    if (appState.relations.length === 0) return;
    
    appState.relations.forEach(r => {
        list.innerHTML += `
            <div class="col-span-1 border border-purple-500/20 bg-purple-900/10 p-3 rounded-lg flex flex-col justify-center items-center text-xs relative group shadow-sm">
                <button onclick="removeRelation(${r.id})" class="absolute -top-2 -right-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500 rounded-full w-6 h-6 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-all border border-slate-700 shadow-md">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>
                <div class="flex items-center gap-2 mb-1 w-full justify-between">
                    <span class="bg-black text-emerald-400 px-2 py-1 rounded font-mono uppercase truncate flex-1 text-center" title="${r.ent1}">${r.ent1}</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 text-purple-400 shrink-0"></i>
                    <span class="bg-black text-emerald-400 px-2 py-1 rounded font-mono uppercase truncate flex-1 text-center" title="${r.ent2}">${r.ent2}</span>
                </div>
                <div class="text-purple-300 font-bold bg-purple-500/20 px-3 py-0.5 rounded-full mt-1 flex gap-1 items-center">
                    <i data-lucide="link" class="w-3 h-3"></i> Vínculo: ${r.verb}
                </div>
            </div>
        `;
    });
    lucide.createIcons({ root: list });
}


// -------------------------------------------------------------
// GERAÇÃO DE PDF PROFISSIONAL COM HTML2PDF
// -------------------------------------------------------------
async function generatePDF() {
    saveHeaderInfo();

    if (!appState.groupName) {
        alert("Preencha o Nome da Equipe no topo da página antes de exportar.");
        document.getElementById('input-group-name').focus();
        return;
    }

    if (typeof html2pdf === 'undefined') {
        alert("A biblioteca html2pdf não foi carregada.");
        return;
    }

    const dataISO = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    let html = `
        <div id="pdf-content" style="
            width: 794px;
            min-height: 1123px;
            background: #ffffff;
            color: #333333;
            font-family: Arial, sans-serif;
            box-sizing: border-box;
            padding: 32px;
        ">
            <div style="text-align:center; border-bottom:2px solid #007DC5; padding-bottom:20px; margin-bottom:30px;">
                <h1 style="color:#007DC5; margin:0; font-size:24px;">DOSSIÊ DE ESTRUTURAÇÃO DE DADOS & GOVERNANÇA</h1>
                <p style="margin:5px 0 0 0; font-size:14px; color:#666;">Laboratório Oficial de Modelagem DB</p>
            </div>

            <div style="margin-bottom:30px; font-size:14px;">
                <p><strong>Equipe Responsável:</strong> ${appState.groupName}</p>
                <p><strong>Data de Emissão:</strong> ${dataISO}</p>
            </div>

            <div style="background:#f8f9fa; border-left:4px solid #F39200; padding:15px; margin-bottom:30px;">
                <h3 style="margin-top:0;">1. Diagnóstico Inicial</h3>
                <ul style="padding-left:20px; font-size:14px;">
                    <li><strong>Natureza de Origem:</strong> ${appState.config.natureza || 'Não declarada'}</li>
                    <li><strong>Arquitetura Alvo:</strong> ${appState.config.modelo || 'Não declarada'}</li>
                </ul>
                <p style="font-size:13px; color:#555;">
                    <strong>Relatório de Abstração & Ruídos:</strong>
                    "${appState.config.abstracao || 'Sem anotações registradas.'}"
                </p>
            </div>
    `;

    if (appState.entities.length === 0) {
        html += `<p style="color:#d9534f; font-size:14px;">Nenhuma entidade foi estruturada pela equipe.</p>`;
    } else {
        html += `<h3 style="border-bottom:1px solid #ddd; padding-bottom:10px;">2. Catálogo de Entidades e Governança de Atributos</h3>`;
        appState.entities.forEach(e => {
            html += `
                <div style="border:1px solid #ccc; border-radius:6px; margin-bottom:15px; overflow:hidden; break-inside:avoid;">
                    <div style="background:#007DC5; color:#fff; padding:10px; font-weight:bold;">
                        Tabela: ${e.name || 'SEM_NOME'}
                    </div>
                    <div style="padding:12px;">
                        <p><strong>ID Único:</strong> ${e.proposed_id || 'Indefinido'}</p>
                        <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                            <thead>
                                <tr style="background:#eee;">
                                    <th style="border:1px solid #ddd; padding:6px; text-align:left;">Nome do Atributo</th>
                                    <th style="border:1px solid #ddd; padding:6px; text-align:left;">Proteção</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            if (e.attributes.length === 0) {
                html += `<tr><td colspan="2" style="border:1px solid #ddd; padding:6px;">Nenhum atributo associado</td></tr>`;
            } else {
                e.attributes.forEach(a => {
                    const pText = a.protection || 'nenhuma';
                    html += `
                        <tr>
                            <td style="border:1px solid #ddd; padding:6px;">${a.name || '-'}</td>
                            <td style="border:1px solid #ddd; padding:6px;">${pText}</td>
                        </tr>
                    `;
                });
            }

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
    }

    html += `<h3 style="border-bottom:1px solid #ddd; padding-bottom:10px;">3. Relacionamentos</h3>`;

    if (appState.relations.length === 0) {
        html += `<p style="color:#d9534f; font-size:14px;">Nenhuma ligação entre tabelas foi mapeada.</p>`;
    } else {
        html += `<ul style="padding-left:20px;">`;
        appState.relations.forEach(r => {
            html += `<li style="margin-bottom:8px;">${r.ent1} — ${r.verb} — ${r.ent2}</li>`;
        });
        html += `</ul>`;
    }

    html += `</div>`;

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-10000px';
    wrapper.style.top = '0';
    wrapper.style.zIndex = '-1';
    wrapper.style.background = '#fff';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    const pdfElement = wrapper.querySelector('#pdf-content');

    await new Promise(resolve => setTimeout(resolve, 300));

    const safeName = appState.groupName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `Relatorio_DBA_${safeName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        },
        pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
        await html2pdf().set(opt).from(pdfElement).save();
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar PDF. Abra o console para ver detalhes.');
    } finally {
        document.body.removeChild(wrapper);
    }
}

// ==== SISTEMA DE ABAS (TABS) ====
function switchTab(tabId) {
    const tabs = ['tab-1', 'tab-2', 'tab-3'];
    
    tabs.forEach(id => {
        const content = document.getElementById(id);
        const btn = document.getElementById('btn-' + id);
        
        if (id === tabId) {
            // Activate Tab
            content.classList.remove('hidden');
            if (id === 'tab-3') {
                content.classList.add('grid');
            } else {
                content.classList.add('flex');
            }
            
            // Activate Button styling
            btn.className = "tab-btn px-6 py-3 font-bold text-sm rounded-t-lg transition-all bg-senai-blue/20 text-senai-lightblue border-b-2 border-senai-lightblue shadow-[0_-4px_10px_rgba(0,125,197,0.1)]";
        } else {
            // Deactivate Tab
            content.classList.add('hidden');
            content.classList.remove('flex', 'grid');
            
            // Deactivate Button styling
            btn.className = "tab-btn px-6 py-3 font-bold text-sm rounded-t-lg transition-all text-slate-400 hover:bg-white/5 hover:text-slate-300 border-b-2 border-transparent";
        }
    });
}
