const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. CSS da IA (adicionado antes de </style>)
const aiCss = `
/* --- IA ASSISTENTE FORTEC --- */
.ai-fab {
  position: fixed; bottom: 20px; left: 20px; z-index: 999;
  background: linear-gradient(135deg, #182741 0%, #2a3f66 100%);
  color: #dd9a2b; border: 2px solid #dd9a2b; border-radius: 30px;
  padding: 10px 18px; font-weight: 700; font-size: 13px;
  cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  display: flex; align-items: center; gap: 8px; transition: transform 0.2s, box-shadow 0.2s;
}
.ai-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(221,154,43,0.4); }
.ai-widget {
  position: fixed; bottom: 70px; left: 20px; z-index: 1000;
  width: 360px; height: 500px; max-width: calc(100vw - 40px); max-height: calc(100vh - 100px);
  background: #182741; border: 1px solid #dd9a2b; border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; flex-direction: column;
  overflow: hidden; font-family: inherit; color: #fff; transition: all 0.3s ease;
}
.ai-widget.hidden { display: none !important; }
.ai-header {
  background: #0f1828; padding: 12px 16px; border-bottom: 1px solid rgba(221,154,43,0.3);
  display: flex; align-items: center; justify-content: space-between;
}
.ai-header-title { font-weight: 700; font-size: 14px; color: #dd9a2b; display: flex; align-items: center; gap: 6px; }
.ai-close-btn { background: none; border: none; color: #aaa; font-size: 18px; cursor: pointer; }
.ai-close-btn:hover { color: #fff; }
.ai-messages {
  flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;
  background: rgba(15, 24, 40, 0.6);
}
.ai-msg { max-width: 85%; padding: 8px 12px; border-radius: 10px; font-size: 12px; line-height: 1.4; word-break: break-word; }
.ai-msg.bot { background: #253755; color: #f0f4f8; align-self: flex-start; border-bottom-left-radius: 2px; }
.ai-msg.user { background: #dd9a2b; color: #182741; font-weight: 600; align-self: flex-end; border-bottom-right-radius: 2px; }
.ai-chips { display: flex; gap: 6px; overflow-x: auto; padding: 6px 12px; background: #0f1828; border-top: 1px solid rgba(255,255,255,0.05); }
.ai-chip {
  background: rgba(221,154,43,0.15); color: #dd9a2b; border: 1px solid rgba(221,154,43,0.4);
  border-radius: 14px; padding: 4px 10px; font-size: 10px; font-weight: 600;
  white-space: nowrap; cursor: pointer; transition: background 0.2s;
}
.ai-chip:hover { background: rgba(221,154,43,0.3); }
.ai-input-area { padding: 10px; background: #0f1828; border-top: 1px solid rgba(221,154,43,0.2); display: flex; gap: 6px; }
.ai-input {
  flex: 1; background: #182741; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px;
  color: #fff; padding: 8px 10px; font-size: 12px; outline: none;
}
.ai-input:focus { border-color: #dd9a2b; }
.ai-send-btn { background: #dd9a2b; color: #182741; border: none; border-radius: 6px; padding: 0 12px; font-weight: 700; cursor: pointer; }
.ai-send-btn:hover { background: #c68822; }
`;

// 2. HTML DOM e JS Engine da IA
const aiHtmlAndJs = `
<!-- ASSISTENTE IA FORTEC -->
<button id="aiFab" class="ai-fab no-print" onclick="toggleAiWidget()">✨ IA Assistente</button>

<div id="aiWidget" class="ai-widget hidden no-print">
  <div class="ai-header">
    <div class="ai-header-title">✨ Assistente IA FORTEC</div>
    <button class="ai-close-btn" onclick="toggleAiWidget()">✕</button>
  </div>
  <div class="ai-messages" id="aiMessages">
    <div class="ai-msg bot">
      Olá! Sou o Assistente IA da FORTEC. 🤖<br><br>
      Posso gerar horários, baixar planilhas, auditar conflitos, filtrar turmas e professores por você!<br><br>
      Como posso te ajudar hoje?
    </div>
  </div>
  <div class="ai-chips">
    <button class="ai-chip" onclick="sendAiQuick('⚡ Gerar horário')">⚡ Gerar horário</button>
    <button class="ai-chip" onclick="sendAiQuick('⬇ Baixar Excel')">⬇ Baixar Excel</button>
    <button class="ai-chip" onclick="sendAiQuick('🔍 Auditar grade')">🔍 Auditar grade</button>
    <button class="ai-chip" onclick="sendAiQuick('📊 Ver estatísticas')">📊 Estatísticas</button>
  </div>
  <div class="ai-input-area">
    <input type="text" id="aiInput" class="ai-input" placeholder="Digite seu comando..." onkeydown="if(event.key==='Enter') sendAiMsg()">
    <button class="ai-send-btn" onclick="sendAiMsg()">Enviar</button>
  </div>
</div>

<script>
function toggleAiWidget(){
  const w = document.getElementById('aiWidget');
  w.classList.toggle('hidden');
  if(!w.classList.contains('hidden')) {
    document.getElementById('aiInput').focus();
  }
}

function addAiMessage(text, isUser=false){
  const box = document.getElementById('aiMessages');
  const msg = document.createElement('div');
  msg.className = 'ai-msg ' + (isUser ? 'user' : 'bot');
  msg.innerHTML = text;
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}

function sendAiQuick(text){
  document.getElementById('aiInput').value = text;
  sendAiMsg();
}

function sendAiMsg(){
  const input = document.getElementById('aiInput');
  const text = input.value.trim();
  if(!text) return;
  
  addAiMessage(text, true);
  input.value = '';
  
  setTimeout(() => processAiCommand(text), 200);
}

function processAiCommand(text){
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // 1. GERAR HORÁRIO
  if(lower.includes('gerar') || lower.includes('recalcular') || lower.includes('novo horario') || lower.includes('criar horario')){
    addAiMessage('⚙️ <b>Executando:</b> Gerando o horário inteligente da escola...');
    runGenerate();
    setTimeout(() => {
      addAiMessage('✅ <b>Horário gerado com sucesso!</b> A grade foi atualizada na tela e auditada.');
    }, 600);
    return;
  }
  
  // 2. BAIXAR EXCEL
  if(lower.includes('excel') || lower.includes('planilha') || lower.includes('baixar') || lower.includes('download')){
    addAiMessage('⬇️ <b>Executando:</b> Gerando planilha Excel estilizada com todas as abas...');
    exportExcel();
    addAiMessage('✅ <b>Download iniciado!</b> A planilha <code>fortec-horario-excel.xlsx</code> foi baixada.');
    return;
  }
  
  // 3. AUDITAR GRADE
  if(lower.includes('audit') || lower.includes('conflito') || lower.includes('erro') || lower.includes('problema') || lower.includes('verificar')){
    state.adminTab = 'auditoria';
    render();
    const a = db.schedule ? db.schedule.audit : null;
    if(a && a.ok){
      addAiMessage('✅ <b>Auditoria Concluída:</b> O horário atual está 100% válido, sem nenhum choque ou janela nas turmas!');
    } else if(a){
      addAiMessage(\`⚠️ <b>Auditoria Concluída:</b> Foram encontrados \${a.hardViolations.length + a.deficits.length} aviso(s). Exibindo detalhes e sugestões na aba Auditoria.\`);
    } else {
      addAiMessage('ℹ️ Nenhum horário foi gerado ainda. Clique em ⚡ Gerar horário.');
    }
    return;
  }
  
  // 4. VER PROFESSOR
  if(lower.includes('professor') || lower.includes('prof')){
    // Tenta identificar o nome do professor no comando
    const foundTeacher = db.teachers.find(t => lower.includes(t.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
    if(foundTeacher){
      state.adminTab = 'horario';
      state.scheduleView = 'professor';
      state.scheduleFilter = foundTeacher.id;
      render();
      addAiMessage(\`👤 <b>Exibindo horário:</b> Mostrando a grade de aulas do(a) professor(a) <b>\${foundTeacher.name}</b>.\`);
      return;
    } else {
      state.adminTab = 'horario';
      state.scheduleView = 'professor';
      render();
      addAiMessage('👤 Selecione o professor desejado no menu suspenso no topo da grade.');
      return;
    }
  }
  
  // 5. VER TURMA
  if(lower.includes('turma') || lower.includes('ano') || lower.includes('sala') || lower.includes('cmr') || lower.includes('tce') || lower.includes('tin') || lower.includes('tam') || lower.includes('tme')){
    const foundClass = db.classes.find(c => lower.includes(c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
    if(foundClass){
      state.adminTab = 'horario';
      state.scheduleView = 'turma';
      state.scheduleFilter = foundClass.id;
      render();
      addAiMessage(\`🏫 <b>Exibindo turma:</b> Mostrando a grade de aulas da turma <b>\${foundClass.name}</b>.\`);
      return;
    } else {
      state.adminTab = 'horario';
      state.scheduleView = 'turma';
      render();
      addAiMessage('🏫 Selecione a turma desejada no menu no topo da tela.');
      return;
    }
  }
  
  // 6. ESTATÍSTICAS
  if(lower.includes('estatistica') || lower.includes('total') || lower.includes('quantos') || lower.includes('resumo')){
    const totalWeekly = db.requirements.reduce((s,r)=>s+(r.joint?r.lessonsPerWeek:r.lessonsPerWeek*r.classIds.length),0);
    addAiMessage(\`📊 <b>Estatísticas da Escola:</b><br>
      • <b>\${db.teachers.length}</b> Professores cadastrados<br>
      • <b>\${db.classes.length}</b> Turmas (Fundamental + Médio)<br>
      • <b>\${db.requirements.length}</b> Requisitos de disciplinas<br>
      • <b>\${totalWeekly}</b> Aulas totais por semana\`);
    return;
  }
  
  // RESPOSTA PADRÃO PARA COMANDOS GERAIS OU DÚVIDAS
  addAiMessage(\`Entendi! Você pode me pedir comandos como:<br>
    • <i>"Gere o horário da escola"</i><br>
    • <i>"Baixar a planilha Excel"</i><br>
    • <i>"Auditar conflitos"</i><br>
    • <i>"Mostrar horário de [Nome do Professor]"</i><br>
    • <i>"Mostrar turma [Nome da Turma]"</i><br>
    • <i>"Ver estatísticas"</i>\`);
}
</script>
`;

// Injetar CSS antes de </style>
html = html.replace('</style>', aiCss + '\n</style>');

// Injetar HTML/JS antes de </body>
html = html.replace('</body>', aiHtmlAndJs + '\n</body>');

fs.writeFileSync('index.html', html, 'utf8');
console.log('AI Assistant added successfully to index.html!');
