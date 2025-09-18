// module.exports.GarbaGalaTemplate = (data = {}) => {
//   const {
//     layout = "split", // "split" | "royal" | "stub"
//     palette = "royalPurple", // "royalPurple" | "saffronRed" | "peacockTeal"

//     // content
//     mainLogo = "",
//     headline = "",
//     tagline = "",
//     eventName = "",
//     dateText = "",
//     timeText = "",
//     venueText = "",
//     noteText = "",
//     qrCodeLink = "",
//     // ⭐ NEW
//     attendeeName = "",
//     ticketId = "",

//     bgImage = "https://img.pikbest.com/origin/09/05/60/55cpIkbEsTCQb.png!w700wp" // Default background image
//   } = data;

//   const PALETTES = {
//     royalPurple: {
//       bg1: "#5A189A",
//       bg2: "#240046",
//       gold: "#FFD700",
//       goldBright: "#FFB84D",
//       accent: "#FF5DA2",
//     },
//     saffronRed: {
//       bg1: "#ff7b00",
//       bg2: "#a30000",
//       gold: "#ffd166",
//       goldBright: "#ffb84d",
//       accent: "#8b0000",
//     },
//     peacockTeal: {
//       bg1: "#007f7f",
//       bg2: "#003c7e",
//       gold: "#ffd166",
//       goldBright: "#ffb84d",
//       accent: "#00bfa6",
//     },
//   };

//   const C = PALETTES[palette] || PALETTES.royalPurple;

//   const COMMON_HEAD = `
//     <meta charset="UTF-8"/>
//     <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
//     <title>${headline}</title>
//     <link href="https://fonts.googleapis.com/css2?family=Yeseva+One&family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
//     <style>
//       :root{
//         --bg1:${C.bg1}; --bg2:${C.bg2}; --gold:${C.gold}; --goldBright:${C.goldBright}; --accent:${C.accent};
//       }
//       *{box-sizing:border-box}
//       html,body{
//         margin:0;
//         padding:0;
//         height:100%;
//         color:#fff;
//         background:
//           url('${bgImage}') center/cover no-repeat fixed,
//           radial-gradient(circle at center, #D7B9FF 0%, ${C.bg1} 50%, ${C.bg2} 100%);
//         background-blend-mode: overlay;
//         overflow-x:hidden;
//       }
//       /* Mandala background overlay */
//       body::before{
//         content:"";
//         position:fixed;
//         inset:0;
//         background:url('https://svgshare.com/i/16zP.svg') center/cover no-repeat;
//         opacity:0.1;
//         z-index:-2;
//       }
//       /* Golden dust particles animation */
//       body::after{
//         content:"";
//         position:fixed;
//         inset:0;
//         background:
//           radial-gradient(2px 2px at 15% 25%, rgba(255,215,0,0.9), transparent),
//           radial-gradient(1.8px 1.8px at 75% 55%, rgba(255,215,0,0.75), transparent),
//           radial-gradient(2.2px 2.2px at 45% 85%, rgba(255,215,0,0.85), transparent),
//           radial-gradient(1.5px 1.5px at 65% 15%, rgba(255,215,0,0.8), transparent);
//         background-size:cover;
//         animation: sparkle 8s linear infinite alternate;
//         opacity:0.3;
//         z-index:-1;
//       }
//       @keyframes sparkle{
//         0%{background-position:0 0; opacity:0.3;}
//         100%{background-position:150px 300px; opacity:0.5;}
//       }
//       .pass{
//         max-width:980px;
//         margin:24px auto;
//         border:12px solid var(--gold);
//         border-radius:26px;
//         overflow:hidden;
//         box-shadow:
//           0 0 20px rgba(255, 215, 0, 0.4),
//           0 0 40px rgba(255, 184, 77, 0.3),
//           0 12px 40px rgba(0,0,0,.55);
//         position:relative;
//         background:linear-gradient(145deg, rgba(255,255,255,.05) 0%, transparent 60%),
//                    radial-gradient(circle at top right, rgba(255, 184, 77, .08) 0%, transparent 50%);
//       }
//       .spark{
//         position:absolute; inset:0; pointer-events:none; mix-blend-mode:screen; opacity:.25;
//         background:
//           radial-gradient(6px 6px at 10% 15%, #fff, transparent 60%),
//           radial-gradient(8px 8px at 80% 30%, #fff, transparent 60%),
//           radial-gradient(5px 5px at 30% 70%, #fff, transparent 60%),
//           radial-gradient(7px 7px at 65% 85%, #fff, transparent 60%);
//       }
//       .brand{display:flex;align-items:center;gap:12px;justify-content:center}
//       .brand img{max-height:72px;max-width:180px;display:block}
//       .eyebrow{font:600 14px/1 Poppins,system-ui;letter-spacing:.12em;text-transform:uppercase;color:#ffe9b0}
//       .title{
//         font:800 48px/1.1 'Yeseva One',serif;
//         color:var(--gold);
//         text-shadow:
//           0 0 6px var(--goldBright),
//           0 0 16px rgba(255,215,0,.7),
//           0 4px 14px rgba(0,0,0,.6);
//         margin:.15em 0;
//       }
//       .subtitle{font:500 16px/1.5 Poppins,system-ui;opacity:.95}
//       .meta{font:600 16px/1.6 Poppins,system-ui;margin-top:10px}
//       .tag{
//         margin-top:12px;
//         font:700 14px/1 Poppins,system-ui;
//         letter-spacing:.08em;
//         color:#fff;
//         background:linear-gradient(90deg, rgba(255,215,0,.15), rgba(255,184,77,.25));
//         display:inline-block;
//         padding:7px 12px;
//         border-radius:999px;
//         border:1px solid rgba(255,215,0,.4);
//         box-shadow:inset 0 0 10px rgba(255,215,0,.2);
//       }
//       .qr{
//         background:#fff;
//         border:5px solid var(--gold);
//         border-radius:16px;
//         padding:12px;
//         display:inline-block;
//         box-shadow:0 0 15px rgba(255,184,77,.5);
//       }
//       .qr img{width:190px;height:190px;display:block}

//       /* ⭐ NEW: Attendee name badge (above QR) */
//       .nameplate{
//         margin-top:10px;
//         font:700 18px/1.2 Poppins,system-ui;
//         letter-spacing:.04em;
//         color:#1b0f2e;
//         background:
//           linear-gradient(0deg, rgba(255,255,255,.9), rgba(255,255,255,.9)),
//           radial-gradient(circle at 20% 0%, rgba(255,184,77,.35), transparent 60%);
//         border:2px solid var(--gold);
//         border-radius:999px;
//         padding:10px 16px;
//         display:inline-block;
//         max-width:100%;
//         overflow:hidden;
//         text-overflow:ellipsis;
//         white-space:nowrap;
//         box-shadow:
//           0 2px 10px rgba(0,0,0,.25),
//           inset 0 0 8px rgba(255,215,0,.25);
//       }

//       /* ⭐ NEW: Ticket ID (below QR) */
//       .ticketId{
//         margin-top:10px;
//         font:600 14px/1.4 Poppins,system-ui;
//         color:#ffe9b0;
//         background:linear-gradient(90deg, rgba(255,215,0,.10), rgba(255,184,77,.18));
//         border:1px dashed rgba(255,215,0,.55);
//         border-radius:10px;
//         padding:8px 12px;
//         display:inline-block;
//       }
//       .ticketId code{
//         font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
//         font-weight:700;
//         font-size:15px;
//         color:#fff;
//         letter-spacing:.06em;
//       }

//       .ornate:before,.ornate:after{
//         content:""; position:absolute; width:120px; height:120px; border:6px solid var(--gold); border-radius:28px;
//         filter:drop-shadow(0 6px 18px rgba(0,0,0,.35));
//       }
//       .ornate:before{top:-60px; left:-60px; transform:rotate(45deg)}
//       .ornate:after{bottom:-60px; right:-60px; transform:rotate(45deg)}
//       .toran{position:absolute; left:0; right:0; top:0; height:80px; pointer-events:none}
//       .toran svg{width:100%; height:100%}
//     </style>
//   `;

//   const SPLIT_LAYOUT = `
//     <style>
//       .split{display:grid;grid-template-columns:1.1fr .9fr;min-height:520px;position:relative}
//       .left{padding:28px; position:relative; display:flex; flex-direction:column; justify-content:flex-end;}
//       .scallop{position:absolute; top:0; bottom:0; left:calc(100% - 38px); width:76px; pointer-events:none;}
//       .scallop svg{width:100%; height:100%; display:block}
//       .motif{position:absolute; inset:0; opacity:.14; pointer-events:none;}
//       .right{padding:34px 28px; display:grid; place-items:center}
//       .card{max-width:420px; text-align:center}
//       .detail{margin:14px 0}
//     </style>

//     <div class="pass ornate">
//       <div class="toran">
//         <svg viewBox="0 0 1000 200" preserveAspectRatio="none">
//           <defs>
//             <linearGradient id="g" x1="0" x2="1">
//               <stop offset="0" stop-color="#fff"/>
//               <stop offset="1" stop-color="#ffe08a"/>
//             </linearGradient>
//           </defs>
//           <path d="M0,10 Q250,60 500,10 T1000,10" fill="none" stroke="url(#g)" stroke-width="6"/>
//           <g>
//             ${Array.from({ length: 18 }).map((_, i) => {
//     const x = i * 55 + 25;
//     return `<polygon points="${x},40 ${x + 20},100 ${x - 20},100" fill="${i % 2 ? C.gold : '#ffe9b0'}" />`
//   }).join("")}
//           </g>
//         </svg>
//       </div>

//       <div class="split">
//         <div class="left">
//           <div class="brand">
//             <img src="${mainLogo}" alt="Logo"/>
//           </div>
//           <h1 class="title">${headline}</h1>
//           <div class="subtitle">${tagline}</div>
//           <div class="ticketId meta">Date: ${dateText} &nbsp; • &nbsp; Time: ${timeText}</div>
//           <div class="detail meta">Venue: ${venueText}</div>
//           <div class="tag">${noteText}</div>
//           <div class="scallop">
//             <svg viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden="true">
//               <defs><linearGradient id="goldGrad" x1="0" x2="1">
//                 <stop offset="0" stop-color="${C.gold}"/><stop offset="1" stop-color="#ffffff"/>
//               </linearGradient></defs>
//               <rect x="44" y="0" width="12" height="1000" fill="url(#goldGrad)" opacity=".65"/>
//               ${Array.from({ length: 22 }).map((_, i) => {
//     const cy = i * 46 + 24;
//     return `<circle cx="56" cy="${cy}" r="22" fill="none" stroke="${C.gold}" stroke-width="3"/>`
//   }).join("")}
//             </svg>
//           </div>
//         </div>

//         <div class="right">
//           <div class="card">
//             <div class="eyebrow">${eventName || 'Admit One'}</div>
//             <!-- ⭐ NEW: Attendee name above QR -->
//             <div class="nameplate" aria-label="Attendee Name">${attendeeName || 'Guest'}</div>
//             <div style="height:12px"></div>
//             <div class="qr"><img src="${qrCodeLink}" alt="QR Code"></div>
//             <!-- ⭐ NEW: Ticket ID below QR -->
//             <div class="ticketId" aria-label="Ticket ID">Ticket ID: <code>${ticketId || '—'}</code></div>
//             <div style="height:10px"></div>
//             <div class="subtitle">Show this QR at entry</div>
//           </div>
//         </div>
//       </div>
//       <div class="spark"></div>
//     </div>
//   `;

//   const BODY = SPLIT_LAYOUT;

//   return `
//   <!DOCTYPE html>
//   <html lang="en">
//   <head>
//     ${COMMON_HEAD}
//   </head>
//   <body>
//     ${BODY}
//   </body>
//   </html>
//   `;
// };


// garba-gala-template.js
// module.exports.GarbaGalaTemplate = (data = {}) => {
//     const {
//         qrCode = "", // QR code image URL
//         passDate = "23 Sept – 01 Oct", // Date range for pass
//         passType = "Season Pass", // Pass type (Season Pass / Day Pass / Couple Pass)
//         passDescription = "This is a Stag Pass valid for 9 days. We are truly grateful to you for choosing Taal 4.0 to celebrate the joy of Navaratri with us."
//     } = data;

//     return `
//   <!DOCTYPE html>
//   <html lang="en">
  
//   <head>
//       <meta charset="UTF-8" />
//       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//       <title>Taal.life – Live Taal</title>
//       <script src="https://cdn.tailwindcss.com"></script>
//   </head>
  
//   <body class="bg-black flex flex-col items-center min-h-screen">
//       <!-- Top image -->
//       <img src="https://backend.taal.life/uploads/productImages/1758204448383-136473890.png" alt="Upper Banner" class="w-full max-w-screen-md object-contain" />
  
//       <!-- Bottom image with overlay -->
//       <div class="relative w-full max-w-screen-md">
//           <!-- Background image -->
//           <img src="https://backend.taal.life/uploads/productImages/1758209213244-895452281.png" alt="Bottom Banner" class="w-full object-contain" />
  
//           <!-- Ticket content overlay -->
//           <div class="absolute inset-0 flex flex-col justify-between text-white px-6 sm:px-10 py-8">
  
//               <!-- Centered Title -->
//               <h2 class="whitespace-nowrap text-5xl sm:text-6xl font-extrabold uppercase tracking-wide text-center mb-6">
//                   ${passType}
//               </h2>
  
//               <!-- Middle row: Details (left) + QR (right) -->
//               <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-8 space-y-8">
//                   <!-- Left side: Event Details -->
//                   <section class="max-w-md leading-relaxed gap-2.5">
//                       <p class="text-xl font-semibold uppercase">Parmeshwari Garden</p>
//                       <p class="uppercase text-sm text-gray-300">Indore Road, Ujjain</p>
//                       <p class="uppercase text-sm text-gray-300">(M.P.), 456010</p>
  
//                       <p class="text-2xl mt-4 uppercase">${passDate}</p>
//                       <p class="uppercase text-sm text-gray-300">Starting Time: 07:00 PM</p>
  
//                       <p class="mt-4 text-sm uppercase text-gray-300">
//                           ${passDescription}
//                       </p>
//                   </section>
  
//                   <!-- Right side: QR Code -->
//                  <div class="flex flex-col items-center justify-center shrink-0 bg-white rounded-2xl p-4">
//   <img src="${qrCode}" alt="QR Code" 
//        class="w-[300px] h-[300px] object-contain rounded-md shadow-md" />
//   <p class="mt-3 text-sm text-gray-800">Scan for Entry</p>
// </div>

//               </div>
  
//               <!-- Full-width bottom disclaimer -->
//               <section class="w-full text-sm font-bold uppercase leading-relaxed text-gray-300 mt-8 pt-4">
//                   <p>
//                       Only passes purchased from our official website or authorised physical outlets will be considered
//                       valid.
//                       Any passes obtained from other sources will not be accepted.
//                   </p>
//               </section>
//           </div>
//       </div>
//   </body>
  
//   </html>
//   `;
// };



// module.exports.GarbaGalaTemplate = ({ 
//     name, 
//     date, 
//     ticketId, 
//     qrData 
//   }) => {
//     return `
//   <!DOCTYPE html>
//   <html lang="en">
//   <head>
//     <meta charset="UTF-8">
//     <title>Taal Garba Ticket</title>
//     <style>
//       body {
//         margin: 0;
//         padding: 0;
//         background: #000;
//         display: flex;
//         justify-content: center;
//         align-items: center;
//       }
  
//       .ticket {
//         position: relative;
//         width: 750px;
//         height: 1191px;
//         background: url("https://backend.taal.life/uploads/eventBanners/1758228064624-321535410.png") no-repeat center center;
//         background-size: cover;
//         font-family: Arial, sans-serif;
//         color: #fff;
//       }
  
//       /* Name */
//       .name {
//         position: absolute;
//         top: 820px;
//         left: 32px;
//         font-size: 22px;
//         font-weight: bold;
//       }
  
//       /* Date */
//       .date {
//         position: absolute;
//         top: 920px;
//         left: 32px;
//         font-size: 20px;
//         font-weight: bold;
//       }
  
//       /* QR Code */
//       .qr {
//         position: absolute;
//         top: 860px;
//         right: 60px;
//         background: #fff;
//         display: flex;
//         justify-content: center;
//         align-items: center;
//       }
  
//       .qr img {
//         width: 200px;
//         height: 200px;
//       }
  
//       /* Ticket ID */
//       .ticket-id {
//         position: absolute;
//         top: 1070px;
//         right: 60px;
//         font-size: 20px;
//         color: black;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="ticket">
//       <div class="name">${name}</div>
//       <div class="date">${date}</div>
//       <div class="qr">
//         <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}" alt="QR Code">
//       </div>
//       <div class="ticket-id">${ticketId}</div>
//     </div>
//   </body>
//   </html>`;
//   };
  

module.exports.GarbaGalaTemplate = ({ name, date, ticketId, qrCode }) => {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Event Pass</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        margin: auto;
        font-family: 'Montserrat', sans-serif;
        background-color: #000;
      }
    </style>
  </head>
  <body>
    <div class="relative inline-block">
      <!-- Ticket image -->
      <img
        src="https://backend.taal.life/uploads/eventBanners/1758231474727-308762227.png"
        alt="Event Pass"
        class="w-full h-auto object-fill block"
      />
  
      <!-- Name -->
      <div class="absolute top-[69%] left-9 flex flex-col space-y-2 text-white">
        <span class="text-3xl font-semibold uppercase">${name}</span>
      </div>
  
      <!-- Date -->
      <div class="absolute top-[77%] left-9 flex flex-col space-y-2 text-white">
        <span class="text-3xl font-semibold uppercase">${date}</span>
      </div>
  
      <!-- QR Code -->
      <div class="absolute top-[70%] right-6 flex items-center justify-center">
        <img src="${qrCode}" alt="QR Code" class="w-72 h-72 object-contain bg-white" />
      </div>
  
      <!-- Ticket ID -->
      <div class="absolute top-[95%] right-14 flex flex-col space-y-2 text-white">
        <span class="text-2xl font-semibold">${ticketId}</span>
      </div>
    </div>
  </body>
  </html>`;
  };




// module.exports.GarbaGalaTemplate = ({ name, date, ticketId, qrCode }) => {
//     return `
//   <!DOCTYPE html>
//   <html lang="en" class="h-full w-full m-0 p-0">  <!-- Added: Full height/width, no margin/padding on html -->
//   <head>
//     <meta charset="UTF-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//     <title>Event Pass</title>
//     <script src="https://cdn.tailwindcss.com"></script>
//     <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
//     <style>
//       body {
//         margin: 0;  /* Changed: Explicitly 0 margin */
//         padding: 0;  /* Added: No padding */
//         font-family: 'Montserrat', sans-serif;
//         background-color: #000;
//         height: 100vh;  /* Added: Full viewport height */
//         width: 100vw;  /* Added: Full viewport width */
//         overflow: hidden;  /* Added: No scrollbars or extra space */
//       }
//       html {
//         height: 100%;  /* Added: Full height on html too */
//         width: 100%;   /* Added: Full width */
//         margin: 0;
//         padding: 0;
//       }
//     </style>
//   </head>
//   <body class="m-0 p-0">  <!-- Added: Tailwind classes for no margin/padding -->
//     <div class="relative inline-block w-full h-full">  <!-- Changed: Added w-full h-full for full container -->
//       <!-- Ticket image -->
//       <img
//         src="https://backend.taal.life/uploads/eventBanners/1758231474727-308762227.png"
//         alt="Event Pass"
//         class="w-full h-full object-cover block"  <!-- Changed: h-auto to h-full, object-fill to object-cover -->
//       />
  
//       <!-- Name -->
//       <div class="absolute top-[69%] left-9 flex flex-col space-y-2 text-white">
//         <span class="text-3xl font-semibold uppercase">${name}</span>
//       </div>
  
//       <!-- Date -->
//       <div class="absolute top-[77%] left-9 flex flex-col space-y-2 text-white">
//         <span class="text-3xl font-semibold uppercase">${date}</span>
//       </div>
  
//       <!-- QR Code -->
//       <div class="absolute top-[70%] right-6 flex items-center justify-center">
//         <img src="${qrCode}" alt="QR Code" class="w-72 h-72 object-contain bg-white" />
//       </div>
  
//       <!-- Ticket ID -->
//       <div class="absolute top-[95%] right-14 flex flex-col space-y-2 text-white">
//         <span class="text-2xl font-semibold">${ticketId}</span>
//       </div>
//     </div>
//   </body>
//   </html>`;
//   };


  
  