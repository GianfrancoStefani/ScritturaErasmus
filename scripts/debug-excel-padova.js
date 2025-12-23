
const XLSX = require('xlsx');
const path = require('path');

function check() {
  const excelPath = path.join(process.cwd(), 'universita_europee_ECHE.xlsx');
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  const padova = data.find(r => r['Nome'] && r['Nome'].toLowerCase().includes('padova'));
  console.log('--- EXCEL MATCH FOR PADOVA ---');
  console.log(padova);
}

check();
