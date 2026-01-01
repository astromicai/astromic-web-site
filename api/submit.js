export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ result: 'error', error: 'Method Not Allowed' });
    }

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

    if (!GOOGLE_SCRIPT_URL) {
        console.error('GOOGLE_SCRIPT_URL is not set in Vercel Environment Variables');
        return res.status(500).json({ result: 'error', error: 'Server Configuration Error' });
    }

    try {
        // Forward the body directly
        // Note: Vercel parses JSON body automatically, but for FormData (multipart), 
        // it's often easier to just pass the data as URL-encoded or JSON if we control the client.
        // However, our client sends FormData.

        // Simplest approach for GAS: Send as URL-encoded parameters or JSON.
        // Let's assume the client sends JSON or we convert it.
        // Actually, GAS `doPost` expects `e.parameter` which usually comes from form-data or url-encoded.
        // Sending JSON to GAS requires `e.postData.contents` parsing.

        // To minimize breakage, we will assume the client sends JSON to *us* (the proxy),
        // and we forward it to GAS.

        // Let's look at how we'll modify script.js first. 
        // We will change script.js to send JSON to this endpoint.

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            // Convert body to URLSearchParams for GAS to read it as parameters
            body: new URLSearchParams(req.body).toString(),
        });

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        return res.status(500).json({ result: 'error', error: error.message });
    }
}
