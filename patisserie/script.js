/* ============================================================
   L'ÉCLAIR — pâtisserie fine
   - ALIGNEMENT OPTIQUE : l'encre (pas la boîte) sur la ligne
   - LAME DE VERRE : parallaxe de réfraction (compositor-friendly)
   - Panier (ajout / quantité / total, prix en euros virgule)
   - Commande (formulaire)
   - Palette de commandes (Ctrl+K)
   ============================================================ */

/* ---- PRIX EUROS ---- */
function fmt(n) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

/* ---- ALIGNEMENT OPTIQUE --------------------------------------
   Les grands glyphes portent un porte-à-faux gauche : on mesure
   l'encre réelle au canvas et on décale la boîte pour que l'encre
   tombe sur la ligne de colonne.
*/
(function () {
  var cvs = document.createElement('canvas');
  var ctx = cvs.getContext('2d');
  var sel = '.masthead, .shead-title, .cname, .stat-num';
  function align() {
    document.querySelectorAll(sel).forEach(function (el) {
      el.style.marginLeft = '0px';
      var cs = getComputedStyle(el);
      var ch = (el.textContent || '').trim().charAt(0);
      if (!ch) return;
      if (cs.textTransform === 'uppercase') ch = ch.toUpperCase();
      ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      ctx.textAlign = 'left';
      var abl = ctx.measureText(ch).actualBoundingBoxLeft;
      if (isFinite(abl)) el.style.marginLeft = abl.toFixed(2) + 'px';
    });
  }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(align); }
  align();
  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(align, 120); });
})();

/* ---- LAME DE VERRE : parallaxe de réfraction ----
   La souris déplace légèrement le poster derrière le verre
   (illusion de lentille). Uniquement des custom properties et
   des transform : rien sur le thread principal.
*/
(function () {
  var cards = document.querySelectorAll('.pat-card, .categ-card');
  cards.forEach(function (card) {
    var ticking = false;
    card.addEventListener('mousemove', function (e) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var r = card.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        var y = ((e.clientY - r.top) / r.height - 0.5) * 2;
        card.style.setProperty('--gx', x.toFixed(3));
        card.style.setProperty('--gy', y.toFixed(3));
        ticking = false;
      });
    });
    card.addEventListener('mouseleave', function () {
      card.style.setProperty('--gx', 0);
      card.style.setProperty('--gy', 0);
    });
  });
})();

/* ---- PANIER ---- */
var cart = [];
var CART_KEY = 'eclair-cart';

function loadCart() {
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch (e) { cart = []; }
}
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  catch (e) { /* stockage indisponible : le panier reste en mémoire */ }
}
function findItem(ref) { return cart.find(function (i) { return i.ref === ref; }); }

function addToCart(ref) {
  var card = document.querySelector('.item[data-ref="' + ref + '"]');
  if (!card) return;
  var it = findItem(ref);
  if (it) {
    it.qty++;
  } else {
    cart.push({
      ref: ref,
      name: card.querySelector('.pname').textContent.trim(),
      price: parseFloat(card.getAttribute('data-price')) || 0,
      qty: 1
    });
  }
  saveCart();
  renderCart();
}

function changeQty(ref, delta) {
  var it = findItem(ref);
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) cart = cart.filter(function (i) { return i.ref !== ref; });
  saveCart();
  renderCart();
}

function cartTotal() {
  return cart.reduce(function (sum, i) { return sum + i.price * i.qty; }, 0);
}

function renderCart() {
  var list = document.getElementById('cartItems');
  var total = document.getElementById('cartTotal');
  var count = document.getElementById('cartCount');
  var n = cart.reduce(function (s, i) { return s + i.qty; }, 0);
  count.textContent = n > 0 ? n : '';

  if (!cart.length) {
    list.innerHTML = '<li class="cart-empty">le plateau est vide.<br />fais un tour au comptoir ↗</li>';
    total.textContent = fmt(0);
    return;
  }
  list.innerHTML = '';
  cart.forEach(function (it) {
    var li = document.createElement('li');
    var left = document.createElement('span');
    left.textContent = it.qty + ' × ' + it.name;
    var right = document.createElement('span');
    right.innerHTML = '<span class="qty">' + fmt(it.price * it.qty) + '</span><button class="remove" data-ref="' + it.ref + '" type="button">✕</button>';
    li.appendChild(left);
    li.appendChild(right);
    list.appendChild(li);
  });
  total.textContent = fmt(cartTotal());
}

document.querySelectorAll('.add').forEach(function (btn) {
  btn.addEventListener('click', function () { addToCart(btn.getAttribute('data-ref')); });
});
document.addEventListener('click', function (e) {
  var rm = e.target.closest('.remove');
  if (rm) changeQty(rm.getAttribute('data-ref'), -1);
});

/* ---- COMMANDE ---- */
var form = document.getElementById('orderForm');
var formStatus = document.getElementById('orderStatus');

if (form) {
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var name = (data.get('name') || '').toString().trim();
    var email = (data.get('email') || '').toString().trim();
    var address = (data.get('address') || '').toString().trim();
    if (!name || !email || !address) {
      formStatus.style.color = '#ef5b7c';
      formStatus.textContent = 'Remplis ton nom, ton email et l\'adresse de livraison.';
      return;
    }
    if (!cart.length) {
      formStatus.style.color = '#ef5b7c';
      formStatus.textContent = 'Le plateau est vide : ajoute d\'abord une pièce au comptoir.';
      return;
    }
    formStatus.style.color = '';
    formStatus.textContent = 'Commande ' + fmt(cartTotal()) + ' enregistrée, merci ' + name + ' ! On s\'occupe du reste.';
    cart = [];
    saveCart();
    renderCart();
    form.reset();
    setTimeout(function () { formStatus.textContent = ''; }, 10000);
  });
}

/* ---- PALETTE DE COMMANDES (Ctrl+K) ---- */
var palette = document.getElementById('palette');
var paletteInput = document.getElementById('paletteInput');
var paletteList = document.getElementById('paletteList');
var paletteItems = [
  { cmd: 'vitrine', hint: 'remonter à l\'entrée', go: function () { scrollToId('vitrine'); } },
  { cmd: 'étages', hint: 'aller aux catégories', go: function () { scrollToId('etages'); } },
  { cmd: 'comptoir', hint: 'voir les pièces du jour', go: function () { scrollToId('comptoir'); } },
  { cmd: 'commander', hint: 'panier + formulaire', go: function () { scrollToId('commander'); } },
  { cmd: 'effacer le plateau', hint: 'tout retirer', go: function () { cart = []; saveCart(); renderCart(); closePalette(); } },
  { cmd: 'fermer', hint: 'quitter cette fenêtre', go: function () { closePalette(); } }
];

function scrollToId(id) {
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  closePalette();
}

var selIndex = 0;

function openPalette() {
  selIndex = 0;
  palette.hidden = false;
  renderPaletteList('');
  paletteInput.value = '';
  paletteInput.focus();
  document.body.style.overflow = 'hidden';
}
function closePalette() {
  palette.hidden = true;
  document.body.style.overflow = '';
}

function renderPaletteList(filter) {
  var items = paletteItems.filter(function (it) {
    return it.cmd.indexOf(filter.toLowerCase()) !== -1;
  });
  paletteList.innerHTML = '';
  items.forEach(function (it, idx) {
    var li = document.createElement('li');
    if (idx === selIndex) li.className = 'sel';
    li.innerHTML = '<span>' + it.cmd + '</span><span class="pcmd">' + it.hint + '</span>';
    li.addEventListener('click', function () { it.go(); });
    li.addEventListener('mousemove', function () {
      selIndex = idx;
      highlight(li);
    });
    paletteList.appendChild(li);
  });
  if (selIndex >= items.length) selIndex = 0;
  var lis = paletteList.querySelectorAll('li');
  if (lis[selIndex]) lis[selIndex].className = 'sel';
}

function highlight(li) {
  var lis = paletteList.querySelectorAll('li');
  lis.forEach(function (el) { el.classList.remove('sel'); });
  li.classList.add('sel');
}

paletteInput.addEventListener('input', function () { renderPaletteList(paletteInput.value); });
paletteInput.addEventListener('keydown', function (e) {
  var lis = paletteList.querySelectorAll('li');
  if (e.key === 'ArrowDown') { e.preventDefault(); selIndex = Math.min(selIndex + 1, Math.max(0, lis.length - 1)); if (lis[selIndex]) highlight(lis[selIndex]); }
  if (e.key === 'ArrowUp') { e.preventDefault(); selIndex = Math.max(selIndex - 1, 0); if (lis[selIndex]) highlight(lis[selIndex]); }
  if (e.key === 'Enter') { e.preventDefault(); if (lis[selIndex]) lis[selIndex].click(); }
  if (e.key === 'Escape') { closePalette(); }
});
palette.addEventListener('click', function (e) {
  if (e.target === palette) closePalette();
});

document.addEventListener('keydown', function (e) {
  if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    if (palette.hidden) openPalette(); else closePalette();
  }
  if (e.key === 'Escape' && !palette.hidden) closePalette();
});

/* ---- init ---- */
loadCart();
renderCart();
