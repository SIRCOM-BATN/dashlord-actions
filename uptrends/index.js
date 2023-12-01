const { default: fetch } = require("node-fetch");
const API_HTTP = "https://api.uptrends.com/v4/";


class HTTPResponseError extends Error {
  constructor(response, ...args) {
    super(
      `HTTP Error Response: ${response.status} ${response.statusText}`,
      ...args
    );
  }
}

const checkStatus = (response) => {
  if (response.ok) {
    return response.json();
  } else {
    throw new HTTPResponseError(response);
  }
};

/**
 * Calcule l'Uptime, le grade Uptime et le temps moyen sur base du retour
 * de l'API /Statistiques/Monitor/{monitorGuid}
 * @param {array} data
 * @returns 
 */
const calculateData = (data) => {
  // Les données sont des éléments par jour ou par mois (à sommer)
  let uptimeSum = 0;
  let downtimeSum = 0;
  let totalTimeSum = 0;
  data.forEach(element => {
    uptimeSum += element.Attributes.Uptime;
    downtimeSum += element.Attributes.Downtime;
    totalTimeSum += element.Attributes.TotalTime;
  });

  let uptimePercentage = uptimeSum / (uptimeSum + downtimeSum);
  let averageTime = totalTimeSum / data.length;

  return {
    uptime: uptimePercentage.toFixed(4),
    uptimeGrade: getUptrendsGrade(uptimePercentage),
    averageTime: averageTime.toFixed(3)
  };
};

/**
 * Retourne le grade d'uptime 
 * Récupéré ici: https://github.com/MTES-MCT/updownio-action/blob/main/src/checks.js
 * @param {float} uptime 
 * @returns 
 */
const getUptrendsGrade = (uptime) => {
  return uptime > 0.99
    ? "A"
    : uptime > 0.98
      ? "B"
      : uptime > 0.97
        ? "C"
        : uptime > 0.96
          ? "D"
          : uptime > 0.95
            ? "E"
            : "F";
};

/**
 * Permet de récupére l'uptrends Monitor GUID depuis l'URL
 * @param {string} url 
 * @param {array} data 
 * @returns 
 */
const getMonitorGuidForUrl = (url, data) => {
  url = url.replace(/^https?:\/\//, '');
  var foundedMonitor = null;
  for (const monitor of data) {  
    if(monitor.Url && monitor.Url.includes(url)) {
      foundedMonitor = monitor;
      break;
    }
  }
  if(foundedMonitor) {
    return foundedMonitor.MonitorGuid;
  }
  return null;
};

/**
 * Scan général de l'API Uptrends pour récupérer des informations de disponibilité
 * @param {string} url 
 * @param {string} apiKey Uptrends API secrets, format login:password
 * @returns 
 */
const getUptrendsInfos = async (url, apiKey) => {
  const result = { url: url, monitorGuid: null, currentYear: null, last30Days: null };
  const options = {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${apiKey}`, 'binary').toString('base64')
    }
  };

  // Retrieve monitorGuid for site
  const apiUrl = encodeURI(`${API_HTTP}/Monitor`);
  const getmonitorGuid = await fetch(apiUrl, options).then(checkStatus).then(response => response);
  result.monitorGuid = getMonitorGuidForUrl(url, getmonitorGuid);
  if(!result.monitorGuid) {
    return result;
  }
  // Retrieve current days data
  const apiStatsUrlCurrentYear = encodeURI(`${API_HTTP}/Statistics/Monitor/${result.monitorGuid}?PresetPeriod=CurrentYear`);
  const currentYearStatistics = await fetch(apiStatsUrlCurrentYear, options).then(checkStatus).then(response => response);
  result.currentYear = calculateData(currentYearStatistics.Data);

  // Retrieve last 30 days data
  const apiStatsUrlLast30days = encodeURI(`${API_HTTP}/Statistics/Monitor/${result.monitorGuid}?PresetPeriod=Last30Days`);
  const last30DaysStatistics = await fetch(apiStatsUrlLast30days, options).then(checkStatus).then(response => response);
  result.last30Days = calculateData(last30DaysStatistics.Data);

  return result;
};



module.exports = { getUptrendsInfos };

if (require.main === module) {
  const url = process.argv[process.argv.length - 2]; // url, to make absolute links
  const apiKey = process.argv[process.argv.length - 1]; // API KEY

  if (!url.match(/^https?:\/\//)) {
    throw Error("error: need an absolute URL");
  }

  if(!apiKey || apiKey == '') {
    throw Error("error: need an Uptrends API Secrets in UPTRENDS_API_SECRETS environment var.");
  }

  getUptrendsInfos(url, apiKey)
    .then((result) => console.log(JSON.stringify(result)))
    .catch(() => console.log(JSON.stringify({ declaration: undefined })));
}
