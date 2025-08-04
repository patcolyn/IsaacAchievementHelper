export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "https://patcolyn.github.io",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      });
    }

    try {
      const url = new URL(request.url);
      const csurl = url.searchParams.get("csurl");

      if (!csurl) {
        return new Response(JSON.stringify({ error: "Missing csurl parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://patcolyn.github.io" }
        });
      }

      if (!csurl.startsWith("https://api.steampowered.com/")) {
        return new Response(JSON.stringify({ error: "Invalid csurl parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://patcolyn.github.io" }
        });
      }

      url.searchParams.delete("csurl");

      // Parse the target Steam API URL
      const targetUrl = new URL(csurl);

      for (const [key, value] of url.searchParams.entries()) {
        targetUrl.searchParams.set(key, value);
      }

      targetUrl.searchParams.set("key", env.STEAM_API_KEY);

      const response = await fetch(targetUrl.toString());

      // Log the final JSON string passed to client
      const text = await response.text();
      console.log("Response to client:", text);
      ////////////////////////////////////////////

      return new Response(text, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://patcolyn.github.io",
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || String(err) }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://patcolyn.github.io",
        }
      });
    }
  }
}

