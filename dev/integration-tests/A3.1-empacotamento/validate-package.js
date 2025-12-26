/**
 * Script de validação de pacotes Custom Charts
 * Verifica estrutura e arquivos obrigatórios
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const charts = [
  'chart-01-encodings',
  'chart-02-layers',
  'chart-03-transforms',
  'chart-04-interactivity',
  'chart-05-customization',
  'chart-06-boxplot'
];

function validatePackage(chartDir) {
  const zipPath = path.join('..', '..', 'charts', chartDir, 'dist', '*.zip');
  const zipFiles = fs.globSync(zipPath);
  
  if (zipFiles.length === 0) {
    console.log(`⚠️  ${chartDir}: Nenhum arquivo .zip encontrado`);
    return false;
  }
  
  const zipFile = zipFiles[0];
  const zip = new AdmZip(zipFile);
  const entries = zip.getEntries();
  
  const requiredFiles = ['index.js', 'manifest.json', 'chart-config.json'];
  const foundFiles = entries.map(e => e.entryName.split('/').pop());
  
  let isValid = true;
  
  for (const required of requiredFiles) {
    if (!foundFiles.includes(required)) {
      console.log(`❌ ${chartDir}: Arquivo obrigatório não encontrado: ${required}`);
      isValid = false;
    }
  }
  
  if (isValid) {
    console.log(`✅ ${chartDir}: Pacote válido`);
  }
  
  return isValid;
}

console.log('🔍 Validando pacotes...\n');

let allValid = true;
for (const chart of charts) {
  if (!validatePackage(chart)) {
    allValid = false;
  }
}

console.log('');
if (allValid) {
  console.log('✅ Todos os pacotes são válidos!');
} else {
  console.log('❌ Alguns pacotes têm problemas. Verifique os erros acima.');
  process.exit(1);
}




