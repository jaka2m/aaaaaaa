
import worker from './gagal.tmp.mjs';
import { writeFile } from 'fs/promises';
import path from 'path';

// Mock global objects that the worker script expects in a Node.js environment
global.fetch = async (url) => {
    const urlStr = url.toString();
    if (urlStr.includes('proxyList.txt')) {
        return { status: 200, text: async () => `1.1.1.1,443,US,Cloudflare\n8.8.8.8,443,US,Google` };
    }
    if (urlStr.includes('api.cloudflare.com')) {
         return { status: 200, json: async () => ({ result: [] }) };
    }
    if (urlStr.includes('api.checker-ip.web.id')) {
        return { status: 200, json: async () => ({ status: 'ACTIVE', delay: '123ms' }) };
    }
     if (urlStr.includes('geovpn.vercel.app')) {
        return { status: 200, json: async () => ({ status: 'ACTIVE', delay: '123ms' }) };
    }
    return { status: 404, text: async () => 'Not Found' };
};

// The Node.js environment already has a 'crypto' object with 'getRandomValues'.
// No need to mock it.

// Mock Request and URL classes to be compatible with worker code
class MockRequest {
    constructor(urlStr) {
        this.url = urlStr;
        this.method = 'GET';
        this.headers = { get: () => null };
        this.searchParams = new URL(urlStr).searchParams;
    }
}
global.URL = URL;

async function generateAndSave(pathname, outputFile) {
    // The worker's fetch expects a Request-like object and separate env/ctx objects
    const request = new MockRequest(`http://localhost:8787${pathname}`);
    const env = {};
    const ctx = { waitUntil: () => {} };

    const response = await worker.fetch(request, env, ctx);
    const html = await response.text();
    await writeFile(path.join('jules-scratch', 'verification', outputFile), html);
    console.log(`Generated ${outputFile}`);
}

Promise.all([
    generateAndSave('/web', 'web.html'),
    generateAndSave('/vpn', 'vpn.html'),
    generateAndSave('/checker', 'checker.html')
]).then(() => console.log('HTML generation complete.'))
  .catch(e => {
      console.error('HTML generation failed:', e);
      process.exit(1);
  });
