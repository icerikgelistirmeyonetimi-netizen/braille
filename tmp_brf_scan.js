const fs = require('fs');
const path = require('path');
const patterns = [
  'brailleRowsFromMeasures',
  'brailleMeasureGroups',
  'brailleGlobalOlculeriOlustur',
  'muzikBrfExportMetniOlustur',
  'brfOlcuBazliSatirlaraBol',
  'muzikOlcuGruplariniMetneCevir',
  'muzikSkorunuBrailleyeCevir',
  'brfMuzikOku',
  'scoreToCanonicalBrf',
  'scoreToReaderResult',
  'useBrailleOutput',
  'useMuzikBrfEditor',
  'musicCanonicalPipelineDebug',
  'musicCanonicalFlags',
  'musicCanonicalPipeline'
];
const files = [];
function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(d.name)) files.push(p);
  });
}
walk('src');
const results = {};
patterns.forEach((p) => { results[p] = []; });
files.forEach((file) => {
  const txt = fs.readFileSync(file, 'utf8');
  patterns.forEach((p) => {
    const re = new RegExp('\\b' + p + '\\b', 'g');
    if (re.test(txt)) results[p].push(file);
  });
});
console.log(JSON.stringify(results, null, 2));
