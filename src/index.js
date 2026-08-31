const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Handle CORS Preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // 2. Flutterwave Payment Initialization Route
    if (url.pathname === '/api/flutterwave/initialize') {
      if (request.method !== 'POST') {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Method not allowed. Use POST.',
          }),
          {
            status: 405,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      try {
        const secretKey = env.FLUTTERWAVE_SECRET_KEY;
        if (!secretKey || !secretKey.trim()) {
          return new Response(
            JSON.stringify({
              status: 'error',
              message: 'Flutterwave secret key is not configured in Worker environment.',
            }),
            {
              status: 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        }

        const body = await request.json();

        // Forward request to Flutterwave Standard Checkout API
        const flwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const flwData = await flwResponse.json();

        return new Response(JSON.stringify(flwData), {
          status: flwResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: err.message || 'Internal server error while initializing Flutterwave payment.',
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // 3. Example API route demonstrating access to env variables & secrets
    if (url.pathname === '/api/hello') {
      const environment = env.ENVIRONMENT || 'development';
      const customMessage = env.CUSTOM_MESSAGE || 'Hello from Cloudflare Worker!';

      return new Response(
        JSON.stringify({
          message: customMessage,
          environment,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 4. Attempt to serve static assets if ASSETS binding is available
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      if (response.status !== 404) {
        return response;
      }
    }

    // 5. 404 Not Found for unhandled routes
    return new Response(
      JSON.stringify({
        error: 'Not Found',
        message: `Route ${url.pathname} not found.`,
      }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  },
};
