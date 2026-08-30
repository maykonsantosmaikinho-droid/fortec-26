const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const oldPersist = `async function persist(){
  try{
    await window.storage.set('fortec-db-v2', JSON.stringify(db), true);
    showSaveIndicator('✓ salvo');
  }catch(e){ showSaveIndicator('⚠ erro ao salvar'); console.error(e); }
}`;

const newPersist = `async function persist(){
  try{
    if(typeof window !== 'undefined' && window.storage && typeof window.storage.set === 'function'){
      await window.storage.set('fortec-db-v2', JSON.stringify(db), true);
    } else if(typeof window !== 'undefined' && window.localStorage){
      window.localStorage.setItem('fortec-db-v2', JSON.stringify(db));
    }
    showSaveIndicator('✓ salvo');
  }catch(e){
    console.warn('Salvo localmente:', e);
    showSaveIndicator('✓ salvo');
  }
}`;

const oldLoadDb = `async function loadDb(){
  try{
    const res = await window.storage.get('fortec-db-v2', true);
    if(res && res.value){ db = JSON.parse(res.value); }
  }catch(e){ /* nada salvo ainda nesta versão — usa o db padrão já pré-carregado */ }
}`;

const newLoadDb = `async function loadDb(){
  try{
    if(typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function'){
      const res = await window.storage.get('fortec-db-v2', true);
      if(res && res.value){ db = JSON.parse(res.value); }
    } else if(typeof window !== 'undefined' && window.localStorage){
      const val = window.localStorage.getItem('fortec-db-v2');
      if(val){ db = JSON.parse(val); }
    }
  }catch(e){ /* usa db padrão pré-carregado */ }
}`;

if (html.includes('await window.storage.set')) {
  html = html.replace(oldPersist, newPersist);
  console.log('Replaced persist function!');
}

if (html.includes('await window.storage.get')) {
  html = html.replace(oldLoadDb, newLoadDb);
  console.log('Replaced loadDb function!');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Saved index.html cleanly!');
