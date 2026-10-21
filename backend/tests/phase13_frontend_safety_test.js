process.env.NODE_ENV = 'test';

// Frontend static guard.
//
// A temporal dead zone error in a React component (reading a `const` before
// its declaration) does not fail the build. It throws on the first render and
// leaves the merchant with a blank screen, which is exactly what happened to
// the merchant dashboard. This test runs the frontend linter and fails when a
// use-before-declaration is introduced again.

const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const FRONTEND_DIR = path.resolve(__dirname, '../../frontend');
const SRC_DIR = path.join(FRONTEND_DIR, 'src');
const CONFIG_FILE = path.join(FRONTEND_DIR, '.oxlintrc.json');
const OXLINT_BIN = path.join(FRONTEND_DIR, 'node_modules', '.bin', 'oxlint');

let passed = 0;
let failed = 0;

const check = (name, condition, detail = '') => {
  if (condition) {
    passed += 1;
    console.log(`[PASS] ${name}`);
  } else {
    failed += 1;
    console.log(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

const run = async () => {
  console.log('\n============================================================');
  console.log('--- STARTING PHASE 13 FRONTEND SAFETY REGRESSION ---');
  console.log('============================================================\n');

  try {
    check('Frontend sources are present', fs.existsSync(SRC_DIR));
    check('Frontend lint config is present', fs.existsSync(CONFIG_FILE));

    if (!fs.existsSync(OXLINT_BIN)) {
      console.log(
        '[SKIP] oxlint is not installed (frontend dependencies are missing). Run `npm install` inside frontend/ to enable this guard.'
      );
      passed += 1;
    } else {
      let raw = '';
      try {
        const result = await execFileAsync(
          OXLINT_BIN,
          ['-c', CONFIG_FILE, '--format=json', SRC_DIR],
          { cwd: FRONTEND_DIR, maxBuffer: 20 * 1024 * 1024 }
        );
        raw = result.stdout;
      } catch (error) {
        // oxlint exits non-zero when it reports findings. The JSON is still
        // printed on stdout, so parse it and decide from the diagnostics.
        raw = error.stdout || '';
        if (!raw) throw error;
      }

      const start = raw.indexOf('{');
      check('Linter produced parsable diagnostics', start !== -1);

      if (start !== -1) {
        const report = JSON.parse(raw.slice(start));
        const diagnostics = report.diagnostics || [];
        const tdzViolations = diagnostics.filter((diagnostic) =>
          /no-use-before-define/.test(diagnostic.code || '')
        );

        const details = tdzViolations
          .map((diagnostic) => {
            const useLine = diagnostic.labels?.[0]?.span?.line;
            const defLine = diagnostic.labels?.[1]?.span?.line;
            return `${diagnostic.filename} (use@${useLine} def@${defLine}) ${diagnostic.message}`;
          })
          .join(' | ');

        check(
          'No frontend source reads a variable before it is declared',
          tdzViolations.length === 0,
          details.slice(0, 400)
        );
      }
    }
  } catch (error) {
    failed += 1;
    console.error('[Phase13 Fatal Error]', error.message);
  }

  console.log('\n============================================================');
  console.log(`--- PHASE 13 RESULT: ${passed} passed, ${failed} failed ---`);
  console.log('============================================================\n');
  if (failed > 0) process.exitCode = 1;
};

run().catch((error) => {
  console.error('[Phase13 Runner Error]', error);
  process.exitCode = 1;
});
