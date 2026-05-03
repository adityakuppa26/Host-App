# CFA Level 2 Sprint App

A tiny, no-login, no-database revision app for short CFA Level 2 quiz sprints.

Modes included:
- The Ton: Bridgerton-flavored approval meter and gossip-sheet review.
- Boss Rush: topic bosses, HP meter, and battle-style feedback.
- Lightning: faster timer, streak pressure, and quick correction review.

Music and sound effects are generated in the browser, so there are no audio files or extra dependencies.

## Run

```bash
python3 app.py
```

Open `http://127.0.0.1:8000`.

For another device on your home Wi-Fi:

```bash
python app.py --host 0.0.0.0 --port 8000
```

Then open `http://YOUR-LAPTOP-IP:8000` from the other device.

For public internet access, use a tunnel such as Cloudflare Tunnel, Tailscale Funnel, or ngrok, or configure router port forwarding carefully.

## Render

When deploying this repository as a Render Web Service:

- Environment: Python
- Build command: leave blank
- Start command: `python app.py`

The app reads Render's `PORT` environment variable and binds to `0.0.0.0` automatically.
