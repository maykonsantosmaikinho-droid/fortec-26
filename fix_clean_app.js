const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Strip out giant inline script if present
const scriptStart = html.indexOf('<script>\n/*! xlsx.js');
if (scriptStart !== -1) {
  const scriptEnd = html.indexOf('</script>', scriptStart);
  if (scriptEnd !== -1) {
    const cleanHeader = '<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>';
    html = html.slice(0, scriptStart) + cleanHeader + html.slice(scriptEnd + 9);
    console.log('Stripped giant inline script successfully!');
  }
}

// Clean exportExcel function using SpreadsheetML XML fallback + XLSX
const cleanExportExcel = `/* exportação Excel */
function exportExcel(){
  if(!db.schedule){ alert('Nenhum horário gerado ainda.'); return; }
  
  // Se XLSX estiver carregado, gera arquivo binário XLSX com abas
  if(typeof XLSX !== 'undefined'){
    try{
      const wb = XLSX.utils.book_new();
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
              row.push(l ? \`\${subjectName(l.subjectId)} (\${teacherName(l.teacherId)})\` : '—');
            });
            rows.push(row);
          });
          rows.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{ wch: 15 }, { wch: 18 }, ...classes.map(c => ({ wch: Math.max(c.name.length + 6, 26) }))];
        XLSX.utils.book_append_sheet(wb, ws, seg === 'F' ? 'Geral Fundamental' : 'Geral Médio');
      });

      // Visão Por Professor
      const teacherRows = [['FORTEC — HORÁRIO POR PROFESSOR'], [], ['Professor', 'Dia', 'Período', 'Horário', 'Disciplina', 'Turma(s)']];
      db.teachers.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).forEach(t => {
        const lessons = db.schedule.lessons.filter(l => l.teacherId === t.id);
        if(lessons.length === 0) return;
        lessons.sort((a,b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period);
        lessons.forEach(l => {
          const p = SEGS[l.segment].periods[l.period];
          teacherRows.push([t.name, DAY_LABELS[l.day], \`\${l.period + 1}ª aula\`, \`\${p.start}–\${p.end}\`, subjectName(l.subjectId), l.classIds.map(className).join(', ')]);
        });
      });
      if(teacherRows.length > 3) {
        const wsTeacher = XLSX.utils.aoa_to_sheet(teacherRows);
        wsTeacher['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 16 }, { wch: 28 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, wsTeacher, 'Por Professor');
      }

      // Abas por turma
      db.classes.forEach(c => {
        const periods = SEGS[c.segment].periods;
        const rows = [[\`FORTEC — HORÁRIO ESCOLAR — \${c.name.toUpperCase()}\`], [], ['Período / Horário', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira']];
        periods.forEach((p, idx) => {
          const row = [\`\${idx+1}ª aula (\${p.start}–\${p.end})\`];
          DAYS.forEach(day => {
            const l = db.schedule ? db.schedule.lessons.find(l => l.day === day && l.period === idx && l.classIds.includes(c.id)) : null;
            row.push(l ? \`\${subjectName(l.subjectId)} (\${teacherName(l.teacherId)})\` : '—');
          });
          rows.push(row);
        });
        const wsClass = XLSX.utils.aoa_to_sheet(rows);
        wsClass['!cols'] = [{ wch: 22 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, wsClass, c.name.slice(0, 28));
      });

      XLSX.writeFile(wb, 'fortec-horario-excel.xlsx');
      showSaveIndicator('✓ Planilha Excel gerada com sucesso!');
      return;
    }catch(e){
      console.warn('Falha no SheetJS, usando gerador XML nativo:', e);
    }
  }

  // Fallback nativo 100% offline via SpreadsheetML XML
  try {
    function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n' +
    '<?mso-application progid="Excel.Sheet"?>\\n' +
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\\n' +
    ' xmlns:o="urn:schemas-microsoft-com:office:office"\\n' +
    ' xmlns:x="urn:schemas-microsoft-com:office:excel"\\n' +
    ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\\n' +
    '<Styles>\\n' +
    ' <Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Calibri" ss:Size="11"/></Style>\\n' +
    ' <Style ss:ID="Title"><Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#182741"/></Style>\\n' +
    ' <Style ss:ID="Header"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#182741" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>\\n' +
    ' <Style ss:ID="Cell"><Font ss:FontName="Calibri" ss:Size="10"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/></Borders></Style>\\n' +
    ' <Style ss:ID="TimeCol"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#182741"/><Interior ss:Color="#EFEADD" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/></Borders></Style>\\n' +
    '</Styles>\\n';

    ['F','M'].forEach(seg=>{
      const periods = SEGS[seg].periods;
      const classes = db.classes.filter(c=>c.segment===seg);
      if(classes.length === 0) return;
      
      xml += '<Worksheet ss:Name="Geral ' + (seg==='F'?'Fundamental':'Médio') + '"><Table>\\n';
      xml += '<Column ss:Width="110"/>\\n<Column ss:Width="120"/>\\n';
      classes.forEach(() => { xml += '<Column ss:Width="180"/>\\n'; });
      
      xml += '<Row ss:Height="30"><Cell ss:StyleID="Title"><Data ss:Type="String">FORTEC — HORÁRIO GERAL (' + SEGS[seg].label.toUpperCase() + ')</Data></Cell></Row>\\n<Row/>\\n';
      xml += '<Row ss:Height="24"><Cell ss:StyleID="Header"><Data ss:Type="String">Dia</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Horário</Data></Cell>';
      classes.forEach(c => { xml += '<Cell ss:StyleID="Header"><Data ss:Type="String">' + esc(c.name) + '</Data></Cell>'; });
      xml += '</Row>\\n';
      
      DAYS.forEach(day => {
        periods.forEach((p, idx) => {
          xml += '<Row ss:Height="22"><Cell ss:StyleID="TimeCol"><Data ss:Type="String">' + esc(DAY_LABELS[day]) + '</Data></Cell><Cell ss:StyleID="TimeCol"><Data ss:Type="String">' + (idx+1) + 'ª (' + p.start + '–' + p.end + ')</Data></Cell>';
          classes.forEach(c => {
            const l = db.schedule ? db.schedule.lessons.find(l => l.day === day && l.period === idx && l.classIds.includes(c.id)) : null;
            const val = l ? subjectName(l.subjectId) + ' (' + teacherName(l.teacherId) + ')' : '—';
            xml += '<Cell ss:StyleID="Cell"><Data ss:Type="String">' + esc(val) + '</Data></Cell>';
          });
          xml += '</Row>\\n';
        });
        xml += '<Row ss:Height="8"/>\\n';
      });
      xml += '</Table></Worksheet>\\n';
    });

    xml += '</Workbook>';
    downloadText('fortec-horario-excel.xls', xml, 'application/vnd.ms-excel;charset=utf-8');
    showSaveIndicator('✓ Planilha Excel gerada com sucesso!');
  }catch(e){
    console.error('Erro na exportação:', e);
    alert('Erro ao gerar Excel: ' + e.message);
  }
}`;

const startIdx = html.indexOf('/* exportação Excel */');
const endIdx = html.indexOf('function exportCSVFallback()');

if (startIdx !== -1 && endIdx !== -1) {
  html = html.slice(0, startIdx) + cleanExportExcel + '\n' + html.slice(endIdx);
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('Fixed index.html! New file size:', html.length);
} else {
  console.error('Could not find function bounds in index.html');
}
