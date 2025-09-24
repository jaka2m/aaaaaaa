import { connect } from "cloudflare:sockets";

const rootDomain = "krikkrik.tech";
const serviceName = "mangap";
const apiKey = "663edaea4bf15546cbdcc5164efea4dc2ccbd";
const apiEmail = "freecf2025@gmail.com";
const accountID = "bc9e18145c1a08fea1757bf382bffa60";
const zoneID = "a0861f3c9dba5203cb45d8f5cb8d10ee";
let isApiReady = false;
let prxIP = "";
let cachedPrxList = [];

const horse = "dHJvamFu";
const flash = "dmxlc3M=";
const v2 = "djJyYXk=";
const neko = "Y2xhc2g=";

const APP_DOMAIN = `${serviceName}.${rootDomain}`;
const PORTS = [443, 80];
const PROTOCOLS = [atob(horse), atob(flash), "ss"];
//const KV_PRX_URL = "https://raw.githubusercontent.com/FoolVPN-ID/Nautica/refs/heads/main/kvProxyList.json";
const PRX_BANK_URL = "https://raw.githubusercontent.com/jaka2m/botak/refs/heads/main/cek/proxyList.txt";
const DNS_SERVER_ADDRESS = "8.8.8.8";
const DNS_SERVER_PORT = 53;
const PRX_HEALTH_CHECK_API = "https://id1.foolvpn.me/api/v1/check";
const CONVERTER_URL = "https://api.foolvpn.me/convert";
const DONATE_LINK = "https://github.com/jaka1m/project/raw/main/BAYAR.jpg";
const TELEGRAM_USERNAME = "sampiiiiu";
const WHATSAPP_NUMBER = "6282339191527";
const NAMAWEB = 'GEO PROJECT'
const LINK_TELEGRAM = 'https://t.me/sampiiiiu'
const wildcards = [
  'quiz.int.vidio.com',
  'support.zoom.us',
  'npca.netflix.com',
  'zaintest.vuclip.com',
  'ava.game.naver.com',
  'app.gopay.co.id',
  'cache.netflix.com',
  'quiz.vidio.com',
  'graph.instagram.com',
  'www.udemy.com',
  'img.email1.vidio.com',
  'investor.fb.com',
  'quiz.int.vidio.com',
  'io.ruangguru.com',
  'bimbel.ruangguru.com',
  'df.game.naver.com',
  'support.duolingo.com',
  'zoomappdocs.zoom.us',
  'siakad.esaunggul.ac.id',
  'bakrie.ac.id'
];
const BAD_WORDS_LIST =
  "https://gist.githubusercontent.com/adierebel/a69396d79b787b84d89b45002cb37cd6/raw/6df5f8728b18699496ad588b3953931078ab9cf1/kata-kasar.txt";
const PRX_PER_PAGE = 10;
const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;
const CORS_HEADER_OPTIONS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function buildCountryFlag(prxList) {
  const flagList = prxList.map((prx) => prx.country);
  const uniqueFlags = new Set(flagList);

  let flagElement = "";
  for (const flag of uniqueFlags) {
    if (flag && flag !== "Unknown") {
      try {
        flagElement += `<a href="/sub?search=${flag.toLowerCase()}&page=0" class="py-1">
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


async function getKVPrxList(kvPrxUrl = KV_PRX_URL) {
  if (!kvPrxUrl) {
    throw new Error("No URL Provided!");
  }

  const kvPrx = await fetch(kvPrxUrl);
  if (kvPrx.status == 200) {
    return await kvPrx.json();
  } else {
    return {};
  }
}

async function getPrxList(prxBankUrl = PRX_BANK_URL) {
  if (!prxBankUrl) {
    throw new Error("No URL Provided!");
  }

  const prxBank = await fetch(prxBankUrl);
  if (prxBank.status == 200) {
    const text = (await prxBank.text()) || "";

    const prxString = text.split("\n").filter(Boolean);
    cachedPrxList = prxString
      .map((entry) => {
        const [prxIP, prxPort, country, org] = entry.split(",");
        return {
          prxIP: prxIP || "Unknown",
          prxPort: prxPort || "Unknown",
          country: country || "Unknown",
          org: org || "Unknown Org",
        };
      })
      .filter(Boolean);
  }

  return cachedPrxList;
}

async function reverseWeb(request, target, targetPath) {
  const targetUrl = new URL(request.url);
  const targetChunk = target.split(":");

  targetUrl.hostname = targetChunk[0];
  targetUrl.port = targetChunk[1]?.toString() || "443";
  targetUrl.pathname = targetPath || targetUrl.pathname;

  const modifiedRequest = new Request(targetUrl, request);

  modifiedRequest.headers.set("X-Forwarded-Host", request.headers.get("Host"));

  const response = await fetch(modifiedRequest);

  const newResponse = new Response(response.body, response);
  for (const [key, value] of Object.entries(CORS_HEADER_OPTIONS)) {
    newResponse.headers.set(key, value);
  }
  newResponse.headers.set("X-Proxied-By", "Cloudflare Worker");

  return newResponse;
}

function generateWebPage(request, prxList, page = 0, searchTerm = "") {
  const totalPrxs = prxList.length;
  const totalPages = Math.ceil(totalPrxs / PRX_PER_PAGE);
  const startIndex = PRX_PER_PAGE * page;
  const url = new URL(request.url);
  const selectedConfigType = url.searchParams.get('configType') || 'tls';
  const selectedWildcard = url.searchParams.get('wildcard');
  
  // 👇 Ini adalah perbaikan utamanya
  let filteredPrxList = prxList.filter(prx => {
    const normalizedSearchTerm = searchTerm.toLowerCase();
    const isSearchTermCountry = normalizedSearchTerm.length === 2; // Asumsi kode negara 2 huruf

    if (isSearchTermCountry) {
      // Untuk kode negara, lakukan pencocokan eksak
      return prx.country.toLowerCase() === normalizedSearchTerm;
    } else {
      // Untuk IP, ISP, dan Port, tetap gunakan pencarian substring
      return prx.prxIP.includes(normalizedSearchTerm) ||
             prx.org.toLowerCase().includes(normalizedSearchTerm) ||
             prx.prxPort.includes(normalizedSearchTerm);
    }
  });
  // 👆 Akhir dari perbaikan

  const prxToShow = filteredPrxList.slice(startIndex, startIndex + PRX_PER_PAGE);
  const hostName = request.headers.get("Host");
  const uuid = crypto.randomUUID();

  const modifiedHostName = selectedWildcard || hostName;

  let html = `
    <!DOCTYPE html>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${NAMAWEB}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/gh/lipis/flag-icon-css@3.5/css/flag-icon.min.css" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        /*
        * =============================================
        * Global CSS Variables & Basic Styles
        * =============================================
        */

        :root {
            /* Dark Mode Defaults */
            --primary: #00ff88;
            --secondary: #00ffff;
            --accent: #ff00ff;
            --dark: #080c14;
            --darker: #040608;
            --light: #e0ffff;
            --card-bg: rgba(8, 12, 20, 0.95);
            --glow: 0 0 20px rgba(0, 255, 136, 0.3);
        }

        /* Light Mode Overrides */
html.light {
  --primary: #0088ff;
  --secondary: #00ffff;
  --accent: #ff00ff;
  --dark: #f0f8ff;
  --darker: #ffffff;
  --light: #2c2c2c;
  --card-bg: rgba(224, 242, 255, 0.7); /* Latar belakang kartu putih kebiruan transparan */
  --glow: 0 0 30px rgba(173, 216, 230, 0.8); /* Efek blur putih kebiruan */
}


/* Modifikasi elemen lain */
html.light .quantum-card {
  backdrop-filter: blur(12px); /* Menambahkan efek blur pada kartu */
  border: 1px solid rgba(173, 216, 230, 0.5); /* Border dengan warna yang sama */
  box-shadow: var(--glow); /* Menggunakan variabel glow yang baru */
}

html.light .quantum-table td {
  background: rgba(173, 216, 230, 0.1); /* Latar belakang sel tabel sedikit transparan */
}

html.light .quantum-table tr:hover td {
  background: rgba(173, 216, 230, 0.2); /* Efek hover pada sel tabel */
}

html.light .button-style, html.light .copy-btn {
  background: var(--primary);
  color: var(--dark);
  border: 1px solid var(--primary);
  /* Tambahkan efek shadow pada tombol */
  box-shadow: 0 0 15px rgba(0, 136, 255, 0.3);
}

html.light select {
  color: var(--light);
  background: rgba(173, 216, 230, 0.1); /* Latar belakang dropdown */
  border: 2px solid rgba(173, 216, 230, 0.3); /* Border dropdown */
  box-shadow: 0 0 15px rgba(173, 216, 230, 0.5); /* Glow dropdown */
}

        html.light body {
            background-image:
                radial-gradient(circle at 0% 0%, rgba(0, 136, 255, 0.1) 0, transparent 50%),
                radial-gradient(circle at 100% 100%, rgba(0, 255, 255, 0.1) 0, transparent 50%),
                url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230088ff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        /* Universal Box Sizing & Font */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Space Grotesk', sans-serif;
        }

        /* Body & Background */
        body {
            background: var(--darker);
            color: var(--light);
            min-height: 85vh;
            background-image:
                radial-gradient(circle at 0% 0%, rgba(0, 255, 136, 0.1) 0, transparent 50%),
                radial-gradient(circle at 100% 100%, rgba(0, 255, 255, 0.1) 0, transparent 50%),
                url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ff88' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        /*
        * =============================================
        * Layout & Component Styles
        * =============================================
        */

        .wildcard-dropdown {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2rem;
            margin: 0.5rem auto;
        }

        select {
            width: 100%;
            max-width: 200px;
            padding: 0.4rem 0.6rem;
            font-size: 0.8rem;
            color: var(--light);
            background: rgba(0, 255, 136, 0.05);
            border: 2px solid rgba(0, 255, 136, 0.3);
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
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
        }

        select:focus {
            border-color: var(--secondary);
            background: rgba(0, 255, 136, 0.1);
            box-shadow: 0 0 20px var(--secondary);
        }

        /* All Button & Input Common Styles */
        .button-reset,
        .button-search,
        .input-search,
        .button-style,
        .copy-btn {
            font-family: 'Rajdhani', sans-serif;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s ease;
            outline: none;
            border-radius: 0.375rem;
            border: 1px solid var(--primary);
            color: var(--primary);
            background-color: transparent;
            padding: 0.3rem 0.75rem;
        }

        .button-style, .copy-btn {
            background: var(--primary);
            color: var(--dark);
            border: none;
            border-radius: 12px;
            cursor: pointer;
            padding: 0.6rem 1rem;
            font-size: 0.6rem;
            position: relative;
            overflow: hidden;
        }
        
        /* Tambahan untuk tombol dark mode */
        .toggle-dark-mode {
            background-color: var(--primary);
            color: var(--dark);
            border-radius: 9999px;
            border: 2px solid var(--dark);
            padding: 0.5rem;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .toggle-dark-mode:hover {
            transform: scale(1.1);
        }

        .copy-btn {
            padding: 0.8rem 1.5rem;
            font-size: 0.9rem;
            width: 100%;
        }

        .table-button {
            background-color: transparent;
            border: 1px solid var(--primary);
            color: var(--primary);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .table-button:hover {
            background-color: var(--primary);
            color: var(--dark);
            box-shadow: 0 0 10px var(--primary);
        }

        .button-search:hover,
        .input-search:focus {
            background-color: rgba(0, 255, 136, 0.1);
            border-color: var(--secondary);
        }

        .button-style::before, .copy-btn::before {
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

        .button-style:hover::before, .copy-btn:hover::before {
            left: 100%;
        }

        .button-style:hover, .copy-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 255, 136, 0.3);
        }

        .button-style:active, .copy-btn:active {
            transform: translateY(1px);
            box-shadow: 0 3px 10px rgba(0, 255, 136, 0.2);
        }

        .form-search {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-grow: 1;
            gap: 1rem;
        }

        .quantum-container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 2rem;
            perspective: 1000px;
        }

        .quantum-card {
            max-width: 100%;
            background: var(--card-bg);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 20px;
            padding: 2rem;
            box-shadow: var(--glow);
            transform-style: preserve-3d;
            animation: cardFloat 6s ease-in-out infinite;
        }

        @keyframes cardFloat {
            0%, 100% { transform: translateY(0) rotateX(0); }
            50% { transform: translateY(-10px) rotateX(2deg); }
        }

        .quantum-title {
            font-family: 'Rajdhani', sans-serif;
            font-size: 4rem;
            font-weight: 700;
            text-align: center;
            margin-top: 1rem;
            margin-bottom: 2rem;
            background: linear-gradient(45deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
            position: relative;
            animation: titlePulse 3s ease-in-out infinite;
        }

        @keyframes titlePulse {
            0%, 100% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.02); filter: brightness(1.2); }
        }

        .search-quantum {
            position: relative;
            margin-top: 0.6rem;
            margin-bottom: 0.3rem;
        }

        #search-bar {
            width: 100%;
            padding: 0.6rem 1rem;
            font-size: 0.6rem;
            color: var(--light);
            background: rgba(0, 255, 136, 0.05);
            border: 2px solid rgba(0, 255, 136, 0.3);
            border-radius: 15px;
            transition: all 0.3s ease;
        }

        #search-bar:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
            background: rgba(0, 255, 136, 0.1);
        }

        .quantum-table {
            width: 100%;
            min-width: 800px;
            border-collapse: collapse;
            border-spacing: 0;
        }

        .quantum-table th {
            background: rgba(0, 255, 136, 0.15);
            color: var(--primary);
            padding: 1rem 1.5rem;
            font-family: 'Rajdhani', sans-serif;
            font-weight: 700;
            font-size: 1rem;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            border-bottom: 3px solid var(--primary);
            white-space: nowrap;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .quantum-table td {
            padding: 1.2rem 1.5rem;
            background: transparent;
            border-bottom: 1px solid rgba(0, 255, 136, 0.1);
            transition: all 0.3s ease;
            vertical-align: middle;
        }

        .quantum-table tr {
            transition: all 0.3s ease;
        }

        .quantum-table tr:hover td {
            background: rgba(0, 255, 136, 0.05);
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
            background: rgba(0, 255, 136, 0.1);
            color: var(--primary);
            text-decoration: none;
            border-radius: 12px;
            border: 1px solid rgba(0, 255, 136, 0.3);
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
            box-shadow: 0 5px 15px rgba(0, 255, 136, 0.2);
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
            box-shadow: 0 5px 15px rgba(0, 255, 136, 0.3);
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

        .table-wrapper {
            width: 100%;
            max-height: calc(80vh - 200px);
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            margin: 1rem 0;
            border-radius: 10px;
            background: rgba(0, 255, 136, 0.02);
        }

        .table-wrapper:hover {
            pointer-events: auto;
        }

        .table-wrapper::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        .table-wrapper::-webkit-scrollbar-track {
            background: rgba(0, 255, 136, 0.1);
            border-radius: 4px;
        }

        .table-wrapper::-webkit-scrollbar-thumb {
            background: var(--primary);
            border-radius: 4px;
        }

        .table-wrapper::-webkit-scrollbar-thumb:hover {
            background: var(--secondary);
        }

        /*
        * =============================================
        * Mobile Responsiveness
        * =============================================
        */

        @media (max-width: 768px) {
            .quantum-container {
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
                padding: 0.6rem 1rem;
                font-size: 0.6rem;
            }

            .table-wrapper {
                margin: 0.5rem 0;
                padding: 0;
                border-radius: 10px;
                max-height: 60vh;
                overflow-y: auto;
                background: rgba(0, 255, 136, 0.02);
            }
            
            .quantum-table th,
            .quantum-table td {
                padding: 0.8rem 0.5rem;
                font-size: 0.9rem;
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

        /*
        * =============================================
        * Animations & Special Styles
        * =============================================
        */

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @keyframes spin-around {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(180deg); }
            100% { transform: rotateY(0deg); }
        }

        .loading-icon, .spinner {
            width: 25px;
            height: 25px;
            border: 3px solid rgba(0, 255, 136, 0.2);
            border-top: 3px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
            display: inline-block;
            vertical-align: middle;
            margin-right: 0.5rem;
        }
        
        .spinner {
            border: 4px solid rgba(0, 0, 0, .1);
            border-left-color: #3b82f6;
            width: 24px;
            height: 24px;
        }

        .loading-text {
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--primary);
        }

        .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .proxy-status.active { color: #00FF00; }
        .proxy-status.dead { color: #FF3333; }
        .proxy-status.unknown { color: #8C8C8C; }
        .proxy-status.error { color: cyan; }
        
        .active-icon-glow {
            color: #10B981;
            font-size: 1.8em;
            animation: glow-blink 1.5s infinite alternate;
        }

        @keyframes glow-blink {
            0% {
                text-shadow: 0 0 5px rgba(16, 185, 129, 0.7);
                opacity: 0.8;
            }
            50% {
                text-shadow: 0 0 15px rgba(16, 185, 129, 1),
                            0 0 25px rgba(16, 185, 129, 0.8);
                opacity: 1;
            }
            100% {
                text-shadow: 0 0 5px rgba(16, 185, 129, 0.7);
                opacity: 0.8;
            }
        }

        .text-red-500 { color: #EF4444; }
        .text-cyan-500 { color: #06B6D4; }
        .text-amber-400 { color: #F59E0B; }
    </style>
    <script>
        tailwind.config = {
            darkMode: 'selector',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Poppins', 'sans-serif'],
                    },
                    colors: {
                        'primary-dark': '#1c1c20',
                        'secondary-dark': '#2a2a2f',
                        'text-light': '#f0f0f5',
                        'accent-cyan': '#00e0b7',
                        'accent-blue': '#4a90e2',
                    },
                },
            },
        };
    </script>
</head>
<body class="bg-darker text-light">
    <div class="quantum-container">
        <div class="quantum-card">
        <div class="flex justify-between items-center mb-4">
            <h1 class="quantum-title">
                <a href="${LINK_TELEGRAM}" target="_blank" rel="noopener noreferrer">
                    ${NAMAWEB}
                </a>
            </h1>
        </div>
        
            <div class="flex justify-around my-2 text-sm">
    <span class="font-bold text-green-500">Active: <span id="active-count">0</span></span>
    <span class="font-bold text-red-500">Dead: <span id="dead-count">0</span></span>
  </div>
  
            <form id="search-form" class="form-search" style="display: flex; align-items: center; gap: 5px;">
                <input type="text" id="search-input" name="search" placeholder="Cari IP, ISP, atau Negara"
                    class="input-search" value="${searchTerm}">
                <button type="submit" class="button-search">Search</button>
            </form>
            <div class="wildcard-dropdown">
                <select id="wildcard" name="wildcard">
                    <option value="" ${!selectedWildcard ? 'selected' : ''}>No Wildcard</option>
                    ${wildcards.map(w => `<option value="${w}" ${selectedWildcard === w ? 'selected' : ''}>${w}</option>`).join('')}
                </select>
                <select id="configType" name="configType">
                    <option value="tls" ${selectedConfigType === 'tls' ? 'selected' : ''}>TLS</option>
                    <option value="non-tls" ${selectedConfigType === 'non-tls' ? 'selected' : ''}>NTLS</option>
                </select>
            </div>
            
            <div class="w-full h-11 overflow-x-auto px-1 py-1 flex items-center space-x-1 shadow-lg bg-transparent border"
  style="border-width: 1px; border-style: solid; border-color: #00ff88; height: 55px; border-radius: 10px; margin-top: 0.5rem;">
  ${buildCountryFlag(prxList)}
</div>
            
            <div class="table-wrapper">
                <table class="quantum-table">
                    <thead>
                        <tr>
                            <th class="text-center">No.</th>
                            <th class="text-center">IP:Port</th>
                            <th class="text-center">STATUS</th>
                            <th class="text-center">ISP</th>
                            <th class="text-center">Negara</th>
                            <th class="text-center">Vless</th>
                            <th class="text-center">Trojan</th>
                            <th class="text-center">Shadowsocks</th>
                            <th class="text-center">Vmess</th>
                        </tr>
                    </thead>
                    <tbody>
  `;

  if (prxToShow.length === 0) {
    html += `
      <tr>
        <td colspan="8" class="px-6 py-4 text-center text-gray-500">
          Tidak ada data yang ditemukan.
        </td>
      </tr>
    `;
  } else {
    prxToShow.forEach((prx, index) => {
      const { prxIP, prxPort, country, org } = prx;
      const displayIndex = startIndex + index + 1;

      const vmessConfigLink = "vmess://" + b64EncodeUnicode(JSON.stringify({
          v: "2",
          ps: `${displayIndex} ${getFlagEmoji(country)} ${org} WS ${selectedConfigType === 'tls' ? "TLS" : "NTLS"} [${serviceName}]`,
          add: modifiedHostName,
          port: selectedConfigType === 'tls' ? '443' : '80',
          id: uuid,
          aid: "0",
          net: "ws",
          type: "none",
          host: hostName,
          path: `/Free-VPN-Geo-Project/${prxIP}-${prxPort}`,
          tls: selectedConfigType === 'tls' ? "tls" : ""
      }));

      const generateConfig = (protocol) => {
        const configs = {
          tls: "",
          ntls: ""
        };
        const port = selectedConfigType === 'tls' ? 443 : 80;

        let uriTls = new URL(`${protocol}://${modifiedHostName}`);
        uriTls.port = 443;
        uriTls.searchParams.set("encryption", "none");
        uriTls.searchParams.set("type", "ws");
        uriTls.searchParams.set("host", hostName);
        uriTls.searchParams.set("security", "tls");
        uriTls.searchParams.set("path", `/Free-VPN-Geo-Project/${prxIP}-${prxPort}`);
        uriTls.hash = `${displayIndex} ${getFlagEmoji(country)} ${org} WS TLS [${serviceName}]`;
        if (protocol === "ss") {
          uriTls.username = btoa(`none:${uuid}`);
          uriTls.searchParams.set("plugin", `${atob(v2)}-plugin;tls;mux=0;mode=websocket;path=/Free-VPN-Geo-Project/${prxIP}-${prxPort};host=${modifiedHostName}`);
        } else {
          uriTls.username = uuid;
        }
        configs.tls = uriTls.toString();

        let uriNtls = new URL(`${protocol}://${modifiedHostName}`);
        uriNtls.port = 80;
        uriNtls.searchParams.set("encryption", "none");
        uriNtls.searchParams.set("type", "ws");
        uriNtls.searchParams.set("host", hostName);
        uriNtls.searchParams.set("security", "none");
        uriNtls.searchParams.set("path", `/Free-VPN-Geo-Project/${prxIP}-${prxPort}`);
        uriNtls.hash = `${displayIndex} ${getFlagEmoji(country)} ${org} WS NTLS [${serviceName}]`;
        if (protocol === "ss") {
          uriNtls.username = btoa(`none:${uuid}`);
          uriNtls.searchParams.set("plugin", `${atob(v2)}-plugin;mux=0;mode=websocket;path=/Free-VPN-Geo-Project/${prxIP}-${prxPort};host=${modifiedHostName}`);
        } else {
          uriNtls.username = uuid;
          uriNtls.searchParams.set("sni", "");
        }
        configs.ntls = uriNtls.toString();
        return configs;
      };

      const vlessConfigs = generateConfig(atob(flash));
      const trojanConfigs = generateConfig(atob(horse));
      const ssConfigs = generateConfig("ss");
      
      html += `
        <tr class="config-row text-center">
  <td>${displayIndex}.</td>
  <td class="ip-port">${prxIP}:${prxPort}</td>
  <td class="proxy-status"></td>
  <td>${org}</td>
  <td class="px-1 py-1 text-center">
    <span class="flag-circle flag-icon flag-icon-${country.toLowerCase()}"
      style="width: 40px; height: 40px; border-radius: 50%; display: inline-block;">
    </span>
  </td>
  <td class="px-6 py-4 whitespace-nowrap">
    <div class="flex flex-col gap-2">
      <button class="table-button" onclick="showPopup('${selectedConfigType === 'tls' ? vlessConfigs.tls : vlessConfigs.ntls}')">
        VLESS
      </button>
    </div>
  </td>
  <td class="px-6 py-4 whitespace-nowrap">
    <div class="flex flex-col gap-2">
      <button class="table-button" onclick="showPopup('${selectedConfigType === 'tls' ? trojanConfigs.tls : trojanConfigs.ntls}')">
        TROJAN
      </button>
    </div>
  </td>
  <td class="px-6 py-4 whitespace-nowrap">
    <div class="flex flex-col gap-2">
      <button class="table-button" onclick="showPopup('${selectedConfigType === 'tls' ? ssConfigs.tls : ssConfigs.ntls}')">
        Shadowsocks
      </button>
    </div>
  </td>
  <td class="px-6 py-4 whitespace-nowrap">
    <div class="flex flex-col gap-2">
      <button class="table-button" onclick="showPopup('${vmessConfigLink}')">
        Vmess
      </button>
    </div>
  </td>
</tr>
      `;
    });
  }
  
  html += `
      </tbody>
    </table>
  </div>
  
  <div id="urlPopup" class="hidden fixed inset-0 z-50 flex items-center justify-center">
  <div class="absolute inset-0 bg-blue-500 opacity-20 backdrop-blur-md"></div>
  <div class="relative w-80 p-4 border rounded-2xl shadow-xl transition-all duration-300 transform scale-95
              bg-white/10 backdrop-filter backdrop-blur-lg border-opacity-20 border-white/20 text-white">
    <div class="mt-2 text-center">
      <h3 class="text-xl font-bold leading-6 mb-4">Copy URL</h3>
      <div class="px-2 py-2 mb-4 relative">
        <textarea 
          id="urlTextarea" 
          class="w-full h-24 p-2 text-sm border-transparent rounded-lg resize-none 
                 bg-white/5 backdrop-filter backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-300 
                 text-white placeholder-gray-300" 
          readonly
        ></textarea>
      </div>
      <div class="items-center px-4 py-2 space-x-2 flex">
        <button id="copyUrlBtn" class="flex-1 px-3 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white text-sm font-medium rounded-lg shadow-lg hover:from-green-500 hover:to-green-700 focus:outline-none transition-all duration-200">
          Copy
        </button>
        <button id="closePopupBtn" class="flex-1 px-3 py-2 bg-gradient-to-r from-red-400 to-red-600 text-white text-sm font-medium rounded-lg shadow-lg hover:from-red-500 hover:to-red-700 focus:outline-none transition-all duration-200">
          Close
        </button>
      </div>
    </div>
  </div>
</div>

  <div class="quantum-pagination">
    <a href="/sub/${page - 1}?q=${encodeURIComponent(searchTerm)}" class="py-0.5 px-1.5 rounded-lg font-bold text-white bg-gray-800 border-2 border-green-500 transition-transform transform hover:-translate-y-0.5 active:scale-95 ${page <= 0 ? 'opacity-50 cursor-not-allowed' : ''}">
      Prev
    </a>
    ${(() => {
      let buttons = '';
      const startPage = Math.max(0, page - 2);
      const endPage = Math.min(totalPages - 1, page + 2);
      for (let i = startPage; i <= endPage; i++) {
        buttons += `<a href="/sub/${i}?q=${encodeURIComponent(searchTerm)}" class="py-0.5 px-1.5 rounded-lg font-bold text-white border-2 border-green-500 transition-transform transform hover:-translate-y-0.5 active:scale-95 ${i === page ? 'bg-green-500 text-black' : 'bg-gray-800'}">
          ${i + 1}
        </a>`;
      }
      return buttons;
    })()}
    <a href="/sub/${page + 1}?q=${encodeURIComponent(searchTerm)}" class="py-0.5 px-1.5 rounded-lg font-bold text-white bg-gray-800 border-2 border-green-500 transition-transform transform hover:-translate-y-0.5 active:scale-95 ${page >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}">
      Next
    </a>
  </div>
  <div class="flex justify-center mt-3 text-green-500">
    <span class="text-xs">
      Showing ${startIndex + 1} to ${startIndex + prxToShow.length} of ${totalPrxs} Proxies
    </span>
  </div>
</div>
  
  
  <div id="container-window" class="hidden">
    <div class="fixed z-20 top-0 inset-0 w-full h-full bg-gray-900/80 backdrop-blur-sm flex justify-center items-center animate-fade-in">
        <p id="container-window-info" class="text-center w-full h-full top-1/4 absolute text-white animate-pulse"></p>
    </div>

    <div id="output-window" class="fixed z-30 inset-0 flex justify-center items-center p-2 hidden">
        <div class="w-full max-w-xs flex flex-col gap-2 p-4 text-center rounded-xl bg-gray-800 border border-gray-700 shadow-lg animate-zoom-in">

        </div>
    </div>
</div>
</div>
     <div id="wildcards-window" class="fixed hidden z-30 top-0 right-0 w-full h-full flex justify-center items-center">
    <div class="w-[75%] max-w-md h-auto flex flex-col gap-2 p-4 rounded-lg bg-white bg-opacity-20 backdrop-blur-sm border border-gray-300">
        <div class="flex w-full h-full gap-2 justify-between">
            <input id="new-domain-input" type="text" placeholder="Input wildcard" class="w-full h-full px-4 py-2 rounded-md focus:outline-0 bg-gray-700 text-white"/>
            <button onclick="registerDomain()" class="p-2 rounded-full bg-blue-600 hover:bg-blue-700 flex justify-center items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                    <path fill-rule="evenodd" d="M16.72 7.72a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 1 1-1.06-1.06l2.47-2.47H3a.75.75 0 0 1 0-1.5h16.19l-2.47-2.47a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"></path>
                </svg>
            </button>
        </div>

        <div id="container-domains" class="w-full h-32 rounded-md flex flex-col gap-1 overflow-y-scroll scrollbar-hide p-2 bg-gray-900"></div>

        <button onclick="toggleWildcardsWindow()" class="transform-gpu flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clip-rule="evenodd"/>
            </svg>
            Close
        </button>
    </div>
</div>
    </div>

    <footer>
    <div class="fixed top-4 right-8 flex flex-col items-end gap-3 z-50">
        <style>
    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes pulse-and-blink {
        0%, 100% {
            transform: scale(1);
            filter: brightness(100%);
        }
        50% {
            transform: scale(1.1);
            filter: brightness(150%);
        }
    }

    .animated-button {
        animation: rotate 4s linear infinite, pulse-and-blink 1.5s infinite;
    }

    .animated-button:hover {
        animation-play-state: paused;
    }
</style>

<button onclick="toggleDropdown()" class="animated-button transition-colors rounded-full p-2 block text-white shadow-lg transform hover:scale-105" style="background-image: linear-gradient(to right, #22c55e, #14b8a6, #3b82f6, #8b5cf6, #ec4899); border: none;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6 text-white">
        <path d="M12 2.25a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75h-6.75a.75.75 0 0 1 0-1.5h6.75V3a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" />
    </svg>
</button>

        <div id="dropdown-menu" class="hidden flex flex-col gap-3">
            <a href="${DONATE_LINK}" target="_blank">
                <button class="bg-accent-cyan hover:bg-teal-600 rounded-full border-2 border-gray-900 p-2 block transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                        <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
                        <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clip-rule="evenodd" />
                    </svg>
                </button>
            </a>

            <a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank">
                <button class="bg-green-500 hover:bg-green-600 rounded-full border-2 border-gray-900 p-2 block transition-colors duration-200">
                    <img src="https://geoproject.biz.id/circle-flags/whatsapp.png" alt="WhatsApp Icon" class="size-6">
                </button>
            </a>

            <a href="https://t.me/${TELEGRAM_USERNAME}" target="_blank">
                <button class="bg-blue-500 hover:bg-blue-600 rounded-full border-2 border-gray-900 p-2 block transition-colors duration-200">
                    <img src="https://geoproject.biz.id/circle-flags/telegram.png" alt="Telegram Icon" class="size-6">
                </button>
            </a>
            
            <button onclick="toggleWildcardsWindow()" class="bg-indigo-500 hover:bg-indigo-600 rounded-full border-2 border-gray-900 p-2 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                </svg>
            </button>

            <button onclick="toggleDarkMode()" class="toggle-dark-mode">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
            </button>
        </div>
    </div>
</footer>
<script>
        // Fungsi dark mode yang sudah diperbaiki
        function toggleDarkMode() {
            const htmlElement = document.documentElement;
            htmlElement.classList.toggle("light");
        }
    </script>
    <script>
    function toggleDropdown() {
        const dropdownMenu = document.getElementById('dropdown-menu');
        dropdownMenu.classList.toggle('hidden');
    }
</script>

<script>
    document.addEventListener('DOMContentLoaded', () => {
    const runningTitle = document.getElementById('runningTitle');
    const container = runningTitle.parentElement;
    let position = -runningTitle.offsetWidth; // Mulai dari luar kiri
    const speed = 1.5; // Kecepatan pergerakan

    function animateTitle() {
        position += speed;

        // Jika teks sudah melewati container, kembalikan ke posisi awal
        if (position > container.offsetWidth) {
            position = -runningTitle.offsetWidth;
        }

        // PERBAIKAN: Menggabungkan string dan variabel dengan tanda '+'
        runningTitle.style.transform = 'translateX(' + position + 'px)';

        requestAnimationFrame(animateTitle);
    }

    animateTitle();
});
</script>


     <script>
  document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      // Tunggu 5 detik sebelum memulai transisi
      setTimeout(() => {
        // Atur opacity menjadi 0 untuk memulai efek fade out
        loadingScreen.style.opacity = '0';
        
        // Setelah efek fade out selesai (500ms), sembunyikan elemen
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 500); // Durasi ini harus sama dengan durasi transisi di CSS (duration-500)
      }, 1000); // <-- Ini adalah jeda 5 detik
    }
  });
    
      // Shared
      const rootDomain = "${serviceName}.${rootDomain}";
      const notification = document.getElementById("notification-badge");
      const windowContainer = document.getElementById("container-window");
      const windowInfoContainer = document.getElementById("container-window-info");
      const converterUrl =
        "https://script.google.com/macros/s/AKfycbwwVeHNUlnP92syOP82p1dOk_-xwBgRIxkTjLhxxZ5UXicrGOEVNc5JaSOu0Bgsx_gG/exec";


      // Switches
      let isDomainListFetched = false;

      // Local variable
      let rawConfig = "";

      function getDomainList() {
        if (isDomainListFetched) return;
        isDomainListFetched = true;

        windowInfoContainer.innerText = "Fetching data...";

        const url = "https://" + rootDomain + "/api/v1/domains/get";
        const res = fetch(url).then(async (res) => {
          const domainListContainer = document.getElementById("container-domains");
          domainListContainer.innerHTML = "";

          if (res.status == 200) {
            windowInfoContainer.innerText = "Done!";
            const respJson = await res.json();
            for (const domain of respJson) {
              const domainElement = document.createElement("p");
              domainElement.classList.add("w-full", "bg-amber-400", "rounded-md");
              domainElement.innerText = domain;
              domainListContainer.appendChild(domainElement);
            }
          } else {
            windowInfoContainer.innerText = "Failed!";
          }
        });
      }

      function registerDomain() {
        const domainInputElement = document.getElementById("new-domain-input");
        const rawDomain = domainInputElement.value.toLowerCase();
        const domain = domainInputElement.value + "." + rootDomain;

        if (!rawDomain.match(/\\w+\\.\\w+$/) || rawDomain.endsWith(rootDomain)) {
          windowInfoContainer.innerText = "Invalid URL!";
          return;
        }

        windowInfoContainer.innerText = "Pushing request...";

        const url = "https://" + rootDomain + "/api/v1/domains/put?domain=" + domain;
        const res = fetch(url).then((res) => {
          if (res.status == 200) {
            windowInfoContainer.innerText = "Done!";
            domainInputElement.value = "";
            isDomainListFetched = false;
            getDomainList();
          } else {
            if (res.status == 409) {
              windowInfoContainer.innerText = "Domain exists!";
            } else {
              windowInfoContainer.innerText = "Error " + res.status;
            }
          }
        });
      }

      function copyToClipboard(text) {
        toggleOutputWindow();
        rawConfig = text;
      }

      function copyToClipboardAsRaw() {
        navigator.clipboard.writeText(rawConfig);

        notification.classList.remove("opacity-0");
        setTimeout(() => {
          notification.classList.add("opacity-0");
        }, 2000);
      }

      async function copyToClipboardAsTarget(target) {
        windowInfoContainer.innerText = "Generating config...";
        const url = "${CONVERTER_URL}";
        const res = await fetch(url, {
          method: "POST",
          body: JSON.stringify({
            url: rawConfig,
            format: target,
            template: "cf",
          }),
        });

        if (res.status == 200) {
          windowInfoContainer.innerText = "Done!";
          navigator.clipboard.writeText(await res.text());

          notification.classList.remove("opacity-0");
          setTimeout(() => {
            notification.classList.add("opacity-0");
          }, 2000);
        } else {
          windowInfoContainer.innerText = "Error " + res.statusText;
        }
      }

      function navigateTo(link) {
        window.location.href = link + window.location.search;
      }

      function toggleOutputWindow() {
        windowInfoContainer.innerText = "Select output:";
        toggleWindow();
        const rootElement = document.getElementById("output-window");
        if (rootElement.classList.contains("hidden")) {
          rootElement.classList.remove("hidden");
        } else {
          rootElement.classList.add("hidden");
        }
      }

      function toggleWildcardsWindow() {
        windowInfoContainer.innerText = "Domain list";
        toggleWindow();
        getDomainList();
        const rootElement = document.getElementById("wildcards-window");
        if (rootElement.classList.contains("hidden")) {
          rootElement.classList.remove("hidden");
        } else {
          rootElement.classList.add("hidden");
        }
      }

      function toggleWindow() {
        if (windowContainer.classList.contains("hidden")) {
          windowContainer.classList.remove("hidden");
        } else {
          windowContainer.classList.add("hidden");
        }
      }

      function checkRegion() {
        for (let i = 0; ; i++) {
          const containerRegionCheck = document.getElementById("container-region-check-" + i);
          const configSample = document.getElementById("config-sample-" + i).value.replaceAll(" ", "");
          if (containerRegionCheck == undefined) break;

          const res = fetch(
            "https://api.foolvpn.me/regioncheck?config=" + encodeURIComponent(configSample)
          ).then(async (res) => {
            if (res.status == 200) {
              containerRegionCheck.innerHTML = "<hr>";
              for (const result of await res.json()) {
                containerRegionCheck.innerHTML += "<p>" + result.name + ": " + result.region + "</p>";
              }
            }
          });
        }
      }

      function checkGeoip() {
        const containerIP = document.getElementById("container-info-ip");
        const containerCountry = document.getElementById("container-info-country");
        const containerISP = document.getElementById("container-info-isp");
        const res = fetch("https://" + rootDomain + "/api/v1/myip").then(async (res) => {
          if (res.status == 200) {
            const respJson = await res.json();
            containerIP.innerText = "IP: " + respJson.ip;
            containerCountry.innerText = "Country: " + respJson.country;
            containerISP.innerText = "ISP: " + respJson.asOrganization;
          }
        });
      }

     function updateTime() {
    const timeElement = document.getElementById("time-info-value");
    if (timeElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-GB');
        timeElement.textContent = timeString;
    }
}

setInterval(updateTime, 1000);

      window.onload = () => {
        checkGeoip();
        updateTime();
        // checkRegion();
        const observer = lozad(".lozad", {
          load: function (el) {
            el.classList.remove("scale-95");
          },
        });
        observer.observe();
      };

      window.onscroll = () => {
        const paginationContainer = document.getElementById("container-pagination");

        if (window.innerHeight + Math.round(window.scrollY) >= document.body.offsetHeight) {
          paginationContainer.classList.remove("-translate-y-6");
        } else {
          paginationContainer.classList.add("-translate-y-6");
        }
      };
    </script>
    <script>
function showPopup(url) {
  const urlTextarea = document.getElementById('urlTextarea');
  const urlPopup = document.getElementById('urlPopup');
  
  urlTextarea.value = url;
  
  urlPopup.classList.remove('hidden');
}

document.getElementById('copyUrlBtn').addEventListener('click', () => {
  const urlTextarea = document.getElementById('urlTextarea');
  
  urlTextarea.select();
  urlTextarea.setSelectionRange(0, 99999);
  
  navigator.clipboard.writeText(urlTextarea.value).then(() => {
    // Ganti alert dengan SweetAlert2 untuk notifikasi sukses
    Swal.fire({
  width: '270px',
  background: 'rgba(6, 18, 67, 0.80)',
  icon: 'success',
  text: 'Link copied successfully!',
  showConfirmButton: false,
  timer: 1500,
  customClass: {
    htmlContainer: 'text-white font-bold'
  }
});
    document.getElementById('urlPopup').classList.add('hidden');
  }).catch(err => {
    // Ganti alert dengan SweetAlert2 untuk notifikasi gagal
    Swal.fire({
    width: '270px',
      icon: 'error',
      title: 'Failed!',
      text: 'Failed to copy link. Please try again..',
      footer: 'Informasi teknis: ' + err
    });
    console.error('Gagal menyalin: ', err);
  });
});

document.getElementById('closePopupBtn').addEventListener('click', () => {
  document.getElementById('urlPopup').classList.add('hidden');
});
</script>
  <script>
    document.getElementById('search-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const searchTerm = document.getElementById('search-input').value;
      const wildcard = document.getElementById('wildcard').value;
      const configType = document.getElementById('configType').value;
      window.location.href = \`/sub/0?search=\${searchTerm}&wildcard=\${wildcard}&configType=\${configType}\`;
    });

    document.getElementById('wildcard').addEventListener('change', function(e) {
      const selectedWildcard = e.target.value;
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('wildcard', selectedWildcard);
      window.location.href = currentUrl.toString();
    });

    document.getElementById('configType').addEventListener('change', function(e) {
        const selectedType = e.target.value;
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('configType', selectedType);
        window.location.href = currentUrl.toString();
    });
  </script>
 <script>
    document.addEventListener('DOMContentLoaded', () => {
        const proxyRows = document.querySelectorAll('.config-row');
        const CORS_API_URL = 'https://cors.checker-ip.web.id/';
        const CHECKER_API_URL = 'https://geovpn.vercel.app/check?ip=';

        if (proxyRows.length === 0) {
            console.warn("Tidak ada data proxy di tabel. Skrip tidak akan berjalan.");
            return;
        }

        let activeCount = 0;
        let deadCount = 0;
        const activeCountEl = document.getElementById('active-count');
        const deadCountEl = document.getElementById('dead-count');

        const promises = Array.from(proxyRows).map(async (row) => {
            const ipPortElement = row.querySelector('.ip-port');
            const statusElement = row.querySelector('.proxy-status');

            if (!ipPortElement || !statusElement) {
                console.error("Elemen .ip-port atau .proxy-status tidak ditemukan pada satu baris. Melewati baris ini.");
                return;
            }

            const ipPort = ipPortElement.textContent.trim();
            const fullApiUrl = CORS_API_URL + '?url=' + CHECKER_API_URL + ipPort;

            // Tampilkan spinner saat memuat
            statusElement.innerHTML = '<div class="spinner"></div>';

            try {
                const response = await fetch(fullApiUrl);

                if (!response.ok) {
                    throw new Error('HTTP error! status: ' + response.status);
                }

                const data = await response.json();
                const status = data.status || 'UNKNOWN';
                let delay = data.delay || null;
                let statusHtml;

                // Hasilkan delay acak jika delay asli adalah string dengan "ms"
                if (delay && typeof delay === 'string' && delay.includes('ms')) {
                    const randomDelay = Math.floor(Math.random() * (400 - 100 + 1)) + 100;
                    delay = '(' + randomDelay + 'ms)';
                } else {
                    delay = '';
                }

                if (status === 'ACTIVE') {
                    activeCount++;
                    statusHtml =
                        '<div class="flex flex-col items-center">' +
                        '<i class="fas fa-check-circle active-icon-glow"></i>' +
                        '<span class="text-xs font-normal text-amber-400 mt-1">' + delay + '</span>' +
                        '</div>';
                } else if (status === 'DEAD') {
                    deadCount++;
                    statusHtml = '<span class="text-red-500 font-bold">DEAD</span>';
                } else {
                    statusHtml = '<span class="text-cyan-500 font-bold">UNKNOWN</span>';
                }

                statusElement.innerHTML = statusHtml;

            } catch (error) {
                console.error('Kesalahan saat mengambil status:', error);
                statusElement.innerHTML = '<span class="text-red-500 font-bold">ERROR</span>';
            }
        });

        Promise.all(promises).then(() => {
            activeCountEl.textContent = activeCount;
            deadCountEl.textContent = deadCount;
        });
    });
</script>
  </body>
  </html>
  `;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}


function getAllConfig(request, hostName, prxList, page = 0) {
  const startIndex = PRX_PER_PAGE * page;

  try {
    const uuid = crypto.randomUUID();
    const url = new URL(request.url);
    const selectedConfigType = url.searchParams.get('configType') || 'tls';    

    const document = new Document(request);
    document.setTitle("Welcome to <span class='text-blue-500 font-semibold'>Nautica</span>");
    document.addInfo(`Total: ${prxList.length}`);
    document.addInfo(`Page: ${page}/${Math.floor(prxList.length / PRX_PER_PAGE)}`);

    for (let i = startIndex; i < startIndex + PRX_PER_PAGE; i++) {
      const prx = prxList[i];
      if (!prx) break;
      const { prxIP, prxPort, country, org } = prx;

      const configs = {};
      for (const port of PORTS) {
        for (const protocol of PROTOCOLS) {
          const uri = new URL(`${protocol}://${hostName}`);
          uri.port = port.toString();
          uri.searchParams.set("encryption", "none");
          uri.searchParams.set("type", "ws");
          uri.searchParams.set("host", hostName);
          uri.searchParams.set("path", `/Free-VPN-Geo-Project/${prxIP}-${prxPort}`);
          uri.hash = `${i + 1} ${getFlagEmoji(country)} ${org} WS ${port == 443 ? "TLS" : "NTLS"} [${serviceName}]`;

          if (protocol === "ss") {
            uri.username = btoa(`none:${uuid}`);
            uri.searchParams.set(
              "plugin",
              `${atob(v2)}-plugin${
                port == 80 ? "" : ";tls"
              };mux=0;mode=websocket;path=/Free-VPN-Geo-Project/${prxIP}-${prxPort};host=${hostName}`
            );
          } else {
            uri.username = uuid;
            uri.searchParams.delete("plugin");
          }

          uri.protocol = protocol;
          uri.searchParams.set("security", port == 443 ? "tls" : "none");
          uri.searchParams.set("sni", port == 80 && protocol == atob(flash) ? "" : hostName);
          configs[`${protocol}-${port}`] = uri.toString();
        }
      }
      document.registerPrxs(
        {
          prxIP,
          prxPort,
          country,
          org,
        },
        Object.values(configs)
      );
    }

    document.addPageButton("Prev", `/sub/${page > 0 ? page - 1 : 0}`, page > 0 ? false : true);
    document.addPageButton("Next", `/sub/${page + 1}`, page < Math.floor(prxList.length / 10) ? false : true);

    return document.build();
  } catch (error) {
    return `An error occurred while generating the ${atob(flash).toUpperCase()} configurations. ${error}`;
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const upgradeHeader = request.headers.get("Upgrade");

      // Gateway check
      if (apiKey && apiEmail && accountID && zoneID) {
        isApiReady = true;
      }

      // Handle prx client
      if (upgradeHeader === "websocket") {
        const prxMatch = url.pathname.match(/^\/Free-VPN-Geo-Project\/(.+[:=-]\d+)$/);

        if (url.pathname.startsWith("/Free-VPN-Geo-Project/") && url.pathname.match(",")) {
          // Contoh: /ID, /SG, dll
          const prxKeys = url.pathname.replace("/Free-VPN-Geo-Project/", "").toUpperCase().split(",");
          const prxKey = prxKeys[Math.floor(Math.random() * prxKeys.length)];
          const kvPrx = await getKVPrxList();

          prxIP = kvPrx[prxKey][Math.floor(Math.random() * kvPrx[prxKey].length)];

          return await websocketHandler(request);
        } else if (prxMatch) {
          prxIP = prxMatch[1];
          return await websocketHandler(request);
        }
      }

      if (url.pathname.startsWith("/sub")) {
        const page = url.pathname.match(/^\/sub\/(\d+)$/);
        const pageIndex = parseInt(page ? page[1] : "0");
        const hostname = request.headers.get("Host");
        const searchTerm = url.searchParams.get("search") || "";
        
        // Queries
        const countrySelect = url.searchParams.get("cc")?.split(",");
        const prxBankUrl = url.searchParams.get("prx-list") || env.PRX_BANK_URL;
        let prxList = (await getPrxList(prxBankUrl)).filter((prx) => {
          // Filter prxs by Country
          if (countrySelect) {
            return countrySelect.includes(prx.country);
          }
          return true;
        });

        const result = generateWebPage(request, prxList, pageIndex, searchTerm);
        return result;
      } else if (url.pathname.startsWith("/check")) {
        const target = url.searchParams.get("target").split(":");
        const result = await checkPrxHealth(target[0], target[1] || "443");

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            ...CORS_HEADER_OPTIONS,
            "Content-Type": "application/json",
          },
        });
      } else if (url.pathname.startsWith("/api/v1")) {
        const apiPath = url.pathname.replace("/api/v1", "");

        if (apiPath.startsWith("/domains")) {
          if (!isApiReady) {
            return new Response("Api not ready", {
              status: 500,
            });
          }

          const wildcardApiPath = apiPath.replace("/domains", "");
          const cloudflareApi = new CloudflareApi();

          if (wildcardApiPath == "/get") {
            const domains = await cloudflareApi.getDomainList();
            return new Response(JSON.stringify(domains), {
              headers: {
                ...CORS_HEADER_OPTIONS,
              },
            });
          } else if (wildcardApiPath == "/put") {
            const domain = url.searchParams.get("domain");
            const register = await cloudflareApi.registerDomain(domain);

            return new Response(register.toString(), {
              status: register,
              headers: {
                ...CORS_HEADER_OPTIONS,
              },
            });
          }
        } else if (apiPath.startsWith("/sub")) {
          const filterCC = url.searchParams.get("cc")?.split(",") || [];
          const filterPort = url.searchParams.get("port")?.split(",") || PORTS;
          const filterVPN = url.searchParams.get("vpn")?.split(",") || PROTOCOLS;
          const filterLimit = parseInt(url.searchParams.get("limit")) || 10;
          const filterFormat = url.searchParams.get("format") || "raw";
          const fillerDomain = url.searchParams.get("domain") || APP_DOMAIN;

          const prxBankUrl = url.searchParams.get("prx-list") || env.PRX_BANK_URL;
          const prxList = await getPrxList(prxBankUrl)
            .then((prxs) => {
              // Filter CC
              if (filterCC.length) {
                return prxs.filter((prx) => filterCC.includes(prx.country));
              }
              return prxs;
            })
            .then((prxs) => {
              // shuffle result
              shuffleArray(prxs);
              return prxs;
            });

          const uuid = crypto.randomUUID();
          const result = [];
          for (const prx of prxList) {
            const uri = new URL(`${atob(horse)}://${fillerDomain}`);
            uri.searchParams.set("encryption", "none");
            uri.searchParams.set("type", "ws");
            uri.searchParams.set("host", APP_DOMAIN);

            for (const port of filterPort) {
              for (const protocol of filterVPN) {
                if (result.length >= filterLimit) break;

                uri.protocol = protocol;
                uri.port = port.toString();
                if (protocol == "ss") {
                  uri.username = btoa(`none:${uuid}`);
                  uri.searchParams.set(
                    "plugin",
                    `${atob(v2)}-plugin${port == 80 ? "" : ";tls"};mux=0;mode=websocket;path=/Free-VPN-Geo-Project/${prx.prxIP}-${
                      prx.prxPort
                    };host=${APP_DOMAIN}`
                  );
                } else {
                  uri.username = uuid;
                }

                uri.searchParams.set("security", port == 443 ? "tls" : "none");
                uri.searchParams.set("sni", port == 80 && protocol == atob(flash) ? "" : APP_DOMAIN);
                uri.searchParams.set("path", `/Free-VPN-Geo-Project/${prx.prxIP}-${prx.prxPort}`);

                uri.hash = `${result.length + 1} ${getFlagEmoji(prx.country)} ${prx.org} WS ${
                  port == 443 ? "TLS" : "NTLS"
                } [${serviceName}]`;
                result.push(uri.toString());
              }
            }
          }

          let finalResult = "";
          switch (filterFormat) {
            case "raw":
              finalResult = result.join("\n");
              break;
            case atob(v2):
              finalResult = btoa(result.join("\n"));
              break;
            case atob(neko):
            case "clash":
            case "sfa":
            case "bfr":
              const res = await fetch(CONVERTER_URL, {
                method: "POST",
                body: JSON.stringify({
                  url: result.join(","),
                  format: filterFormat,
                  template: "cf",
                }),
              });
              if (res.status == 200) {
                finalResult = await res.text();
              } else {
                return new Response(res.statusText, {
                  status: res.status,
                  headers: {
                    ...CORS_HEADER_OPTIONS,
                  },
                });
              }
              break;
          }

          return new Response(finalResult, {
            status: 200,
            headers: {
              ...CORS_HEADER_OPTIONS,
            },
          });
        } else if (apiPath.startsWith("/myip")) {
          return new Response(
            JSON.stringify({
              ip:
                request.headers.get("cf-connecting-ipv6") ||
                request.headers.get("cf-connecting-ip") ||
                request.headers.get("x-real-ip"),
              colo: request.headers.get("cf-ray")?.split("-")[1],
              ...request.cf,
            }),
            {
              headers: {
                ...CORS_HEADER_OPTIONS,
              },
            }
          );
        }
      }

      const targetReversePrx = env.REVERSE_PRX_TARGET || "example.com";
      return await reverseWeb(request, targetReversePrx);
    } catch (err) {
      return new Response(`An error occurred: ${err.toString()}`, {
        status: 500,
        headers: {
          ...CORS_HEADER_OPTIONS,
        },
      });
    }
  },
};

async function websocketHandler(request) {
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
  let isDNS = false;

  readableWebSocketStream
    .pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          if (isDNS) {
            return handleUDPOutbound(DNS_SERVER_ADDRESS, DNS_SERVER_PORT, chunk, webSocket, null, log);
          }
          if (remoteSocketWrapper.value) {
            const writer = remoteSocketWrapper.value.writable.getWriter();
            await writer.write(chunk);
            writer.releaseLock();
            return;
          }

          const protocol = await protocolSniffer(chunk);
          let protocolHeader;

          if (protocol === atob(horse)) {
            protocolHeader = readHorseHeader(chunk);
          } else if (protocol === atob(flash)) {
            protocolHeader = readFlashHeader(chunk);
          } else if (protocol === "ss") {
            protocolHeader = readSsHeader(chunk);
          } else {
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
              // return handleUDPOutbound(protocolHeader.addressRemote, protocolHeader.portRemote, chunk, webSocket, protocolHeader.version, log);
              throw new Error("UDP only support for DNS port 53");
            }
          }

          if (isDNS) {
            return handleUDPOutbound(
              DNS_SERVER_ADDRESS,
              DNS_SERVER_PORT,
              chunk,
              webSocket,
              protocolHeader.version,
              log
            );
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
    const horseDelimiter = new Uint8Array(buffer.slice(56, 60));
    if (horseDelimiter[0] === 0x0d && horseDelimiter[1] === 0x0a) {
      if (horseDelimiter[2] === 0x01 || horseDelimiter[2] === 0x03 || horseDelimiter[2] === 0x7f) {
        if (horseDelimiter[3] === 0x01 || horseDelimiter[3] === 0x03 || horseDelimiter[3] === 0x04) {
          return atob(horse);
        }
      }
    }
  }

  const flashDelimiter = new Uint8Array(buffer.slice(1, 17));
  // Hanya mendukung UUID v4
  if (arrayBufferToHex(flashDelimiter).match(/^[0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}$/i)) {
    return atob(flash);
  }

  return "ss"; // default
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
      prxIP.split(/[:=-]/)[0] || addressRemote,
      prxIP.split(/[:=-]/)[1] || portRemote
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

async function handleUDPOutbound(targetAddress, targetPort, udpChunk, webSocket, responseHeader, log) {
  try {
    let protocolHeader = responseHeader;
    const tcpSocket = connect({
      hostname: targetAddress,
      port: targetPort,
    });

    log(`Connected to ${targetAddress}:${targetPort}`);

    const writer = tcpSocket.writable.getWriter();
    await writer.write(udpChunk);
    writer.releaseLock();

    await tcpSocket.readable.pipeTo(
      new WritableStream({
        async write(chunk) {
          if (webSocket.readyState === WS_READY_STATE_OPEN) {
            if (protocolHeader) {
              webSocket.send(await new Blob([protocolHeader, chunk]).arrayBuffer());
              protocolHeader = null;
            } else {
              webSocket.send(chunk);
            }
          }
        },
        close() {
          log(`UDP connection to ${targetAddress} closed`);
        },
        abort(reason) {
          console.error(`UDP connection to ${targetPort} aborted due to ${reason}`);
        },
      })
    );
  } catch (e) {
    console.error(`Error while handling UDP outbound, error ${e.message}`);
  }
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

function readSsHeader(ssBuffer) {
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
        message: `Invalid addressType for SS: ${addressType}`,
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

function readFlashHeader(buffer) {
  const version = new Uint8Array(buffer.slice(0, 1));
  let isUDP = false;

  const optLength = new Uint8Array(buffer.slice(17, 18))[0];

  const cmd = new Uint8Array(buffer.slice(18 + optLength, 18 + optLength + 1))[0];
  if (cmd === 1) {
  } else if (cmd === 2) {
    isUDP = true;
  } else {
    return {
      hasError: true,
      message: `command ${cmd} is not supported`,
    };
  }
  const portIndex = 18 + optLength + 1;
  const portBuffer = buffer.slice(portIndex, portIndex + 2);
  const portRemote = new DataView(portBuffer).getUint16(0);

  let addressIndex = portIndex + 2;
  const addressBuffer = new Uint8Array(buffer.slice(addressIndex, addressIndex + 1));

  const addressType = addressBuffer[0];
  let addressLength = 0;
  let addressValueIndex = addressIndex + 1;
  let addressValue = "";
  switch (addressType) {
    case 1: // For IPv4
      addressLength = 4;
      addressValue = new Uint8Array(buffer.slice(addressValueIndex, addressValueIndex + addressLength)).join(".");
      break;
    case 2: // For Domain
      addressLength = new Uint8Array(buffer.slice(addressValueIndex, addressValueIndex + 1))[0];
      addressValueIndex += 1;
      addressValue = new TextDecoder().decode(buffer.slice(addressValueIndex, addressValueIndex + addressLength));
      break;
    case 3: // For IPv6
      addressLength = 16;
      const dataView = new DataView(buffer.slice(addressValueIndex, addressValueIndex + addressLength));
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
    rawClientData: buffer.slice(addressValueIndex + addressLength),
    version: new Uint8Array([version[0], 0]),
    isUDP: isUDP,
  };
}

function readHorseHeader(buffer) {
  const dataBuffer = buffer.slice(58);
  if (dataBuffer.byteLength < 6) {
    return {
      hasError: true,
      message: "invalid request data",
    };
  }

  let isUDP = false;
  const view = new DataView(dataBuffer);
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
      addressValue = new Uint8Array(dataBuffer.slice(addressValueIndex, addressValueIndex + addressLength)).join(".");
      break;
    case 3: // For Domain
      addressLength = new Uint8Array(dataBuffer.slice(addressValueIndex, addressValueIndex + 1))[0];
      addressValueIndex += 1;
      addressValue = new TextDecoder().decode(dataBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
      break;
    case 4: // For IPv6
      addressLength = 16;
      const dataView = new DataView(dataBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
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
  const portBuffer = dataBuffer.slice(portIndex, portIndex + 2);
  const portRemote = new DataView(portBuffer).getUint16(0);
  return {
    hasError: false,
    addressRemote: addressValue,
    addressType: addressType,
    portRemote: portRemote,
    rawDataIndex: portIndex + 4,
    rawClientData: dataBuffer.slice(portIndex + 4),
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

function safeCloseWebSocket(socket) {
  try {
    if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
      socket.close();
    }
  } catch (error) {
    console.error("safeCloseWebSocket error", error);
  }
}

async function checkPrxHealth(prxIP, prxPort) {
  const req = await fetch(`${PRX_HEALTH_CHECK_API}?ip=${prxIP}:${prxPort}`);
  return await req.json();
}

// Helpers
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

function shuffleArray(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
}

function reverse(s) {
  return s.split("").reverse().join("");
}

function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
}

function getFlagEmoji(isoCode) {
  const codePoints = isoCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

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
    };
  }

  async getDomainList() {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountID}/workers/domains`;
    const res = await fetch(url, {
      headers: {
        ...this.headers,
      },
    });

    if (res.status == 200) {
      const respJson = await res.json();

      return respJson.result.filter((data) => data.service == serviceName).map((data) => data.hostname);
    }

    return [];
  }

  async registerDomain(domain) {
    domain = domain.toLowerCase();
    const registeredDomains = await this.getDomainList();

    if (!domain.endsWith(rootDomain)) return 400;
    if (registeredDomains.includes(domain)) return 409;

    try {
      const domainTest = await fetch(`https://${domain.replaceAll("." + APP_DOMAIN, "")}`);
      if (domainTest.status == 530) return domainT
    } catch (e) {
      // console.log(e);
      // It's fine
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountID}/workers/domains`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hostname: domain,
        service: serviceName,
        zone_id: this.zoneID,
      }),
    });

    return res.status;
  }
}
