import { connect } from "cloudflare:sockets";

// Variables
const rootDomain = "gpj2.dpdns.org"; // Ganti dengan domain utama kalian
const serviceName = "tes"; // Ganti dengan nama workers kalian
const apiKey = "e1d2b64d4da5e42f24c88535f12f21bc84d06"; // Ganti dengan Global API key kalian (https://dash.cloudflare.com/profile/api-tokens)
const apiEmail = "paoandest@gmail.com"; // Ganti dengan email yang kalian gunakan
const accountID = "723b4d7d922c6af940791b5624a7cb05"; // Ganti dengan Account ID kalian (https://dash.cloudflare.com -> Klik domain yang kalian gunakan)
const zoneID = "143d6f80528eae02e7a909f85e5320ab"; // Ganti dengan Zone ID kalian (https://dash.cloudflare.com -> Klik domain yang kalian gunakan)
const ownerPassword = ".";
let isApiReady = false;
let prxIP = "";
let cachedPrxList = [];

// Constant
const WHATSAPP_NUMBER = "082339191527";
const TELEGRAM_USERNAME = "sampiiii";

function reverse(s) {
  return s.split("").reverse().join("");
}

const COUNTRY_CODE_TO_NAME = {
    "AF": "Afghanistan",
    "AX": "Åland Islands",
    "AL": "Albania",
    "DZ": "Algeria",
    "AS": "American Samoa",
    "AD": "Andorra",
    "AO": "Angola",
    "AI": "Anguilla",
    "AQ": "Antarctica",
    "AG": "Antigua and Barbuda",
    "AR": "Argentina",
    "AM": "Armenia",
    "AW": "Aruba",
    "AU": "Australia",
    "AT": "Austria",
    "AZ": "Azerbaijan",
    "BS": "Bahamas",
    "BH": "Bahrain",
    "BD": "Bangladesh",
    "BB": "Barbados",
    "BY": "Belarus",
    "BE": "Belgium",
    "BZ": "Belize",
    "BJ": "Benin",
    "BM": "Bermuda",
    "BT": "Bhutan",
    "BO": "Bolivia",
    "BA": "Bosnia and Herzegovina",
    "BW": "Botswana",
    "BV": "Bouvet Island",
    "BR": "Brazil",
    "IO": "British Indian Ocean Territory",
    "BN": "Brunei Darussalam",
    "BG": "Bulgaria",
    "BF": "Burkina Faso",
    "BI": "Burundi",
    "KH": "Cambodia",
    "CM": "Cameroon",
    "CA": "Canada",
    "CV": "Cape Verde",
    "KY": "Cayman Islands",
    "CF": "Central African Republic",
    "TD": "Chad",
    "CL": "Chile",
    "CN": "China",
    "CX": "Christmas Island",
    "CC": "Cocos (Keeling) Islands",
    "CO": "Colombia",
    "KM": "Comoros",
    "CG": "Congo",
    "CD": "Congo, The Democratic Republic of the",
    "CK": "Cook Islands",
    "CR": "Costa Rica",
    "CI": "Cote D'Ivoire",
    "HR": "Croatia",
    "CU": "Cuba",
    "CY": "Cyprus",
    "CZ": "Czech Republic",
    "DK": "Denmark",
    "DJ": "Djibouti",
    "DM": "Dominica",
    "DO": "Dominican Republic",
    "EC": "Ecuador",
    "EG": "Egypt",
    "SV": "El Salvador",
    "GQ": "Equatorial Guinea",
    "ER": "Eritrea",
    "EE": "Estonia",
    "ET": "Ethiopia",
    "FK": "Falkland Islands (Malvinas)",
    "FO": "Faroe Islands",
    "FJ": "Fiji",
    "FI": "Finland",
    "FR": "France",
    "GF": "French Guiana",
    "PF": "French Polynesia",
    "TF": "French Southern Territories",
    "GA": "Gabon",
    "GM": "Gambia",
    "GE": "Georgia",
    "DE": "Germany",
    "GH": "Ghana",
    "GI": "Gibraltar",
    "GR": "Greece",
    "GL": "Greenland",
    "GD": "Grenada",
    "GP": "Guadeloupe",
    "GU": "Guam",
    "GT": "Guatemala",
    "GG": "Guernsey",
    "GN": "Guinea",
    "GW": "Guinea-Bissau",
    "GY": "Guyana",
    "HT": "Haiti",
    "HM": "Heard Island and Mcdonald Islands",
    "VA": "Holy See (Vatican City State)",
    "HN": "Honduras",
    "HK": "Hong Kong",
    "HU": "Hungary",
    "IS": "Iceland",
    "IN": "India",
    "ID": "Indonesia",
    "IR": "Iran, Islamic Republic Of",
    "IQ": "Iraq",
    "IE": "Ireland",
    "IM": "Isle of Man",
    "IL": "Israel",
    "IT": "Italy",
    "JM": "Jamaica",
    "JP": "Japan",
    "JE": "Jersey",
    "JO": "Jordan",
    "KZ": "Kazakhstan",
    "KE": "Kenya",
    "KI": "Kiribati",
    "KP": "Korea, Democratic People's Republic of",
    "KR": "Korea, Republic of",
    "KW": "Kuwait",
    "KG": "Kyrgyzstan",
    "LA": "Lao People's Democratic Republic",
    "LV": "Latvia",
    "LB": "Lebanon",
    "LS": "Lesotho",
    "LR": "Liberia",
    "LY": "Libyan Arab Jamahiriya",
    "LI": "Liechtenstein",
    "LT": "Lithuania",
    "LU": "Luxembourg",
    "MO": "Macao",
    "MK": "Macedonia, The Former Yugoslav Republic of",
    "MG": "Madagascar",
    "MW": "Malawi",
    "MY": "Malaysia",
    "MV": "Maldives",
    "ML": "Mali",
    "MT": "Malta",
    "MH": "Marshall Islands",
    "MQ": "Martinique",
    "MR": "Mauritania",
    "MU": "Mauritius",
    "YT": "Mayotte",
    "MX": "Mexico",
    "FM": "Micronesia, Federated States of",
    "MD": "Moldova, Republic of",
    "MC": "Monaco",
    "MN": "Mongolia",
    "MS": "Montserrat",
    "MA": "Morocco",
    "MZ": "Mozambique",
    "MM": "Myanmar",
    "NA": "Namibia",
    "NR": "Nauru",
    "NP": "Nepal",
    "NL": "Netherlands",
    "AN": "Netherlands Antilles",
    "NC": "New Caledonia",
    "NZ": "New Zealand",
    "NI": "Nicaragua",
    "NE": "Niger",
    "NG": "Nigeria",
    "NU": "Niue",
    "NF": "Norfolk Island",
    "MP": "Northern Mariana Islands",
    "NO": "Norway",
    "OM": "Oman",
    "PK": "Pakistan",
    "PW": "Palau",
    "PS": "Palestinian Territory, Occupied",
    "PA": "Panama",
    "PG": "Papua New Guinea",
    "PY": "Paraguay",
    "PE": "Peru",
    "PH": "Philippines",
    "PN": "Pitcairn",
    "PL": "Poland",
    "PT": "Portugal",
    "PR": "Puerto Rico",
    "QA": "Qatar",
    "RE": "Reunion",
    "RO": "Romania",
    "RU": "Russian Federation",
    "RW": "Rwanda",
    "SH": "Saint Helena",
    "KN": "Saint Kitts and Nevis",
    "LC": "Saint Lucia",
    "PM": "Saint Pierre and Miquelon",
    "VC": "Saint Vincent and the Grenadines",
    "WS": "Samoa",
    "SM": "San Marino",
    "ST": "Sao Tome and Principe",
    "SA": "Saudi Arabia",
    "SN": "Senegal",
    "CS": "Serbia and Montenegro",
    "SC": "Seychelles",
    "SL": "Sierra Leone",
    "SG": "Singapore",
    "SK": "Slovakia",
    "SI": "Slovenia",
    "SB": "Solomon Islands",
    "SO": "Somalia",
    "ZA": "South Africa",
    "GS": "South Georgia and the South Sandwich Islands",
    "ES": "Spain",
    "LK": "Sri Lanka",
    "SD": "Sudan",
    "SR": "Suriname",
    "SJ": "Svalbard and Jan Mayen",
    "SZ": "Swaziland",
    "SE": "Sweden",
    "CH": "Switzerland",
    "SY": "Syrian Arab Republic",
    "TW": "Taiwan, Province of China",
    "TJ": "Tajikistan",
    "TZ": "Tanzania, United Republic of",
    "TH": "Thailand",
    "TL": "Timor-Leste",
    "TG": "Togo",
    "TK": "Tokelau",
    "TO": "Tonga",
    "TT": "Trinidad and Tobago",
    "TN": "Tunisia",
    "TR": "Turkey",
    "TM": "Turkmenistan",
    "TC": "Turks and Caicos Islands",
    "TV": "Tuvalu",
    "UG": "Uganda",
    "UA": "Ukraine",
    "AE": "United Arab Emirates",
    "GB": "United Kingdom",
    "US": "United States",
    "UM": "United States Minor Outlying Islands",
    "UY": "Uruguay",
    "UZ": "Uzbekistan",
    "VU": "Vanuatu",
    "VE": "Venezuela",
    "VN": "Viet Nam",
    "VG": "Virgin Islands, British",
    "VI": "Virgin Islands, U.S.",
    "WF": "Wallis and Futuna",
    "EH": "Western Sahara",
    "YE": "Yemen",
    "ZM": "Zambia",
    "ZW": "Zimbabwe"
};

const APP_DOMAIN = `${serviceName}.${rootDomain}`;
const PORTS = [443, 80];
const PROTOCOLS = [reverse("najort"), reverse("sselv"), "ss"];
const PRX_BANK_URL = "https://raw.githubusercontent.com/jaka2m/botak/refs/heads/main/cek/proxyList.txt";
const DOH_URL = "https://1.1.1.1/dns-query";
const PRX_HEALTH_CHECK_API = "https://geovpn.vercel.app/check";
const CONVERTER_URL = "https://api.foolvpn.me/convert";
const DONATE_LINK = "https://github.com/jaka1m/project/raw/main/BAYAR.jpg";
const BAD_WORDS_LIST =
  "https://gist.githubusercontent.com/adierebel/a69396d79b787b84d89b45002cb37cd6/raw/6df5f8728b18699496ad588b3953931078ab9cf1/kata-kasar.txt";
const PRX_PER_PAGE = 24;
const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;
const CORS_HEADER_OPTIONS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
};

async function getKVPrxList(kvPrxUrl) {
  if (!kvPrxUrl) {
    return {};
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
        const [prxIP, prxPort, country, org] = entry.split(",").map(item => item.trim());
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

async function generateSubscription(
  {
    countryCodes = [],
    limit = 10,
    vpnType = null,
    ports = null,
    bug = null,
    useWildcard = false,
    prxBankUrl = null,
    domain = null
  }
) {
    const filterVPN = vpnType ? (Array.isArray(vpnType) ? vpnType : [vpnType]) : PROTOCOLS;
    const filterPort = ports || PORTS;
    const filterCC = countryCodes;
    const filterLimit = limit;
    
    const baseDomain = domain || APP_DOMAIN;
    const effectiveHost = useWildcard && bug ? `${bug}.${baseDomain}` : baseDomain;

    const prxList = await getPrxList(prxBankUrl || PRX_BANK_URL)
        .then((prxs) => {
          if (filterCC.length) {
            return prxs.filter((prx) => filterCC.includes(prx.country));
          }
          return prxs;
        })
        .then((prxs) => {
          shuffleArray(prxs);
          return prxs;
        });

    const uuid = crypto.randomUUID();
    const result = [];
    for (const prx of prxList) {
        const address = bug || prx.prxIP;
        const uri = new URL(`${reverse("najort")}://${address}`);
        uri.searchParams.set("encryption", "none");
        uri.searchParams.set("type", "ws");
        uri.searchParams.set("host", effectiveHost);

        for (const port of filterPort) {
          for (const protocol of filterVPN) {
            if (result.length >= filterLimit) break;

            uri.protocol = protocol;
            uri.port = port.toString();
            if (protocol == "ss") {
              uri.username = btoa(`none:${uuid}`);
              uri.searchParams.set(
                "plugin",
                `${reverse("yar2v")}-plugin${port == 80 ? "" : ";tls"};mux=0;mode=websocket;path=/Free-VPN-Geo-Project/${prx.prxIP}-${
                  prx.prxPort
                };host=${effectiveHost}`
              );
            } else {
              uri.username = uuid;
              uri.searchParams.delete("plugin");
            }

            uri.searchParams.set("security", port == 443 ? "tls" : "none");
            uri.searchParams.set("sni", port == 80 && protocol == reverse("sselv") ? "" : effectiveHost);
            uri.searchParams.set("path", `/Free-VPN-Geo-Project/${prx.prxIP}-${prx.prxPort}`);

            uri.hash = `${result.length + 1} ${getFlagEmoji(prx.country)} ${prx.org} WS ${
              port == 443 ? "TLS" : "NTLS"
            } [${serviceName}]`;
            result.push(uri.toString());
          }
          if (result.length >= filterLimit) break;
        }
        if (result.length >= filterLimit) break;
    }
    
    return result;
}

function getAllConfig(request, hostName, prxList, page = 0, selectedProtocol = null, selectedPort = null, wildcardDomains = [], rootDomain) {
    const startIndex = PRX_PER_PAGE * page;
    const totalProxies = prxList.length;
    const totalPages = Math.ceil(totalProxies / PRX_PER_PAGE) || 1;

    try {
        const uuid = crypto.randomUUID();

        const effectiveHost = hostName === APP_DOMAIN ? APP_DOMAIN : `${hostName}.${APP_DOMAIN}`;

        const uri = new URL(`${reverse("najort")}://${hostName}`);
        uri.searchParams.set("encryption", "none");
        uri.searchParams.set("type", "ws");
        uri.searchParams.set("host", effectiveHost);

        const document = new Document(request, wildcardDomains, rootDomain, startIndex);
        document.setTitle("Free Vless Trojan SS");
        document.setTotalProxy(totalProxies);
        document.setPage(page + 1, totalPages);

        for (let i = startIndex; i < startIndex + PRX_PER_PAGE; i++) {
            const prx = prxList[i];
            if (!prx) break;

            const { prxIP, prxPort, country, org } = prx;

            uri.searchParams.set("path", `/Free-VPN-Geo-Project/${prxIP}-${prxPort}`);

            const protocolsToUse = selectedProtocol && selectedProtocol !== 'all' ? [selectedProtocol] : PROTOCOLS;
            const portsToUse = selectedPort && selectedPort !== 'all' ? [parseInt(selectedPort)] : PORTS;

            const prxs = [];
            for (const port of portsToUse) {
                uri.port = port.toString();
                uri.hash = `${i + 1} ${getFlagEmoji(country)} ${org} WS ${port == 443 ? "TLS" : "NTLS"} [${serviceName}]`;
                for (const protocol of protocolsToUse) {
                    if (protocol === "ss") {
                        uri.username = btoa(`none:${uuid}`);
                        uri.searchParams.set(
                            "plugin",
                            `${reverse("yar2v")}-plugin${
                                port == 80 ? "" : ";tls"
                            };mux=0;mode=websocket;path=/Free-VPN-Geo-Project/${prxIP}-${prxPort};host=${effectiveHost}`
                        );
                    } else {
                        uri.username = uuid;
                        uri.searchParams.delete("plugin");
                    }

                    uri.protocol = protocol;
                    uri.searchParams.set("security", port == 443 ? "tls" : "none");
                    uri.searchParams.set("sni", port == 80 && protocol == reverse("sselv") ? "" : effectiveHost);

                    prxs.push(uri.toString());
                }
            }
            document.registerProxies(
                {
                    prxIP,
                    prxPort,
                    country,
                    org,
                },
                prxs
            );
        }

        const showingFrom = totalProxies > 0 ? startIndex + 1 : 0;
        const showingTo = Math.min(startIndex + PRX_PER_PAGE, totalProxies);
        document.setPaginationInfo(`Showing ${showingFrom} to ${showingTo} of ${totalProxies} Proxies`);

        document.addPageButton("Prev", `/sub/${page > 0 ? page - 1 : 0}`, page === 0);
        document.addPageButton("Next", `/sub/${page < totalPages - 1 ? page + 1 : page}`, page >= totalPages - 1);

        return document.build();
    } catch (error) {
        return `An error occurred while generating the ${reverse("sselv").toUpperCase()} configurations. ${error}`;
    }
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const upgradeHeader = request.headers.get("Upgrade");

      if (apiKey && apiEmail && accountID && zoneID) {
        isApiReady = true;
      }

      if (upgradeHeader === "websocket") {
        const prxMatch = url.pathname.match(
          /^\/Free-VPN-Geo-Project\/(.+[:=-]\d+)$/
        );

        if (url.pathname.length == 3 || url.pathname.match(",")) {
          const prxKeys = url.pathname.replace("/", "").toUpperCase().split(",");
          const prxKey = prxKeys[Math.floor(Math.random() * prxKeys.length)];
          const kvPrx = await getKVPrxList(env.KV_PRX_URL);

          prxIP = kvPrx[prxKey][Math.floor(Math.random() * kvPrx[prxKey].length)];
        } else if (prxMatch) {
          prxIP = prxMatch[1];
        } else {
          prxIP = "";
        }
        return await websocketHandler(request);
      }

      if (url.pathname.startsWith("/sub/v2rayng")) {
        const vpnType = url.searchParams.get("type");
        const bug = url.searchParams.get("bug");
        const useTls = url.searchParams.get("tls") === "true";
        const countryCodes = url.searchParams.get("country")?.toUpperCase().split(",");
        const limit = parseInt(url.searchParams.get("limit")) || 10;
        const prxBankUrl = url.searchParams.get("prx-list") || env.PRX_BANK_URL;

        let ports;
        if (url.searchParams.has("tls")) {
            ports = useTls ? [443] : [80];
        } else {
            ports = PORTS;
        }

        const result = await generateSubscription({
            countryCodes: countryCodes || [],
            limit: limit,
            vpnType: vpnType,
            ports: ports,
            bug: bug,
            prxBankUrl: prxBankUrl
        });
        
        return new Response(result.join("\n"), {
            status: 200,
            headers: { ...CORS_HEADER_OPTIONS, "Content-Type": "text/plain;charset=utf-8" },
        });
      } else if (url.pathname.startsWith("/api/v1/sub")) {
        const filterCC = url.searchParams.get("cc")?.split(",") || [];
        const filterPort = url.searchParams.get("port")?.split(",").map(p => parseInt(p)) || PORTS;
        const filterVPN = url.searchParams.get("vpn")?.split(",") || PROTOCOLS;
        const filterLimit = parseInt(url.searchParams.get("limit")) || 10;
        const filterFormat = url.searchParams.get("format") || "raw";
        const bug = url.searchParams.get("bug");
        const useWildcard = url.searchParams.get("wc") === "true";
        const domain = url.searchParams.get("domain") || APP_DOMAIN;
        const prxBankUrl = url.searchParams.get("prx-list") || env.PRX_BANK_URL;

        const result = await generateSubscription({
            countryCodes: filterCC,
            limit: filterLimit,
            vpnType: filterVPN,
            ports: filterPort,
            bug: bug,
            useWildcard: useWildcard,
            domain: domain,
            prxBankUrl: prxBankUrl
        });

        let finalResult = "";
        switch (filterFormat) {
            case "raw":
                finalResult = result.join("\n");
                break;
            case reverse("yar2v"):
                finalResult = btoa(result.join("\n"));
                break;
            case reverse("hsalc"):
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
                        headers: { ...CORS_HEADER_OPTIONS },
                    });
                }
                break;
        }

        return new Response(finalResult, {
            status: 200,
            headers: { ...CORS_HEADER_OPTIONS },
        });
      } else if (url.pathname.startsWith("/sub")) {
        const page = url.pathname.match(/^\/sub\/(\d+)$/);
        const pageIndex = parseInt(page ? page[1] : "0");

        const hostname = url.searchParams.get("host") || APP_DOMAIN;
        const countrySelect = url.searchParams.get("cc")?.toUpperCase();
        const selectedProtocol = url.searchParams.get("vpn");
        const selectedPort = url.searchParams.get("port");
        const searchKeywords = url.searchParams.get("search")?.toLowerCase() || "";
        const prxBankUrl = url.searchParams.get("prx-list") || env.PRX_BANK_URL;
        let prxList = (await getPrxList(prxBankUrl)).filter((prx) => {
          if (countrySelect && countrySelect !== 'ALL') {
            if (prx.country !== countrySelect) return false;
          }

          if (searchKeywords) {
              const { prxIP, prxPort, country, org } = prx;
              if (
                  !prxIP.toLowerCase().includes(searchKeywords) &&
                  !prxPort.toLowerCase().includes(searchKeywords) &&
                  !country.toLowerCase().includes(searchKeywords) &&
                  !org.toLowerCase().includes(searchKeywords)
              ) {
                  return false;
              }
          }

          return true;
        });

        const cloudflareApi = new CloudflareApi();
        const wildcardDomains = await cloudflareApi.getDomainList();

        const result = getAllConfig(request, hostname, prxList, pageIndex, selectedProtocol, selectedPort, wildcardDomains, rootDomain);
        return new Response(result, {
          status: 200,
          headers: { "Content-Type": "text/html;charset=utf-8" },
        });
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
          } else if (wildcardApiPath.startsWith("/delete")) {
            const domainId = url.searchParams.get("id");
            const password = url.searchParams.get("password");

            if (password !== ownerPassword) {
              return new Response("Unauthorized", {
                status: 401,
                headers: { ...CORS_HEADER_OPTIONS },
              });
            }

            if (!domainId) {
              return new Response("Domain ID is required", {
                status: 400,
                headers: { ...CORS_HEADER_OPTIONS },
              });
            }

            const result = await cloudflareApi.deleteDomain(domainId);
            return new Response(result.toString(), {
              status: result,
              headers: { ...CORS_HEADER_OPTIONS },
            });
          }
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
        } else if (apiPath.startsWith("/stats")) {
          if (!isApiReady) {
              return new Response("API not ready", { status: 500 });
          }
          const cloudflareApi = new CloudflareApi();
          const stats = await cloudflareApi.getStats();
          if (stats) {
              return new Response(JSON.stringify(stats), {
                  headers: { ...CORS_HEADER_OPTIONS, 'Content-Type': 'application/json' },
              });
          }
          return new Response("Could not fetch stats", { status: 500 });
        } else if (apiPath.startsWith("/countries")) {
            await getPrxList(env.PRX_BANK_URL);
            const countries = [...new Set(cachedPrxList.map(p => p.country))].filter(Boolean);
            return new Response(JSON.stringify(countries.sort()), {
                headers: { ...CORS_HEADER_OPTIONS, 'Content-Type': 'application/json' },
            });
        }
      } else if (url.pathname === "/kuota") {
        const html = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Cek Kuota XL/AXIS</title>

    <link rel="icon" href="https://raw.githubusercontent.com/jaka9m/vless/refs/heads/main/sidompul.jpg" type="image/jpeg">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>

    <script>
    tailwind.config = {
        darkMode: 'selector',
        theme: {
            extend: {
                colors: {
                    'accent-blue': '#66b5e8',
                    'accent-purple': '#a466e8',
                }
            }
        }
    };
    
    function navigateTo(url) {
        console.log('Navigating to:', url);
    }
    </script>
<style>
    body {
        background-image: url('https://picsum.photos/1920/1080?random=1');
        background-size: cover;
        background-attachment: fixed;
        perspective: 1500px;
    }

    .main-container {
        background: rgba(30, 41, 59, 0.4);
        backdrop-filter: blur(18px);
        border-radius: 1.5rem;
        border: 1px solid rgba(102, 181, 232, 0.4);
        box-shadow:
            0 40px 80px rgba(0, 0, 0, 0.8),
            0 0 30px rgba(102, 181, 232, 0.4) inset;
        padding: 2rem;
        margin-bottom: 2rem;
        transform: translateZ(50px) rotateX(0deg) rotateY(0deg);
        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .main-container:hover {
        transform: translateZ(80px) rotateX(1deg) rotateY(-1deg);
        box-shadow:
            0 60px 100px rgba(0, 0, 0, 0.9),
            0 0 40px rgba(102, 181, 232, 0.6) inset;
    }
</style>
    </head>
<body class="text-white min-h-screen flex flex-col items-center">
    <div id="cover-spin"><div class="loader"></div></div>
    <div id="custom-notification"></div> 
    
    <div id="main-content-container" class="flex flex-col items-center p-3 sm:p-8 flex-grow w-full max-w-7xl">
    <div id="slide-2" class="slide w-full max-w-4xl main-container p-4 sm:p-6">
    
    <div class="w-full max-w-lg mx-auto main-container">
            <div class="text-center mb-6">
                <h2 class="text-solid-white centered-heading">
                    <img src="https://raw.githubusercontent.com/jaka9m/vless/refs/heads/main/sidompul.jpg" alt="Logo Sidompul" class="heading-icon">
                    Sidompul Cek Kuota XL/AXIS
                </h2>
            </div>
            
            <form id="formnya" class="p-6 rounded-xl shadow-xl border">
                <div class="mb-6">
                    <label for="msisdn" class="block font-medium mb-2 text-gray-300 text-sm">Nomor HP XL/AXIS:</label>
                    <input type="number" class="w-full px-4 py-3 rounded-lg input-dark text-base focus:ring-2 focus:ring-accent-blue" id="msisdn" placeholder="08xxx / 628xxx" maxlength="16" required>
                </div>
                
                <div class="flex gap-4">
                    <a href="/sub" class="flex-1 text-center py-2 rounded-lg text-white font-bold text-base btn-home hover:opacity-90 transition-opacity">
                        <i class="fa fa-home mr-2"></i>Home
                    </a>
                    <button type="button" id="submitCekKuota" class="flex-1 py-2 rounded-lg text-white font-bold text-base btn-gradient hover:opacity-90 transition-opacity">
                        <i class="fa fa-search mr-2"></i>Cek
                    </button>
                </div>
            </form>

            <div id="hasilnya" class="mt-6"></div>
        </div>
    
  </div>

    <footer class="w-full p-4 text-center mt-auto border-t">
        <div class="flex items-center justify-center gap-2 text-sm font-medium text-gray-500">
            <span>Sumbawa Support</span>
            <a href="https://t.me/sampiiiiu" target="_blank" class="flex items-center gap-1 text-accent-blue hover:text-accent-purple transition-colors duration-200">
                <i class="fab fa-telegram"></i>
                <span>GEO PROJECT</span>
            </a>
        </div>
    </footer>

      <script>
        
        function cekKuota() {
            const msisdn = document.getElementById('msisdn').value;
            if (!msisdn) {
                console.error('Nomor tidak boleh kosong.');
                return;
            }
            
            $('#cover-spin').show();
            $.ajax({
                type: 'GET',
                url: 'https://apigw.kmsp-store.com/sidompul/v4/cek_kuota?msisdn=' + msisdn + '&isJSON=true',
                dataType: 'JSON',
                contentType: 'application/x-www-form-urlencoded',
                beforeSend: function (req) {
                    req.setRequestHeader('Authorization', 'Basic c2lkb21wdWxhcGk6YXBpZ3drbXNw');
                    req.setRequestHeader('X-API-Key', '60ef29aa-a648-4668-90ae-20951ef90c55');
                    req.setRequestHeader('X-App-Version', '4.0.0');
                },
                success: function (res) {
                    $('#cover-spin').hide();
                    $('#hasilnya').html('');
                    if (res.status) {
                        $('#hasilnya').html('<div class="result-success p-4 rounded-lg mt-4 text-center font-semibold">' + res.data.hasil + '</div>');
                    } else {
                        console.error('Gagal Cek Kuota: ' + res.message);
                        $('#hasilnya').html('<div class="result-error p-4 rounded-lg mt-4 text-center font-semibold">' + res.data.keteranganError + '</div>');
                    }
                },
                error: function () {
                    $('#cover-spin').hide();
                    console.error('Terjadi kesalahan koneksi.');
                    $('#hasilnya').html(\`<div class="result-error p-4 rounded-lg mt-4 text-center font-semibold">Terjadi kesalahan koneksi atau server tidak merespons.</div>\`);
                }
            });
        }
        
        $(document).ready(function() {
            $('#submitCekKuota').off('click').on('click', cekKuota); 
            $('#msisdn').off('keypress').on('keypress', function (e) {
                if (e.which === 13) cekKuota();
            });
        });
        
      </script>
    </body>
    </html>
        `;
        return new Response(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html;charset=utf-8' },
        });
      } else if (url.pathname.startsWith("/linksub")) {
        let linksubHTML = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Link Generator</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        body {
            display: flex;
            background: url('https://raw.githubusercontent.com/bitzblack/ip/refs/heads/main/shubham-dhage-5LQ_h5cXB6U-unsplash.jpg') no-repeat center center fixed;
            background-size: cover;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
            font-family: 'Arial', sans-serif;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
    	<div class="card">
            <h1 class="text-4xl font-extrabold text-center mb-10 main-title">
                <i class="fas fa-satellite-dish mr-3 text-indigo-400"></i>Subs Link
            </h1>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label for="format" class="block mb-2 text-sm font-semibold text-gray-400">Format</label>
                    <select id="format" class="form-select p-3 rounded-lg w-full">
                        <option value="v2ray">V2RAY</option>
                        <option value="sfa">SFA</option>
                        <option value="bfr">BFR</option>
                        <option value="raw">RAW</option>
                        <option value="clash">CLASH</option>
                    </select>
                </div>
                <div>
                    <label for="vpn" class="block mb-2 text-sm font-semibold text-gray-400">VPN Protocol</label>
                    <select id="vpn" class="form-select p-3 rounded-lg w-full">
                        <option value="vless">VLESS</option>
                        <option value="trojan">TROJAN</option>
                        <option value="ss">SHADOWSOCKS</option>
                    </select>
                </div>
                <div>
                    <label for="tls" class="block mb-2 text-sm font-semibold text-gray-400">TLS/Port</label>
                    <select id="tls" class="form-select p-3 rounded-lg w-full">
                        <option value="true">True (443) - Secure</option>
                        <option value="false">False (80) - Regular</option>
                    </select>
                </div>
                <div>
                    <label for="wildcard" class="block mb-2 text-sm font-semibold text-gray-400">Wildcard/WC</label>
                    <select id="wildcard" class="form-select p-3 rounded-lg w-full">
                        <option value="false">False</option>
                        <option value="true">True</option>
                    </select>
                </div>
                <div class="md:col-span-2">
                    <label for="bug" class="block mb-2 text-sm font-semibold text-gray-400">Bug Host <span class="text-xs italic text-gray-500">(e.g., ava.game.naver.com)</span></label>
                    <input type="text" id="bug" class="form-input p-3 rounded-lg" placeholder="Masukkan Bug Host Anda...">
                </div>
                <div>
                    <label for="country" class="block mb-2 text-sm font-semibold text-gray-400">Country (CC)</label>
                    <select id="country" class="form-select p-3 rounded-lg w-full">
                        <option value="">All Countries</option>
                    </select>
                </div>
                <div>
                    <label for="limit" class="block mb-2 text-sm font-semibold text-gray-400">Limit</label>
                    <input type="number" id="limit" class="form-input p-3 rounded-lg" value="10" min="1">
                </div>
            </div>

            <div class="text-center mt-10">
                <button id="generate-btn" class="btn-generate w-full md:w-auto px-10 py-3 rounded-xl uppercase tracking-wider">
                    <i class="fas fa-rocket mr-2"></i> GENERATE
                </button>
            </div>

            <div class="mt-10">
                <label class="block mb-3 text-sm font-semibold text-gray-400">Generated Link:</label>
                <div id="result" class="result-box p-4 text-sm break-all">Your link will appear here...</div>
                <div class="text-right mt-3">
                    <button id="copy-btn" class="text-sm text-indigo-300 hover:text-indigo-200 font-semibold transition duration-200" style="display: none;">
                        <i class="fas fa-copy mr-1"></i> Copy Link
                    </button>
                </div>
            </div>
    	</div>
    </div>
    
    <script>
        const countryCodeToName = ${JSON.stringify(COUNTRY_CODE_TO_NAME)};

        function getFlagEmoji(isoCode) {
            if (!isoCode) return '';
            const codePoints = isoCode
                .toUpperCase()
                .split("")
                .map((char) => 127397 + char.charCodeAt(0));
            return String.fromCodePoint(...codePoints);
        }

        document.addEventListener('DOMContentLoaded', async () => {
            const countrySelect = document.getElementById('country');
            
            try {
                const response = await fetch('/api/v1/countries'); 
                if (!response.ok) throw new Error('Failed to fetch country list');
                
                const countries = await response.json();
                
                countries.forEach(cc => {
                    const option = document.createElement('option');
                    option.value = cc;
                    option.textContent = getFlagEmoji(cc) + ' ' + (countryCodeToName[cc] || cc);
                    countrySelect.appendChild(option);
                });
            } catch (error) {
                console.error("Could not populate countries:", error);
                countrySelect.innerHTML = '<option value="">Could not load countries</option>';
            }

            document.getElementById('generate-btn').addEventListener('click', () => {
                const format = document.getElementById('format').value;
                const vpn = document.getElementById('vpn').value;
                const port = document.getElementById('tls').value === 'true' ? '443' : '80';
                const bug = document.getElementById('bug').value;
                const wc = document.getElementById('wildcard').value;
                const cc = document.getElementById('country').value;
                const limit = document.getElementById('limit').value;

                const params = new URLSearchParams();
                params.set('format', format);
                params.set('limit', limit);
                if (vpn) params.set('vpn', vpn);
                if (port) params.set('port', port);
                if (bug) params.set('bug', bug);
                if (wc) params.set('wc', wc);
                if (cc) params.set('cc', cc);

                const link = window.location.protocol + '//' + window.location.host + '/api/v1/sub?' + params.toString();
                
                document.getElementById('result').textContent = link;
            });
        });
    </script>
</body>
</html>`;
        return new Response(linksubHTML, { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
      } else if (url.pathname.startsWith("/convert")) {
        const targetUrl = "https://jaka9m.github.io/web";
		const requestUrl = new URL(request.url);
		let path = requestUrl.pathname.replace("/convert", "");
		if (path === "" || path === "/") {
			path = "/index.html";
		}

        const newUrl = `${targetUrl}${path}`;
        const newRequest = new Request(newUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body,
            redirect: 'follow'
        });

        const response = await fetch(newRequest);
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('text/html')) {
            let body = await response.text();
            
            body = body.replace(/https:\/\/jaka9m\.github\.io\/web/g, `https://${APP_DOMAIN}/convert`);
            
            body = body.replace(/(src|href)="\//g, `$1="/convert/`);

            return new Response(body, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });
        }
        
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
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

  readableWebSocketStream
    .pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          if (remoteSocketWrapper.value) {
            const writer = remoteSocketWrapper.value.writable.getWriter();
            await writer.write(chunk);
            writer.releaseLock();
            return;
          }

          let protocolHeader;
          try {
            const protocol = await protocolSniffer(chunk);

            if (protocol === reverse("najort")) {
              protocolHeader = readHorseHeader(chunk);
            } else if (protocol === reverse("sselv")) {
              protocolHeader = readFlashHeader(chunk);
            } else if (protocol === "ss") {
              protocolHeader = readSsHeader(chunk);
            } else {
              throw new Error("Unknown Protocol!");
            }

            if (protocolHeader.hasError) {
              throw new Error(protocolHeader.message);
            }
          } catch (err) {
            log(`protocol error: ${err.message}`);
            return;
          }
          
          addressLog = protocolHeader.addressRemote;
          portLog = `${protocolHeader.portRemote} -> ${protocolHeader.isUDP ? "UDP" : "TCP"}`;


          if (protocolHeader.isUDP) {
            if (protocolHeader.portRemote === 53) {
              return handleUDPOutbound(
                DOH_URL,
                protocolHeader.rawClientData,
                webSocket,
                protocolHeader.version,
                log
              );
            } else {
			  log(`Ignoring UDP packet to ${protocolHeader.addressRemote}:${protocolHeader.portRemote}`);
              return;
            }
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
          return reverse("najort");
        }
      }
    }
  }

  const flashDelimiter = new Uint8Array(buffer.slice(1, 17));
  if (arrayBufferToHex(flashDelimiter).match(/^[0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}$/i)) {
    return reverse("sselv");
  }

  return "ss";
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

async function handleUDPOutbound(dohURL, udpChunk, webSocket, responseHeader, log) {
  try {
    let protocolHeader = responseHeader;
    
    log(`Forwarding DNS query to ${dohURL}`);

    const dohResponse = await fetch(dohURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/dns-message',
      },
      body: udpChunk,
    });

    if (dohResponse.ok) {
      const dnsAnswer = await dohResponse.arrayBuffer();
      if (webSocket.readyState === WS_READY_STATE_OPEN) {
        if (protocolHeader) {
          webSocket.send(await new Blob([protocolHeader, dnsAnswer]).arrayBuffer());
        } else {
          webSocket.send(dnsAnswer);
        }
      }
    } else {
      log(`DoH request failed with status: ${dohResponse.status}`);
    }
  } catch (e) {
    console.error(`Error while handling DoH outbound: ${e.message}`);
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
  
  const rawDataIndex = addressValueIndex + addressLength;
  let rawClientData = buffer.slice(rawDataIndex);
  if (isUDP) {
    const udpPayloadLength = new DataView(rawClientData).getUint16(0);
    rawClientData = rawClientData.slice(2, 2 + udpPayloadLength);
  }

  return {
    hasError: false,
    addressRemote: addressValue,
    addressType: addressType,
    portRemote: portRemote,
    rawDataIndex: rawDataIndex,
    rawClientData: rawClientData,
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
    return {
      hasError: true,
      message: `Unsupported command type for Trojan: ${cmd}`,
    };
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
  const portRemote = new DataView(dataBuffer.slice(portIndex, portIndex + 2)).getUint16(0);

  const rawDataIndex = portIndex + 2;
  let rawClientData = dataBuffer.slice(rawDataIndex);
  if (isUDP) {
    const udpPayloadLength = new DataView(rawClientData).getUint16(0);
    rawClientData = rawClientData.slice(2, 2 + udpPayloadLength);
  }

  return {
    hasError: false,
    addressRemote: addressValue,
    addressType: addressType,
    portRemote: portRemote,
    rawDataIndex: rawDataIndex,
    rawClientData: rawClientData,
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

  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
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

      return respJson.result
        .filter((data) => data.service == serviceName)
        .map((data) => ({ id: data.id, hostname: data.hostname }));
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
      if (domainTest.status == 530) return domainTest.status;

      const badWordsListRes = await fetch(BAD_WORDS_LIST);
      if (badWordsListRes.status == 200) {
        const badWordsList = (await badWordsListRes.text()).split("\n");
        for (const badWord of badWordsList) {
          if (domain.includes(badWord.toLowerCase())) {
            return 403;
          }
        }
      } else {
        return 403;
      }
    } catch (e) {
      return 400;
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountID}/workers/domains`;
    const res = await fetch(url, {
      method: "PUT",
      body: JSON.stringify({
        environment: "production",
        hostname: domain,
        service: serviceName,
        zone_id: this.zoneID,
      }),
      headers: {
        ...this.headers,
      },
    });

    return res.status;
  }

  async deleteDomain(domainId) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountID}/workers/domains/${domainId}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        ...this.headers,
      },
    });

    return res.status;
  }

  async getStats() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const query = `
    query {
      viewer {
        accounts(filter: {accountTag: "${this.accountID}"}) {
          httpRequests1dGroups(limit: 1, filter: {date_gt: "${yesterday}"}) {
            sum {
              requests
              bytes
            }
          }
        }
      }
    }`;

    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
        method: 'POST',
        headers: {
            ...this.headers,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
    });

    if (res.status === 200) {
        const respJson = await res.json();
        const data = respJson.data.viewer.accounts[0].httpRequests1dGroups[0].sum;
        return {
            requests: data.requests,
            bandwidth: data.bytes,
        };
    }
    return null;
  }
}


let baseHTML = `
<!DOCTYPE html>
<html lang="en" id="html" class="scroll-auto scrollbar-hide dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Geo-VPN | VPN Tunnel | CloudFlare</title>

    <meta name="description" content="Akun Vless Gratis. Geo-VPN offers free Vless accounts with Cloudflare and Trojan support. Secure and fast VPN tunnel services.">
    <meta name="keywords" content="Geo-VPN, Free Vless, Vless CF, Trojan CF, Cloudflare, VPN Tunnel, Akun Vless Gratis">
    <meta name="author" content="Geo-VPN">
    <meta name="robots" content="index, follow, noarchive, max-snippet:-1, max-image-preview:large, max-video-preview:-1">

    <link rel="icon" href="https://geoproject.biz.id/circle-flags/bote.png">
    <link rel="apple-touch-icon" href="https://geoproject.biz.id/circle-flags/bote.png">

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/lozad/dist/lozad.min.js"></script>
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-..." crossorigin="anonymous" referrerpolicy="no-referrer" />

    <style>
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    </style>
</head>
<body>
    <script>
      (function() {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark' || !theme) {
          document.getElementById('html').classList.add('dark');
        }
      })();
    </script>
    <div id="loading-screen" class="fixed inset-0 z-50 flex justify-center items-center bg-gray-900 bg-opacity-80 transition-opacity duration-500">
      <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400"></div>
    </div>
    <div class="container mx-auto p-4 sm:p-6 lg:p-8">
        <div class="glass-3d-blur p-4 sm:p-6">
            <div class="flex flex-col items-center relative z-10">
                <div class="w-full mb-6 rounded-xl p-4 shadow-lg">
                    <div class="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold">
                        PLACEHOLDER_INFO
                    </div>
                </div>
                <div class="w-full max-w-5xl mb-6 p-6 rounded-xl shadow-xl grid grid-cols-2 md:grid-cols-4 gap-4">
                    PLACEHOLDER_PROTOCOL_DROPDOWN
                    PLACEHOLDER_COUNTRY_DROPDOWN
                    PLACEHOLDER_HOST_DROPDOWN
                    PLACEHOLDER_PORT_DROPDOWN
                </div>
                <br>
                <div class="flex flex-col md:flex-row gap-4 w-full max-w-7xl justify-center">
                    PLACEHOLDER_PROXY_GROUP
                </div>
                <nav class="w-full max-w-7xl mt-8 sticky bottom-2 z-20 transition-transform -translate-y-6 flex flex-col items-center">
                    <ul class="flex justify-center space-x-2">
                        PLACEHOLDER_PAGE_BUTTON
                    </ul>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-4">PLACEHOLDER_PAGINATION_INFO</p>
                </nav>
            </div>
        </div>
    </div>
</body>
</html>
`;

class Document {
    proxies = [];
    wildcardDomains = [];
    rootDomain = "";
    startIndex = 0;

    constructor(request, wildcardDomains = [], rootDomain = "", startIndex = 0) {
        this.html = baseHTML;
        this.request = request;
        this.url = new URL(this.request.url);
        this.wildcardDomains = wildcardDomains;
        this.rootDomain = rootDomain;
        this.startIndex = startIndex;
    }

    setTotalProxy(total) {
        this.html = this.html.replace(
            '<strong>0</strong>',
            `<strong>${total}</strong>`
        );
    }
    
    setPage(current, total) {
        this.html = this.html.replace(
            '<strong>0/0</strong>',
            `<strong>${current}/${total}</strong>`
        );
    }

    setTitle(title) {
        this.html = this.html.replaceAll("PLACEHOLDER_JUDUL", title);
    }

    addInfo(text) {
        this.html = this.html.replaceAll("PLACEHOLDER_INFO", `${text}\nPLACEHOLDER_INFO`);
    }

    registerProxies(data, proxies) {
        this.proxies.push({
            ...data,
            list: proxies,
        });
    }

    buildProxyGroup() {
        let tableRows = "";
        for (let i = 0; i < this.proxies.length; i++) {
            const prx = this.proxies[i];
            const proxyConfigs = prx.list.join('\\n');
            tableRows += `
                <tr>
                    <td class="px-3 py-3 text-base text-center">${this.startIndex + i + 1}.</td>
                    <td class="px-3 py-3 text-base font-mono text-center">${prx.prxIP}:${prx.prxPort}</td>
                    <td id="ping-${i}" class="px-6 py-4 whitespace-nowrap text-sm text-center">${prx.prxIP}:${prx.prxPort}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm flex items-center justify-center">
                        <img src="https://hatscripts.github.io/circle-flags/flags/${prx.country.toLowerCase()}.svg" width="20" class="inline mr-2 rounded-full"/>
                        ${COUNTRY_CODE_TO_NAME[prx.country] || prx.country}
                    </td>
                    <td class="px-3 py-3 text-base font-mono">
                        <div class="max-w-[150px] overflow-x-auto whitespace-nowrap">${prx.org}</div></td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <button onclick="copyToClipboard(\`${proxyConfigs}\`)" class="text-white px-4 py-1 rounded text-sm font-semibold transition-colors duration-200 action-btn">Config</button>
                    </td>
                </tr>
            `;
        }

        const table = `
            <div class="overflow-x-auto w-full max-w-full" style="max-height: 500px; overflow-y: auto;">    
                <table class="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-base">
                    <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                        <tr>
                            <th class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">No.</th>
                            <th class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IP</th>
                            <th class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Country</th>
                            <th class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ISP</th>
                            <th class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;

        this.html = this.html.replaceAll("PLACEHOLDER_PROXY_GROUP", table);
    }

    addPageButton(text, link, isDisabled) {
        const pageButton = `<li><button ${
            isDisabled ? "disabled" : ""
        } class="px-6 py-2 text-white rounded-lg disabled:opacity-50 text-base font-semibold" onclick=navigateTo('${link}')>${text}</button></li>`;

        this.html = this.html.replaceAll("PLACEHOLDER_PAGE_BUTTON", `${pageButton}\nPLACEHOLDER_PAGE_BUTTON`);
    }

    setPaginationInfo(info) {
        this.html = this.html.replace("PLACEHOLDER_PAGINATION_INFO", info);
    }

    build() {
        this.buildProxyGroup();
        this.html = this.html.replaceAll("PLACEHOLDER_API_READY", isApiReady ? "block" : "hidden");
        this.buildDropdowns();
        return this.html.replaceAll(/PLACEHOLDER_\w+/gim, "");
    }

    buildDropdowns() {
        const selectedProtocol = this.url.searchParams.get('vpn') || 'all';
        const selectedCountry = this.url.searchParams.get('cc') || 'all';
        const selectedHost = this.url.searchParams.get('host') || APP_DOMAIN;
        const selectedPort = this.url.searchParams.get('port') || 'all';

        const protocols = [{ value: 'all', label: 'All Protocols' }, { value: reverse("sselv"), label: 'VLESS' }, { value: reverse("najort"), label: 'TROJAN' }, { value: 'ss', label: 'SHADOWSOCKS' }];
        let protocolOptions = protocols.map(proto => `<option value="${proto.value}" ${selectedProtocol === proto.value ? 'selected' : ''}>${proto.label}</option>`).join('');
        this.html = this.html.replace('PLACEHOLDER_PROTOCOL_DROPDOWN', `
            <div>
                <label for="protocol-select" class="block font-medium mb-2 text-gray-300 text-sm text-center">Protocol</label>
                <select onchange="applyFilters()" id="protocol-select" class="w-full px-3 py-2 rounded-lg input-dark text-base focus:ring-2">
                    ${protocolOptions}
                </select>
            </div>
        `);

        const countries = new Set(cachedPrxList.map(p => p.country));
        let countryOptions = `<option value="all" ${'all' === selectedCountry ? 'selected' : ''}>All Countries</option>`;
        countryOptions += [...countries].sort().map(country => `<option value="${country}" ${selectedCountry === country ? 'selected' : ''}>${getFlagEmoji(country)} ${COUNTRY_CODE_TO_NAME[country] || country}</option>`).join('');
        this.html = this.html.replace('PLACEHOLDER_COUNTRY_DROPDOWN', `
            <div>
                <label for="country-select" class="block font-medium mb-2 text-gray-300 text-sm text-center">Country</label>
                <select onchange="applyFilters()" id="country-select" class="w-full px-3 py-2 rounded-lg input-dark text-base focus:ring-2">
                    ${countryOptions}
                </select>
            </div>
        `);

        const hosts = [{ value: APP_DOMAIN, label: 'Default Host (' + APP_DOMAIN + ')' }];
        if (this.wildcardDomains.length > 0) {
            this.wildcardDomains.forEach(domain => {
                const subDomain = domain.hostname.replace(`.${APP_DOMAIN}`, '').replace(`.${this.rootDomain}`, '');
                hosts.push({ value: subDomain, label: subDomain });
            });
        }
        let hostOptions = hosts.map(host => `<option value="${host.value}" ${selectedHost === host.value ? 'selected' : ''}>${host.label}</option>`).join('');
        this.html = this.html.replace('PLACEHOLDER_HOST_DROPDOWN', `
            <div>
                <label for="host-select" class="block font-medium mb-2 text-gray-300 text-sm text-center">Wildcard/Host</label>
                <select onchange="applyFilters()" id="host-select" class="w-full px-3 py-2 rounded-lg input-dark text-base focus:ring-2">
                    ${hostOptions}
                </select>
            </div>
        `);

        const ports = [{ value: 'all', label: 'All Ports' }, { value: '443', label: 'TLS (443)' }, { value: '80', label: 'NTLS (80)' }];
        let portOptions = ports.map(port => `<option value="${port.value}" ${selectedPort === port.value ? 'selected' : ''}>${port.label}</option>`).join('');
        this.html = this.html.replace('PLACEHOLDER_PORT_DROPDOWN', `
            <div>
                <label for="port-select" class="block font-medium mb-2 text-gray-300 text-sm text-center">Security/Port</label>
                <select onchange="applyFilters()" id="port-select" class="w-full px-3 py-2 rounded-lg input-dark text-base focus:ring-2">
                    ${portOptions}
                </select>
            </div>
        `);
    }
}
