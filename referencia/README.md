# Referência: a versão que já está no ar

Arquivos da primeira versão do projeto (HTML + Netlify + n8n + Notion), guardados aqui para servir de base à versão em CodeIgniter 4. Nada nesta pasta roda no CI4.

| Arquivo | O que é | Como usar no CI4 |
| --- | --- | --- |
| `ficha-original.html` | A ficha pública que está no ar: perguntas, textos na voz do tatuador, visual grafite e vermelho, compressão de fotos no celular | Vira a View da ficha. O CSS e o JS vão para `public/assets/`. O envio passa a ir para `POST /ficha` com o token CSRF, em vez de `/api/ficha` |
| `pontuacao.md` | Regras que pontuam a ficha como quente, morna ou fria | Vira `app/Libraries/Pontuacao.php` |
| `notion-schema-original.md` | Os campos do quadro do Notion | Viraram as tabelas de [docs/modelo-de-dados.md](../docs/modelo-de-dados.md) |
