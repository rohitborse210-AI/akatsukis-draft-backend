import newman from 'newman';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { autoBootstrapAdmin } from '../src/utils/bootstrap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runNewmanTests() {
  process.env.NODE_ENV = 'test';
  await connectDB();
  await autoBootstrapAdmin();

  const testPort = 5002;
  const server = app.listen(testPort, '127.0.0.1', () => {
    console.log(`[Newman Runner] Test API server listening on http://127.0.0.1:${testPort}`);
  });

  const collectionPath = path.join(__dirname, '../postman/Akatsukis-Draft.postman_collection.json');

  console.log('[Newman Runner] Starting Newman execution of Postman collection...');

  const emitter = newman.run({
    collection: collectionPath,
    envVar: [
      { key: 'baseUrl', value: `http://127.0.0.1:${testPort}/api` },
    ],
  });

  let totalRequests = 0;
  let totalAssertions = 0;
  let failedAssertions = 0;

  emitter.on('request', (err, args) => {
    totalRequests++;
    const code = args.response ? args.response.code : 'NO_RESP';
    console.log(`[REQ ${totalRequests}] ${args.item.name} -> HTTP ${code}`);
  });

  emitter.on('assertion', (err, args) => {
    totalAssertions++;
    if (err) {
      failedAssertions++;
      console.error(`  ❌ FAIL: ${args.assertion} - ${err.message}`);
    } else {
      console.log(`  ✅ PASS: ${args.assertion}`);
    }
  });

  emitter.on('done', async (err, summary) => {
    console.log('\n================ Newman Summary ================');
    console.log(`Total Requests:   ${totalRequests}`);
    console.log(`Total Assertions: ${totalAssertions}`);
    console.log(`Passed:           ${totalAssertions - failedAssertions}`);
    console.log(`Failed:           ${failedAssertions}`);
    console.log('================================================\n');

    server.close();
    await disconnectDB();

    if (err || failedAssertions > 0) {
      console.error(`[Newman Runner] Run completed with errors. Failed assertions: ${failedAssertions}`);
      process.exit(1);
    } else {
      console.log('[Newman Runner] All Postman assertions passed successfully!');
      process.exit(0);
    }
  });
}

runNewmanTests().catch((err) => {
  console.error('[Newman Runner] Fatal failure:', err);
  process.exit(1);
});
