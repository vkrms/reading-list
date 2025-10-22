interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function extractOpenGraphData(html: string, originalUrl: string): OpenGraphData {
  const data: OpenGraphData = {};
  
  // Extract title
  const titleMatch = html.match(/<meta\s+(?:property="og:title"|name="og:title")\s+content="([^"]*)"[^>]*>/i) ||
                    html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    data.title = titleMatch[1].trim();
  }
  
  // Extract description
  const descMatch = html.match(/<meta\s+(?:property="og:description"|name="description")\s+content="([^"]*)"[^>]*>/i);
  if (descMatch) {
    data.description = descMatch[1].trim();
  }
  
  // Extract image
  const imageMatch = html.match(/<meta\s+(?:property="og:image"|name="og:image")\s+content="([^"]*)"[^>]*>/i);
  if (imageMatch) {
    let imageUrl = imageMatch[1].trim();
    // Convert relative URLs to absolute
    if (imageUrl.startsWith('/')) {
      const urlObj = new URL(originalUrl);
      imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
    }
    data.image = imageUrl;
  }
  
  data.url = originalUrl;
  return data;
}

function isRedditUrl(url: URL): boolean {
  return url.hostname === 'reddit.com' || 
         url.hostname === 'www.reddit.com' || 
         url.hostname.endsWith('.reddit.com');
}

async function fetchRedditOEmbed(url: string): Promise<OpenGraphData> {
  const oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`;
  const response = await fetch(oembedUrl);
  
  if (!response.ok) {
    throw new Error(`Reddit oEmbed failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    title: data.title || 'Reddit Post',
    description: data.author_name ? `Posted by ${data.author_name}` : undefined,
    image: data.thumbnail_url || undefined,
    url: url
  };
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate URL
    let validUrl: URL;
    try {
      validUrl = new URL(url);
      if (!validUrl.protocol.startsWith('http')) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check if it's a Reddit URL and use oEmbed API
    if (isRedditUrl(validUrl)) {
      try {
        const openGraphData = await fetchRedditOEmbed(validUrl.toString());
        return new Response(
          JSON.stringify(openGraphData),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error('Reddit oEmbed failed, falling back to scraping:', error);
        // Fall through to regular scraping if Reddit API fails
      }
    }

    // Fetch the webpage
    const response = await fetch(validUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.status}` }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const html = await response.text();
    const openGraphData = extractOpenGraphData(html, validUrl.toString());

    // Fallback to URL if no title found
    if (!openGraphData.title) {
      openGraphData.title = validUrl.hostname;
    }

    return new Response(
      JSON.stringify(openGraphData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error fetching OpenGraph data:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});