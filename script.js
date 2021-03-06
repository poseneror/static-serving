function getParameterByName(name, url) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function getSiteInfo() {
    return new Promise(res => {
        Wix.Worker.getSiteInfo(siteInfo => {
          res(siteInfo);
        });
    })
}

async function getReferrer(siteInfo) {
    const hostUrl = siteInfo.url;
    const referrer = getParameterByName('referrer', hostUrl);

    console.log('referred by', referrer);

    return referrer;
}

function getDecodedInstance() {
    const queryParams = Object.fromEntries(new URLSearchParams(window.location.search).entries());

    const encodedInstance = queryParams.instance;

    if (!encodedInstance) {
        console.error('ERROR: failed to get instance');
        return;
    }

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
    let currentMember = await getCurrentMemberDetails();

    console.log('INFO: decoded instance', decodedInstance);

    const siteInfo = await getSiteInfo();
    const referrer = await getReferrer(siteInfo);

    // handleReferrerLinkDistribution(currentMember, siteInfo);

    if (referrer) {
        const {instanceId, appDefId, metaSiteId, signDate, demoMode, aid, biToken, siteOwnerId} = decodedInstance;

        const trackerResponse = await reportTrackerEvent({
            referrer,
            metaSiteId,
            appDefId,
            instanceId,
            visitorId: aid,
            contactId: currentMember?.id,
            eventType: 'visited'
        });
        console.log('INFO: trackerResponse json', trackerResponse);

        // onPageNavigation(target => {
        //     console.log('Navigated to:', target);
        // })
    }

    // let options = {
    //     headers: {
    //         "Access-Control-Allow-Origin": "*",
    //         "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    //         "Access-Control-Max-Age": "86400"
    //     }
    // };
    // const response = await fetch('https://orp700.wixsite.com/bookings-clubs/_functions/hello', options);
    // console.log(response)
}

function onPageNavigation(callback) {
    Wix.Worker.addEventListener('PAGE_NAVIGATION', (eventPayload) => {
        const {toPage} = eventPayload;
        // const target = pages.find(page => page.id === toPage);
        // callback(target);
    })
}

async function getCurrentMemberDetails() {
    return new Promise(resolve => {
        Wix.Worker.currentMember(resolve);
    })
}

function handleReferrerLinkDistribution(currentMember, siteInfo) {
  const showLinkIfNeeded = (member) => {
    if (!isContactGotReferralLink(member.id)) {
      const referrerLink = `${siteInfo.baseUrl}/book-online?referrer=${member.id}`;

      prompt(`
        YoYoYo, wanna b reach $$$$ ?
        The ONLY thing you MUST do is
        Send this link to EVERYONE you know
        Here you go, you can thank me later`,
        referrerLink
      );

      setContactGotReferralLinkCookie(member.id);
    }
  };

  if (!currentMember) {
    let loginInterval;
    loginInterval = setInterval(async () => {
      const loggedInMember = await getCurrentMemberDetails();
      if (loggedInMember) {
        console.log('visitor has logged in as a member', loggedInMember);
        clearInterval(loginInterval);

        showLinkIfNeeded(loggedInMember);
      }
    }, 2000);
  } else {
    console.log('signed in as', currentMember);
    showLinkIfNeeded(currentMember);
  }
};

function setContactGotReferralLinkCookie(contactId) {
  const cookie = `gotReferralLink${contactId}=true; max-age=${7 * 24 * 60 * 60}; SameSite=None; Secure`;
  document.cookie = cookie;
}

function isContactGotReferralLink(contactId) {
  return !!document.cookie.split('; ').find(row => row.startsWith(`gotReferralLink${contactId}`));
}

console.log('loaded script');

onLoad();
