import fs from 'fs';

const punjabiData = JSON.parse(fs.readFileSync('scripts/punjabi-songs.json', 'utf8'));
const mockDataPath = 'src/lib/mock-data.ts';
let mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

// Find end of CURATED_BOLLYWOOD_SONGS array
const closingBracketIndex = mockDataContent.lastIndexOf('];\n\nexport const BOLLYWOOD_SEARCHABLE_CATALOG');
if (closingBracketIndex === -1) {
  console.error('Could not find insertion point in mock-data.ts');
  process.exit(1);
}

const punjabiSongsJson = punjabiData.curated
  .map((song) => `  ${JSON.stringify(song, null, 2).replace(/\n/g, '\n  ')}`)
  .join(',\n');

const newMockDataContent = 
  mockDataContent.slice(0, closingBracketIndex) +
  ',\n' +
  punjabiSongsJson +
  '\n' +
  mockDataContent.slice(closingBracketIndex);

fs.writeFileSync(mockDataPath, newMockDataContent, 'utf8');
console.log(`Successfully added ${punjabiData.curated.length} Punjabi songs to src/lib/mock-data.ts!`);
