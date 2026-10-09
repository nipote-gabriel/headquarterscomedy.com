// POST /api/subscribe  { email }
// Adds the email to the Headquarters Comedy Beehiiv publication.
//
// Needs two environment variables in Vercel (Project → Settings →
// Environment Variables):
//   BEEHIIV_API_KEY         - Beehiiv → Settings → API → create key
//   BEEHIIV_PUBLICATION_ID  - same page, looks like "pub_xxxxxxxx-..."
//                             (BEEHIIV_PUB_ID also works)
// The key stays on the server; it never reaches the browser.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
    const apiKey = process.env.BEEHIIV_API_KEY;
    const publicationId = process.env.BEEHIIV_PUBLICATION_ID || process.env.BEEHIIV_PUB_ID;

    // Visiting /api/subscribe in a browser shows whether it's set up
    // (never reveals the values themselves).
    if (req.method === 'GET') {
        return res.status(200).json({
            ok: true,
            has_api_key: Boolean(apiKey),
            has_publication_id: Boolean(publicationId),
            publication_id_looks_right: Boolean(publicationId && /^pub_[0-9a-f-]{36}$/i.test(publicationId.trim()))
        });
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

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
        const r = await fetch(`https://api.beehiiv.com/v2/publications/${encodeURIComponent(publicationId.trim())}/subscriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                reactivate_existing: true,
                double_opt_override: 'off',
                send_welcome_email: true,
                utm_source: 'headquarterscomedy.com',
                utm_medium: 'website',
                referring_site: 'https://headquarterscomedy.com'
            })
        });

        const text = await r.text().catch(() => '');
        if (!r.ok) {
            console.error('Beehiiv subscribe failed', r.status, text.slice(0, 500));
            // Pass Beehiiv's status and error message through for debugging;
            // it never contains the API key.
            let message = '';
            try {
                const j = JSON.parse(text);
                message = (j.errors && j.errors[0] && (j.errors[0].message || j.errors[0].code)) || j.message || '';
            } catch (e) { /* not JSON */ }
            return res.status(502).json({ ok: false, error: 'upstream_error', beehiiv_status: r.status, beehiiv_message: String(message).slice(0, 200) });
        }

        // Beehiiv returns the subscription; "pending" means it's
        // waiting on double opt-in. "validating" is just Beehiiv checking the
        // address, which counts as subscribed.
        let status = '';
        try { status = (JSON.parse(text).data || {}).status || ''; } catch (e) { /* ignore */ }
        return res.status(200).json({ ok: true, status });
    } catch (err) {
        console.error('Beehiiv subscribe error', err);
        return res.status(502).json({ ok: false, error: 'upstream_error' });
    }
};
