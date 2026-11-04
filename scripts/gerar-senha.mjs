// Gera o hash da senha do painel para colocar em PAINEL_SENHA_HASH.
// Uso: npm run senha -- "sua senha"
import { gerarHashSenha } from '../netlify/lib/painel/seguranca.mjs';

const senha = process.argv[2];
if (!senha || senha.length < 8) {
  console.error('Use uma senha com pelo menos 8 caracteres: npm run senha -- "sua senha"');
  process.exit(1);
}
console.log(gerarHashSenha(senha));
