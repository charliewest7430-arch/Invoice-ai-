export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Example API route demonstrating access to env variables & secrets
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
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Attempt to serve static assets if ASSETS binding is available
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      if (response.status !== 404) {
        return response;
      }
    }

    // 404 Not Found for unhandled routes
    return new Response(
      JSON.stringify({
        error: 'Not Found',
        message: `Route ${url.pathname} not found.`,
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },
};
