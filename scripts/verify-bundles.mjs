import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
for (const variant of ['e2e', 'release']) {
  const path = `android/app/build/generated/sourcemaps/react/${variant}/index.android.bundle.map`;
  const {sources} = JSON.parse(readFileSync(path, 'utf8'));
  const testSources = sources.filter(source => /(?:e2e\/TestApp|index\.e2e)/.test(source.replaceAll('\\', '/')));
  if (variant === 'release') {
    assert.equal(testSources.length, 0, 'Release contains E2E-only source');
  } else {
    assert.ok(testSources.some(source => source.includes('TestApp')), 'E2E does not contain the fault controls');
  }
  console.log(`${variant}: ${sources.length} source files; ${testSources.length} E2E-only sources; PASS`);
}
