const churches = require('./churches.json');
const zipCoords = require('./zipcoords.json');

function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
}

exports.handler = async (event) => {
  const zip = event.queryStringParameters.zip;
  const userLoc = zipCoords[zip];

  if (!userLoc) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `<p>ZIP code not found. Please try again.</p>`
    };
  }

  // Calculate the distance between the user's location and the churches
  const results = churches.map(ch => {
    const dist = haversine(userLoc.lat, userLoc.lng, ch.lat, ch.lng);
    return { ...ch, distance: dist };
  }).sort((a, b) => a.distance - b.distance);

  // Filter churches within 20 miles, or return the 2 closest if none within range
  const nearby = results.filter(ch => ch.distance <= 20);
  const final = nearby.length > 0 ? nearby : results.slice(0, 2);

  // Prepare the church list to display on the page
  const churchList = final.map(ch => `
    <div>
      <strong>${ch.name}</strong><br>
      Pastor: ${ch.pastor}<br>
      ${ch.address}<br>
      <em>${ch.distance.toFixed(1)} miles away</em>
    </div><br>
  `).join('');

  // If no churches were found within 20 miles, add a message for the user
  let extraMessage = '';
  if (nearby.length === 0) {
    extraMessage = `
      <p>No churches were found within 20 miles of your location. Here are the 2 closest options.</p>
      <p>If you'd like further assistance in finding a church near you, please 
      <a href="https://fpcbatesville.com/contact">fill out our contact form</a> 
      and we’ll help you find one.</p>
    `;
  }

  // Return the HTML response
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: `
      <html>
        <head>
          <title>Church Locator Results</title>
        </head>
        <body>
          <h1>Church Locator Results</h1>
          ${churchList}
          ${extraMessage}
          <p><a href="https://fpcbatesville.com/churchlocator">Return to Church Locator</a></p>
        </body>
      </html>
    `
  };
};
