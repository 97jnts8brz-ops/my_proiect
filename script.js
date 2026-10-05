const PRODUCTS = [
  { id: 1, name: 'إثيوبي يرقاتشيف', cat: 'بن مختص', desc: 'نكهة زهرية وحمضيات · 250 جم', price: 68, old: 85, tag: 'الأكثر مبيعاً', color: '#6F4E37' },
  { id: 2, name: 'كولومبي سوبريمو', cat: 'بن مختص', desc: 'شوكولاتة وكراميل · 250 جم', price: 59, color: '#3b2a1d' },
  { id: 3, name: 'برازيلي سانتوس', cat: 'بن مختص', desc: 'مكسرات ونكهة ناعمة · 250 جم', price: 49, color: '#8a5a2b' },
  { id: 4, name: 'قهوة سعودية بالهيل', cat: 'قهوة سعودية', desc: 'تحميص فاتح مع هيل فاخر · 500 جم', price: 55, tag: 'جديد', color: '#A9743F' },
  { id: 5, name: 'قهوة سعودية بالزعفران', cat: 'قهوة سعودية', desc: 'هيل وزعفران وقرنفل · 500 جم', price: 79, old: 95, color: '#B5651D' },
  { id: 6, name: 'كبسولات إسبريسو', cat: 'كبسولات', desc: '30 كبسولة · قوة 8', price: 89, color: '#2B1A12' },
  { id: 7, name: 'كبسولات ديكاف', cat: 'كبسولات', desc: '30 كبسولة · بدون كافيين', price: 85, color: '#4a3426' },
  { id: 8, name: 'طقم V60 للتقطير', cat: 'مستلزمات', desc: 'قمع + 100 فلتر + إبريق', price: 139, old: 169, tag: 'خصم', color: '#C8934B' }
];

const $ = (s, r = document) => r.querySelector(s);
const fmt = n => n + ' ر.س';

/* ---- product art (SVG, no external images) ---- */
function art(p) {
  if (p.cat === 'مستلزمات') {
    return `<svg viewBox="0 0 120 140"><path d="M20 20h80L72 78H48z" fill="${p.color}"/><rect x="48" y="78" width="24" height="10" fill="#F6EDE1"/><path d="M34 88h52l-6 40H40z" fill="#fff" stroke="${p.color}" stroke-width="4"/><path d="M40 108h40l-3 20H43z" fill="#2B1A12"/></svg>`;
  }
  if (p.cat === 'كبسولات') {
    return `<svg viewBox="0 0 120 140"><rect x="22" y="40" width="76" height="86" rx="10" fill="${p.color}"/><rect x="22" y="40" width="76" height="22" rx="10" fill="#C8934B"/><circle cx="60" cy="94" r="20" fill="none" stroke="#E3B873" stroke-width="5"/><circle cx="60" cy="94" r="6" fill="#E3B873"/></svg>`;
  }
  return `<svg viewBox="0 0 120 150"><path d="M30 24h60l8 14v98a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8V38z" fill="${p.color}"/><path d="M22 38h76v14H22z" fill="#00000030"/><rect x="34" y="62" width="52" height="56" rx="8" fill="#F6EDE1"/><circle cx="60" cy="84" r="11" fill="${p.color}"/><path d="M60 74c-6 8-6 12 0 20" stroke="#F6EDE1" stroke-width="3" fill="none"/><rect x="42" y="102" width="36" height="5" rx="2" fill="#C8934B"/></svg>`;
}

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
  const count = cart.reduce((a, i) => a + i.qty, 0);
  const total = cart.reduce((a, i) => a + i.qty * PRODUCTS.find(p => p.id === i.id).price, 0);
  $('#cartCount').textContent = count;
  $('#cartTotal').textContent = fmt(total);
  if (!cart.length) { box.innerHTML = '<div class="empty">السلة فاضية ☕<br>أضف منتجاتك المفضلة</div>'; return; }
  box.innerHTML = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return `<div class="item">
      <div class="mini">${art(p)}</div>
      <div class="meta"><b>${p.name}</b><span>${fmt(p.price)}</span></div>
      <div class="qty"><button data-d="1" data-id="${p.id}">+</button><b>${i.qty}</b><button data-d="-1" data-id="${p.id}">−</button></div>
    </div>`;
  }).join('');
}

function add(id) {
  const it = cart.find(i => i.id === id);
  it ? it.qty++ : cart.push({ id, qty: 1 });
  save(); renderCart(); toast('تمت الإضافة للسلة ✓');
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
$('#checkout').onclick = () => toast(cart.length ? 'هذه نسخة تجريبية — الدفع غير مفعّل بعد' : 'السلة فاضية');

/* ---- products grid ---- */
function renderGrid(filter = 'الكل') {
  const list = filter === 'الكل' ? PRODUCTS : PRODUCTS.filter(p => p.cat === filter);
  $('#grid').innerHTML = list.map(p => `
    <article class="card">
      <div class="thumb">${p.tag ? `<span class="tag">${p.tag}</span>` : ''}${art(p)}</div>
      <div class="info">
        <small>${p.cat}</small>
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="row">
          <div class="price"><b>${fmt(p.price)}</b>${p.old ? `<s>${fmt(p.old)}</s>` : ''}</div>
          <button class="add" data-add="${p.id}" aria-label="أضف للسلة">+</button>
        </div>
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
document.querySelectorAll('.cat').forEach(c => c.addEventListener('click', () => renderGrid(c.dataset.filter)));

/* ---- misc ---- */
$('#burger').onclick = () => $('#links').classList.toggle('open');
document.querySelectorAll('#links a').forEach(a => a.addEventListener('click', () => $('#links').classList.remove('open')));
$('#newsForm').addEventListener('submit', e => { e.preventDefault(); e.target.reset(); toast('شكراً لاشتراكك ☕'); });

renderGrid();
renderCart();
