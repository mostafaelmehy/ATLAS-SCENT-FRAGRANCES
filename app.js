// ---- Settings: edit these two lines ---------------------------------------
const WHATSAPP_NUMBER = '201021503909'; // country code + number, digits only
const CURRENCY = 'EGP';
const SHEET_URL = ''; // optional: Google Apps Script web-app URL that logs every order (see README-orders.txt)
// ---------------------------------------------------------------------------

// Add `soldOut: true` to a perfume to mark it Sold out and stop orders for it.
// To show a price on a card, add `price: 850` to that perfume. Leave it out to hide the price.
// `image` is the photo file inside the images folder, e.g. image: 'icon.jpg' (leave it out to show the bottle drawing).
// `color` tints the bottle drawing. `type` is men | women | unisex.
const PERFUMES = [
  {
    name: 'ICON',
    image: 'icon.jpg',
    type: 'men',
    tagline: 'Fresh, aromatic and confident',
    notes: ['Bergamot', 'Lavender', 'Tonka bean', 'Cedar'],
    color: '#5b8fb9',
    price:300
  },
  {
    name: 'COGNAC',
    image: 'cognac.jpg',
    type: 'unisex',
    tagline: 'Warm, boozy and velvety',
    notes: ['Cognac', 'Cinnamon', 'Vanilla', 'Oak'],
    color: '#b8742f',
    price:400   
  },
  {
    name: 'GOLD RUSH',
    image: 'gold-rush.jpg',
    type: 'men',
    tagline: 'Sweet honey with a bold tobacco edge',
    notes: ['Mint', 'Honey', 'Tobacco', 'Tonka bean'],
    color: '#d4a537',
    price:300
  },
  {
    name: 'SPICE CAKE',
    image: 'spice-cake.jpg',
    type: 'unisex',
    tagline: 'Spiced dates and warm baked sweetness',
    notes: ['Cinnamon', 'Nutmeg', 'Dates', 'Praline'],
    color: '#a2552b',
    price:350
  },
  {
    name: 'CREAM',
    image: 'cream.jpg',
    type: 'unisex',
    tagline: 'Soft, milky and comforting',
    notes: ['Milk', 'Rice', 'Vanilla', 'Sandalwood'],
    color: '#e6d5b8',
    price:350
  },
  {
    name: 'NOBLE',
    image: 'noble.jpg',
    type: 'men',
    tagline: 'Elegant, powdery and refined',
    notes: ['Iris', 'Lavender', 'Amber', 'Cedar'],
    color: '#3c4f73',
    price:400 
  },
  {
    name: 'FLUFFY',
    image: 'fluffy.jpg',
    type: 'women',
    tagline: 'Playful marshmallow and soft vanilla',
    notes: ['Marshmallow', 'Vanilla', 'Musk', 'Caramel'],
    color: '#e9a8c0',
    price:350
  },
  {
    name: 'SUGAR POP',
    image: 'sugar-pop.jpg',
    type: 'women',
    tagline: 'Bright, sweet and candy-like',
    notes: ['Tangerine', 'Orchid', 'Candy floss', 'White musk'],
    color: '#f08fb2',
    price:300
  },
  {
    name: 'DARK BLOOM',
    image: 'dark-bloom.jpg',
    type: 'unisex',
    tagline: 'Dark florals, rich and mysterious',
    notes: ['Black orchid', 'Patchouli', 'Dark chocolate', 'Incense'],
    color: '#3a2147',
    price:370
  },
  {
    name: 'DESIRE',
    image: 'desire.jpg',
    type: 'men',
    tagline: 'Spiced, sweet and magnetic',
    notes: ['Pink pepper', 'Juniper', 'Chestnut', 'Amber'],
    color: '#8a1f2b',
    price:400 
  }
];

const TYPE_LABEL = { men: 'For him', women: 'For her', unisex: 'Unisex' };
const MAX_QTY = 5;

const $ = (selector) => document.querySelector(selector);
const grid = $('#grid');
const home = $('#home');
const detail = $('#detail');
const filterButtons = document.querySelectorAll('[data-filter]');
const byName = new Map(PERFUMES.map((perfume) => [perfume.name, perfume]));

const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
const money = (value) => `${CURRENCY} ${value.toLocaleString('en-US')}`;
const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------- catalog ---------- */

function bottleSvg(color) {
  const id = `g-${color.slice(1)}`;
  return `
    <svg viewBox="0 0 120 160" class="bottle" aria-hidden="true">
      <defs>
        <linearGradient id="${id}" x1="0" x2="1">
          <stop offset="0" stop-color="${color}" stop-opacity=".95"/>
          <stop offset=".55" stop-color="${color}" stop-opacity=".65"/>
          <stop offset="1" stop-color="${color}" stop-opacity=".9"/>
        </linearGradient>
      </defs>
      <rect x="46" y="8" width="28" height="22" rx="3" fill="#c5a059"/>
      <rect x="52" y="28" width="16" height="12" fill="#8c7140"/>
      <rect x="24" y="40" width="72" height="104" rx="10" fill="url(#${id})" stroke="#c5a059" stroke-opacity=".5"/>
      <rect x="34" y="52" width="9" height="80" rx="4" fill="#fff" opacity=".18"/>
      <rect x="44" y="82" width="32" height="26" rx="2" fill="#121212" opacity=".55"/>
      <rect x="49" y="92" width="22" height="1.5" fill="#c5a059"/>
      <rect x="53" y="98" width="14" height="1.5" fill="#c5a059" opacity=".7"/>
    </svg>`;
}

const artFor = (perfume) =>
  perfume.image
    ? `<img src="images/${perfume.image}" alt="${escapeHtml(perfume.name)}" loading="lazy">`
    : bottleSvg(perfume.color);

const pageLink = (perfume) => `#/perfume/${encodeURIComponent(perfume.name)}`;

function card(perfume) {
  const price = perfume.price ? `<p class="price">${money(perfume.price)}</p>` : '';
  const notes = perfume.notes.map((note) => `<li>${note}</li>`).join('');
  return `
    <a class="card${perfume.soldOut ? ' is-sold' : ''}" href="${pageLink(perfume)}" aria-label="View ${escapeHtml(perfume.name)}">
      <div class="card-art ${perfume.image ? 'has-photo' : ''}">${artFor(perfume)}${perfume.soldOut ? '<span class="sold-tag">Sold out</span>' : ''}</div>
      <div class="card-body">
        <p class="card-type">${TYPE_LABEL[perfume.type]}</p>
        <h3>${perfume.name}</h3>
        <p class="tagline">${perfume.tagline}</p>
        <ul class="notes">${notes}</ul>
        ${price}
        <span class="btn btn-view">View details</span>
      </div>
    </a>`;
}

function renderGrid(filter) {
  const visible = filter === 'all' ? PERFUMES : PERFUMES.filter((p) => p.type === filter);
  grid.innerHTML = visible.length
    ? visible.map(card).join('')
    : '<p class="empty">No fragrances in this category yet.</p>';
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((other) => other.classList.toggle('is-active', other === button));
    renderGrid(button.dataset.filter);
  });
});

/* ---------- perfume page ---------- */

const FIELDS = [
  { name: 'firstName', label: 'First name', autocomplete: 'given-name' },
  { name: 'lastName', label: 'Last name', autocomplete: 'family-name' },
  { name: 'phone', label: 'Phone', type: 'tel', autocomplete: 'tel' },
  { name: 'altPhone', label: 'Backup phone (optional)', type: 'tel' },
  { name: 'city', label: 'City', autocomplete: 'address-level2' },
  { name: 'street', label: 'Street', autocomplete: 'address-line1' },
  { name: 'building', label: 'Building / apartment details', autocomplete: 'address-line2', wide: true }
];

const fieldHtml = (field) => `
  <label${field.wide ? ' class="wide"' : ''}>${field.label}
    <input name="${field.name}" type="${field.type || 'text'}"${field.type === 'tel' ? ' inputmode="tel"' : ''}${field.autocomplete ? ` autocomplete="${field.autocomplete}"` : ''}>
    <em data-error-for="${field.name}"></em>
  </label>`;

const noteGroup = (perfume) =>
  `<ul class="notes notes-lg">${perfume.notes.map((note) => `<li>${note}</li>`).join('')}</ul>`;

function orderBox(perfume) {
  if (perfume.soldOut) {
    return '<p class="sold-box">This fragrance is currently sold out. Message us on WhatsApp and we\'ll tell you when it\'s back.</p>';
  }
  return `
    <form id="order-form" class="order-box" novalidate>
      <h2>Order ${perfume.name}</h2>
      <div class="qty-row">
        <span>Quantity</span>
        <span class="stepper">
          <button type="button" data-delta="-1" aria-label="One less">−</button>
          <b id="qty">1</b>
          <button type="button" data-delta="1" aria-label="One more">+</button>
        </span>
        ${perfume.price ? `<span id="line-total" class="line-total">${money(perfume.price)}</span>` : ''}
      </div>
      <div class="fields">${FIELDS.map(fieldHtml).join('')}</div>
      <button type="submit" class="btn btn-wa-solid">Send order on WhatsApp</button>
      <p class="fine">You'll be taken to WhatsApp with your order already written. Just tap Send.</p>
    </form>`;
}

function renderDetail(perfume) {
  detail.innerHTML = `
    <div class="detail-inner">
      <a href="#collection" class="back">← All fragrances</a>
      <div class="detail-grid">
        <div class="detail-art ${perfume.image ? 'has-photo' : ''}">${artFor(perfume)}${perfume.soldOut ? '<span class="sold-tag">Sold out</span>' : ''}</div>
        <div>
          <p class="card-type">${TYPE_LABEL[perfume.type]}</p>
          <h1>${perfume.name}</h1>
          <p class="tagline">${perfume.tagline}</p>
          ${noteGroup(perfume)}
          ${perfume.price ? `<p class="price price-lg">${money(perfume.price)}</p>` : ''}
          ${orderBox(perfume)}
        </div>
      </div>
    </div>`;
  if (!perfume.soldOut) wireOrderForm(perfume);
}

/* ---------- order form ---------- */

const oneLine = (value, max) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
const digitsOf = (value) => value.replace(/\D/g, '');
const phoneOk = (value) => digitsOf(value).length >= 10 && digitsOf(value).length <= 15;

function validate(customer) {
  const errors = {};
  if (!customer.firstName) errors.firstName = 'Enter your first name';
  if (!customer.lastName) errors.lastName = 'Enter your last name';
  if (!phoneOk(customer.phone)) errors.phone = 'Enter a valid phone number';
  if (customer.altPhone && !phoneOk(customer.altPhone)) errors.altPhone = 'Enter a valid phone number or leave it empty';
  if (!customer.city) errors.city = 'Enter your city';
  if (!customer.street) errors.street = 'Enter your street';
  if (!customer.building) errors.building = 'Enter building / apartment details';
  return errors;
}

function orderMessage(perfume, qty, customer) {
  return [
    'New order — Atlas Scent',
    '',
    `Perfume: ${perfume.name} × ${qty}`,
    ...(perfume.price ? [`Total: ${money(perfume.price * qty)}`] : []),
    '',
    `Name: ${customer.firstName} ${customer.lastName}`,
    `Phone: ${customer.phone}`,
    ...(customer.altPhone ? [`Backup phone: ${customer.altPhone}`] : []),
    `Address: ${customer.city}, ${customer.street}, ${customer.building}`
  ].join('\n');
}

function logOrder(perfume, qty, customer) {
  if (!SHEET_URL) return;
  const record = { ...customer, items: `${perfume.name} × ${qty}`, total: perfume.price ? perfume.price * qty : '' };
  try {
    fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', keepalive: true, body: JSON.stringify(record) });
  } catch {
    /* logging is a bonus; the WhatsApp message is what matters */
  }
}

function wireOrderForm(perfume) {
  const form = $('#order-form');
  let qty = 1;

  const updateQty = (next) => {
    qty = Math.min(MAX_QTY, Math.max(1, next));
    $('#qty').textContent = qty;
    const total = $('#line-total');
    if (total) total.textContent = money(perfume.price * qty);
  };

  form.querySelectorAll('[data-delta]').forEach((button) =>
    button.addEventListener('click', () => updateQty(qty + Number(button.dataset.delta)))
  );

  form.addEventListener('input', (event) => {
    const note = form.querySelector(`[data-error-for="${event.target.name}"]`);
    if (note) note.textContent = '';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const customer = {
      firstName: oneLine(data.get('firstName'), 40),
      lastName: oneLine(data.get('lastName'), 40),
      phone: oneLine(data.get('phone'), 20),
      altPhone: oneLine(data.get('altPhone'), 20),
      city: oneLine(data.get('city'), 60),
      street: oneLine(data.get('street'), 120),
      building: oneLine(data.get('building'), 120)
    };

    const errors = validate(customer);
    form.querySelectorAll('[data-error-for]').forEach((node) => {
      node.textContent = errors[node.dataset.errorFor] || '';
    });
    const firstBad = Object.keys(errors)[0];
    if (firstBad) {
      form.elements[firstBad].focus();
      return;
    }

    logOrder(perfume, qty, customer);
    window.location.href = waLink(orderMessage(perfume, qty, customer));
  });
}

/* ---------- routing ---------- */

function route() {
  const match = decodeURIComponent(window.location.hash).match(/^#\/perfume\/(.+)$/);
  const perfume = match && byName.get(match[1]);

  if (perfume) {
    renderDetail(perfume);
    home.hidden = true;
    detail.hidden = false;
    document.title = `${perfume.name} — Atlas Scent`;
    window.scrollTo(0, 0);
  } else {
    const wasDetail = !detail.hidden;
    detail.hidden = true;
    home.hidden = false;
    document.title = 'Atlas Scent — The Art of Fragrance';
    if (wasDetail && window.location.hash === '#collection') $('#collection').scrollIntoView();
  }
}

window.addEventListener('hashchange', route);

$('#wa-float').href = waLink("Hello Atlas Scent, I'd like to ask about your fragrances.");

renderGrid('all');
route();
