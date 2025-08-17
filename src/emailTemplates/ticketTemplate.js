module.exports.GarbaGalaTemplate = (data = {}) => {
  const {
    layout = "split", // "split" | "royal" | "stub"
    palette = "royalPurple", // "royalPurple" | "saffronRed" | "peacockTeal"

    // content
    mainLogo = "",
    headline = "",
    tagline = "",
    eventName = "",
    dateText = "",
    timeText = "",
    venueText = "",
    noteText = "",
    qrCodeLink = "",
    // ⭐ NEW
    attendeeName = "",
    ticketId = "",

    bgImage = "https://img.pikbest.com/origin/09/05/60/55cpIkbEsTCQb.png!w700wp" // Default background image
  } = data;

  const PALETTES = {
    royalPurple: {
      bg1: "#5A189A",
      bg2: "#240046",
      gold: "#FFD700",
      goldBright: "#FFB84D",
      accent: "#FF5DA2",
    },
    saffronRed: {
      bg1: "#ff7b00",
      bg2: "#a30000",
      gold: "#ffd166",
      goldBright: "#ffb84d",
      accent: "#8b0000",
    },
    peacockTeal: {
      bg1: "#007f7f",
      bg2: "#003c7e",
      gold: "#ffd166",
      goldBright: "#ffb84d",
      accent: "#00bfa6",
    },
  };

  const C = PALETTES[palette] || PALETTES.royalPurple;

  const COMMON_HEAD = `
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${headline}</title>
    <link href="https://fonts.googleapis.com/css2?family=Yeseva+One&family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
      :root{
        --bg1:${C.bg1}; --bg2:${C.bg2}; --gold:${C.gold}; --goldBright:${C.goldBright}; --accent:${C.accent};
      }
      *{box-sizing:border-box}
      html,body{
        margin:0;
        padding:0;
        height:100%;
        color:#fff;
        background:
          url('${bgImage}') center/cover no-repeat fixed,
          radial-gradient(circle at center, #D7B9FF 0%, ${C.bg1} 50%, ${C.bg2} 100%);
        background-blend-mode: overlay;
        overflow-x:hidden;
      }
      /* Mandala background overlay */
      body::before{
        content:"";
        position:fixed;
        inset:0;
        background:url('https://svgshare.com/i/16zP.svg') center/cover no-repeat;
        opacity:0.1;
        z-index:-2;
      }
      /* Golden dust particles animation */
      body::after{
        content:"";
        position:fixed;
        inset:0;
        background:
          radial-gradient(2px 2px at 15% 25%, rgba(255,215,0,0.9), transparent),
          radial-gradient(1.8px 1.8px at 75% 55%, rgba(255,215,0,0.75), transparent),
          radial-gradient(2.2px 2.2px at 45% 85%, rgba(255,215,0,0.85), transparent),
          radial-gradient(1.5px 1.5px at 65% 15%, rgba(255,215,0,0.8), transparent);
        background-size:cover;
        animation: sparkle 8s linear infinite alternate;
        opacity:0.3;
        z-index:-1;
      }
      @keyframes sparkle{
        0%{background-position:0 0; opacity:0.3;}
        100%{background-position:150px 300px; opacity:0.5;}
      }
      .pass{
        max-width:980px;
        margin:24px auto;
        border:12px solid var(--gold);
        border-radius:26px;
        overflow:hidden;
        box-shadow:
          0 0 20px rgba(255, 215, 0, 0.4),
          0 0 40px rgba(255, 184, 77, 0.3),
          0 12px 40px rgba(0,0,0,.55);
        position:relative;
        background:linear-gradient(145deg, rgba(255,255,255,.05) 0%, transparent 60%),
                   radial-gradient(circle at top right, rgba(255, 184, 77, .08) 0%, transparent 50%);
      }
      .spark{
        position:absolute; inset:0; pointer-events:none; mix-blend-mode:screen; opacity:.25;
        background:
          radial-gradient(6px 6px at 10% 15%, #fff, transparent 60%),
          radial-gradient(8px 8px at 80% 30%, #fff, transparent 60%),
          radial-gradient(5px 5px at 30% 70%, #fff, transparent 60%),
          radial-gradient(7px 7px at 65% 85%, #fff, transparent 60%);
      }
      .brand{display:flex;align-items:center;gap:12px;justify-content:center}
      .brand img{max-height:72px;max-width:180px;display:block}
      .eyebrow{font:600 14px/1 Poppins,system-ui;letter-spacing:.12em;text-transform:uppercase;color:#ffe9b0}
      .title{
        font:800 48px/1.1 'Yeseva One',serif;
        color:var(--gold);
        text-shadow:
          0 0 6px var(--goldBright),
          0 0 16px rgba(255,215,0,.7),
          0 4px 14px rgba(0,0,0,.6);
        margin:.15em 0;
      }
      .subtitle{font:500 16px/1.5 Poppins,system-ui;opacity:.95}
      .meta{font:600 16px/1.6 Poppins,system-ui;margin-top:10px}
      .tag{
        margin-top:12px;
        font:700 14px/1 Poppins,system-ui;
        letter-spacing:.08em;
        color:#fff;
        background:linear-gradient(90deg, rgba(255,215,0,.15), rgba(255,184,77,.25));
        display:inline-block;
        padding:7px 12px;
        border-radius:999px;
        border:1px solid rgba(255,215,0,.4);
        box-shadow:inset 0 0 10px rgba(255,215,0,.2);
      }
      .qr{
        background:#fff;
        border:5px solid var(--gold);
        border-radius:16px;
        padding:12px;
        display:inline-block;
        box-shadow:0 0 15px rgba(255,184,77,.5);
      }
      .qr img{width:190px;height:190px;display:block}

      /* ⭐ NEW: Attendee name badge (above QR) */
      .nameplate{
        margin-top:10px;
        font:700 18px/1.2 Poppins,system-ui;
        letter-spacing:.04em;
        color:#1b0f2e;
        background:
          linear-gradient(0deg, rgba(255,255,255,.9), rgba(255,255,255,.9)),
          radial-gradient(circle at 20% 0%, rgba(255,184,77,.35), transparent 60%);
        border:2px solid var(--gold);
        border-radius:999px;
        padding:10px 16px;
        display:inline-block;
        max-width:100%;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        box-shadow:
          0 2px 10px rgba(0,0,0,.25),
          inset 0 0 8px rgba(255,215,0,.25);
      }

      /* ⭐ NEW: Ticket ID (below QR) */
      .ticketId{
        margin-top:10px;
        font:600 14px/1.4 Poppins,system-ui;
        color:#ffe9b0;
        background:linear-gradient(90deg, rgba(255,215,0,.10), rgba(255,184,77,.18));
        border:1px dashed rgba(255,215,0,.55);
        border-radius:10px;
        padding:8px 12px;
        display:inline-block;
      }
      .ticketId code{
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-weight:700;
        font-size:15px;
        color:#fff;
        letter-spacing:.06em;
      }

      .ornate:before,.ornate:after{
        content:""; position:absolute; width:120px; height:120px; border:6px solid var(--gold); border-radius:28px;
        filter:drop-shadow(0 6px 18px rgba(0,0,0,.35));
      }
      .ornate:before{top:-60px; left:-60px; transform:rotate(45deg)}
      .ornate:after{bottom:-60px; right:-60px; transform:rotate(45deg)}
      .toran{position:absolute; left:0; right:0; top:0; height:80px; pointer-events:none}
      .toran svg{width:100%; height:100%}
    </style>
  `;

  const SPLIT_LAYOUT = `
    <style>
      .split{display:grid;grid-template-columns:1.1fr .9fr;min-height:520px;position:relative}
      .left{padding:28px; position:relative; display:flex; flex-direction:column; justify-content:flex-end;}
      .scallop{position:absolute; top:0; bottom:0; left:calc(100% - 38px); width:76px; pointer-events:none;}
      .scallop svg{width:100%; height:100%; display:block}
      .motif{position:absolute; inset:0; opacity:.14; pointer-events:none;}
      .right{padding:34px 28px; display:grid; place-items:center}
      .card{max-width:420px; text-align:center}
      .detail{margin:14px 0}
    </style>

    <div class="pass ornate">
      <div class="toran">
        <svg viewBox="0 0 1000 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0" stop-color="#fff"/>
              <stop offset="1" stop-color="#ffe08a"/>
            </linearGradient>
          </defs>
          <path d="M0,10 Q250,60 500,10 T1000,10" fill="none" stroke="url(#g)" stroke-width="6"/>
          <g>
            ${Array.from({ length: 18 }).map((_, i) => {
    const x = i * 55 + 25;
    return `<polygon points="${x},40 ${x + 20},100 ${x - 20},100" fill="${i % 2 ? C.gold : '#ffe9b0'}" />`
  }).join("")}
          </g>
        </svg>
      </div>

      <div class="split">
        <div class="left">
          <div class="brand">
            <img src="${mainLogo}" alt="Logo"/>
          </div>
          <h1 class="title">${headline}</h1>
          <div class="subtitle">${tagline}</div>
          <div class="ticketId meta">Date: ${dateText} &nbsp; • &nbsp; Time: ${timeText}</div>
          <div class="detail meta">Venue: ${venueText}</div>
          <div class="tag">${noteText}</div>
          <div class="scallop">
            <svg viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden="true">
              <defs><linearGradient id="goldGrad" x1="0" x2="1">
                <stop offset="0" stop-color="${C.gold}"/><stop offset="1" stop-color="#ffffff"/>
              </linearGradient></defs>
              <rect x="44" y="0" width="12" height="1000" fill="url(#goldGrad)" opacity=".65"/>
              ${Array.from({ length: 22 }).map((_, i) => {
    const cy = i * 46 + 24;
    return `<circle cx="56" cy="${cy}" r="22" fill="none" stroke="${C.gold}" stroke-width="3"/>`
  }).join("")}
            </svg>
          </div>
        </div>

        <div class="right">
          <div class="card">
            <div class="eyebrow">${eventName || 'Admit One'}</div>
            <!-- ⭐ NEW: Attendee name above QR -->
            <div class="nameplate" aria-label="Attendee Name">${attendeeName || 'Guest'}</div>
            <div style="height:12px"></div>
            <div class="qr"><img src="${qrCodeLink}" alt="QR Code"></div>
            <!-- ⭐ NEW: Ticket ID below QR -->
            <div class="ticketId" aria-label="Ticket ID">Ticket ID: <code>${ticketId || '—'}</code></div>
            <div style="height:10px"></div>
            <div class="subtitle">Show this QR at entry</div>
          </div>
        </div>
      </div>
      <div class="spark"></div>
    </div>
  `;

  const BODY = SPLIT_LAYOUT;

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    ${COMMON_HEAD}
  </head>
  <body>
    ${BODY}
  </body>
  </html>
  `;
};
