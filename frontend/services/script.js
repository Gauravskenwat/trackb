const I={menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',close:'<path d="M18 6L6 18M6 6l12 12"/>',check:'<path d="M5 12l5 5 9-10"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',pin:'<path d="M12 22s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',chev:'<path d="M9 18l6-6-6-6"/>',hist:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',bus:'<rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 11h16M8 21v-4M16 21v-4"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',seat:'<path d="M7 3v9a2 2 0 0 0 2 2h7M5 21h14M17 14v7"/>',card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',route:'<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h6a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h6"/>'};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;
const hydrate=r=>r.querySelectorAll('[data-i]').forEach(e=>e.innerHTML=ic(e.dataset.i));hydrate(document);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let tt;const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2600)};
const dlg=$('#dlg'),open=(t,h)=>{$('#dt').textContent=t;$('#dbody').innerHTML=h;if(!dlg.open)dlg.showModal()};
$('#dx').onclick=()=>dlg.close();dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
const EM=/^\S+@\S+\.\S+$/,inr=n=>'₹'+Number(n).toLocaleString('en-IN');

/* Shared history storage (same key as the History page) */
let H={cancelled:{},ratings:{},removed:[],added:[]};
try{const s=JSON.parse(localStorage.getItem('sb_history'));if(s&&typeof s=='object')H=Object.assign(H,s)}catch(e){}
if(!Array.isArray(H.added))H.added=[];
const save=()=>{try{localStorage.setItem('sb_history',JSON.stringify(H))}catch(e){}};
const DEMO=[{id:'SB12345678',from:'Delhi',to:'Manali',date:'2026-10-20',fare:1450,pax:1}];

/* Services */
const SV=[['search','Route Search','search'],['booking','Bus Booking','bus'],['seats','Seat Reservation','seat'],['pay','Online Payment','card'],['track','Live Tracking','route'],['hist','Booking History','hist'],['cancel','Cancel Booking','close']];
const INFO={search:['Route Search','Find buses between any two cities.'],booking:['Bus Booking','Choose the bus that suits your schedule.'],seats:['Seat Reservation','Pick your seats on the bus.'],pay:['Online Payment','Pay securely to confirm your booking.'],cancel:['Cancel Booking','Cancel an upcoming trip and get a refund.'],done:['Booking confirmed','Your ticket is ready.']};
const CITIES=['Delhi','Manali','Shimla','Chandigarh','Jaipur','Mumbai','Pune','Bengaluru','Hyderabad','Chennai','Panaji','Ahmedabad','Rajkot','Kolkata','Lucknow','Nagpur','Indore','Bhopal','Surat','Kochi','Coimbatore','Amritsar','Dehradun','Udaipur'];
const STEPS=['Search','Select bus','Seats','Payment'];
let view='search',B={from:'Delhi',to:'Manali',date:new Date().toISOString().slice(0,10),pax:1,bus:null,seats:[]};
const hash=s=>[...s].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
const km=()=>150+hash([B.from,B.to].sort().join())%500;
const BUSES=()=>{const k=km(),b=Math.max(300,Math.round(k*2.6/10)*10);return[['06:00 AM','AC Sleeper',b+250],['09:30 AM','AC Seater',b],['01:15 PM','Non-AC Seater',Math.round(b*.75/10)*10],['09:00 PM','Volvo Multi-Axle',b+150]].map((x,i)=>({id:['VRL Travels','Orange Tours','State Roadways Express','Parveen Travels'][i],dep:x[0],type:x[1],price:x[2],hrs:Math.round(k/55)}))};
const taken=()=>{const h=hash(B.from+B.to+B.bus.id),s=new Set();for(let i=0;i<40;i++)if((h>>(i%20)+i)%3==0&&i%4!=1)s.add(i);return s};
const sname=i=>(Math.floor(i/4)+1)+'ABCD'[i%4];
const ST=n=>`<div class="stp">${STEPS.map((s,i)=>`<span class="${i+1==n?'on':i+1<n?'dn':''}">${i+1}. ${s}</span>`).join('')}</div>`;
const sum=()=>`<div class="sum"><b>${esc(B.from)} → ${esc(B.to)}</b> · ${B.date} · ${B.pax} passenger${B.pax>1?'s':''}${B.bus?`<br><small style="color:var(--mut)">${B.bus.id} · ${B.bus.type} · departs ${B.bus.dep}${B.seats.length?' · Seats '+B.seats.map(sname).join(', '):''}</small>`:''}</div>`;
const total=()=>B.bus?B.bus.price*B.pax:0;

function pSearch(){return ST(1)+`<div class="fm"><label>From<select id="f">${CITIES.map(c=>`<option${c==B.from?' selected':''}>${c}</option>`).join('')}</select></label><label>To<select id="t">${CITIES.map(c=>`<option${c==B.to?' selected':''}>${c}</option>`).join('')}</select></label><label>Date<input id="d" type="date" min="${new Date().toISOString().slice(0,10)}" value="${B.date}"></label><label>Passengers<select id="p">${[1,2,3,4,5,6].map(n=>`<option${n==B.pax?' selected':''}>${n}</option>`).join('')}</select></label></div><div class="bar"><button class="btn o" data-a="swap">Swap cities</button><button class="btn" data-a="search">Search buses</button></div>`}
function pBus(){return ST(2)+sum()+BUSES().map(b=>`<div class="bus"><div><b>${b.dep} · ${b.type}</b><div class="mt">${b.id} · about ${b.hrs} hrs · 40 seats</div></div><div class="rr"><b>${inr(b.price)}</b><button class="btn sm" data-a="pick" data-id="${b.id}">Select seats</button></div></div>`).join('')+`<button class="btn o" data-a="tosearch">Change search</button>`}
function pSeats(){const tk=taken();return ST(3)+sum()+`<div class="lg"><span><i></i>Available</span><span><i class="s"></i>Selected</span><span><i class="t"></i>Booked</span></div><div class="deck">${Array.from({length:50},(_,i)=>{const c=i%5;if(c==2)return'<span class="a"></span>';const n=Math.floor(i/5)*4+(c<2?c:c-1);return`<button class="seat${tk.has(n)?' t':B.seats.includes(n)?' s':''}" data-seat="${n}" ${tk.has(n)?'disabled':''} aria-label="Seat ${sname(n)}">${sname(n)}</button>`}).join('')}</div><div class="bar"><span>Selected ${B.seats.length} of ${B.pax} · <b>${inr(total())}</b></span><span style="display:flex;gap:8px"><button class="btn o" data-a="tobus">Back</button><button class="btn" data-a="topay">Continue to payment</button></span></div>`}
function pPay(){return ST(4)+sum()+`<div style="margin-bottom:12px"><b>Total payable: ${inr(total())}</b></div>${[['upi','UPI'],['card','Credit / Debit card'],['net','Net banking']].map((m,i)=>`<label class="opt"><input type="radio" name="m" value="${m[0]}"${i==0?' checked':''}>${m[1]}</label>`).join('')}<div class="fm" id="mf" style="margin-top:12px"></div><div class="fm"><label>Passenger name<input id="pn" placeholder="Full name"></label><label>Phone<input id="ph" inputmode="tel" placeholder="+91 98765 43210"></label></div><div class="bar"><button class="btn o" data-a="toseats">Back</button><button class="btn" data-a="pay">Pay ${inr(total())}</button></div>`}
const MF={upi:'<label>UPI ID<input id="m1" placeholder="name@bank"></label>',card:'<label>Card number<input id="m1" inputmode="numeric" maxlength="19" placeholder="1234 5678 9012 3456"></label><label>Expiry (MM/YY)<input id="m2" maxlength="5" placeholder="08/27"></label><label>CVV<input id="m3" type="password" inputmode="numeric" maxlength="3" placeholder="•••"></label>',net:'<label>Bank<select id="m1"><option>State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Axis Bank</option></select></label>'};
const mine=()=>DEMO.concat(H.added).filter(t=>(t.status||'upcoming')=='upcoming'&&!H.cancelled[t.id]);
function pCancel(){const l=mine();return l.length?l.map(t=>`<div class="li"><div class="grow"><b>${esc(t.from)} → ${esc(t.to)}</b><small>${t.id} · ${t.date} · ${inr(t.fare*t.pax)}</small></div><button class="btn red sm" data-a="cancel" data-id="${t.id}">Cancel</button></div>`).join(''):'<div class="empty">'+ic('check')+'<b>No upcoming bookings</b>Nothing to cancel right now.</div>'}
function pDone(){const t=B.done;return `<div class="ok">${ic('check')}<h2>Payment successful</h2><p>Booking <b>${t.id}</b> · ${esc(t.from)} → ${esc(t.to)} · Seats ${esc(t.seat)}<br>Paid ${inr(t.fare*t.pax)} with ${esc(t.pay)}</p><div class="go"><a class="btn" href="../history/index.html">View in history</a><a class="btn o" href="../tracking/index.html">Track bus</a><button class="btn o" data-a="again">Book another</button></div></div>`}

function render(){const key=view=='done'?'booking':view;$$('#navs .nv[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v==key));
const i=INFO[view],step={search:pSearch,booking:pBus,seats:pSeats,pay:pPay,cancel:pCancel,done:pDone}[view];
$('#mt').textContent=i[0];$('#ms').textContent=i[1];$('#body').innerHTML=step();hydrate($('#body'));if(view=='pay')mf()}
const mf=()=>{$('#mf').innerHTML=MF[document.querySelector('input[name=m]:checked').value]};
function go(v){const need={booking:!!B.from,seats:!!B.bus,pay:B.bus&&B.seats.length==B.pax};
if(v=='booking'&&view=='search'&&!B.searched){return toast('Search a route first')}
if(v=='seats'&&!B.bus){toast('Pick a bus first');v=B.searched?'booking':'search'}
else if(v=='pay'&&!(B.bus&&B.seats.length==B.pax)){toast(B.bus?`Select ${B.pax} seat${B.pax>1?'s':''} first`:'Pick a bus first');v=B.bus?'seats':B.searched?'booking':'search'}
view=v;render();history.replaceState(null,'','?s='+v);if(innerWidth<1000)$('.main').scrollIntoView({behavior:'smooth'})}

/* Sidebar */
$('#navs').innerHTML=SV.map(s=>`<button class="nv" data-v="${s[0]}">${ic(s[2])}<span>${s[1]}</span>${ic('chev').replace('class="ic"','class="ic ch"')}</button>`).join('');
$('#navs').onclick=e=>{const b=e.target.closest('[data-v]');if(!b)return;const v=b.dataset.v;if(v=='track')location.href='../tracking/index.html';else if(v=='hist')location.href='../history/index.html';else if(v=='booking'&&!B.searched){view='search';B.searched=0;go('search');toast('Search a route first')}else go(v)};

/* Actions */
document.addEventListener('change',e=>{if(e.target.name=='m')mf()});
document.addEventListener('input',e=>{if(e.target.id=='m1'&&$('input[name=m]:checked')?.value=='card')e.target.value=e.target.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()});
document.addEventListener('click',e=>{
const s=e.target.closest('[data-seat]');if(s){const n=+s.dataset.seat,i=B.seats.indexOf(n);if(i>=0)B.seats.splice(i,1);else if(B.seats.length<B.pax)B.seats.push(n);else return toast(`You can select ${B.pax} seat${B.pax>1?'s':''} only`);render();return}
const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
if(a=='swap'){B.from=$('#f').value;B.to=$('#t').value;[B.from,B.to]=[B.to,B.from];B.date=$('#d').value||B.date;B.pax=+$('#p').value;render()}
else if(a=='search'){const f=$('#f').value,t=$('#t').value,d=$('#d').value;if(f==t)return toast('Choose two different cities');if(!d||d<new Date().toISOString().slice(0,10))return toast('Choose today or a future date');Object.assign(B,{from:f,to:t,date:d,pax:+$('#p').value,bus:null,seats:[],searched:1});go('booking')}
else if(a=='pick'){B.bus=BUSES().find(x=>x.id==b.dataset.id);B.seats=[];go('seats')}
else if(a=='tosearch')go('search');else if(a=='tobus')go('booking');else if(a=='toseats')go('seats');
else if(a=='topay')go('pay');
else if(a=='pay')payNow();
else if(a=='again'){B={from:B.from,to:B.to,date:B.date,pax:1,bus:null,seats:[]};go('search')}
else if(a=='cancel'){const t=DEMO.concat(H.added).find(x=>x.id==b.dataset.id);open('Cancel booking?',`<div>Cancel <b>${esc(t.from)} → ${esc(t.to)}</b>? Your refund of <b>${inr(t.fare*t.pax)}</b> returns to your original payment method in 5–7 working days.</div><div style="display:flex;gap:10px"><button class="btn o" data-a="keep" style="flex:1">Keep booking</button><button class="btn red" data-a="yes" data-id="${t.id}" style="flex:1">Cancel booking</button></div>`)}
else if(a=='keep')dlg.close();
else if(a=='yes'){H.cancelled[b.dataset.id]=1;save();dlg.close();render();toast('Booking cancelled · refund on its way')}});
function payNow(){const m=$('input[name=m]:checked').value,v=i=>($('#m'+i)?.value||'').trim(),name=$('#pn').value.trim(),ph=$('#ph').value.trim();let pay;
if(name.length<2)return toast('Enter the passenger name');if(!/^\+?[\d\s-]{10,}$/.test(ph))return toast('Enter a valid phone number');
if(m=='upi'){if(!/^[\w.-]+@[\w]+$/.test(v(1)))return toast('Enter a valid UPI ID');pay='UPI '+v(1)}
else if(m=='card'){const n=v(1).replace(/\s/g,'');if(n.length<13)return toast('Enter a valid card number');if(!/^(0[1-9]|1[0-2])\/\d{2}$/.test(v(2)))return toast('Expiry must be MM/YY');if(!/^\d{3}$/.test(v(3)))return toast('Enter the 3-digit CVV');pay='Card ending '+n.slice(-4)}
else pay='Net banking – '+v(1);
const d=new Date(B.date+'T00:00'),t={id:'SB'+(Date.now()%1e8+1e7),from:B.from,to:B.to,date:B.date,dep:B.bus.dep,arr:'—',bus:B.bus.id,seat:B.seats.map(sname).join(', '),pax:B.pax,fare:B.bus.price,km:km(),pay,status:'upcoming',board:B.from+' Bus Stand',drop:B.to+' Bus Stand'};
H.added.push(t);save();B.done=t;view='done';render();history.replaceState(null,'','?s=done');toast('Payment successful')}

/* Header / footer */
$('#menu').onclick=()=>$('#nav').classList.toggle('show');
const NAVTO={'Track Bus':'../tracking/index.html','History':'../history/index.html','Profile':'../profile/index.html'};
$$('[data-nav]').forEach(b=>b.onclick=()=>{const n=b.dataset.nav;$('#nav').classList.remove('show');if(NAVTO[n])location.href=NAVTO[n];else go('search')});
$('#npop').innerHTML='<button><b>Bus is at Sonipat</b><small>On time · 2 min ago</small></button><button><b>Boarding confirmed</b><small>Seat 12A · Delhi</small></button>';
$('#bell').onclick=e=>{e.stopPropagation();$('#npop').classList.toggle('show');$('#bdot').style.display='none'};
$('#npop').onclick=e=>{e.stopPropagation();if(e.target.closest('button'))toast('Notification opened')};
document.addEventListener('click',()=>$('#npop').classList.remove('show'));
$('#login').onclick=()=>{location.href='../trackb-signup/index.html?mode=login'};$('#signup').onclick=()=>{location.href='../trackb-signup/index.html?mode=signup'};
const LINKTO={'Home':'../index.html','Book Ticket':'../index.html#routes','Track Bus':'../tracking/index.html','My Trips':'../history/index.html'};
$$('a[data-l]').forEach(a=>a.onclick=()=>{const u=LINKTO[a.dataset.l];if(u)location.href=u;else toast(a.dataset.l+' opens here')});
$$('[data-s]').forEach(b=>b.onclick=()=>toast('Opening '+b.dataset.s));
$('#sub').onclick=()=>{const v=$('#em').value.trim();if(!EM.test(v))return toast('Enter a valid email address');$('#em').value='';toast('Subscribed! Check your inbox')};

const q=new URLSearchParams(location.search).get('s');view=q=='cancel'?'cancel':'search';render();if(['booking','seats','pay'].includes(q))toast('Search a route first');
