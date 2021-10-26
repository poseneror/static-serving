
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

function crossDomainPost(targetURL, postData) {
  // Add the iframe with a unique name
  var iframe = document.createElement("iframe");
  var uniqueString = "CHANGE_THIS_TO_SOME_UNIQUE_STRING";
  document.body.appendChild(iframe);
  iframe.style.display = "none";
  iframe.contentWindow.name = uniqueString;

  // construct a form with hidden inputs, targeting the iframe
  var form = document.createElement("form");
  form.target = uniqueString;
  form.action = targetURL;
  form.method = "POST";

  // repeat for each parameter
  for (param in postData) {
    var input = document.createElement("input");
    input.type = "hidden";
    input.name = param;
    input.value = postData[param];
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  form.remove();
}

function reportTrackerEvent(eventParams) {
  const trackerBackendURL = 'https://orp700.wixsite.com/bookings-clubs/_functions/trackerEvent';

  crossDomainPost(trackerBackendURL, eventParams);

  // return fetch(trackerBackendURL, {
  //   method: 'POST',
  //   mode: 'cors',
  //   cache: 'no-cache',
  //   credentials: 'same-origin', // include, *same-origin, omit
  //   headers: {
  //     'Content-Type': 'application/json'
  //   },
  //   redirect: 'follow', // manual, *follow, error
  //   referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
  //   body: JSON.stringify(eventParams) // body data type must match "Content-Type" header
  // })
  // .then(response => response.json());
}

async function onLoad() {
  const decodedInstance = getDecodedInstance();

  console.log('INFO: decoded instance', decodedInstance);

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

      return reportTrackerEvent({
        referrer,
        metaSiteId,
        appDefId,
        instanceId,
        visitorId: aid,
        eventType: 'siteEntry'
      });
    })
    .then(trackerResponse => {
      console.log('INFO: trackerResponse json', trackerResponse);
    });

    const currentMember = await getCurrentMemberDetails();
    console.log('signed in as', currentMember);

    onPageNavigation(target => {
        console.log('Navigated to:', target);
    })
}

function onPageNavigation(callback) {
    Wix.Worker.addEventListener('PAGE_NAVIGATION', (eventPayload) => {
        const {toPage} = eventPayload;
        const target = pages.find(page => page.id === toPage);
        callback(target);
    })
}

async function getCurrentMemberDetails() {
    return new Promise(resolve => {
        Wix.Worker.currentMember(resolve);
    })
}
console.log('loaded script');

onLoad();
