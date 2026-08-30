const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Add CSS for matrix board layout
const extraCss = `
.matrix-board .daycol {
  background: var(--amber) !important;
  color: #ffffff !important;
  font-weight: 700;
  text-align: center;
  vertical-align: middle;
  font-size: 13px;
  letter-spacing: 0.5px;
  border-right: 2px solid var(--navy-2) !important;
  width: 90px;
  min-width: 90px;
}
.matrix-board .day-first-row td {
  border-top: 2px solid var(--navy);
}
.matrix-board .day-divider td {
  height: 8px;
  background: var(--paper-2);
  padding: 0;
  border: none;
}
`;

// Insert extraCss before </style>
html = html.replace('</style>', extraCss + '\n</style>');

// 2. Replace renderScheduleTab to remove the horizontal scroll message
const oldRenderScheduleTab = `function renderScheduleTab(){
  if(!db.schedule) return \`<p class="muted">Nenhum horário gerado ainda. Vá na aba "Gerar Horário".</p>\`;
  if(state.scheduleView==='geral'){
    return renderAuditBanner()+
      \`<h3>Ensino Fundamental</h3>\${renderBoardByDay('F')}
      <h3 style="margin-top:18px">Médio/Técnico</h3>\${renderBoardByDay('M')}\${renderLegend()}\`;
  }
  if(state.scheduleView==='turma'){
    if(!state.scheduleFilter) return \`<p class="muted">Selecione uma turma.</p>\`;
    return renderBoard(classSeg(state.scheduleFilter), state.scheduleFilter)+renderLegend();
  }
  if(state.scheduleView==='professor'){
    if(!state.scheduleFilter) return \`<p class="muted">Selecione um professor.</p>\`;
    return renderTeacherBoard(state.scheduleFilter);
  }
}`;

// 3. Replace renderBoardByDay function to output vertical days table
const newRenderBoardByDay = `function renderBoardByDay(seg){
  const classes = db.classes.filter(c=>c.segment===seg);
  if(classes.length===0) return \`<p class="muted">Nenhuma turma neste segmento.</p>\`;
  const periods = SEGS[seg].periods;
  
  let rows = '';
  DAYS.forEach((day, dayIdx) => {
    periods.forEach((p, idx) => {
      rows += \`<tr class="\${idx===0 ? 'day-first-row' : ''}">\`;
      if(idx === 0) {
        rows += \`<td class="daycol" rowspan="\${periods.length}">\${DAY_LABELS[day]}</td>\`;
      }
      rows += \`<td class="timecol">\${idx+1}ª (\${p.start}–\${p.end})</td>\`;
      
      classes.forEach(c => {
        const l = db.schedule && db.schedule.lessons.find(l => l.day === day && l.period === idx && l.classIds.includes(c.id));
        if(!l){
          rows += \`<td><div class="cell empty" onclick="openCellEditor('\${c.id}','\${day}',\${idx})">·</div></td>\`;
        } else {
          const exc = (idx===1 && seg==='M' && !db.schedule.lessons.some(x=>x.day===day && x.period===0 && x.classIds.includes(c.id)));
          rows += \`<td><div class="cell \${seg.toLowerCase()} \${exc?'exc':''}" onclick="openLessonEditor('\${l.id}')">
            <div class="subj">\${subjectName(l.subjectId)}</div>
            <div class="teach">\${teacherName(l.teacherId)}\${l.classIds.length>1?' · '+l.classIds.filter(x=>x!==c.id).map(className).join('+'):''}</div>
          </div></td>\`;
        }
      });
      rows += \`</tr>\`;
    });
    if(dayIdx < DAYS.length - 1) {
      rows += \`<tr class="day-divider"><td colspan="\${classes.length + 2}"></td></tr>\`;
    }
  });

  return \`<div class="board-wrap"><table class="board matrix-board">
    <thead>
      <tr>
        <th class="daycol">Dia</th>
        <th class="timecol">Horário</th>
        \${classes.map(c=>\`<th>\${c.name}</th>\`).join('')}
      </tr>
    </thead>
    <tbody>\${rows}</tbody>
  </table></div>\`;
}`;

// Find renderBoardByDay position and replace up to renderBoard
const startIdx = html.indexOf('function renderBoardByDay(');
const endIdx = html.indexOf('function renderBoard(');

if (startIdx !== -1 && endIdx !== -1) {
  html = html.slice(0, startIdx) + newRenderBoardByDay + '\n' + html.slice(endIdx);
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('Successfully updated site layout in index.html!');
} else {
  console.error('Could not locate renderBoardByDay function in index.html');
}
