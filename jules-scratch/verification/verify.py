import subprocess
import os
from playwright.sync_api import sync_playwright, expect

# --- 1. Prepare temporary worker script ---
print("Preparing temporary worker script...")
with open('gagal.js', 'r') as f:
    content = f.read()

# Comment out the problematic import. The HTML generation logic doesn't use it.
content = content.replace(
    'import { connect } from "cloudflare:sockets";',
    '// import { connect } from "cloudflare:sockets";'
)
# Comment out the setInterval call to prevent the script from hanging
content = content.replace(
    'setInterval(updateProxies, 60000);',
    '// setInterval(updateProxies, 60000);'
)
with open('jules-scratch/verification/gagal.tmp.mjs', 'w') as f:
    f.write(content)
print("Temporary worker script created.")

# --- 2. Create and run Node.js script to generate HTML files ---
print("Creating HTML generation script...")
node_script = """
import worker from './gagal.tmp.mjs';
import { writeFile } from 'fs/promises';
import path from 'path';

// Mock global objects that the worker script expects in a Node.js environment
global.fetch = async (url) => {
    const urlStr = url.toString();
    if (urlStr.includes('proxyList.txt')) {
        return { status: 200, text: async () => `1.1.1.1,443,US,Cloudflare\\n8.8.8.8,443,US,Google` };
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
"""
with open('jules-scratch/verification/generate_html.mjs', 'w') as f:
    f.write(node_script)
print("HTML generation script created.")

print("Running HTML generation script...")
try:
    result = subprocess.run(
        ['node', 'jules-scratch/verification/generate_html.mjs'],
        check=True,
        capture_output=True,
        text=True,
        timeout=30
    )
    print("Node script output:", result.stdout)
except subprocess.CalledProcessError as e:
    print("Error generating HTML files:")
    print("STDOUT:", e.stdout)
    print("STDERR:", e.stderr)
    exit(1)
except subprocess.TimeoutExpired as e:
    print("Node script timed out.")
    print("STDOUT:", e.stdout)
    print("STDERR:", e.stderr)
    exit(1)

# --- 3. Run Playwright to take screenshots ---
print("Launching Playwright to take screenshots...")
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    verification_dir = os.path.abspath('jules-scratch/verification')

    # Verify /web page
    web_html_path = os.path.join(verification_dir, 'web.html')
    page.goto(f'file://{web_html_path}')
    page.wait_for_load_state('load')
    expect(page.locator('h1.quantum-title')).to_have_text('GEO PROJECT')
    page.screenshot(path='jules-scratch/verification/web-page.png')
    print("Screenshot for /web page taken.")

    # Verify /vpn page
    vpn_html_path = os.path.join(verification_dir, 'vpn.html')
    page.goto(f'file://{vpn_html_path}')
    page.wait_for_load_state('load')
    expect(page.locator('h1.title')).to_have_text('Sub Link')
    page.screenshot(path='jules-scratch/verification/vpn-page.png')
    print("Screenshot for /vpn page taken.")

    # Verify /checker page
    checker_html_path = os.path.join(verification_dir, 'checker.html')
    page.goto(f'file://{checker_html_path}')
    page.wait_for_load_state('load')
    expect(page.locator('h1')).to_have_text('Proxy Checker')
    page.screenshot(path='jules-scratch/verification/checker-page.png')
    print("Screenshot for /checker page taken.")

    browser.close()

print("Verification script finished successfully.")