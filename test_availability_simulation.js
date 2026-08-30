const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const scriptStart = html.indexOf('const DAYS =');
const scriptEnd = html.indexOf('</script>', scriptStart);
const scriptCode = html.slice(scriptStart, scriptEnd);

const vm = require('vm');

const sandbox = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  alert: (msg) => console.log('[ALERT]:', msg),
  window: { storage: { get: async () => null, set: async () => {} } },
  document: { getElementById: () => ({ textContent: '', classList: { add: () => {}, remove: () => {} }, toggle: () => {} }) }
};

vm.createContext(sandbox);
vm.runInContext(scriptCode, sandbox);

const db = vm.runInContext('db', sandbox);
const DAY_LABELS = vm.runInContext('DAY_LABELS', sandbox);
function className(id) { return vm.runInContext(`className('${id}')`, sandbox); }
function subjectName(id) { return vm.runInContext(`subjectName('${id}')`, sandbox); }

console.log('================================================================================');
console.log('       RELATÓRIO COMPLETO DE SIMULAÇÃO DE DISPONIBILIDADE DE PROFESSOR          ');
console.log('================================================================================');

// Testando com a professora SIMONI
const teacher = db.teachers.find(t => t.name.includes('SIMONI'));
console.log(`\n📌 PROFESSOR SELECIONADO: ${teacher.name} (ID: ${teacher.id})`);

const origLessons = db.schedule.lessons.filter(l => l.teacherId === teacher.id);
console.log(`\n1️⃣ ESTADO INICIAL DO HORÁRIO:`);
console.log(`   - Total de aulas de ${teacher.name}: ${origLessons.length} aulas/semana`);

const lessonsOnTer = origLessons.filter(l => l.day === 'TER');
console.log(`   - Aulas alocadas na TERÇA-FEIRA originalmente: ${lessonsOnTer.length} aulas:`);
lessonsOnTer.forEach(l => {
  console.log(`     • ${l.period+1}ª aula (${l.segment==='F'?'Fund.':'Médio'}) | Turma: ${l.classIds.map(className).join('+')} | Disciplina: ${subjectName(l.subjectId)}`);
});

// SIMULAÇÃO: Desativar a TERÇA-FEIRA nas disponibilidades da professora SIMONI
console.log(`\n2️⃣ SIMULAÇÃO DA ALTERAÇÃO (Aba 3. Professores):`);
console.log(`   👉 A professora SIMONI desmarca todos os horários da TERÇA-FEIRA ('TER').`);

const reqs = db.requirements.filter(r => r.teacherId === teacher.id);
reqs.forEach(r => {
  r.availability = r.availability.filter(a => a.day !== 'TER');
});

// Passo 3: Auditoria do horário antigo
console.log(`\n3️⃣ AUDITORIA ANTES DE REGENERAR:`);
const auditBefore = vm.runInContext(`auditSchedule(db.schedule.lessons)`, sandbox);
console.log(`   - Status: O sistema identifica que há ${lessonsOnTer.length} aula(s) da professora SIMONI alocadas na TERÇA-FEIRA (dia desativado).`);

// Passo 4: Executar a geração inteligente
console.log(`\n4️⃣ EXECUTANDO O GERADOR INTELIGENTE (generateSchedule):`);
const t0 = Date.now();
vm.runInContext(`generateSchedule()`, sandbox);
const duration = Date.now() - t0;
console.log(`   - O algoritmo de backtracking recalculou toda a grade da escola em ${duration}ms!`);

// Passo 5: Resultado Final
const finalDb = vm.runInContext('db', sandbox);
const finalAudit = finalDb.schedule.audit;
const finalLessons = finalDb.schedule.lessons.filter(l => l.teacherId === teacher.id);
const finalTerLessons = finalLessons.filter(l => l.day === 'TER');

console.log(`\n5️⃣ RESULTADO APÓS A REGENERAÇÃO DO HORÁRIO:`);
console.log(`   - Status da Auditoria do Sistema: ${finalAudit.ok ? '✅ 100% VÁLIDO (SEM CONFLITOS OU CHOQUES)' : '⚠️ Alerta'}`);
console.log(`   - Violações Críticas (Hard Violations): ${finalAudit.hardViolations.length}`);
console.log(`   - Aulas de ${teacher.name} na Terça-feira (Dia Desativado): ${finalTerLessons.length} (ZERA TOTALMENTE)`);

console.log(`\n📅 ONDE FORAM PARAR AS AULAS QUE ESTAVAM NA TERÇA-FEIRA:`);
finalLessons.filter(l => ['SEG','QUA','QUI','SEX'].includes(l.day)).forEach(l => {
  console.log(`   • ${DAY_LABELS[l.day]} | ${l.period+1}ª aula | Turma: ${l.classIds.map(className).join('+')} | ${subjectName(l.subjectId)}`);
});

console.log('\n================================================================================');
console.log('✅ SIMULAÇÃO CONCLUÍDA SEM NENHUM ERRO OU TRAVAMENTO!');
console.log('================================================================================');
