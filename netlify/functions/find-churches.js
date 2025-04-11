
const churches = require('./churches_map_data.json');
const zipCoords = require('./zipcoords.json');

function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const priorityChurches = [
  { name: "First Pentecostal Church of North Little Rock", address: "1401 Calvary Rd, North Little Rock, AR 72116" },
  { name: "First Pentecostal Church of Batesville", address: "684 Harrison St, Batesville, AR 72501" },
  { name: "Calvary Pentecostal Church", address: "308 Janette St, Hot Springs, AR 71901, USA" },
  { name: "Calvary Pentecostal Church", address: "222 N Hickory St, Amity, AR 71921, USA" },
  { name: "Jethro Pentecostal Church", address: "15363 Lower Jethro RD, Ozark, AR, 72949, USA" },
  { name: "Landmark Pentecostal Church", address: "1601 Mall Dr, Texarkana, TX 75503, USA" },
  { name: "Landmark Pentecostal Church", address: "120 County Road 3004, New Boston, TX 75570, USA" },
  { name: "Faith Tabernacle Of Tomball", address: "9525 FM 2920 RD, Tomball, TX, 77375, USA" },
  { name: "Solid Rock Church", address: "E Main St, Marshall, AR 72650, USA" }
];

function isPriority(church) {
  return priorityChurches.some(pc => pc.name === church.name && pc.address === church.address);
}

exports.handler = async (event) => {
  const zip = event.queryStringParameters.zip;
  const userLoc = zipCoords[zip];

  if (!userLoc) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `<p>ZIP code not found. Please try another one or <a href="https://fpcbatesville.com/contact">contact us</a> for assistance.</p>`
    };
  }

  const results = churches.map(ch => {
    const dist = haversine(userLoc.lat, userLoc.lng, ch.lat, ch.lng);
    return { ...ch, distance: dist };
  }).sort((a, b) => a.distance - b.distance);

  const nearby = results.filter(ch => ch.distance <= 30);
  const baseList = nearby.length > 0 ? nearby : results.slice(0, 2);

  const prioritized = baseList.filter(isPriority);
  const nonPrioritized = baseList.filter(ch => !isPriority(ch));
  const final = [...prioritized, ...nonPrioritized];

  const html = final.map(ch => `
    <div>
      <strong>${ch.name}</strong><br>
      Pastor: ${ch.pastor}<br>
      ${ch.address}<br>
      <em>${ch.distance.toFixed(1)} miles away</em>
    </div><br>
  `).join('');

  const note = nearby.length === 0
    ? `<p>No churches found within 30 miles. Showing the 2 closest options instead. 
         <br>Please <a href="https://fpcbatesville.com/contact">fill out our contact form</a> 
         if you need help finding a church.</p>`
    : '';

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: html + note + '<br><a href="https://fpcbatesville.com/churchlocator">Return to Church Locator</a>'
  };
};
