
function getParameterByName(name, url) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

console.log('loaded script');
Wix.Worker.getSiteInfo(siteInfo => {
  const hostUrl = siteInfo.url;
  const referrer = getParameterByName('referrer', hostUrl);
  console.log('referred by', referrer);
})
