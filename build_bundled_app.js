const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
const xlsxJs = fs.readFileSync('node_modules/xlsx/dist/xlsx.full.min.js', 'utf8');

// Replace external script tag with inline script
html = html.replace(
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>',
  '<script>\n' + xlsxJs + '\n</script>'
);

// Replace exportExcel function
const newExportExcel = `/* exportação Excel */
function exportExcel(){
  if(!db.schedule){ alert('Nenhum horário gerado ainda.'); return; }
  try{
    const wb = XLSX.utils.book_new();

    // 1. Visão Geral (Matriz organizada: Dia | Horário | Turma 1 | Turma 2 ...)
    ['F','M'].forEach(seg=>{
      const periods = SEGS[seg].periods;
      const classes = db.classes.filter(c=>c.segment===seg);
      if(classes.length === 0) return;

      const rows = [];
      rows.push([\`FORTEC — HORÁRIO GERAL (\${SEGS[seg].label.toUpperCase()})\`]);
      rows.push([]);
      
      const header = ['Dia', 'Horário', ...classes.map(c=>c.name)];
      rows.push(header);

      DAYS.forEach(day => {
        periods.forEach((p, idx) => {
          const row = [DAY_LABELS[day], \`\${idx+1}ª (\${p.start}–\${p.end})\`];
          classes.forEach(c => {
            const l = db.schedule ? db.schedule.lessons.find(l => l.day === day && l.period === idx && l.classIds.includes(c.id)) : null;
            if(l) {
              row.push(\`\${subjectName(l.subjectId)} (\${teacherName(l.teacherId)})\`);
            } else {
              row.push('—');
            }
          });
          rows.push(row);
        });
        rows.push([]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 15 },
        { wch: 18 },
        ...classes.map(c => ({ wch: Math.max(c.name.length + 6, 26) }))
      ];

      XLSX.utils.book_append_sheet(wb, ws, seg === 'F' ? 'Geral Fundamental' : 'Geral Médio');
    });

    // 2. Visão Por Professor
    const teacherRows = [
      ['FORTEC — HORÁRIO POR PROFESSOR'],
      [],
      ['Professor', 'Dia', 'Período', 'Horário', 'Disciplina', 'Turma(s)']
    ];
    if(db.schedule && db.schedule.lessons){
      db.teachers.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).forEach(t => {
        const lessons = db.schedule.lessons.filter(l => l.teacherId === t.id);
        if(lessons.length === 0) return;
        lessons.sort((a,b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period);
        lessons.forEach(l => {
          const p = SEGS[l.segment].periods[l.period];
          teacherRows.push([
            t.name,
            DAY_LABELS[l.day],
            \`\${l.period + 1}ª aula\`,
            \`\${p.start}–\${p.end}\`,
            subjectName(l.subjectId),
            l.classIds.map(className).join(', ')
          ]);
        });
      });
    }
    if(teacherRows.length > 3) {
      const wsTeacher = XLSX.utils.aoa_to_sheet(teacherRows);
      wsTeacher['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 16 }, { wch: 28 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, wsTeacher, 'Por Professor');
    }

    // 3. Abas Individuais por Turma
    db.classes.forEach(c => {
      const periods = SEGS[c.segment].periods;
      const rows = [
        [\`FORTEC — HORÁRIO ESCOLAR — \${c.name.toUpperCase()}\`],
        [],
        ['Período / Horário', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira']
      ];
      periods.forEach((p, idx) => {
        const row = [\`\${idx+1}ª aula (\${p.start}–\${p.end})\`];
        DAYS.forEach(day => {
          const l = db.schedule ? db.schedule.lessons.find(l => l.day === day && l.period === idx && l.classIds.includes(c.id)) : null;
          row.push(l ? \`\${subjectName(l.subjectId)} (\${teacherName(l.teacherId)})\` : '—');
        });
        rows.push(row);
      });
      const wsClass = XLSX.utils.aoa_to_sheet(rows);
      wsClass['!cols'] = [
        { wch: 22 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 }
      ];
      XLSX.utils.book_append_sheet(wb, wsClass, c.name.slice(0, 28));
    });

    // 4. Auditoria & Conflitos
    const auditRows = [
      ['FORTEC — RELATÓRIO DE AUDITORIA E CONFLITOS'],
      [],
      ['Tipo', 'Descrição do Item / Conflito']
    ];
    if(db.schedule && db.schedule.audit){
      db.schedule.audit.hardViolations.forEach(v => auditRows.push(['Violação (Crítica)', v]));
      db.schedule.audit.deficits.forEach(v => auditRows.push(['Aviso / Déficit', v]));
    }
    if(auditRows.length === 3) auditRows.push(['OK', 'Nenhum conflito ou pendência detectado no horário.']);
    const wsAudit = XLSX.utils.aoa_to_sheet(auditRows);
    wsAudit['!cols'] = [{ wch: 22 }, { wch: 85 }];
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Auditoria-Conflitos');

    XLSX.writeFile(wb, 'fortec-horario-oficial.xlsx');
    showSaveIndicator('✓ Planilha Excel gerada com sucesso!');
  }catch(e){
    console.error('Falha ao exportar Excel:', e);
    alert('Erro ao gerar Excel: ' + e.message);
  }
}`;

// Find exportExcel function position and replace it
const startIdx = html.indexOf('/* exportação Excel */');
const endIdx = html.indexOf('function exportCSVFallback()');

if (startIdx !== -1 && endIdx !== -1) {
  html = html.slice(0, startIdx) + newExportExcel + '\n' + html.slice(endIdx);
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('Successfully updated index.html! New length:', html.length);
} else {
  console.error('Could not find function bounds in index.html');
}
