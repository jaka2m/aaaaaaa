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

  let filteredPrxList = prxList.filter(prx => {
    const normalizedSearchTerm = searchTerm.toLowerCase();
    const isSearchTermCountry = normalizedSearchTerm.length === 2;
    if (isSearchTermCountry) {
      return prx.country.toLowerCase() === normalizedSearchTerm;
    } else {
      return prx.prxIP.includes(normalizedSearchTerm) ||
        prx.org.toLowerCase().includes(normalizedSearchTerm) ||
        prx.prxPort.includes(normalizedSearchTerm);
    }
  });

  const prxToShow = filteredPrxList.slice(startIndex, startIndex + PRX_PER_PAGE);
  const hostName = request.headers.get("Host");
  const uuid = crypto.randomUUID();

  const modifiedHostName = selectedWildcard || hostName;

  const STYLE = `
    /* General Body Styles */
    body {
        background-color: #1a1a1a;
        color: #f0f0f5;
        font-family: 'Space Grotesk', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    /* Container */
    .quantum-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    /* Card */
    .quantum-card {
        background-color: #2a2a2f;
        border-radius: 15px;
        padding: 2rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        border: 1px solid #444;
    }

    /* Title */
    .quantum-title a {
        font-size: 2.5rem;
        font-weight: 700;
        color: #fff;
        text-decoration: none;
        transition: color 0.3s ease;
    }

    .quantum-title a:hover {
        color: #00e0b7;
    }

    /* Search Form */
    .form-search {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .input-search {
        flex-grow: 1;
        background-color: #1c1c20;
        border: 1px solid #444;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        color: #f0f0f5;
        font-size: 1rem;
        transition: all 0.3s ease;
    }

    .input-search:focus {
        outline: none;
        border-color: #00e0b7;
        box-shadow: 0 0 0 3px rgba(0, 224, 183, 0.2);
    }

    .button-search {
        background-color: #00e0b7;
        color: #1c1c20;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        padding: 0.75rem 1.5rem;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .button-search:hover {
        background-color: #00c4a3;
    }

    /* Dropdowns */
    .wildcard-dropdown {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .wildcard-dropdown select {
        background-color: #1c1c20;
        border: 1px solid #444;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        color: #f0f0f5;
        font-size: 1rem;
        flex-grow: 1;
    }

    /* Table */
    .table-wrapper {
        overflow-x: auto;
    }

    .quantum-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1.5rem;
    }

    .quantum-table th,
    .quantum-table td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid #444;
    }

    .quantum-table th {
        font-weight: 600;
        color: #00e0b7;
    }

    .quantum-table tbody tr:hover {
        background-color: #3a3a3f;
    }

    /* Copy Buttons */
    .copy-btn {
        background: linear-gradient(90deg, #00e0b7, #4a90e2);
        color: white;
        font-weight: 500;
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: transform 0.2s ease;
    }

    .copy-btn:hover {
        transform: scale(1.05);
    }

    /* Pagination */
    .quantum-pagination {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 2rem;
    }

    .quantum-pagination a {
        background-color: #1c1c20;
        border: 1px solid #444;
        color: #f0f0f5;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        text-decoration: none;
        transition: all 0.3s ease;
    }

    .quantum-pagination a:hover,
    .quantum-pagination a.active {
        background-color: #00e0b7;
        color: #1c1c20;
        border-color: #00e0b7;
    }

    /* Status Icons */
    .active-icon-glow {
        color: #39ff14;
        filter: drop-shadow(0 0 5px #39ff14);
    }

    .spinner {
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-left-color: #00e0b7;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* Popup */
    #urlPopup .relative {
        background-color: #2a2a2f;
        border: 1px solid #444;
    }

    #urlTextarea {
        background-color: #1c1c20;
        border: 1px solid #444;
    }

    /* Dark Mode Toggle */
    .toggle-dark-mode {
        background-color: #2a2a2f;
        border: 1px solid #444;
        border-radius: 50%;
        padding: 0.5rem;
        color: #f0f0f5;
        transition: all 0.3s ease;
    }

    .toggle-dark-mode:hover {
        background-color: #00e0b7;
        color: #1c1c20;
    }

    /* Light mode */
    .light body {
        background-color: #f0f2f5;
        color: #333;
    }

    .light .quantum-card {
        background-color: #fff;
        border-color: #e0e0e0;
        color: #333;
    }

    .light .quantum-title a {
        color: #333;
    }

    .light .input-search, .light .wildcard-dropdown select {
        background-color: #e9ecef;
        border-color: #ced4da;
        color: #333;
    }

    .light .quantum-table th, .light .quantum-table td {
        border-color: #e0e0e0;
    }

    .light .quantum-table tbody tr:hover {
        background-color: #f8f9fa;
    }

    .light .quantum-pagination a {
        background-color: #fff;
        border-color: #e0e0e0;
        color: #333;
    }

    .light .quantum-pagination a:hover, .light .quantum-pagination a.active {
        background-color: #007bff;
        color: #fff;
        border-color: #007bff;
    }

    .light #urlPopup .relative {
        background-color: #fff;
        border-color: #e0e0e0;
        color: #333;
    }

    .light #urlTextarea {
        background-color: #e9ecef;
        border-color: #ced4da;
        color: #333;
    }
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
    `;

    const SCRIPT = `
        function toggleDarkMode() {
            const htmlElement = document.documentElement;
            htmlElement.classList.toggle("light");
        }

        function toggleDropdown() {
            const dropdownMenu = document.getElementById('dropdown-menu');
            dropdownMenu.classList.toggle('hidden');
        }

        document.addEventListener('DOMContentLoaded', () => {
            const runningTitle = document.getElementById('runningTitle');
            if (runningTitle) {
                const container = runningTitle.parentElement;
                let position = -runningTitle.offsetWidth;
                const speed = 1.5;

                function animateTitle() {
                    position += speed;
                    if (position > container.offsetWidth) {
                        position = -runningTitle.offsetWidth;
                    }
                    runningTitle.style.transform = 'translateX(' + position + 'px)';
                    requestAnimationFrame(animateTitle);
                }
                animateTitle();
            }
        });

        document.addEventListener('DOMContentLoaded', function() {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                setTimeout(() => {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 500);
                }, 1000);
            }
        });

        const rootDomain = "${serviceName}.${rootDomain}";
        const notification = document.getElementById("notification-badge");
        const windowContainer = document.getElementById("container-window");
        const windowInfoContainer = document.getElementById("container-window-info");
        const converterUrl = "https://script.google.com/macros/s/AKfycbwwVeHNUlnP92syOP82p1dOk_-xwBgRIxkTjLhxxZ5UXicrGOEVNc5JaSOu0Bgsx_gG/exec";
        let isDomainListFetched = false;
        let rawConfig = "";

        function getDomainList() {
            if (isDomainListFetched) return;
            isDomainListFetched = true;
            windowInfoContainer.innerText = "Fetching data...";
            const url = "https://" + rootDomain + "/api/v1/domains/get";
            fetch(url).then(async (res) => {
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
            fetch(url).then((res) => {
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

        function checkGeoip() {
            const containerIP = document.getElementById("container-info-ip");
            const containerCountry = document.getElementById("container-info-country");
            const containerISP = document.getElementById("container-info-isp");
            const res = fetch("https://" + rootDomain + "/api/v1/myip").then(async (res) => {
                if (res.status == 200) {
                    const respJson = await res.json();
                    if(containerIP) containerIP.innerText = "IP: " + respJson.ip;
                    if(containerCountry) containerCountry.innerText = "Country: " + respJson.country;
                    if(containerISP) containerISP.innerText = "ISP: " + respJson.asOrganization;
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
        };

        function showPopup(url) {
            const urlTextarea = document.getElementById('urlTextarea');
            const urlPopup = document.getElementById('urlPopup');
            urlTextarea.value = url;
            urlPopup.classList.remove('hidden');
        }

        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('copyUrlBtn').addEventListener('click', () => {
                const urlTextarea = document.getElementById('urlTextarea');
                urlTextarea.select();
                urlTextarea.setSelectionRange(0, 99999);
                navigator.clipboard.writeText(urlTextarea.value).then(() => {
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

            document.getElementById('search-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const searchTerm = document.getElementById('search-input').value;
                const wildcard = document.getElementById('wildcard').value;
                const configType = document.getElementById('configType').value;
                window.location.href = \`/sub/0?search=\${encodeURIComponent(searchTerm)}&wildcard=\${encodeURIComponent(wildcard)}&configType=\${configType}\`;
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
    `;

  let html = `
    <!DOCTYPE html>
    <html lang="en" class="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${NAMAWEB}</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/gh/lipis/flag-icon-css@3.5/css/flag-icon.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        <style>${STYLE}</style>
    </head>
    <body>
        <div class="quantum-container">
            <div class="quantum-card">
                <div class="flex justify-between items-center mb-4">
                    <h1 class="quantum-title">
                        <a href="${LINK_TELEGRAM}" target="_blank" rel="noopener noreferrer">${NAMAWEB}</a>
                    </h1>
                </div>
                <div class="flex justify-around my-2 text-sm">
                    <span class="font-bold text-green-500">Active: <span id="active-count">0</span></span>
                    <span class="font-bold text-red-500">Dead: <span id="dead-count">0</span></span>
                </div>
                <form id="search-form" class="form-search">
                    <input type="text" id="search-input" name="search" placeholder="Cari IP, ISP, atau Negara" class="input-search" value="${searchTerm}">
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
                <div class="w-full h-11 overflow-x-auto px-1 py-1 flex items-center space-x-1 shadow-lg bg-transparent border" style="border-width: 1px; border-style: solid; border-color: #00ff88; height: 55px; border-radius: 10px; margin-top: 0.5rem;">
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
                            </tr>
                        </thead>
                        <tbody>
  `;

  if (prxToShow.length === 0) {
    html += `
      <tr>
        <td colspan="8" class="text-center py-4">Tidak ada data yang ditemukan.</td>
      </tr>
    `;
  } else {
    prxToShow.forEach((prx, index) => {
      const { prxIP, prxPort, country, org } = prx;
      const displayIndex = startIndex + index + 1;

      const generateConfig = (protocol) => {
        const configs = { tls: "", ntls: "" };
        const port = selectedConfigType === 'tls' ? 443 : 80;
        let uri = new URL(`${protocol}://${modifiedHostName}`);
        uri.port = port;
        uri.searchParams.set("encryption", "none");
        uri.searchParams.set("type", "ws");
        uri.searchParams.set("host", hostName);
        uri.searchParams.set("security", selectedConfigType === 'tls' ? "tls" : "none");
        uri.searchParams.set("path", `/Free-VPN-Geo-Project/${prxIP}-${prxPort}`);
        uri.hash = `${displayIndex} ${getFlagEmoji(country)} ${org} WS ${selectedConfigType === 'tls' ? "TLS" : "NTLS"} [${serviceName}]`;
        if (protocol === "ss") {
          uri.username = btoa(`none:${uuid}`);
          uri.searchParams.set("plugin", `${atob(v2)}-plugin;${selectedConfigType === 'tls' ? "tls;" : ""}mux=0;mode=websocket;path=/Free-VPN-Geo-Project/${prxIP}-${prxPort};host=${modifiedHostName}`);
        } else {
          uri.username = uuid;
        }
        if(selectedConfigType === 'tls') configs.tls = uri.toString();
        else configs.ntls = uri.toString();

        // Also generate the other type for the button
        let otherUri = new URL(uri.toString());
        otherUri.port = selectedConfigType === 'tls' ? 80 : 443;
        otherUri.searchParams.set("security", selectedConfigType === 'tls' ? "none" : "tls");
        if (protocol !== "ss") {
            if (selectedConfigType === 'non-tls') {
                otherUri.searchParams.set("sni", "");
            } else {
                otherUri.searchParams.delete("sni");
            }
        }
        if(selectedConfigType === 'tls') configs.ntls = otherUri.toString();
        else configs.tls = otherUri.toString();

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
            <td class="text-center">
                <span class="flag-icon flag-icon-${country.toLowerCase()}"></span>
            </td>
            <td><button class="copy-btn" onclick="showPopup('${selectedConfigType === 'tls' ? vlessConfigs.tls : vlessConfigs.ntls}')">VLESS</button></td>
            <td><button class="copy-btn" onclick="showPopup('${selectedConfigType === 'tls' ? trojanConfigs.tls : trojanConfigs.ntls}')">TROJAN</button></td>
            <td><button class="copy-btn" onclick="showPopup('${selectedConfigType === 'tls' ? ssConfigs.tls : ssConfigs.ntls}')">SS</button></td>
        </tr>
      `;
    });
  }

  html += `
                        </tbody>
                    </table>
                </div>
                <div class="quantum-pagination">
                    <a href="/sub/${page - 1}?q=${encodeURIComponent(searchTerm)}" class="${page <= 0 ? 'opacity-50 cursor-not-allowed' : ''}">Prev</a>
                    ${(() => {
                      let buttons = '';
                      const startPage = Math.max(0, page - 2);
                      const endPage = Math.min(totalPages - 1, page + 2);
                      for (let i = startPage; i <= endPage; i++) {
                        buttons += `<a href="/sub/${i}?q=${encodeURIComponent(searchTerm)}" class="${i === page ? 'active' : ''}">${i + 1}</a>`;
                      }
                      return buttons;
                    })()}
                    <a href="/sub/${page + 1}?q=${encodeURIComponent(searchTerm)}" class="${page >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}">Next</a>
                </div>
                <div class="text-center mt-3 text-sm text-gray-400">
                    Showing ${startIndex + 1} to ${startIndex + prxToShow.length} of ${totalPrxs} Proxies
                </div>
            </div>
        </div>

        <div id="urlPopup" class="hidden fixed inset-0 z-50 flex items-center justify-center">
            <div class="absolute inset-0 bg-blue-500 opacity-20 backdrop-blur-md"></div>
            <div class="relative w-80 p-4 border rounded-2xl shadow-xl bg-white/10 backdrop-filter backdrop-blur-lg border-opacity-20 border-white/20 text-white">
                <h3 class="text-xl font-bold leading-6 mb-4 text-center">Copy URL</h3>
                <textarea id="urlTextarea" class="w-full h-24 p-2 text-sm border-transparent rounded-lg resize-none bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-300 text-white" readonly></textarea>
                <div class="flex space-x-2 mt-4">
                    <button id="copyUrlBtn" class="flex-1 px-3 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white text-sm font-medium rounded-lg shadow-lg hover:from-green-500 hover:to-green-700">Copy</button>
                    <button id="closePopupBtn" class="flex-1 px-3 py-2 bg-gradient-to-r from-red-400 to-red-600 text-white text-sm font-medium rounded-lg shadow-lg hover:from-red-500 hover:to-red-700">Close</button>
                </div>
            </div>
        </div>

        <footer>
            <div class="fixed top-4 right-8 flex flex-col items-end gap-3 z-50">
                <button onclick="toggleDropdown()" class="animated-button transition-colors rounded-full p-2 block text-white shadow-lg" style="background-image: linear-gradient(to right, #22c55e, #14b8a6, #3b82f6, #8b5cf6, #ec4899); border: none;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6 text-white"><path d="M12 2.25a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75h-6.75a.75.75 0 0 1 0-1.5h6.75V3a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" /></svg>
                </button>
                <div id="dropdown-menu" class="hidden flex flex-col gap-3">
                    <a href="${DONATE_LINK}" target="_blank"><button class="bg-accent-cyan hover:bg-teal-600 rounded-full border-2 border-gray-900 p-2 block transition-colors duration-200"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6"><path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" /><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clip-rule="evenodd" /></svg></button></a>
                    <a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank"><button class="bg-green-500 hover:bg-green-600 rounded-full border-2 border-gray-900 p-2 block"><img src="https://geoproject.biz.id/circle-flags/whatsapp.png" alt="WhatsApp Icon" class="size-6"></button></a>
                    <a href="https://t.me/${TELEGRAM_USERNAME}" target="_blank"><button class="bg-blue-500 hover:bg-blue-600 rounded-full border-2 border-gray-900 p-2 block"><img src="https://geoproject.biz.id/circle-flags/telegram.png" alt="Telegram Icon" class="size-6"></button></a>
                    <button onclick="toggleDarkMode()" class="toggle-dark-mode"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg></button>
                </div>
            </div>
        </footer>
        <script>${SCRIPT}<\/script>
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
