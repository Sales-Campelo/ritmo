# Ritmo — calistenia e boxe

Site estático em HTML, CSS e JavaScript. Não precisa instalar dependências nem executar uma compilação.

## Organização

```text
index.html                 Página inicial
assets/
  css/
    styles.css             Estilos principais
    circuit.css            Circuito e paleta azul
    responsive.css         Celular e tablet
  js/
    app.js                 Calendário e fichas
    circuit.js             Edição e execução guiada
  data/
    data.js                Treinos e guia da rotina
scripts/
  check-site.mjs           Verificação local e na publicação
.github/workflows/
  pages.yml                Publicação no GitHub Pages
.nojekyll                  Entrega dos arquivos estáticos
```

## Abrir no computador

Abra `index.html` ou sirva esta pasta com um servidor HTTP local. O progresso e as metas editadas ficam no navegador, sem sincronização entre aparelhos. A prévia HTTP e o site publicado usam armazenamentos separados.

## Publicar no GitHub Pages

Esta pasta corresponde à raiz do repositório `Sales-Campelo/ritmo`. Faça commit dos arquivos movidos, dos novos arquivos e das remoções dos antigos caminhos. Inclua a pasta oculta `.github`.

1. No GitHub, abra **Settings → Pages → Build and deployment**.
2. Em **Source**, selecione **GitHub Actions**.
3. Faça push na branch `main` ou execute **Actions → Publicar Ritmo no GitHub Pages → Run workflow**.
4. Acesse a URL mostrada pela execução concluída, em **deploy**.

O fluxo publica apenas `index.html`, `.nojekyll` e `assets/`. Documentação e scripts de verificação não entram no site.

## Sobre a publicação pendente da captura

A captura mostra `build` e `report-build-status` concluídos e `deploy` pendente por mais de quatro horas. `Result: true` significa que a condição para executar o job foi satisfeita; não é uma mensagem de erro e não revela a causa da espera.

Antes de iniciar o novo fluxo, cancele a execução antiga se ela continuar pendente. Se o novo fluxo também parar, abra os detalhes de **deploy** e confira se há aprovação pendente no ambiente `github-pages`, se a branch `main` está autorizada pelas regras desse ambiente e se Pages está habilitado. Confira também o status do serviço GitHub Pages. Não remova proteções do ambiente sem entender a regra que está bloqueando a publicação.

O arquivo preparado aqui segue a estrutura recomendada pelo GitHub: artefato estático, dependência `needs: build`, ambiente `github-pages` e permissões `pages: write` e `id-token: write`. Isso organiza a configuração; não comprova nem corrige por si só uma espera causada pelo serviço ou pelas configurações remotas. A publicação real ainda precisa ser executada no GitHub.

Fontes: [fluxos personalizados para Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [configuração da fonte de publicação](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [status do GitHub](https://www.githubstatus.com/).

## Conferir antes do commit

Com Node.js disponível, execute na raiz:

```text
node scripts/check-site.mjs
```

As etapas 4 e 5 continuam provisórias até receber os materiais corretos. O conteúdo e as funções da rotina foram preservados na reorganização.
