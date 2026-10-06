import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {encoding: 'utf8'}).split('\0').filter(Boolean).sort();
const sources = [...new Set(files)].filter(existsSync).map(path => ({path, sha256: createHash('sha256').update(readFileSync(path)).digest('hex')}));
const apks = process.argv.slice(2).map(path => ({path: resolve(path), sha256: createHash('sha256').update(readFileSync(path)).digest('hex')}));
const manifest = {createdAt: new Date().toISOString(), node: process.version, fixture: 'collect-v1', sourceHash: createHash('sha256').update(JSON.stringify(sources)).digest('hex'), sources, apks};
mkdirSync('artifacts', {recursive: true});
writeFileSync('artifacts/source-and-build.json', JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({sourceHash: manifest.sourceHash, sourceFiles: sources.length, apks}, null, 2));
