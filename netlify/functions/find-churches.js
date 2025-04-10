const churches = require('./churches_map_data.json');
const zipCoords = require('./zipcoords.json');

function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

  const nearby = results.filter(ch => ch.distance <= 20);
  const final = nearby.length > 0 ? nearby : results.slice(0, 2);

  const html = final.map(ch => `
    <div>
      <strong>${ch.name}</strong><br>
      Pastor: ${ch.pastor}<br>
      ${ch.address}<br>
      <em>${ch.distance.toFixed(1)} miles away</em>
    </div><br>
  `).join('');

  const note = nearby.length === 0
    ? `<p>No churches found within 20 miles. Showing the 2 closest options instead. 
       <br>Please <a href="https://fpcbatesville.com/contact">fill out our contact form</a> 
       if you need help finding a church.</p>`
    : '';

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: html + note + '<br><a href="https://fpcbatesville.com/churchlocator">Return to Church Locator</a>'
  };
};
