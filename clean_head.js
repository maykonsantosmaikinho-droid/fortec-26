const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const styleIdx = html.indexOf('<style>');
if (styleIdx === -1) {
  console.error('Could not find <style> tag!');
  process.exit(1);
}

const cleanHead = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FORTEC — Gerador de Horários</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<style>`;

html = cleanHead + html.slice(styleIdx + 7);
fs.writeFileSync('index.html', html, 'utf8');
console.log('Cleaned head section! New file size:', html.length);
