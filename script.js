
function getParameterByName(name, url) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function getReferrer() {
  return new Promise(res => {
    Wix.Worker.getSiteInfo(siteInfo => {
      const hostUrl = siteInfo.url;
      const referrer = getParameterByName('referrer', hostUrl);
      console.log('referred by', referrer);

      res(referrer);
    });
  })
}

function getDecodedInstance() {
  const queryParams = Object.fromEntries(new URLSearchParams(window.location.search).entries());

  const encodedInstance = queryParams.instance;

  if (!encodedInstance) {
    console.error('ERROR: failed to get instance');
    return;
  };

  const instance = JSON.parse(atob(encodedInstance.split('.')[1]));

  return instance;
}

function reportTrackerEvent(eventParams) {
  const trackerBackendURL = 'https://orp700.wixsite.com/bookings-clubs/_functions/trackerEvent';

  const response = await fetch(trackerBackendURL, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(eventParams) // body data type must match "Content-Type" header
  });
  return response.json();
}

function onLoad() {
  const decodedInstance = getDecodedInstance();
  getReferrer()
    .then(referrer => {
      const instanceId = decodedInstance.instanceId;
      const appDefId = decodedInstance.appDefId;
      const metaSiteId = decodedInstance.metaSiteId;
      const signDate = decodedInstance.signDate;
      const demoMode = decodedInstance.demoMode;
      const aid = decodedInstance.aid;
      const biToken = decodedInstance.biToken;
      const siteOwnerId = decodedInstance.siteOwnerId;
    });
}

console.log('loaded script');

onLoad();