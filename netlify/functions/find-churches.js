
const churches = require('./churches.json');
const zipCoords = require('./zipcoords.json');

function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
}

exports.handler = async (event) => {
  const zip = event.queryStringParameters.zip;
  const userLoc = zipCoords[zip];

  // If ZIP not found, assign default user location (e.g., the center of the United States)
  if (!userLoc) {
    console.log(`ZIP code not found: ${zip}. Defaulting to closest churches.`);
    // Use a default location or the first church in the list (as a fallback)
    return returnClosestChurches();
  }

  // Process the data and find the churches as before
  const results = churches.map(ch => {
    const dist = haversine(userLoc.lat, userLoc.lng, ch.lat, ch.lng);
    return { ...ch, distance: dist };
  }).sort((a, b) => a.distance - b.distance);

  // Filter churches within 20 miles, or return the 2 closest churches if none within range
  const nearby = results.filter(ch => ch.distance <= 20);
  const final = nearby.length > 0 ? nearby : results.slice(0, 2);

  // Construct HTML output for the church listings
  const html = final.map(ch => `
    <div>
      <strong>${ch.name}</strong><br>
      Pastor: ${ch.pastor}<br>
      ${ch.address}<br>
      <em>${ch.distance.toFixed(2)} miles away</em>
    </div><br>
  `).join('');

  // Redirect to the Results Page and include the results in the query string
  return {
    statusCode: 302, // 302 redirect
    headers: {
      "Location": `https://fpcbatesville.com/churchlocatorresults?data=${encodeURIComponent(html)}`,
      "Access-Control-Allow-Origin": "*"  // Allow traffic from any origin
    },
    body: ""
  };
};

// Default behavior when ZIP code is not found, using the closest church as a fallback
function returnClosestChurches() {
  const closestChurches = churches
    .map(ch => {
      // Fallback to first church in list or define a default location
      return { ...ch, distance: 0 };
    })
    .slice(0, 2);  // Return the first two churches
  
  const html = closestChurches.map(ch => `
    <div>
      <strong>${ch.name}</strong><br>
      Pastor: ${ch.pastor}<br>
      ${ch.address}<br>
      <em>${ch.distance} miles away</em>
    </div><br>
  `).join('');

  return {
    statusCode: 302,
    headers: {
      "Location": `https://fpcbatesville.com/churchlocatorresults?data=${encodeURIComponent(html)}`,
      "Access-Control-Allow-Origin": "*"  // Allow traffic from any origin
    },
    body: ""
  };
}
