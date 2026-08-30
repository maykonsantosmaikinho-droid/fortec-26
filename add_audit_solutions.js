const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const oldRenderAuditSummaryCard = `function renderAuditSummaryCard(audit){
  return \`<div class="card">
    <div class="spaced"><h3 style="margin:0">Resultado da auditoria</h3>
      \${audit.ok? \`<span class="ok" style="margin:0">✅ HORÁRIO VÁLIDO</span>\` : \`<span class="err" style="margin:0">❌ \${audit.hardViolations.length+audit.deficits.length} problema(s)</span>\`}
    </div>
    \${audit.hardViolations.map(v=>\`<div class="violation">🔴 \${v}</div>\`).join('')}
    \${audit.deficits.map(v=>\`<div class="deficit">🟡 \${v}</div>\`).join('')}
    \${audit.ok? \`<p class="muted">Turmas, professores e disciplinas conferidos individualmente — nenhuma violação encontrada.</p>\`:''}
  </div>\`;
}`;

const newRenderAuditSummaryCard = `function auditSolutionFor(item){
  if(item.includes('necessário') && item.includes('programado')){
    return '💡 <b>Sugestão de solução:</b> Vá na aba <b>3. Professores</b>, encontre a matéria/professor correspondente e marque mais horários verdes de disponibilidade, ou adicione horários livres para a turma.';
  }
  if(item.includes('sai antes de 11:55')){
    return '💡 <b>Sugestão de solução:</b> A turma precisa de pelo menos 5 aulas no dia. Adicione ou aumente a carga horária de alguma disciplina para essa turma na aba <b>3. Professores</b>.';
  }
  if(item.includes('começa depois da 2ª')){
    return '💡 <b>Sugestão de solução:</b> Adicione disciplinas para cobrir a 1ª ou 2ª aula dessa turma no dia informado.';
  }
  if(item.includes('recebeu mais aulas')){
    return '💡 <b>Sugestão de solução:</b> Ajuste a carga horária semanal cadastrada na aba <b>3. Professores</b>.';
  }
  if(item.includes('choque') || item.includes('simultâneas')){
    return '💡 <b>Sugestão de solução:</b> O professor possui choque de horário. Abra a aba <b>4. Gerar Horário</b> e clique em "⚙ GERAR HORÁRIO FINAL" para recalcular automaticamente.';
  }
  return '💡 <b>Sugestão de solução:</b> Clique em "⚙ GERAR HORÁRIO FINAL" para o sistema realocar as aulas automaticamente.';
}

function renderAuditSummaryCard(audit){
  return \`<div class="card">
    <div class="spaced"><h3 style="margin:0">Resultado da auditoria</h3>
      \${audit.ok? \`<span class="ok" style="margin:0">✅ HORÁRIO VÁLIDO</span>\` : \`<span class="err" style="margin:0">❌ \${audit.hardViolations.length+audit.deficits.length} problema(s) encontrado(s)</span>\`}
    </div>
    \${audit.hardViolations.map(v=>\`
      <div class="violation" style="margin-bottom:8px">
        <div>🔴 <b>\${v}</b></div>
        <div style="font-size:12px;margin-top:4px;color:#7f1d1d;background:rgba(255,255,255,0.7);padding:6px 10px;border-radius:4px">\${auditSolutionFor(v)}</div>
      </div>
    \`).join('')}
    \${audit.deficits.map(v=>\`
      <div class="deficit" style="margin-bottom:8px">
        <div>🟡 <b>\${v}</b></div>
        <div style="font-size:12px;margin-top:4px;color:#78350f;background:rgba(255,255,255,0.7);padding:6px 10px;border-radius:4px">\${auditSolutionFor(v)}</div>
      </div>
    \`).join('')}
    \${audit.ok? \`<p class="muted" style="margin-top:10px">Turmas, professores e disciplinas conferidos individualmente — nenhuma violação ou choque de horário encontrado.</p>\`:''}
  </div>\`;
}`;

if (html.includes(oldRenderAuditSummaryCard)) {
  html = html.replace(oldRenderAuditSummaryCard, newRenderAuditSummaryCard);
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('Successfully added intelligent audit solution suggestions to index.html!');
} else {
  console.log('Pattern not matched directly, checking lines...');
}
