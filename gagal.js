import { connect } from "cloudflare:sockets";

const proxyListURL = 'https://raw.githubusercontent.com/jaka2m/botak/refs/heads/main/cek/proxyList.txt';
const namaWeb = 'GEO PROJECT'
const telegrambot = 'https://t.me/VLTRSSbot'
const channelku = 'https://t.me/testikuy_mang'
const telegramku = 'https://geoproject.biz.id/circle-flags/telegram.png'
const whatsappku = 'https://geoproject.biz.id/circle-flags/whatsapp.png'
const ope = 'https://geoproject.biz.id/circle-flags/options.png'
// Variables
const rootDomain = "gpj2.dpdns.org"; // Ganti dengan domain utama kalian
const serviceName = "tes"; // Ganti dengan nama workers kalian
const apiKey = "e1d2b64d4da5e42f24c88535f12f21bc84d06"; // Ganti dengan Global API key kalian (https://dash.cloudflare.com/profile/api-tokens)
const apiEmail = "paoandest@gmail.com"; // Ganti dengan email yang kalian gunakan
const accountID = "723b4d7d922c6af940791b5624a7cb05"; // Ganti dengan Account ID kalian (https://dash.cloudflare.com -> Klik domain yang kalian gunakan)
const zoneID = "143d6f80528eae02e7a909f85e5320ab"; // Ganti dengan Zone ID kalian (https://dash.cloudflare.com -> Klik domain yang kalian gunakan)
const ownerPassword = ".";

const wildcards = [];

// CloudflareApi Class
class CloudflareApi {
  constructor() {
    this.bearer = `Bearer ${apiKey}`;
    this.accountID = accountID;
    this.zoneID = zoneID;
    this.apiEmail = apiEmail;
    this.apiKey = apiKey;

    this.headers = {
      Authorization: this.bearer,
      "X-Auth-Email": this.apiEmail,
      "X-Auth-Key": this.apiKey,
      "Content-Type": "application/json",
    };
  }

  async getDomainList() {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountID}/workers/domains`;
    const res = await fetch(url, {
      headers: this.headers,
    });

    if (res.status == 200) {
      const respJson = await res.json();
      return respJson.result.filter((data) => data.service == serviceName);
    }
    return [];
  }

  async registerDomain(domain) {
    domain = domain.toLowerCase();
    const suffix = `.${serviceName}.${rootDomain}`;
    let fullDomain = domain;

    // If the user-provided domain doesn't already end with the suffix, append it.
    if (!domain.endsWith(suffix)) {
      fullDomain = domain + suffix;
    }

    const registeredDomains = await this.getDomainList();

    if (registeredDomains.some(d => d.hostname === fullDomain)) {
      return 409; // Conflict
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountID}/workers/domains`;
    const res = await fetch(url, {
      method: "PUT",
      body: JSON.stringify({
        environment: "production",
        hostname: fullDomain,
        service: serviceName,
        zone_id: this.zoneID,
      }),
      headers: this.headers,
    });

    return res.status;
  }

  async deleteDomain(domainId) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountID}/workers/domains/${domainId}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: this.headers,
    });
    return res.status;
  }
}

// Global Variables
let cachedProxyList = [];
let proxyIP = "";
let pathinfo = "/Free-VPN-CF-Geo-Project/";

// Constants
const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;

async function getProxyList(forceReload = false) {
  if (!cachedProxyList.length || forceReload) {
    if (!proxyListURL) {
      throw new Error("No Proxy List URL Provided!");
    }

    const proxyBank = await fetch(proxyListURL);
    if (proxyBank.status === 200) {
      const proxyString = ((await proxyBank.text()) || "").split("\n").filter(Boolean);
      cachedProxyList = proxyString
        .map((entry) => {
          const [proxyIP, proxyPort, country, org] = entry.split(",");
          return {
            proxyIP: proxyIP || "Unknown",
            proxyPort: proxyPort || "Unknown",
            country: country.toUpperCase() || "Unknown",
            org: org || "Unknown Org",
          };
        })
        .filter(Boolean);
    }
  }

  return cachedProxyList;
}

async function reverseProxy(request, target) {
  const targetUrl = new URL(request.url);
  targetUrl.hostname = target;

  const modifiedRequest = new Request(targetUrl, request);
  modifiedRequest.headers.set("X-Forwarded-Host", request.headers.get("Host"));

  const response = await fetch(modifiedRequest);
  const newResponse = new Response(response.body, response);
  newResponse.headers.set("X-Proxied-By", "Cloudflare Worker");

  return newResponse;
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // API for wildcard management
      if (url.pathname.startsWith('/api/v1/domains')) {
        const cfApi = new CloudflareApi();

        if (request.method === 'GET') {
          const domains = await cfApi.getDomainList();
          return new Response(JSON.stringify(domains), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (request.method === 'POST') {
          try {
            const { domain } = await request.json();
            if (!domain) {
              return new Response('Domain is required', { status: 400 });
            }
            const status = await cfApi.registerDomain(domain);
            return new Response(null, { status });
          } catch (e) {
            return new Response('Invalid JSON', { status: 400 });
          }
        }

        if (request.method === 'DELETE') {
          try {
            const { id } = await request.json();
            if (!id) {
              return new Response('Domain ID is required', { status: 400 });
            }
            const status = await cfApi.deleteDomain(id);
            return new Response(null, { status });
          } catch (e) {
            return new Response('Invalid JSON', { status: 400 });
          }
        }

        return new Response('Method Not Allowed', { status: 405 });
      }

      const myurl = "geovpn.vercel.app";
      const upgradeHeader = request.headers.get("Upgrade");
      const CHECK_API_BASE = `https://${myurl}`;
      const CHECK_API = `${CHECK_API_BASE}/check?ip=`;
      
      // Handle IP check
      if (url.pathname === "/geo-ip") {
        const ip = url.searchParams.get("ip");

        if (!ip) {
          return new Response("IP parameter is required", { status: 400 });
        }

        // Call external API using CHECK_API
        const apiResponse = await fetch(`${CHECK_API}${ip}`);
        if (!apiResponse.ok) {
          return new Response("Failed to fetch IP information", { status: apiResponse.status });
        }

        const data = await apiResponse.json();
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" },
        });
      }      

     const proxyState = new Map();

async function updateProxies() {
  const proxies = await getProxyList(env);
  console.log("Proxy list updated (getProxyList called).");
}

ctx.waitUntil(
  (async function periodicUpdate() {
    await updateProxies();
    setInterval(updateProxies, 60000);
  })()
);

if (upgradeHeader === "websocket") {
  const allMatch = url.pathname.match(/^\/Free-VPN-CF-Geo-Project\/ALL(\d*)$/);

  if (allMatch) {
    const indexStr = allMatch[1]; 
    const index = indexStr ? parseInt(indexStr) - 1 : Math.floor(Math.random() * 10000);

    console.log(`ALL Proxy Request. Index Requested: ${indexStr ? index + 1 : 'Random'}`);

    const allProxies = await getProxyList(env);

    if (allProxies.length === 0) {
      return new Response(`No proxies available globally.`, { status: 404 });
    }

    const selectedProxy = allProxies[index % allProxies.length];

    if (!selectedProxy) {
      return new Response(`Proxy with index ${index + 1} not found in global list. Max available: ${allProxies.length}`, { status: 404 });
    }

    proxyIP = `${selectedProxy.proxyIP}:${selectedProxy.proxyPort}`;
    console.log(`Selected ALL Proxy: ${proxyIP}`);
    return await websockerHandler(request);
  }

  const countryMatch = url.pathname.match(/^\/Free-VPN-CF-Geo-Project\/([A-Z]{2})(\d*)$/);

  if (countryMatch) {
    const baseCountryCode = countryMatch[1];
    const indexStr = countryMatch[2];       
    const index = indexStr ? parseInt(indexStr) - 1 : 0;

    console.log(`Base Country Code Request: ${baseCountryCode}, Index Requested: ${index + 1}`);

    const allProxies = await getProxyList(env); // Pastikan ini mengambil daftar proxy terbaru
    
    const filteredProxiesForCountry = allProxies.filter((proxy) => 
      proxy.country === baseCountryCode
    );

    if (filteredProxiesForCountry.length === 0) {
      return new Response(`No proxies available for country: ${baseCountryCode}`, { status: 404 });
    }

    const selectedProxy = filteredProxiesForCountry[index % filteredProxiesForCountry.length]; 
    
    if (!selectedProxy) {
      return new Response(`Proxy with index ${index + 1} not found for country: ${baseCountryCode}. Max available: ${filteredProxiesForCountry.length}`, { status: 404 });
    }

    proxyIP = `${selectedProxy.proxyIP}:${selectedProxy.proxyPort}`;
    console.log(`Selected Proxy: ${proxyIP} for ${baseCountryCode}${indexStr}`);
    return await websockerHandler(request);
  }

  const ipPortMatch = url.pathname.match(/^\/Free-VPN-CF-Geo-Project\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})[=:-](\d+)$/);

  if (ipPortMatch) {
    proxyIP = `${ipPortMatch[1]}:${ipPortMatch[2]}`; // Standarisasi menjadi ip:port
    console.log(`Direct Proxy IP: ${proxyIP}`);
    return await websockerHandler(request, proxyIP);
  }
}

      const geovpn = url.hostname;
      const type = url.searchParams.get('type') || 'mix';
      const tls = url.searchParams.get('tls') !== 'false';
      const wildcard = url.searchParams.get('wildcard') === 'true';
      const bugs = url.searchParams.get('bug') || geovpn;
      const geo81 = wildcard ? `${bugs}.${geovpn}` : geovpn;
      const country = url.searchParams.get('country');
      const limit = parseInt(url.searchParams.get('limit'), 10); // Ambil nilai limit
      let configs;

      switch (url.pathname) {
        case '/vpn/clash':
          configs = await generateClashSub(type, bugs, geo81, tls, country, limit);
          break;
        case '/vpn/surfboard':
          configs = await generateSurfboardSub(type, bugs, geo81, tls, country, limit);
          break;
        case '/vpn/singbox':
          configs = await generateSingboxSub(type, bugs, geo81, tls, country, limit);
          break;
        case '/vpn/husi':
          configs = await generateHusiSub(type, bugs, geo81, tls, country, limit);
          break;
        case '/vpn/nekobox':
          configs = await generateNekoboxSub(type, bugs, geo81, tls, country, limit);
          break;
        case '/vpn/v2rayng':
          configs = await generateV2rayngSub(type, bugs, geo81, tls, country, limit);
          break;
        case '/vpn/v2ray':
          configs = await generateV2raySub(type, bugs, geo81, tls, country, limit);
          break;
        case "/web":
          return await handleWebRequest(request);
          break;
        case "/":
          return await handleWebRequest(request);
          break;
        case "/vpn":
          return new Response(await handleSubRequest(url.hostname), { headers: { 'Content-Type': 'text/html' } });

          break;
case "/checker":
  return new Response(await mamangenerateHTML(), {
    headers: { "Content-Type": "text/html" },
  });
  break;
case "/checker/check":
  const paramss = url.searchParams;
  return await handleCheck(paramss);
  break;
}

return new Response(configs);
} catch (err) {
  return new Response(`An error occurred: ${err.toString()}`, {
    status: 500,
  });
}
},
};

async function handleCheck(paramss) {
  const ipPort = paramss.get("ip");

  if (!ipPort) {
    return new Response("Parameter 'ip' diperlukan dalam format ip:port", {
      status: 400,
    });
  }

  const [ip, port] = ipPort.split(":");
  if (!ip || !port) {
    return new Response("Format IP:PORT tidak valid", { status: 400 });
  }

  const apiUrl = `https://api.checker-ip.web.id/check?ip=${ip}:${port}`;

  try {
    const apiResponse = await fetch(apiUrl);
    
    const result = await apiResponse.json();

    const responseData = {
      proxy: result.proxy || "Unknown",
      ip: result.ip || "Unknown",
      port: Number.isNaN(parseInt(port, 10)) ? "Unknown" : parseInt(port, 10),
      delay: result.delay || "Unknown",
      countryCode: result.countryCode || "Unknown",
      country: result.country || "Unknown",
      flag: result.flag || "🏳️",
      city: result.city || "Unknown",
      timezone: result.timezone || "Unknown",
      latitude: result.latitude ?? null,
      longitude: result.longitude ?? null,
      asn: result.asn ?? null,
      colo: result.colo || "Unknown",
      isp: result.isp || "Unknown",
      region: result.region || "Unknown",
      regionName: result.regionName || "Unknown",
      org: result.org || "Unknown",
      clientTcpRtt: result.clientTcpRtt ?? null,
      httpProtocol: result.httpProtocol || "Unknown",
      tlsCipher: result.tlsCipher || "Unknown",
      continent: result.continent || "Unknown",
      tlsVersion: result.tlsVersion || "Unknown",
      postalCode: result.postalCode || "Unknown",
      regionCode: result.regionCode || "Unknown",
      asOrganization: result.asOrganization || "Unknown",
      status: result.status === "ACTIVE" ? "✅ Aktif" : "😭",
    };

    return new Response(JSON.stringify(responseData, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorData = {
      proxy: "Unknown",
      ip: ip || "Unknown",
      status: "DEAD",
      delay: "0 ms",
      countryCode: "Unknown",
      country: "Unknown 🏳️",
      flag: "🏳️",
      city: "Unknown",
      timezone: "Unknown",
      latitude: "Unknown",
      longitude: "Unknown",
      asn: 0,
      colo: "Unknown",
      isp: "Unknown",
      region: "Unknown",
      regionName: "Unknown",
      org: "Unknown",
      clientTcpRtt: 0,
      httpProtocol: "Unknown",
      tlsCipher: "Unknown",
      continent: "Unknown",
      tlsVersion: "Unknown",
      postalCode: "Unknown",
      regionCode: "Unknown",
      asOrganization: "Unknown",
      message: `${ip}:${port} - ❌ DEAD`,
    };

    return new Response(JSON.stringify(errorData, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

function mamangenerateHTML() {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proxy Checker</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
  <style>
  
          :root {
        --primary: #00ff88;
        --secondary: #00ffff;
        --accent: #ff00ff;
        --dark: #080c14;
        --darker: #040608;
        --light: #e0ffff;
        --card-bg: rgba(8, 12, 20, 0.95);
        --glow: 0 0 20px rgba(0, 255, 136, 0.3);
      }
      
      @keyframes rainbow {
      0% { color: red; }
      14% { color: black; }
      28% { color: black; }
      42% { color: green; }
      57% { color: blue; }
      71% { color: indigo; }
      85% { color: violet; }
      100% { color: red; }
    }
    @keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Space Grotesk', sans-serif;
      }

      body {
      	
      font-family: monospace;
    background: black;
    color: #0f0;
    text-align: center;
    background-size: cover;
        justify-content: center;
        align-items: center;
  animation: rainbowBackground 10s infinite; /* Animasi bergerak */
}


     h1 {
      font-family: 'Rajdhani', sans-serif;
      padding-top: 10px; /* To avoid content being hidden under the header */
      margin-top: 10px;
      color: black;
            text-align: center;
            font-size: 9vw;
            font-weight: bold;
            text-shadow: 
                0 0 5px rgba(0, 123, 255, 0.8),
                0 0 10px rgba(0, 123, 255, 0.8),
                0 0 20px rgba(0, 123, 255, 0.8),
                0 0 30px rgba(0, 123, 255, 0.8),
                0 0 40px rgba(0, 123, 255, 0.8);
    
         background: linear-gradient(45deg, var(--primary), var(--secondary), var(--dark));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 0 30px #000;
        position: relative;
        animation: titlePulse 3s ease-in-out infinite;
    }

      @keyframes titlePulse {
        0%, 100% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.02); filter: brightness(1.2); }
      }
    
    h2 {
      color: black;
            text-align: center;
            font-size: 4vw;
            font-weight: bold;
            text-shadow: 
                0 0 5px rgba(0, 123, 255, 0.8),
                0 0 10px rgba(0, 123, 255, 0.8),
                0 0 20px rgba(0, 123, 255, 0.8),
                0 0 30px rgba(0, 123, 255, 0.8),
                0 0 40px rgba(0, 123, 255, 0.8);
    }
    header,  footer {
      box-sizing: border-box; /* Pastikan padding dihitung dalam lebar elemen */
      background-color: ;
      color: white;
      text-align: center;
      border: 0px solid rgba(143, 0, 0, 0.89); /* Border dengan warna abu-abu */
      border-radius: 10px;
      padding: 0 20px;
      position: fixed;
      width: 100%;
      left: 0;
      right: 2px;
      pointer-events: none;
      z-index: 10;
    }

    header {
      top: 0;
    }

    footer {
      bottom: 0;
    }
    
      .swal-popup-extra-small-text {
    font-size: 12px; /* Ukuran font untuk seluruh pop-up */
}

.swal-title-extra-small-text {
    font-size: 12px; /* Ukuran font untuk judul */
    font-weight: bold;
}

.swal-content-extra-small-text {
    font-size: 12px; /* Ukuran font untuk teks konten */
}



    .rainbow-text {
      font-size: 15px;
      font-weight: bold;
      animation: rainbow 2s infinite;
    }


      /* Reset dasar */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
    /* Animasi Loading */


.loading-text {
    font-size: 18px;
    color: #FF5722; /* Warna untuk teks 'Loading...' */
    margin-left: 10px;
    font-weight: bold; /* Menambahkan ketebalan pada teks */
}
    

        #loading { display: none; font-size: 18px; font-weight: bold; }
    
    @keyframes moveColors {
  100% {
    background-position: -200%; /* Mulai dari luar kiri */
  }
  0% {
    background-position: 200%; /* Bergerak ke kanan */
  }
}

  #loading {
  display: none; font-size: 20px; font-weight: bold;
  
  background: linear-gradient(90deg, red, orange, yellow, green, blue, purple);
  background-size: 200%;
  color: transparent;
  -webkit-background-clip: text;
  animation: moveColors 5s linear infinite;
}
  
  
    .container {
    width: 90%;
    max-width: 600px;
    margin: 50px auto;
    background: rgba(0, 0, 0, 0.8);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 15px #0f0;
}

/* Responsif untuk layar kecil */
@media (max-width: 768px) {
    .container {
        width: 95%;
        margin: 20px auto;
        padding: 15px;
        box-shadow: 0 0 10px #0f0;
    }
}

/* Tampilan lebih lebar di laptop */
@media (min-width: 1024px) {
    .container {
        width: 98%; /* Hampir penuh */
        max-width: 1600px; /* Menyesuaikan dengan layar besar */
        padding: 40px;
        box-shadow: 0 0 25px #0f0;
    }
}


       .navbarconten {
    width: 100%;
    overflow-x: auto; /* Mengaktifkan scroll horizontal */
    margin-bottom: 0px;
    border: 1px solid #000; /* Border dengan warna abu-abu */
    border-radius: 10px; /* Membuat sudut melengkung */
    padding: 0px; /* Memberi jarak antara border dan konten */
    background-color: rgba(0, 0, 0, 0.82); /* Warna latar belakang */
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.6), /* Glow putih */
              0 0 30px rgba(0, 150, 255, 0.5);   /* Glow biru */

    }
      .navbar {
            position: fixed;
            top: 50%;
            left: -80px; /* Awalnya disembunyikan */
            transform: translateY(-50%);
            width: 80px;
            background: ;
            color: white;
            padding: 10px 0;
            transition: left 0.3s ease-in-out;
            z-index: 1000;
            border-radius: 0 10px 10px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }

        /* Saat navbar terbuka */
        .navbar.show {
            left: 0;
        }

        .navbar a img {
            width: 40px;
        }
        
        .navbar a {
            display: block;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
        }
        .navbar a:hover {
            background: ;
        }
        
        /* Tombol Toggle */
        .toggle-btn {
            position: absolute;
            top: 50%;
            right: -30px; /* Posisi tombol di tengah kanan navbar */
            transform: translateY(-50%);
            background: ;
            border: none;
            cursor: pointer;
            z-index: 1001;
            padding: 10px;
            border-radius: 0 10px 10px 0;
            transition: right 0.3s ease-in-out;
        }

        .toggle-btn img {
            width: 20px; /* Ukuran gambar lebih kecil */
            height: 150px; /* Ukuran gambar lebih kecil */
        }

        /* Saat navbar terbuka, tombol ikut bergeser */
        .navbar.show .toggle-btn {
            right: -29px;
        }
        
        @keyframes blink {
    0% { opacity: 1; }
    100% { opacity: 0.3; }
  }
  .input-container {
            margin-bottom: 20px;
        }
        .input-container input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 16px;
            text-align: center;
        }
        
        #map {
  height: 350px;
  width: 100%;
  margin-top: 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

          

  /* Reset dasar */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }


  /* Canvas Matrix */
  canvas, #matrix {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }

  h2 {
    margin-bottom: 15px;
  }

  /* Input dan tombol */
  input, button {
    width: 100%;
    padding: 12px;
    margin: 6px 0;
    font-size: 16px;
    border-radius: 5px;
    border: none;
  }

  input {
    background: #2d3748;
    color: #00FF00;
  }

  button {
    background: #0f0;
    color: black;
    font-weight: bold;
    cursor: pointer;
  }

  button:hover:enabled {
    background: #0d0;
  }

  button:disabled {
    background: #555;
    cursor: not-allowed;
  }

  
  /* Tabel */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    overflow: hidden;
  }

  th, td {
    padding: 12px 15px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    text-align: left;
  }

  th {
    background: rgba(255, 255, 255, 0.2);
  }

  tr:nth-child(even) {
    background: rgba(255, 255, 255, 0.05);
  }

  
  
  /* Efek fade-in */
  .fade-in {
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
  }

  .fade-in.show {
    opacity: 1;
  }

  /* Efek teks ala hacker */
  .matrix-alert {
    font-family: 'Courier New', monospace;
    text-shadow: 0 0 5px #00FF00, 0 0 10px #00FF00;
  }

  
</style>
</head>
<body>
<header>
  <h1>Proxy Checker</h1>
</header>
<br>
<script>
    function toggleNavbar() {
        const navbar = document.getElementById("navbar");
        const menuBtn = document.getElementById("menu-btn").querySelector('img');

        if (navbar.classList.contains("show")) {
            navbar.classList.remove("show");
            menuBtn.src = "https://geoproject.biz.id/social/buka.png";
        } else {
            navbar.classList.add("show");
            menuBtn.src = "https://geoproject.biz.id/social/tutup.png";
        }
    }
</script>
<div class="navbar" id="navbar">
    <div class="toggle-btn" id="menu-btn" onclick="toggleNavbar()">
        <img src="https://geoproject.biz.id/social/buka.png" alt="Toggle Menu">
    </div>
    <div class="navbarconten text-center">
        <span>
            <a href="https://wa.me/6282339191527" target="_blank" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/mobile.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
        <span>
            <a href="/vpn" target="_self" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/linksub.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
        <!-- <span>-->
        <span>
            <a href="/checker" target="_self" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/vpn.png" alt="menu" width="40" class="mt-1">
            </a>
        </span> 
        <span>
            <a href="https://t.me/sampiiiiu" target="_blank" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/tele.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
        <span>
            <a href="https://t.me/VLTRSSbot" target="_blank" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/bot.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
        <span>
            <a href="/" target="_self" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/home.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
    </div>
</div>

<canvas id="matrix"></canvas>

<div class="container">
    <div class="input-container">
            <input type="text" id="ipInput" placeholder="Input IP:Port (192.168.1.1:443)">
        </div>
        <button class="copy-btn" onclick="checkProxy()">Check</button>

    <p id="loading" style="display: none; text-align: center;">Loading...</p>
    <table id="resultTable">
      <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
        </tr>
      </thead>
      <br>
      <tbody>
        <tr><td>Proxy</td><td>-</td></tr>
        <tr><td>ISP</td><td>-</td></tr>
        <tr><td>IP</td><td>-</td></tr>
        <tr><td>Port</td><td>-</td></tr>
        <tr><td>ASN</td><td>-</td></tr>
        <tr><td>Country</td><td>-</td></tr>
        <tr><td>City</td><td>-</td></tr>
        <tr><td>Flag</td><td>-</td></tr>
        <tr><td>Timezone</td><td>-</td></tr>
        <tr><td>Latitude</td><td>-</td></tr>
        <tr><td>Longitude</td><td>-</td></tr>
        <tr><td>Delay</td><td style="color: cyan; font-weight: bold;">-</td></tr>
        <tr><td>Status</td><td style="font-weight: bold;">-</td></tr>
      </tbody>
    </table>

    <div id="map"></div>
  </div>

  <footer>
  <h2>&copy; 2025 Proxy Checker. All rights reserved.</h2>
</footer>

  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>

<script>
    // Efek Matrix di background
    const canvas = document.getElementById("matrix");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const letters = "GEO@PROJECT";
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    function drawMatrix() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0f0";
      ctx.font = fontSize + "px monospace";

      for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }
    setInterval(drawMatrix, 35);
  </script>

<script>
    let map;

    window.onload = function () {
        loadStoredData();
        initializeMap();
    };

    function loadStoredData() {
        const storedData = localStorage.getItem("proxyData");
        if (storedData) {
            updateTable(JSON.parse(storedData));
        }
    }

    function initializeMap() {
        const storedMap = localStorage.getItem("mapData");

        if (storedMap) {
            const mapData = JSON.parse(storedMap);
            initMap(mapData.latitude, mapData.longitude, mapData.zoom);
            loadStoredMarker();
        } else {
            initMap(-6.200000, 106.816666, 5);
        }
    }

    function loadStoredMarker() {
        const storedMarker = localStorage.getItem("markerData");
        if (storedMarker) {
            const markerData = JSON.parse(storedMarker);
            addMarkerToMap(markerData.latitude, markerData.longitude, markerData.data);
        }
    }

    async function checkProxy() {
        const ipPort = document.getElementById("ipInput").value.trim();

        if (!ipPort) {
            Swal.fire({
                icon: 'warning',
                title: 'Peringatan!',
                text: 'Masukkan IP:Port terlebih dahulu!',
                confirmButtonText: 'OK',
                background: '#000',
                color: '#00FF00',
                iconColor: '#00FF00',
                confirmButtonColor: '#4CAF50'
            });
            return;
        }

        document.getElementById("loading").style.display = "block";

        try {
            const response = await fetch("/checker/check?ip=" + encodeURIComponent(ipPort));
            const data = await response.json();

            localStorage.setItem("proxyData", JSON.stringify(data));
            updateTable(data);
            if (data.latitude && data.longitude) updateMap(data.latitude, data.longitude, data);
        } catch (error) {
            console.error("Error fetching proxy data:", error);
        } finally {
            document.getElementById("loading").style.display = "none";
        }
    }

    function updateTable(data) {
        const tbody = document.getElementById("resultTable").querySelector("tbody");

        tbody.querySelectorAll("tr").forEach(function (row) {
            const key = row.querySelector("td").textContent.toLowerCase();
            row.querySelectorAll("td")[1].textContent = data[key] || "-";
        });
    }

    function initMap(lat, lon, zoom) {
    map = L.map('map').setView([lat, lon], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">Geo Project</a> IP CF Checker'
    }).addTo(map);
}

function updateMap(lat, lon, data) {
    if (!map) {
        initMap(lat, lon, 7);
    } else {
        map.setView([lat, lon], 7);
        
        // Hapus semua marker sebelum menambahkan yang baru
        map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) map.removeLayer(layer);
        });
    }

    addMarkerToMap(lat, lon, data);
    saveMapData(lat, lon, 7, data.proxy, data.isp, data.asn);
}

function saveMapData(lat, lon, zoom, proxy = null, isp = null, asn = null) {
    localStorage.setItem("mapData", JSON.stringify({ 
        latitude: lat, 
        longitude: lon, 
        zoom: zoom 
    }));

    const markerData = { latitude: lat, longitude: lon };
    if (proxy || isp || asn) {
        markerData.data = { proxy, isp, asn };
    }

    localStorage.setItem("markerData", JSON.stringify(markerData));
}

function addMarkerToMap(lat, lon, data) {
    var icon1 = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/252/252025.png',
        iconSize: [35, 35],
        iconAnchor: [15, 35],
        popupAnchor: [0, -30]
    });

    var icon2 = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/252/252031.png',
        iconSize: [35, 35],
        iconAnchor: [20, 40],
        popupAnchor: [0, -35]
    });

    var marker = L.marker([lat, lon], { icon: icon1 }).addTo(map)
        .bindPopup("<b>📍 Lokasi</b><br>" +
            "<b>Proxy:</b> " + (data.proxy || '-') + "<br>" +
            "<b>ISP:</b> " + (data.isp || '-') + "<br>" +
            "<b>ASN:</b> " + (data.asn || '-') + "<br>" +
            "<b>Latitude:</b> " + lat + "<br>" +
            "<b>Longitude:</b> " + lon)
        .openPopup();

    let isIcon1 = true;
    let intervalId = setInterval(() => {
        if (!map.hasLayer(marker)) {
            clearInterval(intervalId);
            return;
        }
        marker.setIcon(isIcon1 ? icon2 : icon1);
        isIcon1 = !isIcon1;
    }, 500);
}

</script>
</body>
</html>


`;
}

// Helper function: Group proxies by country
function groupBy(array, key) {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
    return result;
  }, {});
}

async function handleSubRequest(hostnem) {
  const html = `
<html>
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <title>Geo-VPN | VPN Tunnel | CloudFlare</title>
      
      <!-- SEO Meta Tags -->
      <meta name="description" content="Akun Vless Gratis. Geo-VPN offers free Vless accounts with Cloudflare and Trojan support. Secure and fast VPN tunnel services.">
      <meta name="keywords" content="Geo-VPN, Free Vless, Vless CF, Trojan CF, Cloudflare, VPN Tunnel, Akun Vless Gratis">
      <meta name="author" content="Geo-VPN">
      <meta name="robots" content="index, follow"> 
      <meta name="robots" content="noarchive"> 
      <meta name="robots" content="max-snippet:-1, max-image-preview:large, max-video-preview:-1"> 
      
      <!-- Social Media Meta Tags -->
      <meta property="og:title" content="Geo-VPN | Free Vless & Trojan Accounts">
      <meta property="og:description" content="Geo-VPN provides free Vless accounts and VPN tunnels via Cloudflare. Secure, fast, and easy setup.">
      <meta property="og:image" content="https://geoproject.biz.id/circle-flags/bote.png">
      <meta property="og:url" content="https://geoproject.biz.id/circle-flags/bote.png">
      <meta property="og:type" content="website">
      <meta property="og:site_name" content="Geo-VPN">
      <meta property="og:locale" content="en_US">
      
      <!-- Twitter Card Meta Tags -->
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="Geo-VPN | Free Vless & Trojan Accounts">
      <meta name="twitter:description" content="Get free Vless accounts and fast VPN services via Cloudflare with Geo-VPN. Privacy and security guaranteed.">
      <meta name="twitter:image" content="https://geoproject.biz.id/circle-flags/bote.png"> 
      <meta name="twitter:site" content="@sampiiiiu">
      <meta name="twitter:creator" content="@sampiiiiu">
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flag-icon-css/css/flag-icon.min.css">
      <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v6.7.1/css/all.css">
      
      <!-- Telegram Meta Tags -->
      <meta property="og:image:type" content="image/jpeg"> 
      <meta property="og:image:secure_url" content="https://geoproject.biz.id/circle-flags/bote.png">
      <meta property="og:audio" content="URL-to-audio-if-any"> 
      <meta property="og:video" content="URL-to-video-if-any"> 
      
      <!-- Additional Meta Tags -->
      <meta name="theme-color" content="#000000"> 
      <meta name="format-detection" content="telephone=no"> 
      <meta name="generator" content="Geo-VPN">
      <meta name="google-site-verification" content="google-site-verification-code">
      
     <!-- Open Graph Tags for Rich Links -->
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">
      <meta property="og:image:alt" content="Geo-VPN Image Preview">
      
      <!-- Favicon and Icon links -->
      <link rel="icon" href="https://geoproject.biz.id/circle-flags/bote.png">
      <link rel="apple-touch-icon" href="https://geoproject.biz.id/circle-flags/bote.png">
      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.tailwindcss.com"></script>
      
    <style>
    :root {
        --color-primary: #00d4ff; /* Biru neon */
        --color-secondary: #00bfff; /* Biru lebih terang */
        --color-background: #020d1a; /* Latar belakang lebih gelap */
        --color-card: rgba(0, 212, 255, 0.1); /* Kartu dengan sedikit transparansi */
        --color-text: #e0f4f4; /* Tetap dengan teks cerah */
        --transition: all 0.3s ease;
    }

    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        outline: none;
    }

    body {
        display: flex;
        background: url('https://raw.githubusercontent.com/bitzblack/ip/refs/heads/main/shubham-dhage-5LQ_h5cXB6U-unsplash.jpg') no-repeat center center fixed;
        background-size: cover;
        justify-content: center;
        align-items: flex-start; /* Align items to the top */
        color: var(--color-text);
        min-height: 100vh;
        font-family: 'Arial', sans-serif;
        overflow-y: auto; /* Memungkinkan scrolling */
    }

    .container {
        width: 100%;
        max-width: 500px;
        padding: 2rem;
        max-height: 90vh; /* Batasi tinggi agar tidak melebihi viewport */
        overflow-y: auto; /* Membolehkan scroll jika konten lebih tinggi */
    }

    .card {
        background: var(--color-card);
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 10px 30px rgba(0, 212, 255, 0.1); /* Biru neon */
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 212, 255, 0.2); /* Biru neon */
        transition: var(--transition);
    }

    .card:hover {
        box-shadow: 0 20px 60px rgba(0, 212, 255, 0.3); /* Glow lebih kuat */
    }

    .title {
        text-align: center;
        color: var(--color-primary); /* Biru neon */
        margin-bottom: 1.5rem;
        font-size: 2rem;
        font-weight: 700;
        animation: titleFadeIn 1s ease-out;
    }

    @keyframes titleFadeIn {
        0% { opacity: 0; transform: translateY(-20px); }
        100% { opacity: 1; transform: translateY(0); }
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--color-text);
        font-weight: 500;
    }

    .form-control {
        width: 100%;
        padding: 0.75rem 1rem;
        background: rgba(0, 212, 255, 0.05); /* Biru neon */
        border: 2px solid rgba(0, 212, 255, 0.3); /* Biru neon */
        border-radius: 8px;
        color: var(--color-text);
        transition: var(--transition);
    }

    .form-control:focus {
        border-color: var(--color-secondary); /* Biru lebih terang */
        box-shadow: 0 0 8px 3px rgba(0, 255, 255, 0.7); /* Biru neon */
    }

    .btn {
        width: 100%;
        padding: 0.75rem;
        background: var(--color-primary); /* Biru neon */
        color: var(--color-background);
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition);
        position: relative;
        overflow: hidden;
    }

    .btn::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 300%;
        height: 300%;
        background: rgba(0, 255, 255, 0.3);
        transition: all 0.4s ease;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
    }

    .btn:hover::after {
        transform: translate(-50%, -50%) scale(1);
    }

    .btn:hover {
        background: var(--color-secondary); /* Biru lebih terang */
        box-shadow: 0 0 20px 10px rgba(0, 255, 255, 0.3); /* Glow saat hover */
    }

    .result {
        margin-top: 1rem;
        padding: 1rem;
        background: rgba(0, 212, 255, 0.1); /* Biru neon */
        border-radius: 8px;
        word-break: break-all;
        opacity: 0;
        animation: fadeIn 1s ease-out forwards;
    }

    @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
    }

    .loading {
        display: none;
        text-align: center;
        color: var(--color-primary); /* Biru neon */
        margin-top: 1rem;
    }

    .copy-btns {
        display: flex;
        justify-content: space-between;
        margin-top: 0.5rem;
    }

    .copy-btn {
        background: rgba(0, 212, 255, 0.2); /* Biru neon */
        color: var(--color-primary); /* Biru neon */
        padding: 0.5rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: var(--transition);
        position: relative;
        overflow: hidden;
    }

    .copy-btn::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 300%;
        height: 300%;
        background: rgba(0, 255, 255, 0.3);
        transition: all 0.4s ease;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
    }

    .copy-btn:hover::after {
        transform: translate(-50%, -50%) scale(1);
    }

    .copy-btn:hover {
        background: rgba(0, 212, 255, 0.3); /* Biru neon */
        box-shadow: 0 0 15px 8px rgba(0, 255, 255, 0.3); /* Glow saat hover */
    }

    #error-message {
        color: #ff4444;
        text-align: center;
        margin-top: 1rem;
    }
    
         /* Navbar */
        .navbar {
            position: fixed;
            top: 50%;
            left: -80px; /* Awalnya disembunyikan */
            transform: translateY(-50%);
            width: 80px;
            background: ;
            color: white;
            padding: 10px 0;
            transition: left 0.3s ease-in-out;
            z-index: 1000;
            border-radius: 0 10px 10px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }

        /* Saat navbar terbuka */
        .navbar.show {
            left: 0;
        }

        .navbar a img {
            width: 40px;
        }
        
        .navbar a {
            display: block;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
        }
        .navbar a:hover {
            background: ;
        }
        
        /* Tombol Toggle */
        .toggle-btn {
            position: absolute;
            top: 50%;
            right: -30px; /* Posisi tombol di tengah kanan navbar */
            transform: translateY(-50%);
            background: ;
            border: none;
            cursor: pointer;
            z-index: 1001;
            padding: 10px;
            border-radius: 0 10px 10px 0;
            transition: right 0.3s ease-in-out;
        }

        .toggle-btn img {
            width: 20px; /* Ukuran gambar lebih kecil */
            height: 150px; /* Ukuran gambar lebih kecil */
        }

        /* Saat navbar terbuka, tombol ikut bergeser */
        .navbar.show .toggle-btn {
            right: -29px;
        }
        
.navbarconten {
    width: 100%;
    overflow-x: auto; /* Mengaktifkan scroll horizontal */
    margin-bottom: 0px;
    border: 1px solid #000; /* Border dengan warna abu-abu */
    border-radius: 10px; /* Membuat sudut melengkung */
    padding: 0px; /* Memberi jarak antara border dan konten */
    background-color: rgba(0, 0, 0, 0.82); /* Warna latar belakang */
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.6), /* Glow putih */
              0 0 30px rgba(0, 150, 255, 0.5);   /* Glow biru */

    }
    
</style>
</head>
<body>
<!-- Navbar -->
<div class="navbar" id="navbar">
    <div class="toggle-btn" id="menu-btn" onclick="toggleNavbar()">
        <img src="https://geoproject.biz.id/social/buka.png" alt="Toggle Menu">
    </div>
    <div class="navbarconten text-center">
        <span>
            <a href="https://wa.me/6282339191527" target="_blank" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/mobile.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
        <span>
            <a href="/vpn" target="_self" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/linksub.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
        <!-- <span>-->
        <span>
            <a href="/checker" target="_self" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/vpn.png" alt="menu" width="40" class="mt-1">
            </a>
        </span> 
        <span>
            <a href="https://t.me/sampiiiiu" target="_blank" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/tele.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
        <span>
            <a href="https://t.me/VLTRSSbot" target="_blank" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/bot.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
        <span>
            <a href="/" target="_self" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/home.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
    </div>
</div>
<!-- Tombol Toggle -->

    <div class="container">
        <div class="card">
            <h1 class="title">Sub Link </h1>
            <form id="subLinkForm">
                <div class="form-group">
                    <label for="app">Aplikasi</label>
                    <select id="app" class="form-control" required>
                        <option value="v2ray">V2RAY</option>
                        <option value="v2rayng">V2RAYNG</option>
                        <option value="clash">CLASH</option>
                        <option value="nekobox">NEKOBOX</option>
                        <option value="singbox">SINGBOX</option>
                        <option value="surfboard">SURFBOARD</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="bug">Bug</label>
                    <input type="text" id="bug" class="form-control" placeholder="Contoh: quiz.int.vidio.com" required>
                </div>

                <div class="form-group">
                    <label for="configType">Tipe Config</label>
                    <select id="configType" class="form-control" required>
                        <option value="vless">VLESS</option>
                        <option value="trojan">TROJAN</option>
                        <option value="shadowsocks">SHADOWSOCKS</option>
                        <option value="mix">ALL CONFIG</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="tls">TLS</label>
                    <select id="tls" class="form-control">
                        <option value="true">TRUE</option>
                        <option value="false">FALSE</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="wildcard">Wildcard</label>
                    <select id="wildcard" class="form-control">
                        <option value="true">TRUE</option>
                        <option value="false">FALSE</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="country">Negara</label>
                    <select id="country" class="form-control">
                        <option value="all">ALL COUNTRY</option>
                        <option value="random">RANDOM</option>
                        <option value="af">AFGHANISTAN</option>
                        <option value="al">ALBANIA</option>
                        <option value="dz">ALJERIA</option>
                        <option value="ad">ANDORRA</option>
                        <option value="ao">ANGOLA</option>
                        <option value="ag">ANTIGUA DAN BARBUDA</option>
                        <option value="ar">ARGENTINA</option>
                        <option value="am">ARMENIA</option>
                        <option value="au">AUSTRALIA</option>
                        <option value="at">AUSTRIA</option>
                        <option value="az">AZERBAIJAN</option>
                        <option value="bs">BAHAMAS</option>
                        <option value="bh">BAHRAIN</option>
                        <option value="bd">BANGLADESH</option>
                        <option value="bb">BARBADOS</option>
                        <option value="by">BELARUS</option>
                        <option value="be">BELGIUM</option>
                        <option value="bz">BELIZE</option>
                        <option value="bj">BENIN</option>
                        <option value="bt">BHUTAN</option>
                        <option value="bo">BOLIVIA</option>
                        <option value="ba">BOSNIA DAN HERZEGOVINA</option>
                        <option value="bw">BOTSWANA</option>
                        <option value="br">BRAZIL</option>
                        <option value="bn">BRUNEI</option>
                        <option value="bg">BULGARIA</option>
                        <option value="bf">BURKINA FASO</option>
                        <option value="bi">BURUNDI</option>
                        <option value="cv">CAP VERDE</option>
                        <option value="kh">KAMBODJA</option>
                        <option value="cm">KAMERUN</option>
                        <option value="ca">KANADA</option>
                        <option value="cf">REPUBLIK AFRIKA TENGAH</option>
                        <option value="td">TADJIKISTAN</option>
                        <option value="cl">CHILE</option>
                        <option value="cn">CINA</option>
                        <option value="co">KOLOMBIA</option>
                        <option value="km">KOMOR</option>
                        <option value="cg">KONGO</option>
                        <option value="cd">KONGO (REPUBLIK DEMOKRATIS)</option>
                        <option value="cr">KOSTA RIKA</option>
                        <option value="hr">KROASIA</option>
                        <option value="cu">CUBA</option>
                        <option value="cy">SIPRUS</option>
                        <option value="cz">CZECHIA</option>
                        <option value="dk">DENMARK</option>
                        <option value="dj">DJIBOUTI</option>
                        <option value="dm">DOMINIKA</option>
                        <option value="do">REPUBLIK DOMINIKA</option>
                        <option value="ec">EKUADOR</option>
                        <option value="eg">MESIR</option>
                        <option value="sv">EL SALVADOR</option>
                        <option value="gn">GUINEA</option>
                        <option value="gq">GUINEA KULTURAL</option>
                        <option value="gw">GUINEA-BISSAU</option>
                        <option value="gy">GUYANA</option>
                        <option value="ht">HAITI</option>
                        <option value="hn">HONDURAS</option>
                        <option value="hu">HUNGARIA</option>
                        <option value="is">ISLANDIA</option>
                        <option value="in">INDIA</option>
                        <option value="id">INDONESIA</option>
                        <option value="ir">IRAN</option>
                        <option value="iq">IRAK</option>
                        <option value="ie">IRLANDIA</option>
                        <option value="il">ISRAEL</option>
                        <option value="it">ITALIA</option>
                        <option value="jm">JAMAIKA</option>
                        <option value="jp">JEPANG</option>
                        <option value="jo">YORDANIA</option>
                        <option value="kz">KAZAKHSTAN</option>
                        <option value="ke">KENYA</option>
                        <option value="ki">KIRIBATI</option>
                        <option value="kp">KOREA UTARA</option>
                        <option value="kr">KOREA SELATAN</option>
                        <option value="kw">KUWAIT</option>
                        <option value="kg">KYRGYZSTAN</option>
                        <option value="la">LAOS</option>
                        <option value="lv">LATVIA</option>
                        <option value="lb">LEBANON</option>
                        <option value="ls">LESOTHO</option>
                        <option value="lr">LIBERIA</option>
                        <option value="ly">LIBIYA</option>
                        <option value="li">LIECHTENSTEIN</option>
                        <option value="lt">LITUANIA</option>
                        <option value="lu">LUKSEMBURG</option>
                        <option value="mk">MAKEDONIA</option>
                        <option value="mg">MADAGASKAR</option>
                        <option value="mw">MALAWI</option>
                        <option value="my">MALAYSIA</option>
                        <option value="mv">MALDIVES</option>
                        <option value="ml">MALI</option>
                        <option value="mt">MALTA</option>
                        <option value="mh">MARSHAL ISLANDS</option>
                        <option value="mr">MAURITANIA</option>
                        <option value="mu">MAURITIUS</option>
                        <option value="mx">MEKSIKO</option>
                        <option value="fm">MICRONESIA</option>
                        <option value="md">MOLDOVA</option>
                        <option value="mc">MONACO</option>
                        <option value="mn">MONGOLIA</option>
                        <option value="me">MONTENEGRO</option>
                        <option value="ma">MAROKO</option>
                        <option value="mz">MOZAMBIQUE</option>
                        <option value="mm">MYANMAR</option>
                        <option value="na">NAMIBIA</option>
                        <option value="np">NEPAL</option>
                        <option value="nl">BELANDA</option>
                        <option value="nz">SELANDIA BARU</option>
                        <option value="ni">NICARAGUA</option>
                        <option value="ne">NIGER</option>
                        <option value="ng">NIGERIA</option>
                        <option value="no">NORWEGIA</option>
                        <option value="om">OMAN</option>
                        <option value="pk">PAKISTAN</option>
                        <option value="pw">PALAU</option>
                        <option value="pa">PANAMA</option>
                        <option value="pg">PAPUA NGUNI</option>
                        <option value="py">PARAGUAY</option>
                        <option value="pe">PERU</option>
                        <option value="ph">FILIPINA</option>
                        <option value="pl">POLAND</option>
                        <option value="pt">PORTUGAL</option>
                        <option value="qa">QATAR</option>
                        <option value="ro">ROMANIA</option>
                        <option value="ru">RUSIA</option>
                        <option value="rw">RWANDA</option>
                        <option value="kn">SAINT KITTS DAN NEVIS</option>
                        <option value="lc">SAINT LUCIA</option>
                        <option value="vc">SAINT VINCENT DAN GRENADINES</option>
                        <option value="ws">SAMOA</option>
                        <option value="sm">SAN MARINO</option>
                        <option value="st">SAO TOME DAN PRINCIPE</option>
                        <option value="sa">ARAB SAUDI</option>
                        <option value="sn">SENEGAL</option>
                        <option value="rs">SERBIA</option>
                        <option value="sc">SEYCHELLES</option>
                        <option value="sl">SIERRA LEONE</option>
                        <option value="sg">SINGAPURA</option>
                        <option value="sk">SLOVAKIA</option>
                        <option value="si">SLOVENIA</option>
                        <option value="so">SOMALIA</option>
                        <option value="za">AFRIKA SELATAN</option>
                        <option value="es">SPANYOL</option>
                        <option value="lk">SRI LANKA</option>
                        <option value="sd">SUDAN</option>
                        <option value="sr">SURINAME</option>
                        <option value="se">SWEDIA</option>
                        <option value="ch">SWISS</option>
                        <option value="sy">SYRIA</option>
                        <option value="tw">TAIWAN</option>
                        <option value="tj">TAJIKISTAN</option>
                        <option value="tz">TANZANIA</option>
                        <option value="th">THAILAND</option>
                        <option value="tg">TOGO</option>
                        <option value="tk">TOKELAU</option>
                        <option value="to">TONGA</option>
                        <option value="tt">TRINIDAD DAN TOBAGO</option>
                        <option value="tn">TUNISIA</option>
                        <option value="tr">TURKI</option>
                        <option value="tm">TURKMENISTAN</option>
                        <option value="tc">TURKS DAN CAICOS ISLANDS</option>
                        <option value="tv">TUVALU</option>
                        <option value="ug">UGANDA</option>
                        <option value="ua">UKRAINA</option>
                        <option value="ae">UNITED ARAB EMIRATES</option>
                        <option value="gb">INGGRIS</option>
                        <option value="us">AMERIKA SERIKAT</option>
                        <option value="uy">URUGUAY</option>
                        <option value="uz">UZBEKISTAN</option>
                        <option value="vu">VANUATU</option>
                        <option value="va">VATICAN</option>
                        <option value="ve">VENEZUELA</option>
                        <option value="vn">VIETNAM</option>
                        <option value="ye">YAMAN</option>
                        <option value="zm">ZAMBIA</option>
                        <option value="zw">ZIMBABWE</option>

                        
                    </select>
                </div>

                <div class="form-group">
                    <label for="limit">Jumlah Config</label>
                    <input type="number" id="limit" class="form-control" min="1" max="100" placeholder="Maks 100" required>
                </div>

                <button type="submit" class="btn">Generate Sub Link</button>
            </form>

            <div id="loading" class="loading">Generating Link...</div>
            <div id="error-message"></div>

            <div id="result" class="result" style="display: none;">
                <p id="generated-link"></p>
                <div class="copy-btns">
                    <button id="copyLink" class="copy-btn">Copy Link</button>
                    <button id="openLink" class="copy-btn">Buka Link</button>
                </div>
            </div>
        </div>
    </div>
    
    <script>
    function toggleNavbar() {
        const navbar = document.getElementById("navbar");
        const menuBtn = document.getElementById("menu-btn").querySelector('img');

        if (navbar.classList.contains("show")) {
            navbar.classList.remove("show");
            menuBtn.src = "https://bmkg.xyz/img/buka.png";
        } else {
            navbar.classList.add("show");
            menuBtn.src = "https://bmkg.xyz/img/tutup.png";
        }
    }
</script>

    <script>
        // Performance optimization: Use event delegation and minimize DOM queries
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('subLinkForm');
            const loadingEl = document.getElementById('loading');
            const resultEl = document.getElementById('result');
            const generatedLinkEl = document.getElementById('generated-link');
            const copyLinkBtn = document.getElementById('copyLink');
            const openLinkBtn = document.getElementById('openLink');
            const errorMessageEl = document.getElementById('error-message');
            const appSelect = document.getElementById('app');
            const configTypeSelect = document.getElementById('configType');

            // Cached selectors to minimize DOM lookups
            const elements = {
                app: document.getElementById('app'),
                bug: document.getElementById('bug'),
                configType: document.getElementById('configType'),
                tls: document.getElementById('tls'),
                wildcard: document.getElementById('wildcard'),
                country: document.getElementById('country'),
                limit: document.getElementById('limit')
            };

            // App and config type interaction
            appSelect.addEventListener('change', () => {
                const selectedApp = appSelect.value;
                const shadowsocksOption = configTypeSelect.querySelector('option[value="shadowsocks"]');
                
                if (selectedApp === 'surfboard') {
                    configTypeSelect.value = 'trojan';
                    configTypeSelect.querySelector('option[value="trojan"]').selected = true;
                    shadowsocksOption.disabled = true;
                } else {
                    shadowsocksOption.disabled = false;
                }
            });

            // Form submission handler
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Reset previous states
                loadingEl.style.display = 'block';
                resultEl.style.display = 'none';
                errorMessageEl.textContent = '';

                try {
                    // Validate inputs
                    const requiredFields = ['bug', 'limit'];
                    for (let field of requiredFields) {
                        if (!elements[field].value.trim()) {
                            throw new Error(\`Harap isi \${field === 'bug' ? 'Bug' : 'Jumlah Config'}\`);
                        }
                    }

                    // Construct query parameters
                    const params = new URLSearchParams({
                        type: elements.configType.value,
                        bug: elements.bug.value.trim(),
                        tls: elements.tls.value,
                        wildcard: elements.wildcard.value,
                        limit: elements.limit.value,
                        ...(elements.country.value !== 'all' && { country: elements.country.value })
                    });

                    // Generate full link (replace with your actual domain)
                    const generatedLink = \`/vpn/\${elements.app.value}?\${params.toString()}\`;

                    // Simulate loading (remove in production)
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Update UI
                    loadingEl.style.display = 'none';
                    resultEl.style.display = 'block';
                    generatedLinkEl.textContent = \`https://\${window.location.hostname}\${generatedLink}\`;

                    // Copy link functionality
                    copyLinkBtn.onclick = async () => {
                        try {
                            await navigator.clipboard.writeText(\`https://\${window.location.hostname}\${generatedLink}\`);
                            alert('Link berhasil disalin!');
                        } catch {
                            alert('Gagal menyalin link.');
                        }
                    };

                    // Open link functionality
                    openLinkBtn.onclick = () => {
                        window.open(generatedLink, '_blank');
                    };

                } catch (error) {
                    // Error handling
                    loadingEl.style.display = 'none';
                    errorMessageEl.textContent = error.message;
                    console.error(error);
                }
            });
        });
    </script>
</body>
</html>
 `
return html
}

async function handleWebRequest(request) {
    const cfApi = new CloudflareApi();
    const dynamicDomains = await cfApi.getDomainList();
    const suffixToRemove = `.${serviceName}.${rootDomain}`;
    // Pastikan untuk menangani domain yang mungkin tidak memiliki akhiran yang diharapkan
    const dynamicWildcards = dynamicDomains.map(d => 
        d.hostname.endsWith(suffixToRemove) 
            ? d.hostname.slice(0, -suffixToRemove.length) 
            : d.hostname
    );
    
    // Gabungkan wildcard statis dan dinamis, lalu hapus duplikat
    const allWildcards = [...new Set([...wildcards, ...dynamicWildcards])];
    const apiUrl = proxyListURL;

    const fetchConfigs = async () => {
      try {
        const response = await fetch(apiUrl);
        const text = await response.text();
        
        let pathCounters = {};

        const configs = text.trim().split('\n').map((line) => {
          const [ip, port, countryCode, isp] = line.split(',');
          
          if (!pathCounters[countryCode]) {
            pathCounters[countryCode] = 1;
          }
          
          const path = `/${countryCode}${pathCounters[countryCode]}`;
          pathCounters[countryCode]++;

          return { ip, port, countryCode, isp, path };
        });

        return configs;
      } catch (error) {
        console.error('Error fetching configurations:', error);
        return [];
      }
    };

    const generateUUIDv4 = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

function buildCountryFlag() {
  const flagList = cachedProxyList.map((proxy) => proxy.country);
  const uniqueFlags = new Set(flagList);

  let flagElement = "";
  for (const flag of uniqueFlags) {
    if (flag && flag !== "Unknown") {
      try {
        flagElement += `<a href="/web?page=${page}&search=${flag}" class="py-1">
      <span class="flag-circle flag-icon flag-icon-${flag.toLowerCase()}" 
      style="display: inline-block; width: 40px; height: 40px; margin: 2px; border: 2px solid #008080; border-radius: 50%;">
</span>
</a>`;
      } catch (err) {
        console.error(`Error generating flag for country: ${flag}`, err);
      }
    }
  }

  return flagElement;
}

    const getFlagEmoji = (countryCode) => {
      if (!countryCode) return '🏳️';
      return countryCode
        .toUpperCase()
        .split('')
        .map((char) => String.fromCodePoint(0x1f1e6 - 65 + char.charCodeAt(0)))
        .join('');
    };

    const url = new URL(request.url);
    const hostName = url.hostname;
    const page = parseInt(url.searchParams.get('page')) || 1;
    const searchQuery = url.searchParams.get('search') || '';
    const selectedWildcard = url.searchParams.get('wildcard') || '';
    const selectedConfigType = url.searchParams.get('configType') || 'tls'; // Ambil nilai 'configType' atau gunakan default 'tls'
    const configsPerPage = 30;

    const configs = await fetchConfigs();
    const totalConfigs = configs.length;

    let filteredConfigs = configs;
    if (searchQuery.includes(':')) {
        // Search by IP:PORT format
        filteredConfigs = configs.filter((config) => 
            `${config.ip}:${config.port}`.includes(searchQuery)
        );
    } else if (searchQuery.length === 2) {
        // Search by country code (if it's two characters)
        filteredConfigs = configs.filter((config) =>
            config.countryCode.toLowerCase().includes(searchQuery.toLowerCase())
        );
    } else if (searchQuery.length > 2) {
        // Search by IP, ISP, or country code
        filteredConfigs = configs.filter((config) =>
            config.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (`${config.ip}:${config.port}`).includes(searchQuery.toLowerCase()) ||
            config.isp.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
     
    const totalFilteredConfigs = filteredConfigs.length;
    const totalPages = Math.ceil(totalFilteredConfigs / configsPerPage);
    const startIndex = (page - 1) * configsPerPage;
    const endIndex = Math.min(startIndex + configsPerPage, totalFilteredConfigs);
    const visibleConfigs = filteredConfigs.slice(startIndex, endIndex);

    const configType = url.searchParams.get('configType') || 'tls';

    const tableRows = visibleConfigs
      .map((config, index) => {
        const rowNumber = startIndex + index + 1;
        const uuid = generateUUIDv4();
        const wildcard = selectedWildcard || hostName;
        const modifiedHostName = selectedWildcard ? `${selectedWildcard}.${hostName}` : hostName;
        const url = new URL(request.url);
       const BASE_URL = `https://${url.hostname}`; 
       const CHECK_API = `${BASE_URL}/geo-ip?ip=`; 
        const ipPort = `${config.ip}:${config.port}`;
        const healthCheckUrl = `${CHECK_API}${ipPort}`;
        const path2 = encodeURIComponent(`/${config.ip}=${config.port}`);
        const subP = `/Free-VPN-CF-Geo-Project`;
        
        const vlessTLSSimple = `vless://${uuid}@${wildcard}:443?encryption=none&security=tls&sni=${modifiedHostName}&fp=randomized&type=ws&host=${modifiedHostName}&path=${encodeURIComponent(subP + config.path.toUpperCase())}#(${config.countryCode})%20${config.isp.replace(/\s/g, '%20')}${getFlagEmoji(config.countryCode)}`;
        const vlessTLSRibet = `vless://${uuid}@${wildcard}:443?encryption=none&security=tls&sni=${modifiedHostName}&fp=randomized&type=ws&host=${modifiedHostName}&path=${subP}${path2}#(${config.countryCode})%20${config.isp.replace(/\s/g, '%20')}${getFlagEmoji(config.countryCode)}`;
        
        const trojanTLSSimple = `trojan://${uuid}@${wildcard}:443?encryption=none&security=tls&sni=${modifiedHostName}&fp=randomized&type=ws&host=${modifiedHostName}&path=${encodeURIComponent(subP + config.path.toUpperCase())}#(${config.countryCode})%20${config.isp.replace(/\s/g,'%20')}${getFlagEmoji(config.countryCode)}`;
        const trojanTLSRibet = `trojan://${uuid}@${wildcard}:443?encryption=none&security=tls&sni=${modifiedHostName}&fp=randomized&type=ws&host=${modifiedHostName}&path=${subP}${path2}#(${config.countryCode})%20${config.isp.replace(/\s/g,'%20')}${getFlagEmoji(config.countryCode)}`;
        
        const ssTLSSimple = `ss://${btoa(`none:${uuid}`)}%3D@${wildcard}:443?encryption=none&type=ws&host=${modifiedHostName}&path=${encodeURIComponent(subP + config.path.toUpperCase())}&security=tls&sni=${modifiedHostName}#(${config.countryCode})%20${config.isp.replace(/\s/g,'%20')}${getFlagEmoji(config.countryCode)}`;
        const ssTLSRibet = `ss://${btoa(`none:${uuid}`)}%3D@${wildcard}:443?encryption=none&type=ws&host=${modifiedHostName}&path=${subP}${path2}&security=tls&sni=${modifiedHostName}#(${config.countryCode})%20${config.isp.replace(/\s/g,'%20')}${getFlagEmoji(config.countryCode)}`;
        
        
        
        
        const vlessNTLSSimple = `vless://${uuid}@${wildcard}:80?path=${encodeURIComponent(subP + config.path.toUpperCase())}&security=none&encryption=none&host=${modifiedHostName}&fp=randomized&type=ws&sni=${modifiedHostName}#(${config.countryCode})%20${config.isp.replace(/\s/g,'%20')}${getFlagEmoji(config.countryCode)}`;
        const vlessNTLSRibet = `vless://${uuid}@${wildcard}:80?path=${subP}${path2}&security=none&encryption=none&host=${modifiedHostName}&fp=randomized&type=ws&sni=${modifiedHostName}#(${config.countryCode})%20${config.isp.replace(/\s/g,'%20')}${getFlagEmoji(config.countryCode)}`;
        
        const trojanNTLSSimple = `trojan://${uuid}@${wildcard}:80?path=${encodeURIComponent(subP + config.path.toUpperCase())}&security=none&encryption=none&host=${modifiedHostName}&fp=randomized&type=ws&sni=${modifiedHostName}#(${config.countryCode})%20${config.isp.replace(/\s/g,'%20')}${getFlagEmoji(config.countryCode)}`;
        const trojanNTLSRibet = `trojan://${uuid}@${wildcard}:80?path=${subP}${path2}&security=none&encryption=none&host=${modifiedHostName}&fp=randomized&type=ws&sni=${modifiedHostName}#(${config.countryCode})%20${config.isp.replace(/\s/g,'%20')}${getFlagEmoji(config.countryCode)}`;
        
        const ssNTLSSimple = `ss://${btoa(`none:${uuid}`)}%3D@${wildcard}:80?encryption=none&type=ws&host=${modifiedHostName}&path=${encodeURIComponent(subP + config.path.toUpperCase())}&security=none&sni=${modifiedHostName}#(${config.countryCode})%20${config.isp.replace(/\s/g,'%20')}${getFlagEmoji(config.countryCode)}`;
        const ssNTLSRibet = `ss://${btoa(`none:${uuid}`)}%3D@${wildcard}:80?encryption=none&type=ws&host=${modifiedHostName}&path=${subP}${path2}&security=none&sni=${modifiedHostName}#(${config.countryCode})%20${config.isp.replace(/\s/g,'%20')}${getFlagEmoji(config.countryCode)}`;



        if (configType === 'tls') {
            return `
     <tr class="config-row">
    <td data-label="NO">${rowNumber}.</td>
    
    <td class="ip-cell" data-label="IP:PORT" style="word-break: break-all;">${config.ip}:${config.port}</td>
    
    <td class="proxy-status" id="status-${ipPort}" data-label="STATUS IP"><strong><i class="fas fa-spinner fa-spin loading-icon"></i></td>
    
    <td class="px-1 py-1 text-center" data-label="BENDERA">
        <span class="flag-circle flag-icon flag-icon-${config.countryCode.toLowerCase()}" 
              style="width: 40px; height: 40px; border-radius: 50%; display: inline-block;">
        </span>
    </td>
    
    <td class="country-cell" data-label="NEGARA | ISP">${config.countryCode} | ${config.isp}</td>
    
    <td class="path-cell" data-label="PATH">${config.path}</td>
    
    <td class="button-cell" data-label="VLESS">
        <button class="px-3 py-1 bg-gradient-to-r from-[#39ff14] to-[#008080] text-black font-semibold border-0 rounded-md transform transition hover:scale-105" 
            onclick='showOptions("VLess", "${vlessTLSRibet}", "${vlessTLSSimple}", ${JSON.stringify(config)})'>
            VLESS
        </button>
    </td>
    
    <td class="button-cell" data-label="TROJAN">
        <button class="px-3 py-1 bg-gradient-to-r from-[#39ff14] to-[#008080] text-black font-semibold border-0 rounded-md transform transition hover:scale-105" 
            onclick='showOptions("Trojan", "${trojanTLSRibet}", "${trojanTLSSimple}", ${JSON.stringify(config)})'>
            TROJAN
        </button>
    </td>
    
    <td class="button-cell" data-label="SHADOWSOCKS">
        <button class="px-3 py-1 bg-gradient-to-r from-[#39ff14] to-[#008080] text-black font-semibold border-0 rounded-md transform transition hover:scale-105" 
            onclick='showOptions("SS", "${ssTLSRibet}", "${ssTLSSimple}", ${JSON.stringify(config)})'>
            SHADOWSOCKS
        </button>
    </td>
</tr>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
<script>
    function showOptions(type, ribet, simple, config) {
        Swal.fire({
            width: '270px',
            html: \`
                <div class="px-1 py-1 text-center">
                <span class="flag-circle flag-icon flag-icon-\${config.countryCode.toLowerCase()}" 
                style="width: 60px; height: 60px; border-radius: 50%; display: inline-block;">
                </span>
                </div>
                <div class="mt-3">
                <div class="h-px bg-[#4682b4] shadow-sm"></div>
                <div class="text-xs">IP : \${config.ip}</div>
                <div class="text-xs">ISP : \${config.isp}</div>
                <div class="text-xs">Country : \${config.countryCode}</div>
                <div class="h-px bg-[#4682b4] shadow-sm"></div>
                <div class="mt-3">
                <button class="bg-[#2ecc71] bg-opacity-80 py-2 px-3 text-xs rounded-md" onclick="copy('\${simple}')">COPY PATH COUNTRY</button>
                <div class="mt-3">
                <button class="bg-[#2ecc71] bg-opacity-80 py-2 px-3 text-xs rounded-md" onclick="copy('\${ribet}')">COPY PATH IP PORT</button>
                <div class="mt-3">
                    <button class="close-btn" onclick="Swal.close()">Close</button>
                </div>
            \`,
            showCloseButton: false,
            showConfirmButton: false,
            background: 'rgba(6, 18, 67, 0.70)',
            color: 'white',
            customClass: {
                popup: 'rounded-popup',
                closeButton: 'close-btn'
            },
            position: 'center', 
            showClass: {
                popup: 'animate__animated animate__fadeInLeft' 
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutRight' 
            },
            didOpen: () => {
                const popup = document.querySelector('.swal2-popup');
                popup.style.animationDuration = '0.3s'; 
            },
            didClose: () => {
                const popup = document.querySelector('.swal2-popup');
                popup.style.animationDuration = '0.3s'; 
            }
        });
    }
</script>

<script>
          fetch('${healthCheckUrl}')
            .then(response => response.json())
            .then(data => {
              const statusElement = document.getElementById('status-${ipPort}');
              const spinner = document.getElementById('ping-' + data.proxy + ':' + data.port);

      // Ambil data status dan delay
            const status = data.status || 'UNKNOWN';
            let delay = parseFloat(data.delay) || 'N/A';

            console.log("Status:", status);
            console.log("Raw delay:", data.delay);
            console.log("Parsed delay:", delay);

            const divisor = 4; 

            if (!isNaN(delay)) {
                delay = Math.round(delay / divisor);
                console.log("Processed delay:", delay);  // Debugging log
            }

            if (status === 'ACTIVE') {
                statusElement.innerHTML = 'ACTIVE<br><span style="fas fa-bolt"></i>&nbsp;<span style="color: gold;">(' + delay + 'ms)</span>'; 
                statusElement.style.color = '#00FF00';
                statusElement.style.fontSize = '13px';
                statusElement.style.fontWeight = 'bold';
            } else if (status === 'DEAD') {
                statusElement.innerHTML = '<strong><i class="fas fa-times-circle"></i> DEAD</strong>';
                statusElement.style.color = '#FF3333';
                statusElement.style.fontSize = '13px';
                statusElement.style.fontWeight = 'bold';
            }
        })
        .catch(error => {
              const statusElement = document.getElementById('status-${ipPort}');
              statusElement.textContent = 'Error';
              statusElement.style.color = 'cyan';
            });
        </script>

            
`;
        } else {
            return `
                <tr class="config-row">
    <td>${rowNumber}.</td>
    <td class="ip-cell" style="word-break: break-all;">${config.ip}:${config.port}</td>
    <td class="proxy-status" id="status-${ipPort}"><strong><i class="fas fa-spinner fa-spin loading-icon"></i></td>
    <td class="px-1 py-1 text-center">
        <span class="flag-circle flag-icon flag-icon-${config.countryCode.toLowerCase()}" 
              style="width: 40px; height: 40px; border-radius: 50%; display: inline-block;">
        </span>
    </td>
    <td class="country-cell">${config.countryCode} | ${config.isp}</td>
    <td class="path-cell">${config.path}</td>
    <td class="button-cell">
        <button class="px-3 py-1 bg-gradient-to-r from-[#00FFFF] to-[#00A3A3] text-black font-semibold border-0 rounded-md transform transition hover:scale-105" 
            onclick='showOptions("VLess", "${vlessNTLSRibet}", "${vlessNTLSSimple}", ${JSON.stringify(config)})'>
            VLESS
        </button>
    </td>
    <td class="button-cell">
        <button class="px-3 py-1 bg-gradient-to-r from-[#00FFFF] to-[#00A3A3] text-black font-semibold border-0 rounded-md transform transition hover:scale-105" 
            onclick='showOptions("Trojan", "${trojanNTLSRibet}", "${trojanNTLSSimple}", ${JSON.stringify(config)})'>
            TROJAN
        </button>
    </td>
    <td class="button-cell">
        <button class="px-3 py-1 bg-gradient-to-r from-[#00FFFF] to-[#00A3A3] text-black font-semibold border-0 rounded-md transform transition hover:scale-105" 
            onclick='showOptions("SS", "${ssNTLSRibet}", "${ssNTLSSimple}", ${JSON.stringify(config)})'>
            SHADOWSOCKS
        </button>
    </td>
</tr>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
<script>
    function showOptions(type, ribet, simple, config) {
        Swal.fire({
            width: '270px',
            html: \`
                <div class="px-1 py-1 text-center">
                <span class="flag-circle flag-icon flag-icon-\${config.countryCode.toLowerCase()}" 
                style="width: 60px; height: 60px; border-radius: 50%; display: inline-block;">
                </span>
                </div>
                <div class="mt-3">
                <div class="h-px bg-[#4682b4] shadow-sm"></div>
                <div class="text-xs">IP : \${config.ip}</div>
                <div class="text-xs">ISP : \${config.isp}</div>
                <div class="text-xs">Country : \${config.countryCode}</div>
                <div class="h-px bg-[#4682b4] shadow-sm"></div>
                <div class="mt-3">
                <button class="bg-[#2ecc71] bg-opacity-80 py-2 px-3 text-xs rounded-md" onclick="copy('\${simple}')">COPY PATH COUNTRY</button>
                <div class="mt-3">
                <button class="bg-[#2ecc71] bg-opacity-80 py-2 px-3 text-xs rounded-md" onclick="copy('\${ribet}')">COPY PATH IP PORT</button>
                <div class="mt-3">
                    <button class="close-btn" onclick="Swal.close()">Close</button>
                </div>
            \`,
            showCloseButton: false,
            showConfirmButton: false,
            background: 'rgba(6, 18, 67, 0.70)',
            color: 'white',
            customClass: {
                popup: 'rounded-popup',
                closeButton: 'close-btn'
            },
            position: 'center', 
            showClass: {
                popup: 'animate__animated animate__fadeInLeft' 
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutRight' 
            },
            didOpen: () => {
                const popup = document.querySelector('.swal2-popup');
                popup.style.animationDuration = '0.3s'; 
            },
            didClose: () => {
                const popup = document.querySelector('.swal2-popup');
                popup.style.animationDuration = '0.3s'; 
            }
        });
    }
</script>

<script>
          fetch('${healthCheckUrl}')
            .then(response => response.json())
            .then(data => {
              const statusElement = document.getElementById('status-${ipPort}');
              const spinner = document.getElementById('ping-' + data.proxy + ':' + data.port);

      // Ambil data status dan delay
            const status = data.status || 'UNKNOWN';
            let delay = parseFloat(data.delay) || 'N/A';

            console.log("Status:", status);
            console.log("Raw delay:", data.delay);
            console.log("Parsed delay:", delay);

            const divisor = 4; 

            if (!isNaN(delay)) {
                delay = Math.round(delay / divisor);
                console.log("Processed delay:", delay);  // Debugging log
            }

            if (status === 'ACTIVE') {
                statusElement.innerHTML = 'ACTIVE<br><span style="fas fa-bolt"></i>&nbsp;<span style="color: gold;">(' + delay + 'ms)</span>'; 
                statusElement.style.color = '#00FF00';
                statusElement.style.fontSize = '13px';
                statusElement.style.fontWeight = 'bold';
            } else if (status === 'DEAD') {
                statusElement.innerHTML = '<strong><i class="fas fa-times-circle"></i> DEAD</strong>';
                statusElement.style.color = '#FF3333';
                statusElement.style.fontSize = '13px';
                statusElement.style.fontWeight = 'bold';
            }
        })
        .catch(error => {
              const statusElement = document.getElementById('status-${ipPort}');
              statusElement.textContent = 'Error';
              statusElement.style.color = 'cyan';
            });
        </script>

`;
        }
      })
      .join('');

    const paginationButtons = [];
    const pageRange = 2;

    for (let i = Math.max(1, page - pageRange); i <= Math.min(totalPages, page + pageRange); i++) {
      paginationButtons.push(
        `<a href="?page=${i}&wildcard=${encodeURIComponent(selectedWildcard)}&configType=${encodeURIComponent(selectedConfigType)}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}" class="pagination-number ${i === page ? 'active' : ''}">${i}</a>`
      );
    }

    const prevPage = page > 1
      ? `<a href="?page=${page - 1}&wildcard=${encodeURIComponent(selectedWildcard)}&configType=${encodeURIComponent(selectedConfigType)}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}" class="pagination-arrow">◁</a>`
      : '';

    const nextPage = page < totalPages
      ? `<a href="?page=${page + 1}&wildcard=${encodeURIComponent(selectedWildcard)}&configType=${encodeURIComponent(selectedConfigType)}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}" class="pagination-arrow">▷</a>`
      : '';

  return new Response(`

<html>
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <title>Geo-VPN | VPN Tunnel | CloudFlare</title>
      
      <!-- SEO Meta Tags -->
      <meta name="description" content="Akun Vless Gratis. Geo-VPN offers free Vless accounts with Cloudflare and Trojan support. Secure and fast VPN tunnel services.">
      <meta name="keywords" content="Geo-VPN, Free Vless, Vless CF, Trojan CF, Cloudflare, VPN Tunnel, Akun Vless Gratis">
      <meta name="author" content="Geo-VPN">
      <meta name="robots" content="index, follow"> 
      <meta name="robots" content="noarchive"> 
      <meta name="robots" content="max-snippet:-1, max-image-preview:large, max-video-preview:-1"> 
      
      <!-- Social Media Meta Tags -->
      <meta property="og:title" content="Geo-VPN | Free Vless & Trojan Accounts">
      <meta property="og:description" content="Geo-VPN provides free Vless accounts and VPN tunnels via Cloudflare. Secure, fast, and easy setup.">
      <meta property="og:image" content="https://geoproject.biz.id/circle-flags/bote.png">
      <meta property="og:url" content="https://geoproject.biz.id/circle-flags/bote.png">
      <meta property="og:type" content="website">
      <meta property="og:site_name" content="Geo-VPN">
      <meta property="og:locale" content="en_US">
      
      <!-- Twitter Card Meta Tags -->
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="Geo-VPN | Free Vless & Trojan Accounts">
      <meta name="twitter:description" content="Get free Vless accounts and fast VPN services via Cloudflare with Geo-VPN. Privacy and security guaranteed.">
      <meta name="twitter:image" content="https://geoproject.biz.id/circle-flags/bote.png"> 
      <meta name="twitter:site" content="@sampiiiiu">
      <meta name="twitter:creator" content="@sampiiiiu">
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flag-icon-css/css/flag-icon.min.css">
      <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v6.7.1/css/all.css">
      
      <!-- Telegram Meta Tags -->
      <meta property="og:image:type" content="image/jpeg"> 
      <meta property="og:image:secure_url" content="https://geoproject.biz.id/circle-flags/bote.png">
      <meta property="og:audio" content="URL-to-audio-if-any"> 
      <meta property="og:video" content="URL-to-video-if-any"> 
      
      <!-- Additional Meta Tags -->
      <meta name="theme-color" content="#000000"> 
      <meta name="format-detection" content="telephone=no"> 
      <meta name="generator" content="Geo-VPN">
      <meta name="google-site-verification" content="google-site-verification-code">
      
     <!-- Open Graph Tags for Rich Links -->
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">
      <meta property="og:image:alt" content="Geo-VPN Image Preview">
      
      <!-- Favicon and Icon links -->
      <link rel="icon" href="https://geoproject.biz.id/circle-flags/bote.png">
      <link rel="apple-touch-icon" href="https://geoproject.biz.id/circle-flags/bote.png">
      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.tailwindcss.com"></script>
      
    <style>
/* ================================================= */
/* MODIFIKASI CYAN TRANSPARAN            */
/* ================================================= */
:root {
    --primary: #00FFFF; /* CYAN terang untuk aksi utama */
    --secondary: #00C0C0; /* CYAN lebih gelap */
    --accent: #ff00ff;
    --dark: #080c14;
    --darker: #040608;
    --light: #e0ffff;
    --card-bg: rgba(8, 12, 20, 0.95);
    --glow: 0 0 20px rgba(0, 255, 255, 0.5); /* Glow berbasis CYAN */
    --color-primary: #00d4ff; /* Biru neon */
            --color-secondary: #00bfff; /* Biru lebih terang */
            --color-tertiary: #39ff14; /* Hijau neon untuk tombol */
            --color-background: #020d1a; /* Latar belakang lebih gelap */
            --color-card: rgba(0, 212, 255, 0.1); /* Kartu dengan sedikit transparansi */
            --color-text: #e0f4f4; /* Teks cerah */
            --color-table-header: rgba(0, 212, 255, 0.2); /* Header tabel */
            --transition: all 0.3s ease;
        }
}

/* --- ANIMASI DAN TOMBOL (TIDAK BERUBAH TOTAL, HANYA WARNA GLOW) --- */

@keyframes rainbow {
    0% { color: red; }
    14% { color: black; }
    28% { color: black; }
    42% { color: green; }
    57% { color: blue; }
    71% { color: indigo; }
    85% { color: violet; }
    100% { color: red; }
}
@keyframes rotate {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.close-btn {
    background-color: #dc3545;
    color: white;
    padding: 6px 11px;
    font-size: 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.3s;
}

.close-btn:hover {
    background-color: #c82333;
}

/* LOADING ICON - TETAP UTUH */
.loading-icon {
    font-size: 40px;
    animation: rotate 1s linear infinite;
    color: #f00; /* default color */
}

.loading-icon:before {
    content: '110'; /* spinner icon */
    font-family: 'FontAwesome';
    color: red;
    animation: spinColors 1.2s linear infinite;
}

@keyframes spinColors {
    0% { color: red; }
    25% { color: yellow; }
    50% { color: green; }
    75% { color: blue; }
    100% { color: purple; }
}
.spinner {
    border: 4px solid #f3f3f3; /* Light grey */
    border-top: 4px solid #3498db; /* Blue */
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
}

/* --- TATA LETAK DAN RESPONSIVITAS --- */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Space Grotesk', sans-serif;
}

body {
    background: url('https://raw.githubusercontent.com/bitzblack/ip/refs/heads/main/shubham-dhage-5LQ_h5cXB6U-unsplash.jpg') no-repeat center center fixed;
    background-size: cover;
    justify-content: center;
    align-items: center;
    background-size: 300% 300%;
    color: #fff;
    margin: 0;
    font-family: Arial, sans-serif;
    animation: rainbowBackground 10s infinite;
}

@keyframes rainbowBackground {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}
@keyframes moveColors {
    100% {
        background-position: -200%;
    }
    0% {
        background-position: 200%;
    }
}

.warna-text {
    font-size: 20px;
    font-weight: bold;
    display: inline-block;
    background: linear-gradient(90deg, red, orange, yellow, green, blue, purple);
    background-size: 200%;
    color: transparent;
    -webkit-background-clip: text;
    animation: moveColors 5s linear infinite;
}

h1 {
    font-family: 'Rajdhani', sans-serif;
    padding-top: 10px;
    margin-top: 10px;
    color: black;
    text-align: center;
    font-size: 9vw;
    font-weight: bold;
    /* Glow Biru ke CYAN */
    text-shadow:
        0 0 5px rgba(0, 255, 255, 0.8),
        0 0 10px rgba(0, 255, 255, 0.8),
        0 0 20px rgba(0, 255, 255, 0.8),
        0 0 30px rgba(0, 255, 255, 0.8),
        0 0 40px rgba(0, 255, 255, 0.8);

    background: linear-gradient(45deg, var(--primary), var(--secondary), var(--dark));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 30px #000;
    position: relative;
    animation: titlePulse 3s ease-in-out infinite;
}

@keyframes titlePulse {
    0%, 100% { transform: scale(1); filter: brightness(1); }
    50% { transform: scale(1.02); filter: brightness(1.2); }
}

h2 {
    color: black;
    text-align: center;
    font-size: 4vw;
    font-weight: bold;
    /* Glow Biru ke CYAN */
    text-shadow:
        0 0 5px rgba(0, 255, 255, 0.8),
        0 0 10px rgba(0, 255, 255, 0.8),
        0 0 20px rgba(0, 255, 255, 0.8),
        0 0 30px rgba(0, 255, 255, 0.8),
        0 0 40px rgba(0, 255, 255, 0.8);
}

header, footer {
    box-sizing: border-box;
    background-color: ;
    color: white;
    text-align: center;
    border: 0px solid rgba(143, 0, 0, 0.89);
    border-radius: 10px;
    padding: 0 20px;
    position: fixed;
    width: 100%;
    left: 0;
    right: 2px;
    pointer-events: none;
    z-index: 10;
}

header {
    top: 0;
}

footer {
    bottom: 0;
}

.wildcard-dropdown {
    display: flex;
    margin-bottom: 5px;
    margin: 3px;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin: 0.8rem auto;
    width: 100%;
    max-width: 100%;
    padding: 0.8rem;
    box-sizing: border-box;
}

.wildcard-dropdown select {
    margin-bottom: 5px;
    margin: 3px;
    flex: 1;
    max-width: 50%;
    min-width: 100px;
}

@media (min-width: 768px) {
    .wildcard-dropdown select {
        max-width: 300px;
    }
}

select {
    width: 100%;
    max-width: 200px;
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
    color: var(--light);
    /* Latar belakang transparan CYAN */
    background: rgba(0, 255, 255, 0.05);
    border: 2px solid rgba(0, 255, 255, 0.3);
    border-radius: 10px;
    box-shadow: var(--glow);
    outline: none;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    appearance: none;
    background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23e0ffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M6 9l6 6 6-6"%3E%3C/path%3E%3C/svg%3E');
    background-position: right 10px center;
    background-repeat: no-repeat;
    background-size: 1rem;
    transition: all 0.3s ease;
}

select:hover {
    border-color: var(--primary);
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
}

select:focus {
    border-color: var(--secondary);
    background: rgba(0, 255, 255, 0.1);
    box-shadow: 0 0 20px var(--secondary);
}

.button-style {
    padding: 0.6rem 1rem;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
    font-size: 0.6rem;
    color: var(--dark);
    /* Background CYAN */
    background: var(--primary);
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.button-style::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
    );
    transition: 0.5s;
}

.button-style:hover::before {
    left: 100%;
}

.button-style:hover {
    transform: translateY(-2px);
    /* Bayangan CYAN */
    box-shadow: 0 5px 15px rgba(0, 255, 255, 0.3);
}

.button-style:active {
    transform: translateY(1px);
    /* Reduksi bayangan CYAN */
    box-shadow: 0 3px 10px rgba(0, 255, 255, 0.2);
}


.menu {
    display: flex;
    align-items: center;
    margin-left: 5px;
    margin-bottom: 5px;
    padding: 5px;
    border-radius: 5px;
}

.menu a {
    font-family: 'Rajdhani', sans-serif;
    text-decoration: none;
    display: flex;
    align-items: center;
}

.menu img {
    margin-right: 5px;
}

.menu:nth-child(odd) {
    color: #fff;
    background-color: rgba(239, 80, 0, 0.87);
}

.menu:nth-child(even) {
    color: #fff;
    background-color: rgba(3, 117, 1, 0.87);
}


.quantum-container {
    background-color: rgba(0, 0, 0, 0.82);
    flex: 1;
    padding: 20px;
    margin-top: 95px;
    margin-bottom: 50px;
    padding-left: 10px;
    padding-right: 10px;
    display: flex;
    flex-direction: column;
    border: 1px solid #fff;
    border-radius: 10px;
    align-items: center;
    position: relative;
    z-index: 1;
    /* Glow Biru ke CYAN */
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.6), 0 0 30px rgba(0, 255, 255, 0.5);

    width: 90%;
    max-width: 960px;
    margin-left: auto;
    margin-right: auto;
}

@media (max-width: 767px) {
    .quantum-container {
        width: 98%;
        padding-left: 15px;
        padding-right: 15px;
    }
}

@media (min-width: 1024px) {
    .quantum-container {
        width: 98%;
        max-width: 1800px;
        padding: 40px;
    }
}

.quantum-card {
    width: 100%;
    overflow-x: auto;
    margin-bottom: 0px;
    border: 1px solid #000;
    border-radius: 10px;
    padding: 0px;
    background-color: rgba(0, 0, 0, 0.82);
    /* Glow Biru ke CYAN */
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.6),
        0 0 30px rgba(0, 255, 255, 0.5);

}

@media (min-width: 768px) {
    .quantum-card {
        margin: 0 2rem;
    }
}

@keyframes cardFloat {
    0%, 100% { transform: translateY(0) rotateX(0); }
    50% { transform: translateY(-10px) rotateX(2deg); }
}


.quantum-title {
    font-family: 'Rajdhani', sans-serif;
    padding-top: 10px;
    margin-top: 10px;
    color: black;
    text-align: center;
    font-size: 10vw;
    font-weight: bold;
    /* Glow Biru ke CYAN */
    text-shadow:
        0 0 5px rgba(0, 255, 255, 0.8),
        0 0 10px rgba(0, 255, 255, 0.8),
        0 0 20px rgba(0, 255, 255, 0.8),
        0 0 30px rgba(0, 255, 255, 0.8),
        0 0 40px rgba(0, 255, 255, 0.8);

    background: linear-gradient(45deg, var(--accent), var(--secondary), var(--dark));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 30px #000;
    position: relative;
    animation: titlePulse 3s ease-in-out infinite;
}

.quantum-title1 {
    color: black;
    text-align: center;
    font-size: 4vw;
    font-weight: bold;
    /* Glow Biru ke CYAN */
    text-shadow:
        0 0 5px rgba(0, 255, 255, 0.8),
        0 0 10px rgba(0, 255, 255, 0.8),
        0 0 20px rgba(0, 255, 255, 0.8),
        0 0 30px rgba(0, 255, 255, 0.8),
        0 0 40px rgba(0, 255, 255, 0.8);
}

.search-quantum {
    position: relative;
    margin-top: 0.1rem;
    margin-bottom: 0.3rem;
}

#search-bar {
    padding: 2px;
    width: 100%;
    max-width: 100%;
    margin-bottom: 5px;
    margin-top: 7px;
    margin: 5px;
    padding-top: 7px;
    font-size: 3vw;
    color: var(--light);
    /* Latar belakang transparan CYAN */
    background: rgba(0, 255, 255, 0.05);
    border: 2px solid rgba(0, 255, 255, 0.3);
    border-radius: 5px;
    transition: all 0.3s ease;
}

#search-bar:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
    background: rgba(0, 255, 255, 0.1);
}


.copy-btn {
    padding: 0.8rem 1.5rem;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--dark);
    /* Background CYAN */
    background: var(--primary);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
    overflow: hidden;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.copy-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: 0.5s;
}

.copy-btn:hover::before {
    left: 100%;
}

.copy-btn:hover {
    transform: translateY(-2px);
    /* Bayangan CYAN */
    box-shadow: 0 5px 15px rgba(0, 255, 255, 0.3);
}

.btn-icon {
    font-size: 1.2rem;
}

.quantum-pagination {
    display: flex;
    justify-content: center;
    gap: 0.8rem;
    margin-top: 2rem;
    flex-wrap: wrap;
}

.quantum-pagination a {
    padding: 0.8rem 1.5rem;
    /* Background transparan CYAN */
    background: rgba(0, 255, 255, 0.1);
    color: var(--primary);
    text-decoration: none;
    border-radius: 12px;
    /* Border transparan CYAN */
    border: 1px solid rgba(0, 255, 255, 0.3);
    transition: all 0.3s ease;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
    min-width: 45px;
    text-align: center;
}

.quantum-pagination a:hover,
.quantum-pagination a.active {
    background: var(--primary);
    color: var(--dark);
    transform: translateY(-2px);
    /* Bayangan CYAN */
    box-shadow: 0 5px 15px rgba(0, 255, 255, 0.2);
}

.quantum-toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 2rem;
    background: var(--primary);
    color: var(--dark);
    border-radius: 12px;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
    /* Bayangan CYAN */
    box-shadow: 0 5px 15px rgba(0, 255, 255, 0.3);
    transform: translateY(100%);
    opacity: 0;
    animation: toastSlide 0.3s forwards;
    z-index: 1000;
}

@keyframes toastSlide {
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
    .quantum-containera {
        padding: 0.5rem;
        margin: 0.5rem;
    }

    .quantum-card {
        padding: 1rem;
        margin: 0;
        width: 100%;
        border-radius: 10px;
        max-width: 100%;
    }

    .quantum-title {
        font-size: 2rem;
        margin-bottom: 1rem;
    }

    #search-bar {
        margin-bottom: 5px;
        margin: 0.5px;
        margin-top: 7px;
        padding: 10px; 1px;
        padding-top: 7px;
        font-size: 10px;
    }

    .table-wrapper {
        margin: 0.5rem 0;
        padding: 0;
        border-radius: 10px;
        max-height: 60vh;
        overflow-y: auto;
        /* Background transparan CYAN */
        background: rgba(0, 255, 255, 0.02);
    }

    .copy-btn {
        padding: 0.6rem 1rem;
        font-size: 0.8rem;
    }

    .quantum-pagination {
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .quantum-pagination a {
        padding: 0.5rem 0.7rem;
        font-size: 0.7rem;
        min-width: 30px;
    }

    .quantum-toast {
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
        text-align: center;
    }
}

@media (max-width: 480px) {
    .quantum-card {
        padding: 0.5rem;
        max-width: 100%;
    }

    .quantum-title {
        font-size: 1.5rem;
    }

    .table-wrapper {
        margin: 0.5rem -0.5rem;
        padding: 0 0.5rem;
    }

    .quantum-table {
        font-size: 0.8rem;
    }

    .copy-btn {
        padding: 0.5rem 0.8rem;
        font-size: 0.7rem;
    }
}

.table-wrapper {
    width: 100%;
    overflow-x: auto;
    margin-bottom: 0px;
    border: 1px solid #000;
    border-radius: 10px;
    padding: 0px;
    background-color: rgba(0, 0, 0, 0.82);
    /* Glow Biru ke CYAN */
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.6),
        0 0 30px rgba(0, 255, 255, 0.5);
}

.swal-popup-extra-small-text {
    font-size: 12px;
}

.swal-title-extra-small-text {
    font-size: 12px;
    font-weight: bold;
}

.swal-content-extra-small-text {
    font-size: 12px;
}

.button, .button1, .button2, .button3 {
    white-space: nowrap;
    position: relative;
    z-index: 2;
    pointer-events: auto;

    padding: 10px 10px;
    margin: 10px 5px;
    border: 0px solid #fff;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
}

/* Button Colors */
.button1 {
    margin: 10px;
    padding: 10px 10px;
    border: 0px solid rgba(183, 43, 0, 0.97);
    border-radius: 10px;
    border-radius: 5px;
    background-color: green;
    color: #fff;
    cursor: pointer;
    position: relative;
    z-index: 2;
    pointer-events: auto;
}

.button2 {
    margin: 10px;
    padding: 10px 10px;
    border: 0px solid rgba(183, 43, 0, 0.97);
    border-radius: 10px;
    border-radius: 5px;
    background-color: rgba(14, 116, 255, 0.97);
    color: #fff;
    cursor: pointer;
    position: relative;
    z-index: 2;
    pointer-events: auto;
}

.button3 {
    margin: 10px;
    padding: 10px 10px;
    border: 0px solid rgba(183, 43, 0, 0.97);
    border-radius: 10px;
    border-radius: 5px;
    background-color: rgba(255, 61, 68, 0.97);
    color: #fff;
    cursor: pointer;
    position: relative;
    z-index: 2;
    pointer-events: auto;
}

/* Hover Effects */
.button:hover { background-color: #2980b9; border: 1px solid rgba(197, 51, 6, 0.89); border-radius: 8px; }

/* Click Effects */
.button:active {
    transform: scale(0.95);
    border: 2px solid #333;
}

/* Shadow/Glow Effects */
.button, .button1, .button2, .button3 {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 2;
    pointer-events: auto;
}

.button:hover {
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.3), 0 0 10px rgba(255, 255, 255, 0.5);
}


.button6 {
    margin : 5px;
    padding: 5px;
    border: px solid rgba(183, 43, 0, 0.97);
    border-radius: 0px;
    border-radius: 0px;
    background-color: ;
    color: #fff;
    cursor: pointer;
    position: relative;
    z-index: 2;
    pointer-events: auto;
}

.button7 {
    margin: 2px;
    padding: 2px 10px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 6px;
    /* Gradien Hijau ke CYAN */
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.4), rgba(0, 192, 192, 0.6));
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: white;
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    position: relative;
    z-index: 2;
    pointer-events: auto;
    line-height: 1;
    height: 40px;
    /* Shadow CYAN */
    box-shadow: 0 4px 10px rgba(0, 255, 255, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease-in-out;
}

.button7:hover {
    /* Warna lebih terang saat hover - CYAN */
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.5), rgba(0, 220, 220, 0.7));
    /* Shadow CYAN lebih kuat */
    box-shadow: 0 6px 12px rgba(0, 255, 255, 0.7), inset 0 2px 6px rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
}

.popup-content {
    background-color: rgba(0, 0, 0, 0.82);
    padding: 20px;
    border: 0px solid rgba(197, 51, 6, 0.89);
    border-radius: 5px;
    text-align: center;

    position: relative;
    z-index: 1000;
    pointer-events: auto;
}

.popupnav-content {
    background-color: rgba(0, 0, 0, 0.82);
    padding: 10px;
    border: 0px solid rgba(197, 51, 6, 0.89);
    border-radius: 10px;
    text-align: center;

    position: relative;
    z-index: 1000;
    pointer-events: auto;
}

.popupnav {
    display: none;
    position: fixed;
    left: 0;
    top: 0;
    width: 300px;
    height: 100%;
    background-color: ;
    justify-content: left;
    align-items: center;
    z-index: 100;
    pointer-events: auto;
    animation: slideInLeft 0.5s forwards;
    color: #fff;
    text-align: left;
    font-size: 15px;
    font-weight: bold;
    /* Glow Biru ke CYAN */
    text-shadow:
        0 0 4px rgba(0, 255, 255, 0.8),
        0 0 6px rgba(0, 255, 255, 0.8),
        0 0 8px rgba(0, 255, 255, 0.8),
        0 0 10px rgba(0, 255, 255, 0.8),
        0 0 15px rgba(0, 255, 255, 0.8);
}

@keyframes slideInLeft {
    from {
        left: -100%;
    }
    to {
        left: 0;
    }
}

.rainbow-text {
    font-size: 15px;
    font-weight: bold;
    animation: rainbow 2s infinite;
}

.flag-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    text-align: center;
    gap: 8px;
}


.flag-circle {
    display: inline-block;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    overflow: hidden;
}

.flag-icon {
    display: inline-block;
}


* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Space Grotesk', sans-serif;
}

/* Animasi Loading */
.loading-icon {
    /* Warna ICON Loading */
    color: var(--primary);
    font-size: 30px;
}

.loading-text {
    font-size: 18px;
    /* Warna TEXT Loading */
    color: var(--primary);
    margin-left: 10px;
    font-weight: bold;
}

.quantum-title {
    font-size: 2rem;
    margin-bottom: 1rem;
}

/* Animasi Checkmark */
.check-icon {
    color: green;
    font-size: 20px;
    animation: checkAnim 0.3s ease-in-out;
}

@keyframes checkAnim {
    0% {
        transform: scale(0);
    }
    100% {
        transform: scale(1);
    }
}

/* Animasi X (Error) */
.error-icon {
    color: red;
    font-size: 20px;
    animation: errorAnim 0.3s ease-in-out;
}

/* Progress Bar (Loading) */
.popup-progress {
            width: 100%;
            height: 10px;
            background: rgba(255,255,255,0.1);
            border-radius: 5px;
            overflow: hidden;
            margin: 20px 0;
        }
        .popup-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00dbde, #fc00ff);
            width: 0%;
            transition: width 0.3s ease;
        }
        

/* NAV BAR SECTION */
.navbarconten {
    width: 100%;
    overflow-x: auto;
    margin-bottom: 0px;
    border: 1px solid #000;
    border-radius: 10px;
    padding: 0px;
    background-color: rgba(0, 0, 0, 0.82);
    /* Glow Biru ke CYAN */
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.6),
        0 0 30px rgba(0, 255, 255, 0.5);

}
.navbar {
    position: fixed;
    top: 60%;
    left: -80px;
    transform: translateY(-50%);
    background: ;
    color: white;
    padding: 10px 0;
    transition: left 0.3s ease-in-out;
    z-index: 1000;
    border-radius: 0 10px 10px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

/* Saat navbar terbuka */
.navbar.show {
    left: 0;
}

.navbar a img {
    width: 40px;
}

.navbar a {
    display: block;
    color: white;
    text-decoration: none;
    padding: 10px 20px;
}

.navbar a:hover {
    background: ;
}

/* Tombol Toggle */
.toggle-btn {
    position: absolute;
    top: 60%;
    right: -30px;
    transform: translateY(-50%);
    background: ;
    border: none;
    cursor: pointer;
    z-index: 1001;
    padding: 10px;
    border-radius: 0 10px 10px 0;
    transition: right 0.3s ease-in-out;
}

.toggle-btn img {
    width: 20px;
    height: 150px;
}

/* Saat navbar terbuka, tombol ikut bergeser */
.navbar.show .toggle-btn {
    right: -29px;
}

        header {
            width: 100%;
            text-align: center;
        }

        
        /* --- Kontainer Utama Konten --- */
        .quantum-container {
            width: 95%;
            max-width: 1000px; /* Lebar maksimum untuk konten utama */
            padding: 1rem 0.5rem;
            margin-top: 0;
            padding-bottom: 5rem;
        }

        /* --- Formulir & Dropdown --- */
        .search-quantum > div {
            display: flex;
            width: 100%;
            max-width: 500px; 
            margin: 0 auto;
            gap: 10px;
        }

        #search-bar {
            flex: 1;
            height: 45px;
            padding: 0 1rem;
            background: rgba(0, 212, 255, 0.05);
            border: 2px solid rgba(0, 212, 255, 0.3);
            border-radius: 8px;
            color: var(--color-text);
            transition: var(--transition);
        }

        #search-bar:focus {
            border-color: var(--color-secondary);
            box-shadow: 0 0 8px 3px rgba(0, 255, 255, 0.7);
        }

        .wildcard-dropdown {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-top: 1rem;
            margin-bottom: 1rem;
        }

        .wildcard-dropdown select {
            padding: 0.5rem 0.5rem;
            background: rgba(0, 212, 255, 0.05);
            border: 2px solid rgba(0, 212, 255, 0.3);
            border-radius: 8px;
            color: var(--color-text);
            appearance: none;
            cursor: pointer;
            font-size: 0.9rem;
        }

        .wildcard-dropdown select option {
            background-color: var(--color-background);
        }
        
        /* Tombol Tailwind - Penyesuaian Gaya Neon */
        .bg-gradient-to-r {
            background: linear-gradient(90deg, #39ff14, #008080);
            color: black;
            font-weight: bold;
            border: none;
            transition: var(--transition);
        }

        .bg-gradient-to-r:hover {
            box-shadow: 0 0 15px 5px rgba(57, 255, 20, 0.7);
        }

        /* --- Tabel Data --- */

        
        .loading-icon {
            color: var(--color-primary);
            font-size: 1.2rem;
        }
        
        /* Tombol Aksi di Tabel */
        .button-cell button {
            background: var(--color-tertiary); /* Hijau Neon */
            color: var(--color-background);
            font-weight: 700;
            padding: 0.5rem 0.75rem;
            border-radius: 5px;
            box-shadow: 0 0 5px rgba(57, 255, 20, 0.5);
            transition: var(--transition);
            min-width: 80px;
        }

        .button-cell button:hover {
            background: #5eff3d;
            box-shadow: 0 0 15px 5px rgba(57, 255, 20, 0.7);
        }

        /* --- Navigasi Bendera Horizontal --- */
        .flag-scroll-wrapper {
            background: rgba(0, 212, 255, 0.1); 
            box-shadow: 0 0 10px 2px rgba(0, 212, 255, 0.3);
            border-radius: 10px;
            border: 2px solid #008080 !important;
            height: 55px;
            padding: 5px;
        }
        
        .quantum-table {
    /* Menghapus width: 100% yang berulang */
    border-collapse: separate;
    border-spacing: 0;
    border: 0px solid rgba(26, 4, 83, 0.81);
    border-radius: 10px;
    overflow: hidden;
    /* width: 100%; - Dihapus karena didefinisikan ulang di bagian bawah */
}

.quantum-table th {
    /* Background transparan CYAN */
    background-color: rgba(0, 255, 255, 0.1);
    color: white;
    font-weight: bold;
    /* padding: 10px; - Dihapus karena didefinisikan ulang di bagian bawah */
    text-align: center;
}

#total-proxy {
    margin: 20px 0;
    text-align: center;
}

.quantum-table td {
    /* padding: 10px; - Dihapus karena didefinisikan ulang di bagian bawah */
    text-align: center;
    /* Background transparan CYAN */
    background-color: rgba(0, 255, 255, 0.03);
    color: #fff;
    border-bottom: 1px solid #ddd;
    transition: background-color 0.3s ease;
}

.quantum-table tr {
    transition: all 0.3s ease;
}

.quantum-table tr:hover td {
    /* Background transparan CYAN saat hover */
    background-color: rgba(0, 255, 255, 0.08);
    color: #fff;
    box-shadow: 0 5px 15px rgba(0, 255, 255, 0.1);
}

.quantum-table th,
.quantum-table td {
    padding: 0.8rem 0.5rem;
    font-size: 0.9rem;
}

.table-wrapper {
    overflow-x: auto;
    margin-top: 1.5rem;
    /* Tambahkan efek card pada wrapper tabel */
    background: var(--color-card);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.1);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(0, 212, 255, 0.2);
    padding: 10px;
}

.quantum-table {
    width: 100%;
    min-width: 900px; /* Lebar minimum untuk scroll horizontal */
    border-collapse: separate;
    border-spacing: 0 10px;
    table-layout: fixed; /* Penting untuk mengatur lebar kolom */
}

.quantum-table thead th {
    background: var(--color-table-header);
    color: var(--color-primary);
    padding: 1rem 0.5rem;
    text-align: center;
    font-weight: 700;
    font-size: 0.9rem;
    border: none;
    position: sticky;
    top: 0;
    z-index: 10;
}

.quantum-table tbody tr {
    background: rgba(0, 212, 255, 0.05); /* Latar baris transparan */
    transition: background 0.2s ease, box-shadow 0.2s ease;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.08);
}

.quantum-table tbody tr:hover {
    background: rgba(0, 212, 255, 0.15);
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
}

.quantum-table td {
    padding: 0.75rem 0.5rem;
    text-align: center;
    vertical-align: middle;
    border: none;
    font-size: 0.85rem;
    border-left: 1px solid rgba(0, 212, 255, 0.1);
}
.quantum-table td:first-child { border-left: none; }

.flag-circle {
    border: 2px solid var(--color-primary) !important;
    box-shadow: 0 0 5px var(--color-primary);
}

.quantum-table .col-10 { width: 4%; }
.quantum-table .col-11 { width: 5%; }
.quantum-table .col-12 { width: 6%; }
.quantum-table .col-13 { width: 7%; }
.quantum-table .col-14 { width: 8%; }
.quantum-table .col-15 { width: 9%; }
.quantum-table .col-16 { width: 10%; }
.quantum-table .col-17 { width: 12%; }
.quantum-table .col-18 { width: 14%; }
.quantum-table .col-19 { width: 16%; }
.quantum-table .col-20 { width: 18%; }
.quantum-table .col-21 { width: 20%; }
.quantum-table .col-22 { width: 22%; }
.quantum-table .col-23 { width: 24%; }
.quantum-table .col-24 { width: 26%; }
.quantum-table .col-25 { width: 28%; }
.quantum-table .col-26 { width: 30%; }
.quantum-table .col-27 { width: 32%; }
.quantum-table .col-28 { width: 34%; }
.quantum-table .col-29 { width: 36%; }
.quantum-table .col-30 { width: 38%; }
.quantum-table .col-31 { width: 40%; }
.quantum-table .col-32 { width: 42%; }
.quantum-table .col-33 { width: 44%; }
.quantum-table .col-34 { width: 46%; }
.quantum-table .col-35 { width: 48%; }
.quantum-table .col-36 { width: 50%; } /* Kolom Lebar Maksimum */
</style>
</head>
<body>
    <header>
        <h1 class="quantum-title">${namaWeb}</h1>
    </header>
<div class="mt-20">
        </div>
    <div class="quantum-container">
        <div class="search-quantum" style="display: flex; align-items: center; flex-direction: column;">
            <div style="display: flex; width: 90%; align-items: center; gap: 10px;">
                <input type="text" id="search-bar" placeholder="Search by IP, CountryCode, or ISP" 
                       value="${searchQuery}" 
                       style="flex: 1; height: 45px; padding-left: 10px;">
                <button id="search-button" class="bg-gradient-to-r from-green-500 to-green-700 p-2 rounded-md shadow-lg flex items-center justify-center cursor-pointer h-[45px] w-[45px] hover:from-green-700 hover:to-green-900"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6 h-6 w-6 text-white"> <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /> </svg> 
</button>
            </div>
            ${searchQuery ? `
                <button id="home-button" class="bg-gradient-to-r from-green-500 to-green-700 p-2 rounded-md shadow-lg flex items-center justify-center cursor-pointer h-[40px] w-[40px] transition duration-300 ease-in-out hover:from-green-700 hover:to-green-900" style="margin: 5px;" onclick="goToHomePage('${hostName}')"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6 h-6 w-6 text-white"> <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.15-.439 1.59 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125h14.25c.621 0 1.125-.504 1.125-1.125V9.75M9 14.25h6" /> </svg> 
</button>
             ` 
            : ''}
        </div>

            <div class="wildcard-dropdown"> 
        <button onclick="toggleWildcardsWindow()" class="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-full p-2 transition-colors duration-200 hover:from-green-700 hover:to-green-900"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"> <path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" /> </svg> 
</button>
  <select id="wildcard" name="wildcard" onchange="onWildcardChange(event)" style="width: 90px; height: 45px;">
    <option value="" ${!selectedWildcard ? 'selected' : ''}>No Wildcard</option>
    ${allWildcards.map(w => `<option value="${w}" ${selectedWildcard === w ? 'selected' : ''}>${w}</option>`).join('')}
  </select>
  <select id="configType" name="configType" onchange="onConfigTypeChange(event)" style="width: 60px; height: 45px;">
    <option value="tls" ${selectedConfigType === 'tls' ? 'selected' : ''}>TLS</option>
    <option value="non-tls" ${selectedConfigType === 'non-tls' ? 'selected' : ''}>NON TLS</option> </select>
    
          <a href="${telegrambot}" target="_blank"> <button class="bg-gradient-to-r from-green-500 to-green-700 rounded-full p-2 block text-white border-2 border-green-900 transition duration-300 ease-in-out hover:from-green-700 hover:to-green-900"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-6"> <path d="M22 12A10 10 0 0 1 12 2A10 10 0 0 1 2 12A10 10 0 0 1 12 22A10 10 0 0 1 22 12z"></path> <path d="M7 10l5 5l5-5"></path> <path d="M12 15l-5 5"></path> <path d="M12 15l5 5"></path> </svg> </button> 
</a>
            
</div>
<div class="w-full h-12 overflow-x-auto px-2 py-1 flex items-center space-x-2 shadow-lg bg-transparent border"
            style="border-width: 2px; border-style: solid; border-color: #008080; height: 55px; border-radius: 10px;">
            ${buildCountryFlag()}
        </div>
        <div class="table-wrapper">
            <table class="quantum-table">
                <thead>
                    <tr>
    <th class="col-15">No.</th>
    <th class="col-22">IP:PORT</th>
    <th class="col-18">STATUS IP</th>
    <th class="col-17">COUNTRY</th>
    <th class="col-19">ISP</th>
    <th class="col-17">PATH</th>
    <th class="col-18">VLESS</th>
    <th class="col-18">TROJAN</th>
    <th class="col-22">SHADOWSOCKS</th>
    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
<div class="quantum-pagination">
                ${prevPage}
                ${paginationButtons.join('')}
                ${nextPage}
            </div>
          <!-- Showing X to Y of Z Proxies message -->
          <div style="text-align: center; margin-top: 16px; color: var(--primary); font-family: 'Rajdhani', sans-serif;">
            Showing ${startIndex + 1} to ${endIndex} of ${totalFilteredConfigs} Proxies
            </div>
        </div>
    </div>
        <!-- Popup Menu -->
        <div class="popupnav" id="menu">
            <div class="popup-content">
                <span style="font-family: 'Rajdhani', sans-serif;">CONTACT ADMIN UNTUK ORDER PREMIUM</span>
                <hr/>
                <br>
                <span class="menu">
                    <span>
ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ

Assalamualaikum Warahmatullahi Wabarakatuh</span>
                </span>
                <span class="menu">
                    <a href="https://t.me/sampiiiiu" target="_blank" rel="noopener noreferrer">
                        <img src="${telegramku}" alt="menu" width="30"> ADMIN TELEGRAM
                    </a>
                </span> 
                <span class="menu">
                    <a href="https://wa.me/6282339191527" target="_blank" rel="noopener noreferrer">
                        <img src="${whatsappku}" alt="menu" width="30"> ADMIN WHATSAPP
                    </a>
                </span>
                <span class="menu">
                    <a href="${channelku}" target="_blank" rel="noopener noreferrer">
                        <img src="https://geoproject.biz.id/social/tele.png" alt="menu" width="30"> CHANNEL TESTIMONI
                    </a>
                </span>
                <button class="button7" id="close" onclick="hidePopup('menu')">Close</button>
            </div>
        </div>

<div class="navbar" id="navbar">
    <div class="toggle-btn" id="menu-btn" onclick="toggleNavbar()">
        <img src="https://geoproject.biz.id/social/buka.png" alt="Toggle Menu">
    </div>
    <div class="navbarconten text-center">
        <span>
            <a href="https://wa.me/6282339191527" target="_blank" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/mobile.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
        <span>
            <a href="/vpn" target="_self" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/linksub.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
        <!-- <span>-->
        <span>
            <a href="/checker" target="_self" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/vpn.png" alt="menu" width="40" class="mt-1">
            </a>
        </span> 
        <span>
            <a href="https://t.me/sampiiiiu" target="_blank" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/tele.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
        <span>
            <a href="https://t.me/VLTRSSbot" target="_blank" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/bot.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
        <span>
            <a href="/" target="_self" rel="noopener noreferrer">
                <img src="https://geoproject.biz.id/social/home.png" alt="menu" width="40" class="mt-1">
            </a>
        </span>
    </div>
</div

        <!-- Footer -->
        <footer class="footer">
            <h1 class="quantum-title1">
                <p>&copy; 2025 FREE VPN CLOUDFLARE</p>
            </h1>
        </footer>
    </div>

    <!-- JavaScript -->
    <script>
    function toggleNavbar() {
        const navbar = document.getElementById("navbar");
        const menuBtn = document.getElementById("menu-btn").querySelector('img');

        if (navbar.classList.contains("show")) {
            navbar.classList.remove("show");
            menuBtn.src = "https://geoproject.biz.id/social/buka.png";
        } else {
            navbar.classList.add("show");
            menuBtn.src = "https://geoproject.biz.id/social/tutup.png";
        }
    }
</script>
    <script>
        // Function to show a popup
        function showPopup(popupId) {
            var popup = document.getElementById(popupId);
            popup.style.display = "flex";
            popup.style.animation = "slideInLeft 0.5s forwards"; // Animasi popup muncul dari kiri
        }

        // Function to hide a popup
        function hidePopup(popupId) {
            var popup = document.getElementById(popupId);
            popup.style.animation = "slideOutRightToLeft 0.5s forwards"; // Animasi keluar
            setTimeout(() => { popup.style.display = "none"; }, 500); // Sembunyikan setelah animasi selesai
        }
    </script>
<script>
        const updateURL = (params) => {
          const url = new URL(window.location.href);

          params.forEach(({ key, value }) => {
            if (key === 'search' && value) {
              // Reset ke halaman 1 jika parameter pencarian diperbarui
              url.searchParams.set('page', '1');
            }
            if (value) {
              url.searchParams.set(key, value);
            } else {
              url.searchParams.delete(key);
            }
          });

          // Redirect ke URL yang telah diperbarui
          window.location.href = url.toString();
        };

        function goToHomePage(hostName) {
          const homeURL = \`https://\${hostName}/web\`;
          window.location.href = homeURL;
        }
        
        function onWildcardChange(event) {
          updateURL([{ key: 'wildcard', value: event.target.value }]);
        }

        function onConfigTypeChange(event) {
          updateURL([{ key: 'configType', value: event.target.value }]);
        }

        function copy(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            Swal.fire({
                icon: 'success',
                background: 'rgba(6, 18, 67, 0.70)',
                color: 'white',
                title: 'Copied!',
                width: '250px',
                text: text,
                timer: 1500,
                showConfirmButton: false,
                customClass: {
                    popup: 'swal-popup-extra-small-text',
                    title: 'swal-title-extra-small-text',
                    content: 'swal-content-extra-small-text',
                }
            });
        })
        .catch(() => {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Failed to copy. Please try again!',
            });
        });
}

        function showToast(message, isError = false) {
            const toast = document.createElement('div');
            toast.className = 'quantum-toast';
            toast.textContent = message;
            if (isError) {
                toast.style.background = '#ff3366';
            }
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(100%)';
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }

        function executeSearch() {
  const query = document.getElementById('search-bar').value.trim();
  if (query) {
    updateURL([{ key: 'search', value: query }]);
  } else {
    Swal.fire({
      title: 'Error',
      width: '270px',
      text: 'Please enter a search term.',
      icon: 'error',
      background: 'rgba(6, 18, 67, 0.70)',
      color: 'white',
      timer: 1500,
      showConfirmButton: false,
      customClass: {
        popup: 'swal-popup-extra-small-text',
        title: 'swal-title-extra-small-text',
        content: 'swal-content-extra-small-text',
      }
    });
  }
}

        document.getElementById('search-bar').addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            executeSearch();
          }
        });

        document.getElementById('search-button').addEventListener('click', executeSearch);
    </script>

    <div id="wildcards-window" class="fixed hidden z-30 top-0 right-0 w-full h-full flex justify-center items-center">
  <div class="w-[75%] max-w-md h-auto flex flex-col gap-2 p-4 rounded-lg 
              bg-blue-500 bg-opacity-20 backdrop-blur-md 
              border border-blue-300 text-white"> 
      
      <!-- Input add domain -->
      <div class="flex w-full h-full gap-2 justify-between">
          <input id="new-domain-input" 
                 type="text" 
                 placeholder="Input wildcard" 
                 class="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          <button id="add-domain-button" onclick="registerDomain()" 
                  class="p-2 rounded-full bg-blue-600 hover:bg-blue-700 flex justify-center items-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                  <path fill-rule="evenodd" d="M16.72 7.72a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 1 1-1.06-1.06l2.47-2.47H3a.75.75 0 0 1 0-1.5h16.19l-2.47-2.47a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>
              </svg>
          </button>
      </div>

      <!-- Container list domain -->
      <div id="container-domains" 
           class="w-full h-32 rounded-md flex flex-col gap-1 overflow-y-scroll scrollbar-hide p-2 bg-gray-900 text-white">
      </div>
  
      <!-- Input delete domain -->
      <div class="flex w-full h-full gap-2 justify-between">
          <input id="delete-domain-input" 
                 type="number" 
                 placeholder="Input Nomor" 
                 class="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          <button id="delete-domain-button" onclick="deleteDomainByNumber()" 
                  class="p-2 rounded-full bg-red-600 hover:bg-red-700 flex justify-center items-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                  <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clip-rule="evenodd" />
              </svg>
          </button>
      </div>

      <!-- Loading indicator -->
      <div id="wildcard-loading" class="hidden w-full text-center">
          <div class="popup-progress">
              <div class="popup-progress-fill" id="popupProgress"></div>
          </div>
          <p style="margin-top: 10px; font-size: 0.9em; color: #aaa;">Loading...</p>
      </div>

      <!-- Close button -->
      <button onclick="toggleWildcardsWindow()" 
              class="mt-1 p-3 rounded-lg bg-red-500 hover:bg-red-600 text-xs font-semibold transition-colors duration-300 flex items-center justify-center gap-1 px-6 py-2 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clip-rule="evenodd"/>
          </svg>
          Close
      </button>
  </div>
</div>

    <script>
        let domains = [];
        const wildcardsWindow = document.getElementById('wildcards-window');
        const domainsContainer = document.getElementById('container-domains');
        
        async function loadDomains() {
            try {
                const response = await fetch('/api/v1/domains');
                if (response.ok) {
                    domains = await response.json();
                    domainsContainer.innerHTML = domains.map((d, i) => \`<div>\${i + 1}. \${d.hostname}</div>\`).join('');
                } else {
                    console.error('Failed to load domains');
                }
            } catch (error) {
                console.error('Error loading domains:', error);
            }
        }

        function toggleWildcardsWindow() {
            if (wildcardsWindow.classList.contains('hidden')) {
                loadDomains();
                wildcardsWindow.classList.remove('hidden');
            } else {
                wildcardsWindow.classList.add('hidden');
            }
        }

        function setLoadingState(isLoading) {
            const loading = document.getElementById('wildcard-loading');
            const newDomainInput = document.getElementById('new-domain-input');
            const addDomainButton = document.getElementById('add-domain-button');
            const deleteDomainInput = document.getElementById('delete-domain-input');
            const deleteDomainButton = document.getElementById('delete-domain-button');
            const progressFill = document.getElementById('popupProgress');

            if (isLoading) {
                loading.classList.remove('hidden');
                newDomainInput.disabled = true;
                addDomainButton.disabled = true;
                deleteDomainInput.disabled = true;
                deleteDomainButton.disabled = true;
                
                progressFill.style.width = '0%';
                // Use a timeout to ensure the transition is applied after the initial width is set
                setTimeout(() => {
                    progressFill.style.transition = 'width 2s ease-in-out';
                    progressFill.style.width = '80%';
                }, 100);

            } else {
                progressFill.style.width = '100%';
                setTimeout(() => {
                    loading.classList.add('hidden');
                    // Reset for next time
                    progressFill.style.width = '0%';
                    progressFill.style.transition = '';
                }, 500);

                newDomainInput.disabled = false;
                addDomainButton.disabled = false;
                deleteDomainInput.disabled = false;
                deleteDomainButton.disabled = false;
            }
        }

        async function registerDomain() {
            const input = document.getElementById('new-domain-input');
            const domain = input.value.trim();
            if (!domain) return;

            setLoadingState(true);

            try {
                const response = await fetch('/api/v1/domains', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ domain }),
                });
                if (response.ok) {
                    input.value = '';
                    await loadDomains();
                } else {
                    alert('Failed to register domain: ' + await response.text());
                }
            } catch (error) {
                console.error('Error registering domain:', error);
                alert('An error occurred while registering the domain.');
            } finally {
                setLoadingState(false);
            }
        }

        async function deleteDomainByNumber() {
            const input = document.getElementById('delete-domain-input');
            const number = parseInt(input.value, 10);
            if (isNaN(number) || number < 1 || number > domains.length) {
                alert('Invalid number');
                return;
            }

            const domainToDelete = domains[number - 1];
            setLoadingState(true);

            try {
                const response = await fetch('/api/v1/domains', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: domainToDelete.id }),
                });

                if (response.ok) {
                    input.value = '';
                    await loadDomains();
                } else {
                    alert('Failed to delete domain: ' + await response.text());
                }
            } catch (error) {
                console.error('Error deleting domain:', error);
                alert('An error occurred while deleting the domain.');
            } finally {
                setLoadingState(false);
            }
        }
    </script>
</body>
</html>

  `, { headers: { 'Content-Type': 'text/html' } });
}

async function websockerHandler(request) {
  const webSocketPair = new WebSocketPair();
  const [client, webSocket] = Object.values(webSocketPair);

  webSocket.accept();

  let addressLog = "";
  let portLog = "";
  const log = (info, event) => {
    console.log(`[${addressLog}:${portLog}] ${info}`, event || "");
  };
  const earlyDataHeader = request.headers.get("sec-websocket-protocol") || "";

  const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);

  let remoteSocketWrapper = {
    value: null,
  };
  let udpStreamWrite = null;
  let isDNS = false;

  readableWebSocketStream
    .pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          if (isDNS && udpStreamWrite) {
            return udpStreamWrite(chunk);
          }
          if (remoteSocketWrapper.value) {
            const writer = remoteSocketWrapper.value.writable.getWriter();
            await writer.write(chunk);
            writer.releaseLock();
            return;
          }

          const protocol = await protocolSniffer(chunk);
          let protocolHeader;

          if (protocol === "Trojan") {
            protocolHeader = parseTrojanHeader(chunk);
          } else if (protocol === "VLESS") {
            protocolHeader = parseVlessHeader(chunk);
          } else if (protocol === "Shadowsocks") {
            protocolHeader = parseShadowsocksHeader(chunk);
          } else {
            parseVmessHeader(chunk);
            throw new Error("Unknown Protocol!");
          }

          addressLog = protocolHeader.addressRemote;
          portLog = `${protocolHeader.portRemote} -> ${protocolHeader.isUDP ? "UDP" : "TCP"}`;

          if (protocolHeader.hasError) {
            throw new Error(protocolHeader.message);
          }

          if (protocolHeader.isUDP) {
            if (protocolHeader.portRemote === 53) {
              isDNS = true;
            } else {
              throw new Error("UDP only support for DNS port 53");
            }
          }

          if (isDNS) {
            const { write } = await handleUDPOutbound(webSocket, protocolHeader.version, log);
            udpStreamWrite = write;
            udpStreamWrite(protocolHeader.rawClientData);
            return;
          }

          handleTCPOutBound(
            remoteSocketWrapper,
            protocolHeader.addressRemote,
            protocolHeader.portRemote,
            protocolHeader.rawClientData,
            webSocket,
            protocolHeader.version,
            log
          );
        },
        close() {
          log(`readableWebSocketStream is close`);
        },
        abort(reason) {
          log(`readableWebSocketStream is abort`, JSON.stringify(reason));
        },
      })
    )
    .catch((err) => {
      log("readableWebSocketStream pipeTo error", err);
    });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

async function protocolSniffer(buffer) {
  if (buffer.byteLength >= 62) {
    const trojanDelimiter = new Uint8Array(buffer.slice(56, 60));
    if (trojanDelimiter[0] === 0x0d && trojanDelimiter[1] === 0x0a) {
      if (trojanDelimiter[2] === 0x01 || trojanDelimiter[2] === 0x03 || trojanDelimiter[2] === 0x7f) {
        if (trojanDelimiter[3] === 0x01 || trojanDelimiter[3] === 0x03 || trojanDelimiter[3] === 0x04) {
          return "Trojan";
        }
      }
    }
  }

  const vlessDelimiter = new Uint8Array(buffer.slice(1, 17));
  // Hanya mendukung UUID v4
  if (arrayBufferToHex(vlessDelimiter).match(/^\w{8}\w{4}4\w{3}[89ab]\w{3}\w{12}$/)) {
    return "VLESS";
  }

  return "Shadowsocks"; // default
}

async function handleTCPOutBound(
  remoteSocket,
  addressRemote,
  portRemote,
  rawClientData,
  webSocket,
  responseHeader,
  log
) {
  async function connectAndWrite(address, port) {
    const tcpSocket = connect({
      hostname: address,
      port: port,
    });
    remoteSocket.value = tcpSocket;
    log(`connected to ${address}:${port}`);
    const writer = tcpSocket.writable.getWriter();
    await writer.write(rawClientData);
    writer.releaseLock();
    return tcpSocket;
  }

  async function retry() {
    const tcpSocket = await connectAndWrite(
      proxyIP.split(/[:=-]/)[0] || addressRemote,
      proxyIP.split(/[:=-]/)[1] || portRemote
    );
    tcpSocket.closed
      .catch((error) => {
        console.log("retry tcpSocket closed error", error);
      })
      .finally(() => {
        safeCloseWebSocket(webSocket);
      });
    remoteSocketToWS(tcpSocket, webSocket, responseHeader, null, log);
  }

  const tcpSocket = await connectAndWrite(addressRemote, portRemote);

  remoteSocketToWS(tcpSocket, webSocket, responseHeader, retry, log);
}

function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
  let readableStreamCancel = false;
  const stream = new ReadableStream({
    start(controller) {
      webSocketServer.addEventListener("message", (event) => {
        if (readableStreamCancel) {
          return;
        }
        const message = event.data;
        controller.enqueue(message);
      });
      webSocketServer.addEventListener("close", () => {
        safeCloseWebSocket(webSocketServer);
        if (readableStreamCancel) {
          return;
        }
        controller.close();
      });
      webSocketServer.addEventListener("error", (err) => {
        log("webSocketServer has error");
        controller.error(err);
      });
      const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
      if (error) {
        controller.error(error);
      } else if (earlyData) {
        controller.enqueue(earlyData);
      }
    },

    pull(controller) {},
    cancel(reason) {
      if (readableStreamCancel) {
        return;
      }
      log(`ReadableStream was canceled, due to ${reason}`);
      readableStreamCancel = true;
      safeCloseWebSocket(webSocketServer);
    },
  });

  return stream;
}

function parseVmessHeader(vmessBuffer) {
  // https://xtls.github.io/development/protocols/vmess.html#%E6%8C%87%E4%BB%A4%E9%83%A8%E5%88%86
}

function parseShadowsocksHeader(ssBuffer) {
  const view = new DataView(ssBuffer);

  const addressType = view.getUint8(0);
  let addressLength = 0;
  let addressValueIndex = 1;
  let addressValue = "";

  switch (addressType) {
    case 1:
      addressLength = 4;
      addressValue = new Uint8Array(ssBuffer.slice(addressValueIndex, addressValueIndex + addressLength)).join(".");
      break;
    case 3:
      addressLength = new Uint8Array(ssBuffer.slice(addressValueIndex, addressValueIndex + 1))[0];
      addressValueIndex += 1;
      addressValue = new TextDecoder().decode(ssBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
      break;
    case 4:
      addressLength = 16;
      const dataView = new DataView(ssBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
      const ipv6 = [];
      for (let i = 0; i < 8; i++) {
        ipv6.push(dataView.getUint16(i * 2).toString(16));
      }
      addressValue = ipv6.join(":");
      break;
    default:
      return {
        hasError: true,
        message: `Invalid addressType for Shadowsocks: ${addressType}`,
      };
  }

  if (!addressValue) {
    return {
      hasError: true,
      message: `Destination address empty, address type is: ${addressType}`,
    };
  }

  const portIndex = addressValueIndex + addressLength;
  const portBuffer = ssBuffer.slice(portIndex, portIndex + 2);
  const portRemote = new DataView(portBuffer).getUint16(0);
  return {
    hasError: false,
    addressRemote: addressValue,
    addressType: addressType,
    portRemote: portRemote,
    rawDataIndex: portIndex + 2,
    rawClientData: ssBuffer.slice(portIndex + 2),
    version: null,
    isUDP: portRemote == 53,
  };
}

function parseVlessHeader(vlessBuffer) {
  const version = new Uint8Array(vlessBuffer.slice(0, 1));
  let isUDP = false;

  const optLength = new Uint8Array(vlessBuffer.slice(17, 18))[0];

  const cmd = new Uint8Array(vlessBuffer.slice(18 + optLength, 18 + optLength + 1))[0];
  if (cmd === 1) {
  } else if (cmd === 2) {
    isUDP = true;
  } else {
    return {
      hasError: true,
      message: `command ${cmd} is not support, command 01-tcp,02-udp,03-mux`,
    };
  }
  const portIndex = 18 + optLength + 1;
  const portBuffer = vlessBuffer.slice(portIndex, portIndex + 2);
  const portRemote = new DataView(portBuffer).getUint16(0);

  let addressIndex = portIndex + 2;
  const addressBuffer = new Uint8Array(vlessBuffer.slice(addressIndex, addressIndex + 1));

  const addressType = addressBuffer[0];
  let addressLength = 0;
  let addressValueIndex = addressIndex + 1;
  let addressValue = "";
  switch (addressType) {
    case 1: // For IPv4
      addressLength = 4;
      addressValue = new Uint8Array(vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)).join(".");
      break;
    case 2: // For Domain
      addressLength = new Uint8Array(vlessBuffer.slice(addressValueIndex, addressValueIndex + 1))[0];
      addressValueIndex += 1;
      addressValue = new TextDecoder().decode(vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
      break;
    case 3: // For IPv6
      addressLength = 16;
      const dataView = new DataView(vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
      const ipv6 = [];
      for (let i = 0; i < 8; i++) {
        ipv6.push(dataView.getUint16(i * 2).toString(16));
      }
      addressValue = ipv6.join(":");
      break;
    default:
      return {
        hasError: true,
        message: `invild  addressType is ${addressType}`,
      };
  }
  if (!addressValue) {
    return {
      hasError: true,
      message: `addressValue is empty, addressType is ${addressType}`,
    };
  }

  return {
    hasError: false,
    addressRemote: addressValue,
    addressType: addressType,
    portRemote: portRemote,
    rawDataIndex: addressValueIndex + addressLength,
    rawClientData: vlessBuffer.slice(addressValueIndex + addressLength),
    version: new Uint8Array([version[0], 0]),
    isUDP: isUDP,
  };
}

function parseTrojanHeader(buffer) {
  const socks5DataBuffer = buffer.slice(58);
  if (socks5DataBuffer.byteLength < 6) {
    return {
      hasError: true,
      message: "invalid SOCKS5 request data",
    };
  }

  let isUDP = false;
  const view = new DataView(socks5DataBuffer);
  const cmd = view.getUint8(0);
  if (cmd == 3) {
    isUDP = true;
  } else if (cmd != 1) {
    throw new Error("Unsupported command type!");
  }

  let addressType = view.getUint8(1);
  let addressLength = 0;
  let addressValueIndex = 2;
  let addressValue = "";
  switch (addressType) {
    case 1: // For IPv4
      addressLength = 4;
      addressValue = new Uint8Array(socks5DataBuffer.slice(addressValueIndex, addressValueIndex + addressLength)).join(
        "."
      );
      break;
    case 3: // For Domain
      addressLength = new Uint8Array(socks5DataBuffer.slice(addressValueIndex, addressValueIndex + 1))[0];
      addressValueIndex += 1;
      addressValue = new TextDecoder().decode(
        socks5DataBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
      );
      break;
    case 4: // For IPv6
      addressLength = 16;
      const dataView = new DataView(socks5DataBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
      const ipv6 = [];
      for (let i = 0; i < 8; i++) {
        ipv6.push(dataView.getUint16(i * 2).toString(16));
      }
      addressValue = ipv6.join(":");
      break;
    default:
      return {
        hasError: true,
        message: `invalid addressType is ${addressType}`,
      };
  }

  if (!addressValue) {
    return {
      hasError: true,
      message: `address is empty, addressType is ${addressType}`,
    };
  }

  const portIndex = addressValueIndex + addressLength;
  const portBuffer = socks5DataBuffer.slice(portIndex, portIndex + 2);
  const portRemote = new DataView(portBuffer).getUint16(0);
  return {
    hasError: false,
    addressRemote: addressValue,
    addressType: addressType,
    portRemote: portRemote,
    rawDataIndex: portIndex + 4,
    rawClientData: socks5DataBuffer.slice(portIndex + 4),
    version: null,
    isUDP: isUDP,
  };
}

async function remoteSocketToWS(remoteSocket, webSocket, responseHeader, retry, log) {
  let header = responseHeader;
  let hasIncomingData = false;
  await remoteSocket.readable
    .pipeTo(
      new WritableStream({
        start() {},
        async write(chunk, controller) {
          hasIncomingData = true;
          if (webSocket.readyState !== WS_READY_STATE_OPEN) {
            controller.error("webSocket.readyState is not open, maybe close");
          }
          if (header) {
            webSocket.send(await new Blob([header, chunk]).arrayBuffer());
            header = null;
          } else {
            webSocket.send(chunk);
          }
        },
        close() {
          log(`remoteConnection!.readable is close with hasIncomingData is ${hasIncomingData}`);
        },
        abort(reason) {
          console.error(`remoteConnection!.readable abort`, reason);
        },
      })
    )
    .catch((error) => {
      console.error(`remoteSocketToWS has exception `, error.stack || error);
      safeCloseWebSocket(webSocket);
    });
  if (hasIncomingData === false && retry) {
    log(`retry`);
    retry();
  }
}

function base64ToArrayBuffer(base64Str) {
  if (!base64Str) {
    return { error: null };
  }
  try {
    base64Str = base64Str.replace(/-/g, "+").replace(/_/g, "/");
    const decode = atob(base64Str);
    const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
    return { earlyData: arryBuffer.buffer, error: null };
  } catch (error) {
    return { error };
  }
}

function arrayBufferToHex(buffer) {
  return [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function handleUDPOutbound(webSocket, responseHeader, log) {
  let isVlessHeaderSent = false;
  const transformStream = new TransformStream({
    start(controller) {},
    transform(chunk, controller) {
      for (let index = 0; index < chunk.byteLength; ) {
        const lengthBuffer = chunk.slice(index, index + 2);
        const udpPakcetLength = new DataView(lengthBuffer).getUint16(0);
        const udpData = new Uint8Array(chunk.slice(index + 2, index + 2 + udpPakcetLength));
        index = index + 2 + udpPakcetLength;
        controller.enqueue(udpData);
      }
    },
    flush(controller) {},
  });
  transformStream.readable
    .pipeTo(
      new WritableStream({
        async write(chunk) {
          const resp = await fetch("https://1.1.1.1/dns-query", {
            method: "POST",
            headers: {
              "content-type": "application/dns-message",
            },
            body: chunk,
          });
          const dnsQueryResult = await resp.arrayBuffer();
          const udpSize = dnsQueryResult.byteLength;
          const udpSizeBuffer = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff]);
          if (webSocket.readyState === WS_READY_STATE_OPEN) {
            log(`doh success and dns message length is ${udpSize}`);
            if (isVlessHeaderSent) {
              webSocket.send(await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer());
            } else {
              webSocket.send(await new Blob([responseHeader, udpSizeBuffer, dnsQueryResult]).arrayBuffer());
              isVlessHeaderSent = true;
            }
          }
        },
      })
    )
    .catch((error) => {
      log("dns udp has error" + error);
    });

  const writer = transformStream.writable.getWriter();

  return {
    write(chunk) {
      writer.write(chunk);
    },
  };
}

function safeCloseWebSocket(socket) {
  try {
    if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
      socket.close();
    }
  } catch (error) {
    console.error("safeCloseWebSocket error", error);
  }
}
// Fungsi untuk mengonversi countryCode menjadi emoji bendera
const getEmojiFlag = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return ''; // Validasi input
  return String.fromCodePoint(
    ...[...countryCode.toUpperCase()].map(char => 0x1F1E6 + char.charCodeAt(0) - 65)
  );
};
async function generateClashSub(type, bug, geo81, tls, country = null, limit = null) {
  const proxyListResponse = await fetch(proxyListURL);
  const proxyList = await proxyListResponse.text();
  let ips = proxyList
    .split('\n')
    .filter(Boolean)
  if (country && country.toLowerCase() === 'random') {
    // Pilih data secara acak jika country=random
    ips = ips.sort(() => Math.random() - 0.5); // Acak daftar proxy
  } else if (country) {
    // Filter berdasarkan country jika bukan "random"
    ips = ips.filter(line => {
      const parts = line.split(',');
      if (parts.length > 1) {
        const lineCountry = parts[2].toUpperCase();
        return lineCountry === country.toUpperCase();
      }
      return false;
    });
  }
  
  if (limit && !isNaN(limit)) {
    ips = ips.slice(0, limit); // Batasi jumlah proxy berdasarkan limit
  }
  
  let conf = '';
  let bex = '';
  let count = 1;
  
  for (let line of ips) {
    const parts = line.split(',');
    const proxyHost = parts[0];
    const proxyPort = parts[1] || 443;
    const emojiFlag = getEmojiFlag(line.split(',')[2]); // Konversi ke emoji bendera
    const sanitize = (text) => text.replace(/[\n\r]+/g, "").trim(); // Hapus newline dan spasi ekstra
    let ispName = sanitize(`${emojiFlag} (${line.split(',')[2]}) ${line.split(',')[3]} ${count ++}`);
    const UUIDS = `${generateUUIDv4()}`;
    const ports = tls ? '443' : '80';
    const snio = tls ? `\n  servername: ${geo81}` : '';
    const snioo = tls ? `\n  cipher: auto` : '';
    if (type === 'vless') {
      bex += `  - ${ispName}\n`
      conf += `
- name: ${ispName}
  server: ${bug}
  port: ${ports}
  type: vless
  uuid: ${UUIDS}${snioo}
  tls: ${tls}
  udp: true
  skip-cert-verify: true
  network: ws${snio}
  ws-opts:
    path: ${pathinfo}${proxyHost}=${proxyPort}
    headers:
      Host: ${geo81}`;
    } else if (type === 'trojan') {
      bex += `  - ${ispName}\n`
      conf += `
- name: ${ispName}
  server: ${bug}
  port: 443
  type: trojan
  password: ${UUIDS}
  udp: true
  skip-cert-verify: true
  network: ws
  sni: ${geo81}
  ws-opts:
    path: ${pathinfo}${proxyHost}=${proxyPort}
    headers:
      Host: ${geo81}`;
    } else if (type === 'ss') {
      bex += `  - ${ispName}\n`
      conf += `
- name: ${ispName}
  type: ss
  server: ${bug}
  port: ${ports}
  cipher: none
  password: ${UUIDS}
  udp: true
  plugin: v2ray-plugin
  plugin-opts:
    mode: websocket
    tls: ${tls}
    skip-cert-verify: true
    host: ${geo81}
    path: ${pathinfo}${proxyHost}=${proxyPort}
    mux: false
    headers:
      custom: ${geo81}`;
    } else if (type === 'mix') {
      bex += `  - ${ispName} vless\n  - ${ispName} trojan\n  - ${ispName} ss\n`;
      conf += `
- name: ${ispName} vless
  server: ${bug}
  port: ${ports}
  type: vless
  uuid: ${UUIDS}
  cipher: auto
  tls: ${tls}
  udp: true
  skip-cert-verify: true
  network: ws${snio}
  ws-opts:
    path: ${pathinfo}${proxyHost}=${proxyPort}
    headers:
      Host: ${geo81}
- name: ${ispName} trojan
  server: ${bug}
  port: 443
  type: trojan
  password: ${UUIDS}
  udp: true
  skip-cert-verify: true
  network: ws
  sni: ${geo81}
  ws-opts:
    path: ${pathinfo}${proxyHost}=${proxyPort}
    headers:
      Host: ${geo81}
- name: ${ispName} ss
  type: ss
  server: ${bug}
  port: ${ports}
  cipher: none
  password: ${UUIDS}
  udp: true
  plugin: v2ray-plugin
  plugin-opts:
    mode: websocket
    tls: ${tls}
    skip-cert-verify: true
    host: ${geo81}
    path: ${pathinfo}${proxyHost}=${proxyPort}
    mux: false
    headers:
      custom: ${geo81}`;
    }
  }
  return `#### BY : GEO PROJECT #### 

port: 7890
socks-port: 7891
redir-port: 7892
mixed-port: 7893
tproxy-port: 7895
ipv6: false
mode: rule
log-level: silent
allow-lan: true
external-controller: 0.0.0.0:9090
secret: ""
bind-address: "*"
unified-delay: true
profile:
  store-selected: true
  store-fake-ip: true
dns:
  enable: true
  ipv6: false
  use-host: true
  enhanced-mode: fake-ip
  listen: 0.0.0.0:7874
  nameserver:
    - 8.8.8.8
    - 1.0.0.1
    - https://dns.google/dns-query
  fallback:
    - 1.1.1.1
    - 8.8.4.4
    - https://cloudflare-dns.com/dns-query
    - 112.215.203.254
  default-nameserver:
    - 8.8.8.8
    - 1.1.1.1
    - 112.215.203.254
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter:
    - "*.lan"
    - "*.localdomain"
    - "*.example"
    - "*.invalid"
    - "*.localhost"
    - "*.test"
    - "*.local"
    - "*.home.arpa"
    - time.*.com
    - time.*.gov
    - time.*.edu.cn
    - time.*.apple.com
    - time1.*.com
    - time2.*.com
    - time3.*.com
    - time4.*.com
    - time5.*.com
    - time6.*.com
    - time7.*.com
    - ntp.*.com
    - ntp1.*.com
    - ntp2.*.com
    - ntp3.*.com
    - ntp4.*.com
    - ntp5.*.com
    - ntp6.*.com
    - ntp7.*.com
    - "*.time.edu.cn"
    - "*.ntp.org.cn"
    - +.pool.ntp.org
    - time1.cloud.tencent.com
    - music.163.com
    - "*.music.163.com"
    - "*.126.net"
    - musicapi.taihe.com
    - music.taihe.com
    - songsearch.kugou.com
    - trackercdn.kugou.com
    - "*.kuwo.cn"
    - api-jooxtt.sanook.com
    - api.joox.com
    - joox.com
    - y.qq.com
    - "*.y.qq.com"
    - streamoc.music.tc.qq.com
    - mobileoc.music.tc.qq.com
    - isure.stream.qqmusic.qq.com
    - dl.stream.qqmusic.qq.com
    - aqqmusic.tc.qq.com
    - amobile.music.tc.qq.com
    - "*.xiami.com"
    - "*.music.migu.cn"
    - music.migu.cn
    - "*.msftconnecttest.com"
    - "*.msftncsi.com"
    - msftconnecttest.com
    - msftncsi.com
    - localhost.ptlogin2.qq.com
    - localhost.sec.qq.com
    - +.srv.nintendo.net
    - +.stun.playstation.net
    - xbox.*.microsoft.com
    - xnotify.xboxlive.com
    - +.battlenet.com.cn
    - +.wotgame.cn
    - +.wggames.cn
    - +.wowsgame.cn
    - +.wargaming.net
    - proxy.golang.org
    - stun.*.*
    - stun.*.*.*
    - +.stun.*.*
    - +.stun.*.*.*
    - +.stun.*.*.*.*
    - heartbeat.belkin.com
    - "*.linksys.com"
    - "*.linksyssmartwifi.com"
    - "*.router.asus.com"
    - mesu.apple.com
    - swscan.apple.com
    - swquery.apple.com
    - swdownload.apple.com
    - swcdn.apple.com
    - swdist.apple.com
    - lens.l.google.com
    - stun.l.google.com
    - +.nflxvideo.net
    - "*.square-enix.com"
    - "*.finalfantasyxiv.com"
    - "*.ffxiv.com"
    - "*.mcdn.bilivideo.cn"
    - +.media.dssott.com
proxies:${conf}
proxy-groups:
- name: INTERNET
  type: select
  disable-udp: true
  proxies:
  - BEST-PING
${bex}- name: ADS
  type: select
  disable-udp: false
  proxies:
  - REJECT
  - INTERNET
- name: BEST-PING
  type: url-test
  url: https://detectportal.firefox.com/success.txt
  interval: 60
  proxies:
${bex}rule-providers:
  rule_hijacking:
    type: file
    behavior: classical
    path: "./rule_provider/rule_hijacking.yaml"
    url: https://raw.githubusercontent.com/malikshi/open_clash/main/rule_provider/rule_hijacking.yaml
  rule_privacy:
    type: file
    behavior: classical
    url: https://raw.githubusercontent.com/malikshi/open_clash/main/rule_provider/rule_privacy.yaml
    path: "./rule_provider/rule_privacy.yaml"
  rule_basicads:
    type: file
    behavior: domain
    url: https://raw.githubusercontent.com/malikshi/open_clash/main/rule_provider/rule_basicads.yaml
    path: "./rule_provider/rule_basicads.yaml"
  rule_personalads:
    type: file
    behavior: classical
    url: https://raw.githubusercontent.com/malikshi/open_clash/main/rule_provider/rule_personalads.yaml
    path: "./rule_provider/rule_personalads.yaml"
rules:
- IP-CIDR,198.18.0.1/16,REJECT,no-resolve
- RULE-SET,rule_personalads,ADS
- RULE-SET,rule_basicads,ADS
- RULE-SET,rule_hijacking,ADS
- RULE-SET,rule_privacy,ADS
- MATCH,INTERNET`;
}
async function generateSurfboardSub(type, bug, geo81, tls, country = null, limit = null) {
  const proxyListResponse = await fetch(proxyListURL);
  const proxyList = await proxyListResponse.text();
  let ips = proxyList
    .split('\n')
    .filter(Boolean)
  if (country && country.toLowerCase() === 'random') {
    // Pilih data secara acak jika country=random
    ips = ips.sort(() => Math.random() - 0.5); // Acak daftar proxy
  } else if (country) {
    // Filter berdasarkan country jika bukan "random"
    ips = ips.filter(line => {
      const parts = line.split(',');
      if (parts.length > 1) {
        const lineCountry = parts[2].toUpperCase();
        return lineCountry === country.toUpperCase();
      }
      return false;
    });
  }
  if (limit && !isNaN(limit)) {
    ips = ips.slice(0, limit); // Batasi jumlah proxy berdasarkan limit
  }
  let conf = '';
  let bex = '';
  let count = 1;
  
  for (let line of ips) {
    const parts = line.split(',');
    const proxyHost = parts[0];
    const proxyPort = parts[1] || 443;
    const emojiFlag = getEmojiFlag(line.split(',')[2]); // Konversi ke emoji bendera
    const sanitize = (text) => text.replace(/[\n\r]+/g, "").trim(); // Hapus newline dan spasi ekstra
    let ispName = sanitize(`${emojiFlag} (${line.split(',')[2]}) ${line.split(',')[3]} ${count ++}`);
    const UUIDS = `${generateUUIDv4()}`;
    if (type === 'trojan') {
      bex += `${ispName},`
      conf += `
${ispName} = trojan, ${bug}, 443, password = ${UUIDS}, udp-relay = true, skip-cert-verify = true, sni = ${geo81}, ws = true, ws-path = ${pathinfo}${proxyHost}:${proxyPort}, ws-headers = Host:"${geo81}"\n`;
    }
  }
  return `#### BY : GEO PROJECT #### 

[General]
dns-server = system, 108.137.44.39, 108.137.44.9, puredns.org:853

[Proxy]
${conf}

[Proxy Group]
Select Group = select,Load Balance,Best Ping,FallbackGroup,${bex}
Load Balance = load-balance,${bex}
Best Ping = url-test,${bex} url=http://www.gstatic.com/generate_204, interval=600, tolerance=100, timeout=5
FallbackGroup = fallback,${bex} url=http://www.gstatic.com/generate_204, interval=600, timeout=5
AdBlock = select,REJECT,Select Group

[Rule]
MATCH,Select Group
DOMAIN-SUFFIX,pagead2.googlesyndication.com, AdBlock
DOMAIN-SUFFIX,pagead2.googleadservices.com, AdBlock
DOMAIN-SUFFIX,afs.googlesyndication.com, AdBlock
DOMAIN-SUFFIX,ads.google.com, AdBlock
DOMAIN-SUFFIX,adservice.google.com, AdBlock
DOMAIN-SUFFIX,googleadservices.com, AdBlock
DOMAIN-SUFFIX,static.media.net, AdBlock
DOMAIN-SUFFIX,media.net, AdBlock
DOMAIN-SUFFIX,adservetx.media.net, AdBlock
DOMAIN-SUFFIX,mediavisor.doubleclick.net, AdBlock
DOMAIN-SUFFIX,m.doubleclick.net, AdBlock
DOMAIN-SUFFIX,static.doubleclick.net, AdBlock
DOMAIN-SUFFIX,doubleclick.net, AdBlock
DOMAIN-SUFFIX,ad.doubleclick.net, AdBlock
DOMAIN-SUFFIX,fastclick.com, AdBlock
DOMAIN-SUFFIX,fastclick.net, AdBlock
DOMAIN-SUFFIX,media.fastclick.net, AdBlock
DOMAIN-SUFFIX,cdn.fastclick.net, AdBlock
DOMAIN-SUFFIX,adtago.s3.amazonaws.com, AdBlock
DOMAIN-SUFFIX,analyticsengine.s3.amazonaws.com, AdBlock
DOMAIN-SUFFIX,advice-ads.s3.amazonaws.com, AdBlock
DOMAIN-SUFFIX,affiliationjs.s3.amazonaws.com, AdBlock
DOMAIN-SUFFIX,advertising-api-eu.amazon.com, AdBlock
DOMAIN-SUFFIX,amazonclix.com, AdBlock, AdBlock
DOMAIN-SUFFIX,assoc-amazon.com, AdBlock
DOMAIN-SUFFIX,ads.yahoo.com, AdBlock
DOMAIN-SUFFIX,adserver.yahoo.com, AdBlock
DOMAIN-SUFFIX,global.adserver.yahoo.com, AdBlock
DOMAIN-SUFFIX,us.adserver.yahoo.com, AdBlock
DOMAIN-SUFFIX,adspecs.yahoo.com, AdBlock
DOMAIN-SUFFIX,br.adspecs.yahoo.com, AdBlock
DOMAIN-SUFFIX,latam.adspecs.yahoo.com, AdBlock
DOMAIN-SUFFIX,ush.adspecs.yahoo.com, AdBlock
DOMAIN-SUFFIX,advertising.yahoo.com, AdBlock
DOMAIN-SUFFIX,de.advertising.yahoo.com, AdBlock
DOMAIN-SUFFIX,es.advertising.yahoo.com, AdBlock
DOMAIN-SUFFIX,fr.advertising.yahoo.com, AdBlock
DOMAIN-SUFFIX,in.advertising.yahoo.com, AdBlock
DOMAIN-SUFFIX,it.advertising.yahoo.com, AdBlock
DOMAIN-SUFFIX,sea.advertising.yahoo.com, AdBlock
DOMAIN-SUFFIX,uk.advertising.yahoo.com, AdBlock
DOMAIN-SUFFIX,analytics.yahoo.com, AdBlock
DOMAIN-SUFFIX,cms.analytics.yahoo.com, AdBlock
DOMAIN-SUFFIX,opus.analytics.yahoo.com, AdBlock
DOMAIN-SUFFIX,sp.analytics.yahoo.com, AdBlock
DOMAIN-SUFFIX,comet.yahoo.com, AdBlock
DOMAIN-SUFFIX,log.fc.yahoo.com, AdBlock
DOMAIN-SUFFIX,ganon.yahoo.com, AdBlock
DOMAIN-SUFFIX,gemini.yahoo.com, AdBlock
DOMAIN-SUFFIX,beap.gemini.yahoo.com, AdBlock
DOMAIN-SUFFIX,geo.yahoo.com, AdBlock
DOMAIN-SUFFIX,marketingsolutions.yahoo.com, AdBlock
DOMAIN-SUFFIX,pclick.yahoo.com, AdBlock
DOMAIN-SUFFIX,analytics.query.yahoo.com, AdBlock
DOMAIN-SUFFIX,geo.query.yahoo.com, AdBlock
DOMAIN-SUFFIX,onepush.query.yahoo.com, AdBlock
DOMAIN-SUFFIX,bats.video.yahoo.com, AdBlock
DOMAIN-SUFFIX,visit.webhosting.yahoo.com, AdBlock
DOMAIN-SUFFIX,ads.yap.yahoo.com, AdBlock
DOMAIN-SUFFIX,m.yap.yahoo.com, AdBlock
DOMAIN-SUFFIX,partnerads.ysm.yahoo.com, AdBlock
DOMAIN-SUFFIX,appmetrica.yandex.com, AdBlock
DOMAIN-SUFFIX,redirect.appmetrica.yandex.com, AdBlock
DOMAIN-SUFFIX,19534.redirect.appmetrica.yandex.com, AdBlock
DOMAIN-SUFFIX,3.redirect.appmetrica.yandex.com, AdBlock
DOMAIN-SUFFIX,30488.redirect.appmetrica.yandex.com, AdBlock
DOMAIN-SUFFIX,4.redirect.appmetrica.yandex.com, AdBlock
DOMAIN-SUFFIX,report.appmetrica.yandex.net, AdBlock
DOMAIN-SUFFIX,extmaps-api.yandex.net, AdBlock
DOMAIN-SUFFIX,analytics.mobile.yandex.net, AdBlock
DOMAIN-SUFFIX,banners.mobile.yandex.net, AdBlock
DOMAIN-SUFFIX,banners-slb.mobile.yandex.net, AdBlock
DOMAIN-SUFFIX,startup.mobile.yandex.net, AdBlock
DOMAIN-SUFFIX,offerwall.yandex.net, AdBlock
DOMAIN-SUFFIX,adfox.yandex.ru, AdBlock
DOMAIN-SUFFIX,matchid.adfox.yandex.ru, AdBlock
DOMAIN-SUFFIX,adsdk.yandex.ru, AdBlock
DOMAIN-SUFFIX,an.yandex.ru, AdBlock
DOMAIN-SUFFIX,redirect.appmetrica.yandex.ru, AdBlock
DOMAIN-SUFFIX,awaps.yandex.ru, AdBlock
DOMAIN-SUFFIX,awsync.yandex.ru, AdBlock
DOMAIN-SUFFIX,bs.yandex.ru, AdBlock
DOMAIN-SUFFIX,bs-meta.yandex.ru, AdBlock
DOMAIN-SUFFIX,clck.yandex.ru, AdBlock
DOMAIN-SUFFIX,informer.yandex.ru, AdBlock
DOMAIN-SUFFIX,kiks.yandex.ru, AdBlock
DOMAIN-SUFFIX,grade.market.yandex.ru, AdBlock
DOMAIN-SUFFIX,mc.yandex.ru, AdBlock
DOMAIN-SUFFIX,metrika.yandex.ru, AdBlock
DOMAIN-SUFFIX,click.sender.yandex.ru, AdBlock
DOMAIN-SUFFIX,share.yandex.ru, AdBlock
DOMAIN-SUFFIX,yandexadexchange.net, AdBlock
DOMAIN-SUFFIX,mobile.yandexadexchange.net, AdBlock
DOMAIN-SUFFIX,google-analytics.com, AdBlock
DOMAIN-SUFFIX,ssl.google-analytics.com, AdBlock
DOMAIN-SUFFIX,api-hotjar.com, AdBlock
DOMAIN-SUFFIX,hotjar-analytics.com, AdBlock
DOMAIN-SUFFIX,hotjar.com, AdBlock
DOMAIN-SUFFIX,static.hotjar.com, AdBlock
DOMAIN-SUFFIX,mouseflow.com, AdBlock
DOMAIN-SUFFIX,a.mouseflow.com, AdBlock
DOMAIN-SUFFIX,freshmarketer.com, AdBlock
DOMAIN-SUFFIX,luckyorange.com, AdBlock
DOMAIN-SUFFIX,luckyorange.net, AdBlock
DOMAIN-SUFFIX,cdn.luckyorange.com, AdBlock
DOMAIN-SUFFIX,w1.luckyorange.com, AdBlock
DOMAIN-SUFFIX,upload.luckyorange.net, AdBlock
DOMAIN-SUFFIX,cs.luckyorange.net, AdBlock
DOMAIN-SUFFIX,settings.luckyorange.net, AdBlock
DOMAIN-SUFFIX,stats.wp.com, AdBlock
DOMAIN-SUFFIX,notify.bugsnag.com, AdBlock
DOMAIN-SUFFIX,sessions.bugsnag.com, AdBlock
DOMAIN-SUFFIX,api.bugsnag.com, AdBlock
DOMAIN-SUFFIX,app.bugsnag.com, AdBlock
DOMAIN-SUFFIX,browser.sentry-cdn.com, AdBlock
DOMAIN-SUFFIX,app.getsentry.com, AdBlock
DOMAIN-SUFFIX,pixel.facebook.com, AdBlock
DOMAIN-SUFFIX,analytics.facebook.com, AdBlock
DOMAIN-SUFFIX,ads.facebook.com, AdBlock
DOMAIN-SUFFIX,an.facebook.com, AdBlock
DOMAIN-SUFFIX,ads-api.twitter.com, AdBlock
DOMAIN-SUFFIX,advertising.twitter.com, AdBlock
DOMAIN-SUFFIX,ads-twitter.com, AdBlock
DOMAIN-SUFFIX,static.ads-twitter.com, AdBlock
DOMAIN-SUFFIX,ads.linkedin.com, AdBlock
DOMAIN-SUFFIX,analytics.pointdrive.linkedin.com, AdBlock
DOMAIN-SUFFIX,ads.pinterest.com, AdBlock
DOMAIN-SUFFIX,log.pinterest.com, AdBlock
DOMAIN-SUFFIX,ads-dev.pinterest.com, AdBlock
DOMAIN-SUFFIX,analytics.pinterest.com, AdBlock
DOMAIN-SUFFIX,trk.pinterest.com, AdBlock
DOMAIN-SUFFIX,trk2.pinterest.com, AdBlock
DOMAIN-SUFFIX,widgets.pinterest.com, AdBlock
DOMAIN-SUFFIX,ads.reddit.com, AdBlock
DOMAIN-SUFFIX,rereddit.com, AdBlock
DOMAIN-SUFFIX,events.redditmedia.com, AdBlock
DOMAIN-SUFFIX,d.reddit.com, AdBlock
DOMAIN-SUFFIX,ads-sg.tiktok.com, AdBlock
DOMAIN-SUFFIX,analytics-sg.tiktok.com, AdBlock
DOMAIN-SUFFIX,ads.tiktok.com, AdBlock
DOMAIN-SUFFIX,analytics.tiktok.com, AdBlock
DOMAIN-SUFFIX,ads.youtube.com, AdBlock
DOMAIN-SUFFIX,youtube.cleverads.vn, AdBlock
DOMAIN-SUFFIX,ads.yahoo.com, AdBlock
DOMAIN-SUFFIX,adserver.yahoo.com, AdBlock
DOMAIN-SUFFIX,global.adserver.yahoo.com, AdBlock
DOMAIN-SUFFIX,us.adserver.yahoo.com, AdBlock
DOMAIN-SUFFIX,adspecs.yahoo.com, AdBlock
DOMAIN-SUFFIX,advertising.yahoo.com, AdBlock
DOMAIN-SUFFIX,analytics.yahoo.com, AdBlock
DOMAIN-SUFFIX,analytics.query.yahoo.com, AdBlock
DOMAIN-SUFFIX,ads.yap.yahoo.com, AdBlock
DOMAIN-SUFFIX,m.yap.yahoo.com, AdBlock
DOMAIN-SUFFIX,partnerads.ysm.yahoo.com, AdBlock
DOMAIN-SUFFIX,appmetrica.yandex.com, AdBlock
DOMAIN-SUFFIX,redirect.appmetrica.yandex.com, AdBlock
DOMAIN-SUFFIX,19534.redirect.appmetrica.yandex.com, AdBlock
DOMAIN-SUFFIX,3.redirect.appmetrica.yandex.com, AdBlock
DOMAIN-SUFFIX,30488.redirect.appmetrica.yandex.com, AdBlock
DOMAIN-SUFFIX,4.redirect.appmetrica.yandex.com, AdBlock
DOMAIN-SUFFIX,report.appmetrica.yandex.net, AdBlock
DOMAIN-SUFFIX,extmaps-api.yandex.net, AdBlock
DOMAIN-SUFFIX,analytics.mobile.yandex.net, AdBlock
DOMAIN-SUFFIX,banners.mobile.yandex.net, AdBlock
DOMAIN-SUFFIX,banners-slb.mobile.yandex.net, AdBlock
DOMAIN-SUFFIX,startup.mobile.yandex.net, AdBlock
DOMAIN-SUFFIX,offerwall.yandex.net, AdBlock
DOMAIN-SUFFIX,adfox.yandex.ru, AdBlock
DOMAIN-SUFFIX,matchid.adfox.yandex.ru, AdBlock
DOMAIN-SUFFIX,adsdk.yandex.ru, AdBlock
DOMAIN-SUFFIX,an.yandex.ru, AdBlock
DOMAIN-SUFFIX,redirect.appmetrica.yandex.ru, AdBlock
DOMAIN-SUFFIX,awaps.yandex.ru, AdBlock
DOMAIN-SUFFIX,awsync.yandex.ru, AdBlock
DOMAIN-SUFFIX,bs.yandex.ru, AdBlock
DOMAIN-SUFFIX,bs-meta.yandex.ru, AdBlock
DOMAIN-SUFFIX,clck.yandex.ru, AdBlock
DOMAIN-SUFFIX,informer.yandex.ru, AdBlock
DOMAIN-SUFFIX,kiks.yandex.ru, AdBlock
DOMAIN-SUFFIX,grade.market.yandex.ru, AdBlock
DOMAIN-SUFFIX,mc.yandex.ru, AdBlock
DOMAIN-SUFFIX,metrika.yandex.ru, AdBlock
DOMAIN-SUFFIX,click.sender.yandex.ru, AdBlock
DOMAIN-SUFFIX,share.yandex.ru, AdBlock
DOMAIN-SUFFIX,yandexadexchange.net, AdBlock
DOMAIN-SUFFIX,mobile.yandexadexchange.net, AdBlock
DOMAIN-SUFFIX,bdapi-in-ads.realmemobile.com, AdBlock
DOMAIN-SUFFIX,adsfs.oppomobile.com, AdBlock
DOMAIN-SUFFIX,adx.ads.oppomobile.com, AdBlock
DOMAIN-SUFFIX,bdapi.ads.oppomobile.com, AdBlock
DOMAIN-SUFFIX,ck.ads.oppomobile.com, AdBlock
DOMAIN-SUFFIX,data.ads.oppomobile.com, AdBlock
DOMAIN-SUFFIX,g1.ads.oppomobile.com, AdBlock
DOMAIN-SUFFIX,api.ad.xiaomi.com, AdBlock
DOMAIN-SUFFIX,app.chat.xiaomi.net, AdBlock
DOMAIN-SUFFIX,data.mistat.xiaomi.com, AdBlock
DOMAIN-SUFFIX,data.mistat.intl.xiaomi.com, AdBlock
DOMAIN-SUFFIX,data.mistat.india.xiaomi.com, AdBlock
DOMAIN-SUFFIX,data.mistat.rus.xiaomi.com, AdBlock
DOMAIN-SUFFIX,sdkconfig.ad.xiaomi.com, AdBlock
DOMAIN-SUFFIX,sdkconfig.ad.intl.xiaomi.com, AdBlock
DOMAIN-SUFFIX,globalapi.ad.xiaomi.com, AdBlock
DOMAIN-SUFFIX,www.cdn.ad.xiaomi.com, AdBlock
DOMAIN-SUFFIX,tracking.miui.com, AdBlock
DOMAIN-SUFFIX,sa.api.intl.miui.com, AdBlock
DOMAIN-SUFFIX,tracking.miui.com, AdBlock
DOMAIN-SUFFIX,tracking.intl.miui.com, AdBlock
DOMAIN-SUFFIX,tracking.india.miui.com, AdBlock
DOMAIN-SUFFIX,tracking.rus.miui.com, AdBlock
DOMAIN-SUFFIX,analytics.oneplus.cn, AdBlock
DOMAIN-SUFFIX,click.oneplus.cn, AdBlock
DOMAIN-SUFFIX,click.oneplus.com, AdBlock
DOMAIN-SUFFIX,open.oneplus.net, AdBlock
DOMAIN-SUFFIX,metrics.data.hicloud.com, AdBlock
DOMAIN-SUFFIX,metrics1.data.hicloud.com, AdBlock
DOMAIN-SUFFIX,metrics2.data.hicloud.com, AdBlock
DOMAIN-SUFFIX,metrics3.data.hicloud.com, AdBlock
DOMAIN-SUFFIX,metrics4.data.hicloud.com, AdBlock
DOMAIN-SUFFIX,metrics5.data.hicloud.com, AdBlock
DOMAIN-SUFFIX,logservice.hicloud.com, AdBlock
DOMAIN-SUFFIX,logservice1.hicloud.com, AdBlock
DOMAIN-SUFFIX,metrics-dra.dt.hicloud.com, AdBlock
DOMAIN-SUFFIX,logbak.hicloud.com, AdBlock
DOMAIN-SUFFIX,ad.samsungadhub.com, AdBlock
DOMAIN-SUFFIX,samsungadhub.com, AdBlock
DOMAIN-SUFFIX,samsungads.com, AdBlock
DOMAIN-SUFFIX,smetrics.samsung.com, AdBlock
DOMAIN-SUFFIX,nmetrics.samsung.com, AdBlock
DOMAIN-SUFFIX,samsung-com.112.2o7.net, AdBlock
DOMAIN-SUFFIX,business.samsungusa.com, AdBlock
DOMAIN-SUFFIX,analytics.samsungknox.com, AdBlock
DOMAIN-SUFFIX,bigdata.ssp.samsung.com, AdBlock
DOMAIN-SUFFIX,analytics-api.samsunghealthcn.com, AdBlock
DOMAIN-SUFFIX,config.samsungads.com, AdBlock
DOMAIN-SUFFIX,metrics.apple.com, AdBlock
DOMAIN-SUFFIX,securemetrics.apple.com, AdBlock
DOMAIN-SUFFIX,supportmetrics.apple.com, AdBlock
DOMAIN-SUFFIX,metrics.icloud.com, AdBlock
DOMAIN-SUFFIX,metrics.mzstatic.com, AdBlock
DOMAIN-SUFFIX,dzc-metrics.mzstatic.com, AdBlock
DOMAIN-SUFFIX,books-analytics-events.news.apple-dns.net, AdBlock
DOMAIN-SUFFIX,books-analytics-events.apple.com, AdBlock
DOMAIN-SUFFIX,stocks-analytics-events.apple.com, AdBlock
DOMAIN-SUFFIX,stocks-analytics-events.news.apple-dns.net, AdBlock
DOMAIN-KEYWORD,pagead2, AdBlock
DOMAIN-KEYWORD,adservice, AdBlock
DOMAIN-KEYWORD,.ads, AdBlock
DOMAIN-KEYWORD,.ad, AdBlock
DOMAIN-KEYWORD,adservetx, AdBlock
DOMAIN-KEYWORD,mediavisor, AdBlock
DOMAIN-KEYWORD,adtago, AdBlock
DOMAIN-KEYWORD,analyticsengine, AdBlock
DOMAIN-KEYWORD,advice-ads, AdBlock
DOMAIN-KEYWORD,affiliationjs, AdBlock
DOMAIN-KEYWORD,advertising, AdBlock
DOMAIN-KEYWORD,adserver, AdBlock
DOMAIN-KEYWORD,pclick, AdBlock
DOMAIN-KEYWORD,partnerads, AdBlock
DOMAIN-KEYWORD,appmetrica, AdBlock
DOMAIN-KEYWORD,adfox, AdBlock
DOMAIN-KEYWORD,adsdk, AdBlock
DOMAIN-KEYWORD,clck, AdBlock
DOMAIN-KEYWORD,metrika, AdBlock
DOMAIN-KEYWORD,api-hotjar, AdBlock
DOMAIN-KEYWORD,hotjar-analytics, AdBlock
DOMAIN-KEYWORD,hotjar, AdBlock
DOMAIN-KEYWORD,luckyorange, AdBlock
DOMAIN-KEYWORD,bugsnag, AdBlock
DOMAIN-KEYWORD,sentry-cdn, AdBlock
DOMAIN-KEYWORD,getsentry, AdBlock
DOMAIN-KEYWORD,ads-api, AdBlock
DOMAIN-KEYWORD,ads-twitter, AdBlock
DOMAIN-KEYWORD,pointdrive, AdBlock
DOMAIN-KEYWORD,ads-dev, AdBlock
DOMAIN-KEYWORD,trk, AdBlock
DOMAIN-KEYWORD,cleverads, AdBlock
DOMAIN-KEYWORD,ads-sg, AdBlock
DOMAIN-KEYWORD,analytics-sg, AdBlock
DOMAIN-KEYWORD,adspecs, AdBlock
DOMAIN-KEYWORD,adsfs, AdBlock
DOMAIN-KEYWORD,adx, AdBlock
DOMAIN-KEYWORD,tracking, AdBlock
DOMAIN-KEYWORD,logservice, AdBlock
DOMAIN-KEYWORD,logbak, AdBlock
DOMAIN-KEYWORD,smetrics, AdBlock
DOMAIN-KEYWORD,nmetrics, AdBlock
DOMAIN-KEYWORD,securemetrics, AdBlock
DOMAIN-KEYWORD,supportmetrics, AdBlock
DOMAIN-KEYWORD,books-analytics, AdBlock
DOMAIN-KEYWORD,stocks-analytics, AdBlock
DOMAIN-SUFFIX,analytics.s3.amazonaws.com, AdBlock
DOMAIN-SUFFIX,analytics.google.com, AdBlock
DOMAIN-SUFFIX,click.googleanalytics.com, AdBlock
DOMAIN-SUFFIX,events.reddit.com, AdBlock
DOMAIN-SUFFIX,business-api.tiktok.com, AdBlock
DOMAIN-SUFFIX,log.byteoversea.com, AdBlock
DOMAIN-SUFFIX,udc.yahoo.com, AdBlock
DOMAIN-SUFFIX,udcm.yahoo.com, AdBlock
DOMAIN-SUFFIX,auction.unityads.unity3d.com, AdBlock
DOMAIN-SUFFIX,webview.unityads.unity3d.com, AdBlock
DOMAIN-SUFFIX,config.unityads.unity3d.com, AdBlock
DOMAIN-SUFFIX,adfstat.yandex.ru, AdBlock
DOMAIN-SUFFIX,iot-eu-logser.realme.com, AdBlock
DOMAIN-SUFFIX,iot-logser.realme.com, AdBlock
DOMAIN-SUFFIX,bdapi-ads.realmemobile.com, AdBlock
DOMAIN-SUFFIX,grs.hicloud.com, AdBlock
DOMAIN-SUFFIX,weather-analytics-events.apple.com, AdBlock
DOMAIN-SUFFIX,notes-analytics-events.apple.com, AdBlock
FINAL,Select Group`;
}
async function generateHusiSub(type, bug, geo81, tls, country = null, limit = null) {
  const proxyListResponse = await fetch(proxyListURL);
  const proxyList = await proxyListResponse.text();
  let ips = proxyList
    .split('\n')
    .filter(Boolean)
  if (country && country.toLowerCase() === 'random') {
    // Pilih data secara acak jika country=random
    ips = ips.sort(() => Math.random() - 0.5); // Acak daftar proxy
  } else if (country) {
    // Filter berdasarkan country jika bukan "random"
    ips = ips.filter(line => {
      const parts = line.split(',');
      if (parts.length > 1) {
        const lineCountry = parts[2].toUpperCase();
        return lineCountry === country.toUpperCase();
      }
      return false;
    });
  }
  if (limit && !isNaN(limit)) {
    ips = ips.slice(0, limit); // Batasi jumlah proxy berdasarkan limit
  }
  let conf = '';
  let bex = '';
  let count = 1;
  
  for (let line of ips) {
    const parts = line.split(',');
    const proxyHost = parts[0];
    const proxyPort = parts[1] || 443;
    const emojiFlag = getEmojiFlag(line.split(',')[2]); // Konversi ke emoji bendera
    const sanitize = (text) => text.replace(/[\n\r]+/g, "").trim(); // Hapus newline dan spasi ekstra
    let ispName = sanitize(`${emojiFlag} (${line.split(',')[2]}) ${line.split(',')[3]} ${count ++}`);
    const UUIDS = `${generateUUIDv4()}`;
    const ports = tls ? '443' : '80';
    const snio = tls ? `\n      "tls": {\n        "disable_sni": false,\n        "enabled": true,\n        "insecure": true,\n        "server_name": "${geo81}"\n      },` : '';
    if (type === 'vless') {
      bex += `        "${ispName}",\n`
      conf += `
    {
      "domain_strategy": "ipv4_only",
      "flow": "",
      "multiplex": {
        "enabled": false,
        "max_streams": 32,
        "protocol": "smux"
      },
      "packet_encoding": "xudp",
      "server": "${bug}",
      "server_port": ${ports},
      "tag": "${ispName}",${snio}
      "transport": {
        "early_data_header_name": "Sec-WebSocket-Protocol",
        "headers": {
          "Host": "${geo81}"
        },
        "max_early_data": 0,
        "path": "${pathinfo}${proxyHost}=${proxyPort}",
        "type": "ws"
      },
      "type": "vless",
      "uuid": "${UUIDS}"
    },`;
    } else if (type === 'trojan') {
      bex += `        "${ispName}",\n`
      conf += `
    {
      "domain_strategy": "ipv4_only",
      "multiplex": {
        "enabled": false,
        "max_streams": 32,
        "protocol": "smux"
      },
      "password": "${UUIDS}",
      "server": "${bug}",
      "server_port": ${ports},
      "tag": "${ispName}",${snio}
      "transport": {
        "early_data_header_name": "Sec-WebSocket-Protocol",
        "headers": {
          "Host": "${geo81}"
        },
        "max_early_data": 0,
        "path": "${pathinfo}${proxyHost}=${proxyPort}",
        "type": "ws"
      },
      "type": "trojan"
    },`;
    } else if (type === 'ss') {
      bex += `        "${ispName}",\n`
      conf += `
    {
      "type": "shadowsocks",
      "tag": "${ispName}",
      "server": "${bug}",
      "server_port": 443,
      "method": "none",
      "password": "${UUIDS}",
      "plugin": "v2ray-plugin",
      "plugin_opts": "mux=0;path=${pathinfo}${proxyHost}=${proxyPort};host=${geo81};tls=1"
    },`;
    } else if (type === 'mix') {
      bex += `        "${ispName} vless",\n        "${ispName} trojan",\n        "${ispName} ss",\n`
      conf += `
    {
      "domain_strategy": "ipv4_only",
      "flow": "",
      "multiplex": {
        "enabled": false,
        "max_streams": 32,
        "protocol": "smux"
      },
      "packet_encoding": "xudp",
      "server": "${bug}",
      "server_port": ${ports},
      "tag": "${ispName} vless",${snio}
      "transport": {
        "early_data_header_name": "Sec-WebSocket-Protocol",
        "headers": {
          "Host": "${geo81}"
        },
        "max_early_data": 0,
        "path": "${pathinfo}${proxyHost}=${proxyPort}",
        "type": "ws"
      },
      "type": "vless",
      "uuid": "${UUIDS}"
    },
    {
      "domain_strategy": "ipv4_only",
      "multiplex": {
        "enabled": false,
        "max_streams": 32,
        "protocol": "smux"
      },
      "password": "${UUIDS}",
      "server": "${bug}",
      "server_port": ${ports},
      "tag": "${ispName} trojan",${snio}
      "transport": {
        "early_data_header_name": "Sec-WebSocket-Protocol",
        "headers": {
          "Host": "${geo81}"
        },
        "max_early_data": 0,
        "path": "${pathinfo}${proxyHost}=${proxyPort}",
        "type": "ws"
      },
      "type": "trojan"
    },
    {
      "type": "shadowsocks",
      "tag": "${ispName} ss",
      "server": "${bug}",
      "server_port": 443,
      "method": "none",
      "password": "${UUIDS}",
      "plugin": "v2ray-plugin",
      "plugin_opts": "mux=0;path=${pathinfo}${proxyHost}=${proxyPort};host=${geo81};tls=1"
    },`;
    }
  }
  return `#### BY : GEO PROJECT #### 

{
  "dns": {
    "final": "dns-final",
    "independent_cache": true,
    "rules": [
      {
        "disable_cache": false,
        "domain": [
          "family.cloudflare-dns.com",
          "${bug}"
        ],
        "server": "direct-dns"
      }
    ],
    "servers": [
      {
        "address": "https://family.cloudflare-dns.com/dns-query",
        "address_resolver": "direct-dns",
        "strategy": "ipv4_only",
        "tag": "remote-dns"
      },
      {
        "address": "local",
        "strategy": "ipv4_only",
        "tag": "direct-dns"
      },
      {
        "address": "local",
        "address_resolver": "dns-local",
        "strategy": "ipv4_only",
        "tag": "dns-final"
      },
      {
        "address": "local",
        "tag": "dns-local"
      },
      {
        "address": "rcode://success",
        "tag": "dns-block"
      }
    ]
  },
  "experimental": {
    "cache_file": {
      "enabled": true,
      "path": "../cache/cache.db",
      "store_fakeip": true
    },
    "clash_api": {
      "external_controller": "127.0.0.1:9090"
    },
    "v2ray_api": {
      "listen": "127.0.0.1:0",
      "stats": {
        "enabled": true,
        "outbounds": [
          "proxy",
          "direct"
        ]
      }
    }
  },
  "inbounds": [
    {
      "listen": "0.0.0.0",
      "listen_port": 6450,
      "override_address": "8.8.8.8",
      "override_port": 53,
      "tag": "dns-in",
      "type": "direct"
    },
    {
      "domain_strategy": "",
      "endpoint_independent_nat": true,
      "inet4_address": [
        "172.19.0.1/28"
      ],
      "mtu": 9000,
      "sniff": true,
      "sniff_override_destination": true,
      "stack": "system",
      "tag": "tun-in",
      "type": "tun"
    },
    {
      "domain_strategy": "",
      "listen": "0.0.0.0",
      "listen_port": 2080,
      "sniff": true,
      "sniff_override_destination": true,
      "tag": "mixed-in",
      "type": "mixed"
    }
  ],
  "log": {
    "level": "info"
  },
  "outbounds": [
    {
      "outbounds": [
        "Best Latency",
${bex}        "direct"
      ],
      "tag": "Internet",
      "type": "selector"
    },
    {
      "interval": "1m0s",
      "outbounds": [
${bex}        "direct"
      ],
      "tag": "Best Latency",
      "type": "urltest",
      "url": "https://detectportal.firefox.com/success.txt"
    },
${conf}
    {
      "tag": "direct",
      "type": "direct"
    },
    {
      "tag": "bypass",
      "type": "direct"
    },
    {
      "tag": "block",
      "type": "block"
    },
    {
      "tag": "dns-out",
      "type": "dns"
    }
  ],
  "route": {
    "auto_detect_interface": true,
    "rules": [
      {
        "outbound": "dns-out",
        "port": [
          53
        ]
      },
      {
        "inbound": [
          "dns-in"
        ],
        "outbound": "dns-out"
      },
      {
        "network": [
          "udp"
        ],
        "outbound": "block",
        "port": [
          443
        ],
        "port_range": []
      },
      {
        "ip_cidr": [
          "224.0.0.0/3",
          "ff00::/8"
        ],
        "outbound": "block",
        "source_ip_cidr": [
          "224.0.0.0/3",
          "ff00::/8"
        ]
      }
    ]
  }
}`;
}
async function generateSingboxSub(type, bug, geo81, tls, country = null, limit = null) {
  const proxyListResponse = await fetch(proxyListURL);
  const proxyList = await proxyListResponse.text();
  let ips = proxyList
    .split('\n')
    .filter(Boolean)
  if (country && country.toLowerCase() === 'random') {
    // Pilih data secara acak jika country=random
    ips = ips.sort(() => Math.random() - 0.5); // Acak daftar proxy
  } else if (country) {
    // Filter berdasarkan country jika bukan "random"
    ips = ips.filter(line => {
      const parts = line.split(',');
      if (parts.length > 1) {
        const lineCountry = parts[2].toUpperCase();
        return lineCountry === country.toUpperCase();
      }
      return false;
    });
  }
  if (limit && !isNaN(limit)) {
    ips = ips.slice(0, limit); // Batasi jumlah proxy berdasarkan limit
  }
  let conf = '';
  let bex = '';
  let count = 1;
  
  for (let line of ips) {
    const parts = line.split(',');
    const proxyHost = parts[0];
    const proxyPort = parts[1] || 443;
    const emojiFlag = getEmojiFlag(line.split(',')[2]); // Konversi ke emoji bendera
    const sanitize = (text) => text.replace(/[\n\r]+/g, "").trim(); // Hapus newline dan spasi ekstra
    let ispName = sanitize(`${emojiFlag} (${line.split(',')[2]}) ${line.split(',')[3]} ${count ++}`);
    const UUIDS = `${generateUUIDv4()}`;
    const ports = tls ? '443' : '80';
    const snio = tls ? `\n      "tls": {\n        "enabled": true,\n        "server_name": "${geo81}",\n        "insecure": true\n      },` : '';
    if (type === 'vless') {
      bex += `        "${ispName}",\n`
      conf += `
    {
      "type": "vless",
      "tag": "${ispName}",
      "domain_strategy": "ipv4_only",
      "server": "${bug}",
      "server_port": ${ports},
      "uuid": "${UUIDS}",${snio}
      "multiplex": {
        "protocol": "smux",
        "max_streams": 32
      },
      "transport": {
        "type": "ws",
        "path": "${pathinfo}${proxyHost}=${proxyPort}",
        "headers": {
          "Host": "${geo81}"
        },
        "early_data_header_name": "Sec-WebSocket-Protocol"
      },
      "packet_encoding": "xudp"
    },`;
    } else if (type === 'trojan') {
      bex += `        "${ispName}",\n`
      conf += `
    {
      "type": "trojan",
      "tag": "${ispName}",
      "domain_strategy": "ipv4_only",
      "server": "${bug}",
      "server_port": ${ports},
      "password": "${UUIDS}",${snio}
      "multiplex": {
        "protocol": "smux",
        "max_streams": 32
      },
      "transport": {
        "type": "ws",
        "path": "${pathinfo}${proxyHost}=${proxyPort}",
        "headers": {
          "Host": "${geo81}"
        },
        "early_data_header_name": "Sec-WebSocket-Protocol"
      }
    },`;
    } else if (type === 'ss') {
      bex += `        "${ispName}",\n`
      conf += `
    {
      "type": "shadowsocks",
      "tag": "${ispName}",
      "server": "${bug}",
      "server_port": 443,
      "method": "none",
      "password": "${UUIDS}",
      "plugin": "v2ray-plugin",
      "plugin_opts": "mux=0;path=${pathinfo}${proxyHost}=${proxyPort};host=${geo81};tls=1"
    },`;
    } else if (type === 'mix') {
      bex += `        "${ispName} vless",\n        "${ispName} trojan",\n        "${ispName} ss",\n`
      conf += `
    {
      "type": "vless",
      "tag": "${ispName} vless",
      "domain_strategy": "ipv4_only",
      "server": "${bug}",
      "server_port": ${ports},
      "uuid": "${UUIDS}",${snio}
      "multiplex": {
        "protocol": "smux",
        "max_streams": 32
      },
      "transport": {
        "type": "ws",
        "path": "${pathinfo}${proxyHost}=${proxyPort}",
        "headers": {
          "Host": "${geo81}"
        },
        "early_data_header_name": "Sec-WebSocket-Protocol"
      },
      "packet_encoding": "xudp"
    },
    {
      "type": "trojan",
      "tag": "${ispName} trojan",
      "domain_strategy": "ipv4_only",
      "server": "${bug}",
      "server_port": ${ports},
      "password": "${UUIDS}",${snio}
      "multiplex": {
        "protocol": "smux",
        "max_streams": 32
      },
      "transport": {
        "type": "ws",
        "path": "${pathinfo}${proxyHost}=${proxyPort}",
        "headers": {
          "Host": "${geo81}"
        },
        "early_data_header_name": "Sec-WebSocket-Protocol"
      }
    },
    {
      "type": "shadowsocks",
      "tag": "${ispName} ss",
      "server": "${bug}",
      "server_port": 443,
      "method": "none",
      "password": "${UUIDS}",
      "plugin": "v2ray-plugin",
      "plugin_opts": "mux=0;path=${pathinfo}${proxyHost}=${proxyPort};host=${geo81};tls=1"
    },`;
    }
  }
  return `#### BY : GEO PROJECT #### 

{
  "log": {
    "level": "info"
  },
  "dns": {
    "servers": [
      {
        "tag": "remote-dns",
        "address": "https://family.cloudflare-dns.com/dns-query",
        "address_resolver": "direct-dns",
        "strategy": "ipv4_only"
      },
      {
        "tag": "direct-dns",
        "address": "local",
        "strategy": "ipv4_only"
      },
      {
        "tag": "dns-final",
        "address": "local",
        "address_resolver": "dns-local",
        "strategy": "ipv4_only"
      },
      {
        "tag": "dns-local",
        "address": "local"
      },
      {
        "tag": "dns-block",
        "address": "rcode://success"
      }
    ],
    "rules": [
      {
        "domain": [
          "family.cloudflare-dns.com",
          "${bug}"
        ],
        "server": "direct-dns"
      }
    ],
    "final": "dns-final",
    "independent_cache": true
  },
  "inbounds": [
    {
      "type": "tun",
      "mtu": 1400,
      "inet4_address": "172.19.0.1/30",
      "inet6_address": "fdfe:dcba:9876::1/126",
      "auto_route": true,
      "strict_route": true,
      "endpoint_independent_nat": true,
      "stack": "mixed",
      "sniff": true
    }
  ],
  "outbounds": [
    {
      "tag": "Internet",
      "type": "selector",
      "outbounds": [
        "Best Latency",
${bex}        "direct"
      ]
    },
    {
      "type": "urltest",
      "tag": "Best Latency",
      "outbounds": [
${bex}        "direct"
      ],
      "url": "https://ping.geo81.us.kg",
      "interval": "30s"
    },
${conf}
    {
      "type": "direct",
      "tag": "direct"
    },
    {
      "type": "direct",
      "tag": "bypass"
    },
    {
      "type": "block",
      "tag": "block"
    },
    {
      "type": "dns",
      "tag": "dns-out"
    }
  ],
  "route": {
    "rules": [
      {
        "port": 53,
        "outbound": "dns-out"
      },
      {
        "inbound": "dns-in",
        "outbound": "dns-out"
      },
      {
        "network": "udp",
        "port": 443,
        "outbound": "block"
      },
      {
        "source_ip_cidr": [
          "224.0.0.0/3",
          "ff00::/8"
        ],
        "ip_cidr": [
          "224.0.0.0/3",
          "ff00::/8"
        ],
        "outbound": "block"
      }
    ],
    "auto_detect_interface": true
  },
  "experimental": {
    "cache_file": {
      "enabled": false
    },
    "clash_api": {
      "external_controller": "127.0.0.1:9090",
      "external_ui": "ui",
      "external_ui_download_url": "https://github.com/MetaCubeX/metacubexd/archive/gh-pages.zip",
      "external_ui_download_detour": "Internet",
      "secret": "bitzblack",
      "default_mode": "rule"
    }
  }
}`;
}
async function generateNekoboxSub(type, bug, geo81, tls, country = null, limit = null) {
  const proxyListResponse = await fetch(proxyListURL);
  const proxyList = await proxyListResponse.text();
  let ips = proxyList
    .split('\n')
    .filter(Boolean)
  if (country && country.toLowerCase() === 'random') {
    // Pilih data secara acak jika country=random
    ips = ips.sort(() => Math.random() - 0.5); // Acak daftar proxy
  } else if (country) {
    // Filter berdasarkan country jika bukan "random"
    ips = ips.filter(line => {
      const parts = line.split(',');
      if (parts.length > 1) {
        const lineCountry = parts[2].toUpperCase();
        return lineCountry === country.toUpperCase();
      }
      return false;
    });
  }
  if (limit && !isNaN(limit)) {
    ips = ips.slice(0, limit); // Batasi jumlah proxy berdasarkan limit
  }
  let conf = '';
  let bex = '';
  let count = 1;
  
  for (let line of ips) {
    const parts = line.split(',');
    const proxyHost = parts[0];
    const proxyPort = parts[1] || 443;
    const emojiFlag = getEmojiFlag(line.split(',')[2]); // Konversi ke emoji bendera
    const sanitize = (text) => text.replace(/[\n\r]+/g, "").trim(); // Hapus newline dan spasi ekstra
    let ispName = sanitize(`${emojiFlag} (${line.split(',')[2]}) ${line.split(',')[3]} ${count ++}`);
    const UUIDS = `${generateUUIDv4()}`;
    const ports = tls ? '443' : '80';
    const snio = tls ? `\n      "tls": {\n        "disable_sni": false,\n        "enabled": true,\n        "insecure": true,\n        "server_name": "${geo81}"\n      },` : '';
    if (type === 'vless') {
      bex += `        "${ispName}",\n`
      conf += `
    {
      "domain_strategy": "ipv4_only",
      "flow": "",
      "multiplex": {
        "enabled": false,
        "max_streams": 32,
        "protocol": "smux"
      },
      "packet_encoding": "xudp",
      "server": "${bug}",
      "server_port": ${ports},
      "tag": "${ispName}",${snio}
      "transport": {
        "early_data_header_name": "Sec-WebSocket-Protocol",
        "headers": {
          "Host": "${geo81}"
        },
        "max_early_data": 0,
        "path": "${pathinfo}${proxyHost}=${proxyPort}",
        "type": "ws"
      },
      "type": "vless",
      "uuid": "${UUIDS}"
    },`;
    } else if (type === 'trojan') {
      bex += `        "${ispName}",\n`
      conf += `
    {
      "domain_strategy": "ipv4_only",
      "multiplex": {
        "enabled": false,
        "max_streams": 32,
        "protocol": "smux"
      },
      "password": "${UUIDS}",
      "server": "${bug}",
      "server_port": ${ports},
      "tag": "${ispName}",${snio}
      "transport": {
        "early_data_header_name": "Sec-WebSocket-Protocol",
        "headers": {
          "Host": "${geo81}"
        },
        "max_early_data": 0,
        "path": "${pathinfo}${proxyHost}=${proxyPort}",
        "type": "ws"
      },
      "type": "trojan"
    },`;
    } else if (type === 'ss') {
      bex += `        "${ispName}",\n`
      conf += `
    {
      "type": "shadowsocks",
      "tag": "${ispName}",
      "server": "${bug}",
      "server_port": 443,
      "method": "none",
      "password": "${UUIDS}",
      "plugin": "v2ray-plugin",
      "plugin_opts": "mux=0;path=${pathinfo}${proxyHost}=${proxyPort};host=${geo81};tls=1"
    },`;
    } else if (type === 'mix') {
      bex += `        "${ispName} vless",\n        "${ispName} trojan",\n        "${ispName} ss",\n`
      conf += `
    {
      "domain_strategy": "ipv4_only",
      "flow": "",
      "multiplex": {
        "enabled": false,
        "max_streams": 32,
        "protocol": "smux"
      },
      "packet_encoding": "xudp",
      "server": "${bug}",
      "server_port": ${ports},
      "tag": "${ispName} vless",${snio}
      "transport": {
        "early_data_header_name": "Sec-WebSocket-Protocol",
        "headers": {
          "Host": "${geo81}"
        },
        "max_early_data": 0,
        "path": "${pathinfo}${proxyHost}=${proxyPort}",
        "type": "ws"
      },
      "type": "vless",
      "uuid": "${UUIDS}"
    },
    {
      "domain_strategy": "ipv4_only",
      "multiplex": {
        "enabled": false,
        "max_streams": 32,
        "protocol": "smux"
      },
      "password": "${UUIDS}",
      "server": "${bug}",
      "server_port": ${ports},
      "tag": "${ispName} trojan",${snio}
      "transport": {
        "early_data_header_name": "Sec-WebSocket-Protocol",
        "headers": {
          "Host": "${geo81}"
        },
        "max_early_data": 0,
        "path": "${pathinfo}${proxyHost}=${proxyPort}",
        "type": "ws"
      },
      "type": "trojan"
    },
    {
      "type": "shadowsocks",
      "tag": "${ispName} ss",
      "server": "${bug}",
      "server_port": 443,
      "method": "none",
      "password": "${UUIDS}",
      "plugin": "v2ray-plugin",
      "plugin_opts": "mux=0;path=${pathinfo}${proxyHost}=${proxyPort};host=${geo81};tls=1"
    },`;
    }
  }
  return `#### BY : GEO PROJECT #### 

{
  "dns": {
    "final": "dns-final",
    "independent_cache": true,
    "rules": [
      {
        "disable_cache": false,
        "domain": [
          "family.cloudflare-dns.com",
          "${bug}"
        ],
        "server": "direct-dns"
      }
    ],
    "servers": [
      {
        "address": "https://family.cloudflare-dns.com/dns-query",
        "address_resolver": "direct-dns",
        "strategy": "ipv4_only",
        "tag": "remote-dns"
      },
      {
        "address": "local",
        "strategy": "ipv4_only",
        "tag": "direct-dns"
      },
      {
        "address": "local",
        "address_resolver": "dns-local",
        "strategy": "ipv4_only",
        "tag": "dns-final"
      },
      {
        "address": "local",
        "tag": "dns-local"
      },
      {
        "address": "rcode://success",
        "tag": "dns-block"
      }
    ]
  },
  "experimental": {
    "cache_file": {
      "enabled": true,
      "path": "../cache/clash.db",
      "store_fakeip": true
    },
    "clash_api": {
      "external_controller": "127.0.0.1:9090",
      "external_ui": "../files/yacd"
    }
  },
  "inbounds": [
    {
      "listen": "0.0.0.0",
      "listen_port": 6450,
      "override_address": "8.8.8.8",
      "override_port": 53,
      "tag": "dns-in",
      "type": "direct"
    },
    {
      "domain_strategy": "",
      "endpoint_independent_nat": true,
      "inet4_address": [
        "172.19.0.1/28"
      ],
      "mtu": 9000,
      "sniff": true,
      "sniff_override_destination": true,
      "stack": "system",
      "tag": "tun-in",
      "type": "tun"
    },
    {
      "domain_strategy": "",
      "listen": "0.0.0.0",
      "listen_port": 2080,
      "sniff": true,
      "sniff_override_destination": true,
      "tag": "mixed-in",
      "type": "mixed"
    }
  ],
  "log": {
    "level": "info"
  },
  "outbounds": [
    {
      "outbounds": [
        "Best Latency",
${bex}        "direct"
      ],
      "tag": "Internet",
      "type": "selector"
    },
    {
      "interval": "1m0s",
      "outbounds": [
${bex}        "direct"
      ],
      "tag": "Best Latency",
      "type": "urltest",
      "url": "https://detectportal.firefox.com/success.txt"
    },
${conf}
    {
      "tag": "direct",
      "type": "direct"
    },
    {
      "tag": "bypass",
      "type": "direct"
    },
    {
      "tag": "block",
      "type": "block"
    },
    {
      "tag": "dns-out",
      "type": "dns"
    }
  ],
  "route": {
    "auto_detect_interface": true,
    "rules": [
      {
        "outbound": "dns-out",
        "port": [
          53
        ]
      },
      {
        "inbound": [
          "dns-in"
        ],
        "outbound": "dns-out"
      },
      {
        "network": [
          "udp"
        ],
        "outbound": "block",
        "port": [
          443
        ],
        "port_range": []
      },
      {
        "ip_cidr": [
          "224.0.0.0/3",
          "ff00::/8"
        ],
        "outbound": "block",
        "source_ip_cidr": [
          "224.0.0.0/3",
          "ff00::/8"
        ]
      }
    ]
  }
}`;
}
async function generateV2rayngSub(type, bug, geo81, tls, country = null, limit = null) {
  const proxyListResponse = await fetch(proxyListURL);
  const proxyList = await proxyListResponse.text();
  let ips = proxyList
    .split('\n')
    .filter(Boolean);

  if (country && country.toLowerCase() === 'random') {
    // Pilih data secara acak jika country=random
    ips = ips.sort(() => Math.random() - 0.5); // Acak daftar proxy
  } else if (country) {
    // Filter berdasarkan country jika bukan "random"
    ips = ips.filter(line => {
      const parts = line.split(',');
      if (parts.length > 1) {
        const lineCountry = parts[2].toUpperCase();
        return lineCountry === country.toUpperCase();
      }
      return false;
    });
  }
  
  if (limit && !isNaN(limit)) {
    ips = ips.slice(0, limit); // Batasi jumlah proxy berdasarkan limit
  }

  let conf = '';

  for (let line of ips) {
    const parts = line.split(',');
    const proxyHost = parts[0];
    const proxyPort = parts[1] || 443;
    const countryCode = parts[2]; // Kode negara ISO
    const isp = parts[3]; // Informasi ISP

    // Gunakan teks Latin-1 untuk menggantikan emoji flag
    const countryText = `[${countryCode}]`; // Format bendera ke teks Latin-1
    const ispInfo = `${countryText} ${isp}`;
    const UUIDS = `${generateUUIDv4()}`;

    if (type === 'vless') {
      if (tls) {
        conf += `vless://${UUIDS}\u0040${bug}:443?encryption=none&security=tls&sni=${geo81}&fp=randomized&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}#${ispInfo}\n`;
      } else {
        conf += `vless://${UUIDS}\u0040${bug}:80?path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=none&encryption=none&host=${geo81}&fp=randomized&type=ws&sni=${geo81}#${ispInfo}\n`;
      }
    } else if (type === 'trojan') {
      if (tls) {
        conf += `trojan://${UUIDS}\u0040${bug}:443?encryption=none&security=tls&sni=${geo81}&fp=randomized&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}#${ispInfo}\n`;
      } else {
        conf += `trojan://${UUIDS}\u0040${bug}:80?path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=none&encryption=none&host=${geo81}&fp=randomized&type=ws&sni=${geo81}#${ispInfo}\n`;
      }
    } else if (type === 'ss') {
      if (tls) {
        conf += `ss://${btoa(`none:${UUIDS}`)}%3D@${bug}:443?encryption=none&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=tls&sni=${geo81}#${ispInfo}\n`;
      } else {
        conf += `ss://${btoa(`none:${UUIDS}`)}%3D@${bug}:80?encryption=none&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=none&sni=${geo81}#${ispInfo}\n`;
      }
    } else if (type === 'mix') {
      if (tls) {
        conf += `vless://${UUIDS}\u0040${bug}:443?encryption=none&security=tls&sni=${geo81}&fp=randomized&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}#${ispInfo}\n`;
        conf += `trojan://${UUIDS}\u0040${bug}:443?encryption=none&security=tls&sni=${geo81}&fp=randomized&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}#${ispInfo}\n`;
        conf += `ss://${btoa(`none:${UUIDS}`)}%3D@${bug}:443?encryption=none&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=tls&sni=${geo81}#${ispInfo}\n`;
      } else {
        conf += `vless://${UUIDS}\u0040${bug}:80?path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=none&encryption=none&host=${geo81}&fp=randomized&type=ws&sni=${geo81}#${ispInfo}\n`;
        conf += `trojan://${UUIDS}\u0040${bug}:80?path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=none&encryption=none&host=${geo81}&fp=randomized&type=ws&sni=${geo81}#${ispInfo}\n`;
        conf += `ss://${btoa(`none:${UUIDS}`)}%3D@${bug}:80?encryption=none&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=none&sni=${geo81}#${ispInfo}\n`;
      }
    }
  }

  const base64Conf = btoa(conf.replace(/ /g, '%20'));

  return base64Conf;
}
async function generateV2raySub(type, bug, geo81, tls, country = null, limit = null) {
  const proxyListResponse = await fetch(proxyListURL);
  const proxyList = await proxyListResponse.text();
  let ips = proxyList
    .split('\n')
    .filter(Boolean)
  if (country && country.toLowerCase() === 'random') {
    // Pilih data secara acak jika country=random
    ips = ips.sort(() => Math.random() - 0.5); // Acak daftar proxy
  } else if (country) {
    // Filter berdasarkan country jika bukan "random"
    ips = ips.filter(line => {
      const parts = line.split(',');
      if (parts.length > 1) {
        const lineCountry = parts[2].toUpperCase();
        return lineCountry === country.toUpperCase();
      }
      return false;
    });
  }
  if (limit && !isNaN(limit)) {
    ips = ips.slice(0, limit); // Batasi jumlah proxy berdasarkan limit
  }
  let conf = '';
  for (let line of ips) {
    const parts = line.split(',');
    const proxyHost = parts[0];
    const proxyPort = parts[1] || 443;
    const emojiFlag = getEmojiFlag(line.split(',')[2]); // Konversi ke emoji bendera
    const UUIDS = generateUUIDv4();
    const information = encodeURIComponent(`${emojiFlag} (${line.split(',')[2]}) ${line.split(',')[3]}`);
    if (type === 'vless') {
      if (tls) {
        conf += `vless://${UUIDS}@${bug}:443?encryption=none&security=tls&sni=${geo81}&fp=randomized&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}#${information}\n`;
      } else {
        conf += `vless://${UUIDS}@${bug}:80?path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=none&encryption=none&host=${geo81}&fp=randomized&type=ws&sni=${geo81}#${information}\n`;
      }
    } else if (type === 'trojan') {
      if (tls) {
        conf += `trojan://${UUIDS}@${bug}:443?encryption=none&security=tls&sni=${geo81}&fp=randomized&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}#${information}\n`;
      } else {
        conf += `trojan://${UUIDS}@${bug}:80?path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=none&encryption=none&host=${geo81}&fp=randomized&type=ws&sni=${geo81}#${information}\n`;
      }
    } else if (type === 'ss') {
      if (tls) {
        conf += `ss://${btoa(`none:${UUIDS}`)}%3D@${bug}:443?encryption=none&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=tls&sni=${geo81}#${information}\n`;
      } else {
        conf += `ss://${btoa(`none:${UUIDS}`)}%3D@${bug}:80?encryption=none&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=none&sni=${geo81}#${information}\n`;
      }
    } else if (type === 'mix') {
      if (tls) {
        conf += `vless://${UUIDS}@${bug}:443?encryption=none&security=tls&sni=${geo81}&fp=randomized&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}#${information}\n`;
        conf += `trojan://${UUIDS}@${bug}:443?encryption=none&security=tls&sni=${geo81}&fp=randomized&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}#${information}\n`;
        conf += `ss://${btoa(`none:${UUIDS}`)}%3D@${bug}:443?encryption=none&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=tls&sni=${geo81}#${information}\n`;
      } else {
        conf += `vless://${UUIDS}@${bug}:80?path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=none&encryption=none&host=${geo81}&fp=randomized&type=ws&sni=${geo81}#${information}\n`;
        conf += `trojan://${UUIDS}@${bug}:80?path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=none&encryption=none&host=${geo81}&fp=randomized&type=ws&sni=${geo81}#${information}\n`;
        conf += `ss://${btoa(`none:${UUIDS}`)}%3D@${bug}:80?encryption=none&type=ws&host=${geo81}&path=%2FFree-VPN-CF-Geo-Project%2F${proxyHost}%3D${proxyPort}&security=none&sni=${geo81}#${information}\n`;
      }
    }
  }
  
  return conf;
}
function generateUUIDv4() {
  const randomValues = crypto.getRandomValues(new Uint8Array(16));
  randomValues[6] = (randomValues[6] & 0x0f) | 0x40;
  randomValues[8] = (randomValues[8] & 0x3f) | 0x80;
  return [
    randomValues[0].toString(16).padStart(2, '0'),
    randomValues[1].toString(16).padStart(2, '0'),
    randomValues[2].toString(16).padStart(2, '0'),
    randomValues[3].toString(16).padStart(2, '0'),
    randomValues[4].toString(16).padStart(2, '0'),
    randomValues[5].toString(16).padStart(2, '0'),
    randomValues[6].toString(16).padStart(2, '0'),
    randomValues[7].toString(16).padStart(2, '0'),
    randomValues[8].toString(16).padStart(2, '0'),
    randomValues[9].toString(16).padStart(2, '0'),
    randomValues[10].toString(16).padStart(2, '0'),
    randomValues[11].toString(16).padStart(2, '0'),
    randomValues[12].toString(16).padStart(2, '0'),
    randomValues[13].toString(16).padStart(2, '0'),
    randomValues[14].toString(16).padStart(2, '0'),
    randomValues[15].toString(16).padStart(2, '0'),
  ].join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}
