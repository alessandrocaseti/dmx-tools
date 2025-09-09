const fs = require('fs');
const path = require('path');

const fixturesDir = path.join(__dirname, 'pages', '..', 'fixtures');
const outputFile = path.join(__dirname, 'pages', 'fixtures-map.js');

function getFixtureFoldersAndFiles(dir) {
    const folders = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
    const folderFiles = {};
    folders.forEach(folder => {
        const files = fs.readdirSync(path.join(dir, folder))
            .filter(f => f.endsWith('.json'));
        folderFiles[folder] = files;
    });
    return { folders, folderFiles };
}

const { folders, folderFiles } = getFixtureFoldersAndFiles(fixturesDir);

const jsContent = `// DMX TOOLS - Generated fixture map

const fixtureFolders = ${JSON.stringify(folders, null, 4)};

const folderFiles = ${JSON.stringify(folderFiles, null, 4)};
`;

fs.writeFileSync(outputFile, jsContent, 'utf8');
console.log('fixtures-map.js generated!');
