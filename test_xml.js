const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const dbMatch = html.match(/let db = ({[\s\S]*?});\r?\n/);
const db = JSON.parse(dbMatch[1]);

const DAYS = ['SEG','TER','QUA','QUI','SEX'];
const DAY_LABELS = {SEG:'Segunda-feira',TER:'Terça-feira',QUA:'Quarta-feira',QUI:'Quinta-feira',SEX:'Sexta-feira'};
const FUND_PERIODS = [
  {start:'07:30',end:'08:20'},{start:'08:20',end:'09:10'},{start:'09:25',end:'10:15'},
  {start:'10:15',end:'11:05'},{start:'11:05',end:'11:55'},{start:'11:55',end:'12:45'},{start:'12:45',end:'13:35'}
];
const MEDIO_PERIODS = [
  {start:'07:30',end:'08:20'},{start:'08:20',end:'09:10'},{start:'09:10',end:'10:00'},
  {start:'10:15',end:'11:05'},{start:'11:05',end:'11:55'},{start:'11:55',end:'12:45'},{start:'12:45',end:'13:35'}
];
const SEGS = { F:{key:'F',label:'Fundamental',periods:FUND_PERIODS}, M:{key:'M',label:'Médio/Técnico',periods:MEDIO_PERIODS} };

function subjectName(id){ const s=db.subjects.find(x=>x.id===id); return s?s.name:''; }
function teacherName(id){ const t=db.teachers.find(x=>x.id===id); return t?t.name:''; }
function className(id){ const c=db.classes.find(x=>x.id===id); return c?c.name:''; }

function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
 <Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Calibri" ss:Size="11"/></Style>
 <Style ss:ID="Title"><Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#182741"/></Style>
 <Style ss:ID="Header"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#182741" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>
 <Style ss:ID="SubHeader"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#2A1C02"/><Interior ss:Color="#DD9A2B" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>
 <Style ss:ID="Cell"><Font ss:FontName="Calibri" ss:Size="10"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/></Borders></Style>
 <Style ss:ID="TimeCol"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#182741"/><Interior ss:Color="#EFEADD" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3DDCB"/></Borders></Style>
</Styles>
`;

['F','M'].forEach(seg=>{
  const periods = SEGS[seg].periods;
  const classes = db.classes.filter(c=>c.segment===seg);
  if(classes.length === 0) return;
  
  xml += `<Worksheet ss:Name="Geral ${seg==='F'?'Fundamental':'Médio'}"><Table>\n`;
  xml += `<Column ss:Width="110"/>\n`;
  xml += `<Column ss:Width="120"/>\n`;
  classes.forEach(() => { xml += `<Column ss:Width="180"/>\n`; });
  
  xml += `<Row ss:Height="30"><Cell ss:StyleID="Title"><Data ss:Type="String">FORTEC — HORÁRIO GERAL (${SEGS[seg].label.toUpperCase()})</Data></Cell></Row>\n`;
  xml += `<Row/>\n`;
  
  xml += `<Row ss:Height="24"><Cell ss:StyleID="Header"><Data ss:Type="String">Dia</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Horário</Data></Cell>`;
  classes.forEach(c => { xml += `<Cell ss:StyleID="Header"><Data ss:Type="String">${esc(c.name)}</Data></Cell>`; });
  xml += `</Row>\n`;
  
  DAYS.forEach(day => {
    periods.forEach((p, idx) => {
      xml += `<Row ss:Height="22"><Cell ss:StyleID="TimeCol"><Data ss:Type="String">${esc(DAY_LABELS[day])}</Data></Cell><Cell ss:StyleID="TimeCol"><Data ss:Type="String">${idx+1}ª (${p.start}–${p.end})</Data></Cell>`;
      classes.forEach(c => {
        const l = db.schedule ? db.schedule.lessons.find(l => l.day === day && l.period === idx && l.classIds.includes(c.id)) : null;
        const val = l ? `${subjectName(l.subjectId)} (${teacherName(l.teacherId)})` : '—';
        xml += `<Cell ss:StyleID="Cell"><Data ss:Type="String">${esc(val)}</Data></Cell>`;
      });
      xml += `</Row>\n`;
    });
    xml += `<Row ss:Height="8"/>\n`;
  });
  
  xml += `</Table></Worksheet>\n`;
});

// Aba Por Professor
xml += `<Worksheet ss:Name="Por Professor"><Table>\n`;
xml += `<Column ss:Width="160"/>\n`;
xml += `<Column ss:Width="110"/>\n`;
xml += `<Column ss:Width="90"/>\n`;
xml += `<Column ss:Width="110"/>\n`;
xml += `<Column ss:Width="200"/>\n`;
xml += `<Column ss:Width="150"/>\n`;
xml += `<Row ss:Height="30"><Cell ss:StyleID="Title"><Data ss:Type="String">FORTEC — HORÁRIO POR PROFESSOR</Data></Cell></Row>\n<Row/>\n`;
xml += `<Row ss:Height="24">
  <Cell ss:StyleID="Header"><Data ss:Type="String">Professor</Data></Cell>
  <Cell ss:StyleID="Header"><Data ss:Type="String">Dia</Data></Cell>
  <Cell ss:StyleID="Header"><Data ss:Type="String">Período</Data></Cell>
  <Cell ss:StyleID="Header"><Data ss:Type="String">Horário</Data></Cell>
  <Cell ss:StyleID="Header"><Data ss:Type="String">Disciplina</Data></Cell>
  <Cell ss:StyleID="Header"><Data ss:Type="String">Turma(s)</Data></Cell>
</Row>\n`;
if(db.schedule && db.schedule.lessons){
  db.teachers.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).forEach(t => {
    const lessons = db.schedule.lessons.filter(l => l.teacherId === t.id);
    if(lessons.length === 0) return;
    lessons.sort((a,b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period);
    lessons.forEach(l => {
      const p = SEGS[l.segment].periods[l.period];
      xml += `<Row ss:Height="20">
        <Cell ss:StyleID="TimeCol"><Data ss:Type="String">${esc(t.name)}</Data></Cell>
        <Cell ss:StyleID="Cell"><Data ss:Type="String">${esc(DAY_LABELS[l.day])}</Data></Cell>
        <Cell ss:StyleID="Cell"><Data ss:Type="String">${l.period + 1}ª aula</Data></Cell>
        <Cell ss:StyleID="Cell"><Data ss:Type="String">${p.start}–${p.end}</Data></Cell>
        <Cell ss:StyleID="Cell"><Data ss:Type="String">${esc(subjectName(l.subjectId))}</Data></Cell>
        <Cell ss:StyleID="Cell"><Data ss:Type="String">${esc(l.classIds.map(className).join(', '))}</Data></Cell>
      </Row>\n`;
    });
  });
}
xml += `</Table></Worksheet>\n`;

// Abas por turma
db.classes.forEach(c => {
  const periods = SEGS[c.segment].periods;
  xml += `<Worksheet ss:Name="${esc(c.name.slice(0,28))}"><Table>\n`;
  xml += `<Column ss:Width="130"/>\n`;
  DAYS.forEach(() => { xml += `<Column ss:Width="200"/>\n`; });
  xml += `<Row ss:Height="30"><Cell ss:StyleID="Title"><Data ss:Type="String">FORTEC — HORÁRIO ESCOLAR — ${esc(c.name.toUpperCase())}</Data></Cell></Row>\n<Row/>\n`;
  xml += `<Row ss:Height="24"><Cell ss:StyleID="Header"><Data ss:Type="String">Período / Horário</Data></Cell>`;
  DAYS.forEach(d => { xml += `<Cell ss:StyleID="Header"><Data ss:Type="String">${esc(DAY_LABELS[d])}</Data></Cell>`; });
  xml += `</Row>\n`;
  periods.forEach((p, idx) => {
    xml += `<Row ss:Height="22"><Cell ss:StyleID="TimeCol"><Data ss:Type="String">${idx+1}ª aula (${p.start}–${p.end})</Data></Cell>`;
    DAYS.forEach(day => {
      const l = db.schedule ? db.schedule.lessons.find(l => l.day === day && l.period === idx && l.classIds.includes(c.id)) : null;
      const val = l ? `${subjectName(l.subjectId)} (${teacherName(l.teacherId)})` : '—';
      xml += `<Cell ss:StyleID="Cell"><Data ss:Type="String">${esc(val)}</Data></Cell>`;
    });
    xml += `</Row>\n`;
  });
  xml += `</Table></Worksheet>\n`;
});

xml += '</Workbook>';

fs.writeFileSync('fortec-horario-perfeito.xls', xml, 'utf8');
console.log('XML generated successfully! File size:', xml.length, 'bytes');
