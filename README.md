
# Church ZIP Search API

This Netlify Function allows you to search for nearby churches by ZIP code and returns plain HTML results.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/nathanechurch/find-churches)

## How to Use

After deployment, embed this form in any HTML site (e.g., Squarespace):

```html
<form method="GET" action="https://your-site.netlify.app/.netlify/functions/find-churches" target="results-frame">
  <label for="zip">Enter ZIP Code:</label>
  <input name="zip" id="zip" required />
  <button type="submit">Find Churches</button>
</form>

<iframe name="results-frame" style="width:100%; min-height:200px; border:none;"></iframe>
```
