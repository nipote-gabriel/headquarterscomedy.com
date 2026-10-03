// POST /api/subscribe  { email }
// Adds the email to the Headquarters Comedy Beehiiv publication.
//
// Needs two environment variables in Vercel (Project → Settings →
// Environment Variables):
//   BEEHIIV_API_KEY         - Beehiiv → Settings → API → create key
//   BEEHIIV_PUBLICATION_ID  - same page, looks like "pub_xxxxxxxx-..."
// The key stays on the server; it never reaches the browser.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const apiKey = process.env.BEEHIIV_API_KEY;
    const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
    if (!apiKey || !publicationId) {
        return res.status(503).json({ ok: false, error: 'not_configured' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const email = String((body && body.email) || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) {
        return res.status(400).json({ ok: false, error: 'invalid_email' });
    }

    try {
        const r = await fetch(`https://api.beehiiv.com/v2/publications/${encodeURIComponent(publicationId)}/subscriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                reactivate_existing: true,
                send_welcome_email: true,
                utm_source: 'headquarterscomedy.com',
                utm_medium: 'website',
                referring_site: 'https://headquarterscomedy.com'
            })
        });

        if (!r.ok) {
            const detail = await r.text().catch(() => '');
            console.error('Beehiiv subscribe failed', r.status, detail.slice(0, 500));
            return res.status(502).json({ ok: false, error: 'upstream_error' });
        }
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Beehiiv subscribe error', err);
        return res.status(502).json({ ok: false, error: 'upstream_error' });
    }
};
