const PRODUCTS = [
  { id: 1, sku: 'ET-YRG', name: 'يرقاتشيف', origin: 'إثيوبيا', alt: '1,950 م', process: 'مغسول', roast: 2, notes: 'ياسمين، خوخ، ليمون', size: '250 جم', cat: 'بن مختص', price: 68, old: 85, tag: 'الأكثر طلباً', bag: '#1E2A22', label: '#F2EEE6', accent: '#B5381C' },
  { id: 2, sku: 'CO-HUI', name: 'هويلا', origin: 'كولومبيا', alt: '1,700 م', process: 'مغسول', roast: 3, notes: 'كراميل، كاكاو', size: '250 جم', cat: 'بن مختص', price: 59, bag: '#6B2B16', label: '#F2EEE6', accent: '#1E2A22' },
  { id: 3, sku: 'BR-SAN', name: 'سانتوس', origin: 'البرازيل', alt: '1,100 م', process: 'طبيعي', roast: 4, notes: 'لوز، شوكولاتة داكنة', size: '250 جم', cat: 'بن مختص', price: 49, bag: '#2A1D16', label: '#E7E1D5', accent: '#B5381C' },
  { id: 4, sku: 'KE-NYR', name: 'نييري', origin: 'كينيا', alt: '1,800 م', process: 'مغسول', roast: 2, notes: 'توت أسود، طماطم حلوة', size: '250 جم', cat: 'بن مختص', price: 74, tag: 'جديد', bag: '#B5381C', label: '#F2EEE6', accent: '#16110E' },
  { id: 5, sku: 'SA-HEL', name: 'قهوة سعودية بالهيل', origin: 'مزيج', alt: '—', process: 'مطحون ناعم', roast: 1, notes: 'هيل، قرنفل', size: '500 جم', cat: 'قهوة سعودية', price: 55, bag: '#C9A24B', label: '#16110E', accent: '#B5381C', dark: true },
  { id: 6, sku: 'SA-ZAF', name: 'قهوة سعودية بالزعفران', origin: 'مزيج', alt: '—', process: 'مطحون ناعم', roast: 1, notes: 'هيل، زعفران', size: '500 جم', cat: 'قهوة سعودية', price: 79, old: 95, bag: '#E3B04B', label: '#16110E', accent: '#B5381C', dark: true },
  { id: 7, sku: 'CP-ESP', name: 'كبسولات إسبريسو', origin: 'مزيج', alt: '—', process: '30 كبسولة', roast: 4, notes: 'قوة 8، كراميل', size: '30 حبة', cat: 'كبسولات', price: 89, bag: '#16110E', label: '#B5381C', accent: '#F2EEE6' },
  { id: 8, sku: 'EQ-V60', name: 'طقم V60', origin: 'مستلزمات', alt: '—', process: 'قمع، إبريق، 100 فلتر', roast: 0, notes: 'سيراميك أبيض', size: 'طقم', cat: 'مستلزمات', price: 139, old: 169, tag: 'خصم', bag: '#F2EEE6', label: '#16110E', accent: '#B5381C' }
];

const $ = (s, r = document) => r.querySelector(s);
const fmt = n => n + ' ر.س';

/* ---- drawn product art (no external images) ---- */
function bag(p, w = 120) {
  const tx = p.label === '#16110E' ? '#F2EEE6' : '#16110E';
  const ink = p.dark ? '#16110E' : p.bag === '#F2EEE6' ? '#16110E' : '#F2EEE6';
  return `<svg viewBox="0 0 120 170" role="img" aria-label="${p.name}">
    <path d="M14 22h92l6 138a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6z" fill="${p.bag}"/>
    <path d="M14 22h92l1 14H13z" fill="#000" opacity=".22"/>
    <path d="M14 22 20 8h80l6 14" fill="${p.bag}" stroke="#000" stroke-opacity=".25"/>
    <path d="M20 8h80" stroke="#000" stroke-opacity=".3" stroke-width="3"/>
    <rect x="22" y="52" width="76" height="86" fill="${p.label}"/>
    <rect x="22" y="52" width="76" height="8" fill="${p.accent}"/>
    <text x="60" y="84" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="${tx}" letter-spacing="1">${p.sku}</text>
    <text x="60" y="104" text-anchor="middle" font-family="El Messiri,serif" font-weight="700" font-size="${p.name.length > 9 ? 11 : 16}" fill="${tx}">${p.name.length > 14 ? p.name.slice(0, 11) : p.name}</text>
    <line x1="32" y1="114" x2="88" y2="114" stroke="${tx}" stroke-width="1"/>
    <text x="60" y="128" text-anchor="middle" font-family="IBM Plex Sans Arabic,sans-serif" font-size="8" fill="${tx}">${p.origin}</text>
    <circle cx="60" cy="38" r="5" fill="none" stroke="${ink}" stroke-opacity=".7" stroke-width="1.5"/>
  </svg>`;
}
function capsules(p) {
  return `<svg viewBox="0 0 120 150"><rect x="12" y="30" width="96" height="108" fill="${p.bag}"/><rect x="12" y="30" width="96" height="22" fill="${p.label}"/><circle cx="60" cy="96" r="22" fill="none" stroke="#F2EEE6" stroke-width="4"/><circle cx="60" cy="96" r="7" fill="${p.label}"/></svg>`;
}
function dripper(p) {
  return `<svg viewBox="0 0 120 150"><path d="M16 14h88L74 80H46z" fill="${p.bag}" stroke="#16110E" stroke-width="3"/><rect x="46" y="80" width="28" height="9" fill="#16110E"/><path d="M30 92h60l-6 44H36z" fill="#fff" stroke="#16110E" stroke-width="3"/><path d="M37 114h46l-3 22H40z" fill="#2A1D16"/></svg>`;
}
const art = p => p.cat === 'كبسولات' ? capsules(p) : p.cat === 'مستلزمات' ? dripper(p) : bag(p);

/* ---- hero batch data ---- */
(function () {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const str = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  $('#roastDate').textContent = str;
  $('#heroBag').innerHTML = bag(PRODUCTS[0]);
})();

/* ---- cart ---- */
let cart = [];
try { cart = JSON.parse(localStorage.getItem('cart')) || []; } catch (e) {}
const save = () => { try { localStorage.setItem('cart', JSON.stringify(cart)); } catch (e) {} };

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 1800);
}

function renderCart() {
  const box = $('#cartItems');
  cart = cart.filter(i => PRODUCTS.some(p => p.id === i.id));
  const count = cart.reduce((a, i) => a + i.qty, 0);
  const total = cart.reduce((a, i) => a + i.qty * PRODUCTS.find(p => p.id === i.id).price, 0);
  $('#cartCount').textContent = count;
  $('#cartTotal').textContent = fmt(total);
  if (!cart.length) { box.innerHTML = '<div class="empty">السلة فاضية.<br>اختر من المحمصة.</div>'; return; }
  box.innerHTML = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return `<div class="item">
      <div class="mini">${art(p)}</div>
      <div class="meta"><b>${p.name}</b><span>${p.size} · ${fmt(p.price)}</span></div>
      <div class="qty"><button data-d="1" data-id="${p.id}" aria-label="زيادة">+</button><b>${i.qty}</b><button data-d="-1" data-id="${p.id}" aria-label="نقص">−</button></div>
    </div>`;
  }).join('');
}

function add(id) {
  const it = cart.find(i => i.id === id);
  it ? it.qty++ : cart.push({ id, qty: 1 });
  save(); renderCart(); toast('أُضيف للسلة');
}

$('#cartItems').addEventListener('click', e => {
  const b = e.target.closest('button[data-id]');
  if (!b) return;
  const it = cart.find(i => i.id === +b.dataset.id);
  it.qty += +b.dataset.d;
  if (it.qty <= 0) cart = cart.filter(i => i !== it);
  save(); renderCart();
});

const drawer = $('#drawer'), overlay = $('#overlay');
const toggleCart = open => { drawer.classList.toggle('show', open); overlay.classList.toggle('show', open); };
$('#openCart').onclick = () => toggleCart(true);
$('#closeCart').onclick = overlay.onclick = () => toggleCart(false);
$('#checkout').onclick = () => toast(cart.length ? 'نسخة تجريبية، الدفع غير مفعّل' : 'السلة فاضية');

/* ---- catalogue ---- */
const dots = n => n ? `<span class="dots" aria-label="درجة التحميص ${n} من 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'f' : ''}"></i>`).join('')}</span>` : '—';

function renderGrid(filter = 'الكل') {
  const list = filter === 'الكل' ? PRODUCTS : PRODUCTS.filter(p => p.cat === filter);
  $('#grid').innerHTML = list.map(p => `
    <article class="card">
      <div class="thumb"><span class="sku">${p.sku}</span>${p.tag ? `<span class="tag">${p.tag}</span>` : ''}${art(p)}</div>
      <h3>${p.name}</h3>
      <dl class="spec">
        <div><dt>الأصل</dt><dd>${p.origin}${p.alt !== '—' ? ' · ' + p.alt : ''}</dd></div>
        <div><dt>التحميص</dt><dd>${dots(p.roast)}</dd></div>
        <div><dt>النكهات</dt><dd style="direction:rtl">${p.notes}</dd></div>
      </dl>
      <div class="row">
        <div class="price"><b>${p.price}</b> ر.س${p.old ? `<s>${p.old}</s>` : ''}</div>
        <button class="add" data-add="${p.id}">أضف</button>
      </div>
    </article>`).join('');
  document.querySelectorAll('#filters button').forEach(b => b.classList.toggle('on', b.dataset.f === filter));
}

$('#grid').addEventListener('click', e => {
  const b = e.target.closest('[data-add]');
  if (b) add(+b.dataset.add);
});
$('#filters').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) renderGrid(b.dataset.f);
});

/* ---- brew calculator (starting points, not rules) ---- */
const METHODS = {
  v60:      { cup: 250, ratio: 16,  grind: 'متوسط، مثل الملح الخشن' },
  press:    { cup: 250, ratio: 15,  grind: 'خشن' },
  espresso: { cup: 36,  ratio: 2,   grind: 'ناعم جداً', yieldRatio: true },
  saudi:    { cup: 60,  ratio: 10,  grind: 'ناعم، مع الهيل' }
};
function calc() {
  const m = METHODS[$('#method').value];
  const cups = Math.max(1, Math.min(20, +$('#cups').value || 1));
  const water = cups * m.cup;
  const coffee = m.yieldRatio ? cups * 18 : water / m.ratio;
  $('#outCoffee').textContent = Math.round(coffee) + ' جم';
  $('#outWater').textContent = (m.yieldRatio ? Math.round(coffee * m.ratio) : water) + ' مل';
  $('#outGrind').textContent = m.grind;
}
$('#method').addEventListener('change', calc);
$('#cups').addEventListener('input', calc);

/* ---- misc ---- */
$('#burger').onclick = () => $('#links').classList.toggle('open');
document.querySelectorAll('#links a').forEach(a => a.addEventListener('click', () => $('#links').classList.remove('open')));
$('#newsForm').addEventListener('submit', e => { e.preventDefault(); e.target.reset(); toast('تم الاشتراك'); });

renderGrid();
renderCart();
calc();
