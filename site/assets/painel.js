// Comportamento do painel no navegador. A validação de verdade acontece no servidor;
// aqui é só para ajudar quem preenche.
(function () {
  // validação visual do Bootstrap antes de enviar
  document.querySelectorAll('form.needs-validation').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  });

  // campos que só aparecem com certa resposta: data-mostrar-se="campo=valor"
  var condicionais = document.querySelectorAll('[data-mostrar-se]');
  function atualizar() {
    condicionais.forEach(function (bloco) {
      var regra = bloco.getAttribute('data-mostrar-se').split('=');
      var campo = document.getElementById(regra[0]);
      var mostrar = campo && campo.value === regra[1];
      bloco.classList.toggle('d-none', !mostrar);
      bloco.querySelectorAll('input, select, textarea').forEach(function (el) { el.required = !!mostrar; });
    });
  }
  condicionais.forEach(function (bloco) {
    var campo = document.getElementById(bloco.getAttribute('data-mostrar-se').split('=')[0]);
    if (campo) campo.addEventListener('change', atualizar);
  });
  atualizar();
})();
