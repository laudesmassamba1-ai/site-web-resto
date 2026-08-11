/* ============================================================
   Chez Marguerite — script
   - ALIGNEMENT OPTIQUE : l'encre (pas la boîte) sur la ligne
   - Formulaire de contact
   ============================================================ */

/* ---- ALIGNEMENT OPTIQUE --------------------------------------
   Les grands glyphes portent un porte-à-faux gauche : l'encre est
   en retrait dans la boîte de texte. On mesure l'encre réelle au
   canvas et on décale la boîte pour que l'encre tombe sur la ligne
   de colonne. Relancé après le chargement de la police et au resize.
*/
(function () {
  var cvs = document.createElement('canvas');
  var ctx = cvs.getContext('2d');
  var sel = '.masthead, .numeral, .shead-title, .quote-big'; /* éléments display alignés */
  function align() {
    document.querySelectorAll(sel).forEach(function (el) {
      el.style.marginLeft = '0px';
      var cs = getComputedStyle(el);
      var ch = (el.textContent || '').trim().charAt(0);
      if (!ch) return;
      if (cs.textTransform === 'uppercase') ch = ch.toUpperCase();
      ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      ctx.textAlign = 'left';
      var abl = ctx.measureText(ch).actualBoundingBoxLeft; /* + = l'encre déborde à gauche, - = penche à droite */
      if (isFinite(abl)) el.style.marginLeft = abl.toFixed(2) + 'px';
    });
  }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(align); }
  align();
  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(align, 120); });
})();

/* ---- formulaire de contact ---- */
var form = document.getElementById('contactForm');
var formStatus = document.getElementById('formStatus');

if (form) {
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var name = (data.get('name') || '').toString().trim();
    var email = (data.get('email') || '').toString().trim();
    var message = (data.get('message') || '').toString().trim();

    if (!name || !email || !message) {
      formStatus.textContent = 'Veuillez remplir les champs obligatoires.';
      formStatus.style.color = '#c90227';
      return;
    }

    formStatus.style.color = '';
    formStatus.textContent = 'Merci ' + name + ' ! Votre demande est bien reçue — on vous répond vite.';
    form.reset();
    setTimeout(function () { formStatus.textContent = ''; }, 8000);
  });
}
