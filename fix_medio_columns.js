const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Replace CSS rules for table.board to prevent squeezing
const oldCss = `table.board{border-collapse:collapse;table-layout:fixed;width:auto}
table.board th,table.board td{border:1px solid var(--line);padding:0;text-align:center;vertical-align:top;width:150px;overflow:hidden}
table.board thead th{background:var(--navy);color:#fff;font:600 11px 'JetBrains Mono',monospace;letter-spacing:1px;padding:9px 4px;position:sticky;top:0;width:150px}
table.board .timecol{background:var(--paper-2);font:700 11px 'JetBrains Mono',monospace;color:var(--navy);padding:9px 6px;white-space:nowrap;width:96px}`;

const newCss = `table.board{border-collapse:collapse;table-layout:fixed;width:max-content;min-width:100%}
table.board th,table.board td{border:1px solid var(--line);padding:0;text-align:center;vertical-align:middle;min-width:145px;width:145px;box-sizing:border-box}
table.board thead th{background:var(--navy);color:#fff;font:600 11.5px 'JetBrains Mono',monospace;letter-spacing:0.8px;padding:10px 6px;position:sticky;top:0;min-width:145px;width:145px;z-index:2}
table.board .timecol{background:var(--paper-2);font:700 11px 'JetBrains Mono',monospace;color:var(--navy);padding:9px 6px;white-space:nowrap;min-width:115px;width:115px;border-right:2px solid var(--navy-2)}
.matrix-board .daycol {
  background: var(--amber) !important;
  color: #ffffff !important;
  font-weight: 700;
  text-align: center;
  vertical-align: middle;
  font-size: 13px;
  letter-spacing: 0.5px;
  border-right: 2px solid var(--navy-2) !important;
  min-width: 95px !important;
  width: 95px !important;
}
.cell{min-height:48px;padding:8px 6px;cursor:pointer;transition:background .1s;border-bottom:1px dashed var(--line);display:flex;flex-direction:column;justify-content:center;align-items:center}
.cell .subj{font-weight:700;font-size:11.5px;color:var(--navy);overflow-wrap:break-word;word-break:break-word;line-height:1.3;text-align:center}
.cell .teach{font-size:10.5px;color:var(--steel);margin-top:2px;overflow-wrap:break-word;word-break:break-word;text-align:center}`;

const startIdx = html.indexOf('table.board{border-collapse:collapse');
const endIdx = html.indexOf('.cell.f{border-left');

if (startIdx !== -1 && endIdx !== -1) {
  html = html.slice(0, startIdx) + newCss + '\n' + html.slice(endIdx);
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('Successfully updated CSS for spacious table columns!');
} else {
  console.error('Could not find CSS bounds in index.html');
}
