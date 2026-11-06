# Dom Ruiz | Correção do vídeo e foto do barbeiro

Esta versão corrige **dois HTMLs ao mesmo tempo**:

- `index.html` agora contém o vídeo otimizado (45 segundos, MP4/H.264/AAC), as fotos, a logo, o CSS e o JavaScript. A foto do Rodrigues tem ainda um fundo de segurança.
- `admin.html` agora contém a foto do Rodrigues, a logo e o CSS/JS necessários para renderizar a tela de login, mesmo que os arquivos de mídia não sejam encontrados no GitHub Pages.

**Para resolver no seu repositório GitHub Pages:** atualize os arquivos `index.html` **e** `admin.html` da raiz (ou substitua todo o conteúdo pelo pacote completo). Espere o Pages publicar a versão nova e faça `Ctrl + Shift + R`. O vídeo não precisa mais de uma pasta separada para funcionar nessas páginas.

**Para Vercel:** publique o ZIP completo. O vídeo original continua em `assets/video.baber.jpg.mp4` como cópia de segurança, sem perda da versão fornecida. Você precisa configurar o backend da Vercel e o acesso do Rodrigues para fazer agendamentos reais. No GitHub Pages, o visual abre mas a API de agenda não funciona.

Não coloque chaves secretas do Supabase no código público. O Mercado Souza não foi alterado.

---

# CORREÇÃO GITHUB PAGES | DOM RUIZ 2.6

## Para corrigir a tela branca SEM precisar atualizar 27 arquivos

1. No repositório `dom-ruiz-teste`, abra a raiz e substitua apenas o arquivo `index.html` pelo deste ZIP.
2. Confirme que o arquivo aparece exatamente como `index.html` na **raiz** (não dentro de outra pasta).
3. Em **Settings > Pages**, escolha **Deploy from a branch > main > / (root)**, depois Save.
4. Depois que o workflow do Pages concluir, abra `https://wallacelima244.github.io/dom-ruiz-teste/` com Ctrl+Shift+R.

Este `index.html` contém o CSS, o JavaScript, a logo e as imagens principais internamente. Portanto, as fontes/cores/fotos funcionam mesmo se o CSS ou a pasta de imagens externa não forem encontrados. O vídeo ainda depende de `assets/video.baber.jpg.mp4`; inclua a pasta assets para ele funcionar.

**IMPORTANTE:** Github Pages é um site estático. Para receber agendamentos reais, conectar o Supabase e operar o painel administrativo, publique o projeto COMPLETO na Vercel e configure a chave segura do backend. No Github Pages, o catálogo fica em modo de referência e os clientes podem chamar no WhatsApp enquanto a API não está disponível. Não coloque a chave `service_role` em `index.html` ou `config.js`.

## Instruções originais da Vercel

# Dom Ruiz 2.5 — CORREÇÃO DO GITHUB PAGES

**Por que a tela apareceu branca?** O site antigo usava caminhos absolutos como `/style.css` e `/assets/logo.jpg.jpeg`. No GitHub Pages, com a URL `/dom-ruiz-teste/`, esses caminhos apontavam para a pasta errada. Corrigimos CSS, JS, imagens, vídeo, logo da faixa e links entre as páginas para caminhos relativos.

## Para corrigir agora

1. Abra o ZIP e envie **todos os arquivos e a pasta `assets/`** para a raiz do repositório `dom-ruiz-teste`. Ao abrir o repositório, `index.html` e `style.css` devem aparecer juntos, e `assets/` como pasta ao lado deles.
2. Confirme em **GitHub → Settings → Pages** que está publicando a branch e a pasta corretas (por exemplo, `main` / `(root)`).
3. Acesse `https://wallacelima244.github.io/dom-ruiz-teste/` e atualize com **Ctrl + Shift + R** para ignorar a versão em cache.
4. Abra `https://wallacelima244.github.io/dom-ruiz-teste/style.css` e `https://wallacelima244.github.io/dom-ruiz-teste/assets/logo.jpg.jpeg`. Ambas devem carregar diretamente no navegador.

**Atenção:** GitHub Pages publica apenas arquivos estáticos. O visual e o catálogo de demonstração funcionarão, mas **GitHub Pages não executa `api/index.js`**, que é a API privada das reservas e do painel. Para agendamentos de verdade e login do Rodrigues, publique o mesmo repositório na **Vercel**, configure as variáveis de ambiente da API e teste a conexão do Supabase. Se a agenda estiver desconectada, o site oferece WhatsApp e nunca confirma uma reserva fictícia.

**Não envie** `SUPABASE_SERVICE_ROLE_KEY` para GitHub nem para o navegador. Essa chave fica só nas variáveis de ambiente da Vercel. Mercado Souza não precisa de mudanças.

---

# Barbearia Dom Ruiz 2.4 | Logo ORIGINAL sem fundo branco

Nesta versão, a faixa horizontal usa exatamente a logo original da Dom Ruiz (navalhas, bigode e nome), convertida para PNG transparente em `assets/logo-faixa-transparente.png`. Não foi desenhado nem substituído o símbolo da marca.

A logo é um pouco maior (110 × 50 px no computador; 78 × 36 px no celular), sem quadrado branco, sombra ou borda. A faixa mantém o movimento contínuo (11 segundos no desktop), com cópias iguais e sem buracos entre os ciclos.

## Publicar

- Para atualizar apenas a faixa, envie `index.html`, `style.css` **e** `assets/logo-faixa-transparente.png`, respeitando a pasta assets.
- Para substituir tudo, use o ZIP completo no repositório GitHub da Dom Ruiz.
- Não altere as variáveis de ambiente da Vercel nem o Supabase. Esta correção é apenas visual e funciona mesmo com o banco desconectado.

---

# DOM RUIZ 2.3 | LOGO ORIGINAL + FAIXA MAIS RÁPIDA

**Alterado:** na faixa azul, o asterisco foi substituído pela logo original da Dom Ruiz. A faixa agora desliza continuamente e mais rápido (11 s no computador, 15 s no celular), sem deixar espaços vazios na passagem do conteúdo. A animação funciona apenas com HTML/CSS, sem conexão ao Supabase.

**Como atualizar:** extraia este ZIP e substitua todos os arquivos do projeto no GitHub da Dom Ruiz. Ou use o pacote separado com somente `index.html` e `style.css` se quiser atualizar apenas a faixa. Não altere as variáveis privadas que já estejam configuradas na Vercel. Aguarde a publicação do novo deploy; se o navegador mostrar o visual antigo, atualize com Ctrl+F5.

**Atenção:** este ZIP não publica o site sozinho. A agenda e o painel continuam dependendo da configuração da API e do Supabase na Vercel, conforme as instruções completas abaixo.

---

# DOM RUIZ 2.2 | FAIXA ANIMADA CORRIGIDA

**Correção:** a faixa azul (PRECISÃO · PERSONALIDADE · PRESENÇA · DOM RUIZ) agora desliza continuamente para a esquerda, com repetição sem salto. A animação é só HTML/CSS e não depende do Supabase.

**Para atualizar no GitHub:** substitua todos os arquivos do projeto pelos deste ZIP, preservando as configurações de ambiente já feitas na Vercel. Se desejar corrigir apenas a faixa, substitua somente `index.html` e `style.css`. No painel da Vercel, confirme que o novo deploy foi publicado. Para verificar, atualize a página com Ctrl+F5 no Windows.

---

# Dom Ruiz 2.1 — revisão e diagnóstico rápido

**Corrigido nesta versão:** o catálogo agora exibe os seis serviços com as fotos originais mesmo se a API ainda não estiver configurada. Enquanto o backend não responder, o agendamento próprio não simula uma reserva e oferece WhatsApp para contato. Foram melhorados o retorno de erro, o carregamento de horários e o tratamento da sessão administrativa.

**Teste mais rápido para descobrir o que falta:** após publicar na Vercel, abra `https://SEU-SITE.vercel.app/api/index?action=health` no navegador.

- Se aparecer `{"ok":true,"database":"connected"}`, a API está conectada ao Supabase.
- Se aparecer `reason: "missing_server_key"`, falta configurar a variável privada `SUPABASE_SERVICE_ROLE_KEY` **somente na Vercel**.
- Se aparecer `reason: "database_connection"`, confira a URL do projeto e a chave privada na Vercel e faça Redeploy.

O login do Rodrigues **também precisa ser criado em Authentication → Users** e seu usuário autorizado em `public.admin_users`, conforme explicado abaixo. Sem essas configurações, as telas existem mas não devem ser tratadas como prontas para receber reservas reais.

---

# BARBEARIA DOM RUIZ — SITE + AGENDA PRÓPRIA + PAINEL

Projeto independente do Mercado Souza. Feito com HTML, CSS e JavaScript no site, funções de servidor da Vercel e banco Supabase exclusivo da Dom Ruiz.

## O que já está preparado

- **Site (`index.html`)** com visual renovado, fotos e vídeo originais, catálogo com valores e durações, localização, Instagram, WhatsApp e avaliação no Google.
- **Agendamento dentro do próprio site**: escolha de serviço, data, horário livre, nome e WhatsApp. Clientes não precisam criar conta. A reserva é salva no Supabase; o WhatsApp é um contato adicional, não substitui a reserva.
- **Painel (`admin.html`)** com login, visão geral, faturamento de atendimentos marcados como concluídos, agenda, reagendamentos, cancelamentos, faltas, bloqueios de horário, clientes, WhatsApp, serviços, preços, fotos, horários e exportação CSV.
- **Proteção no banco** para impedir intervalos de reserva sobrepostos, mesmo se duas pessoas tentarem reservar quase ao mesmo tempo.

**Importante:** o banco de dados já foi criado, testado e recebeu os seis serviços e os horários iniciais. O site ainda precisa ser publicado na Vercel e receber a chave privada em uma variável de ambiente. **Não está publicado nem pronto para reservas reais até concluir os passos abaixo.**

## 1. Publique os arquivos sem alterar a estrutura

No VS Code, abra esta pasta inteira (`dom_ruiz_site`). Envie **todos** os arquivos e a pasta `assets/` para um repositório GitHub. No painel da [Vercel](https://vercel.com/), crie um projeto a partir do repositório. Framework Preset: **Other**. Root Directory: a pasta que contém `index.html`, `admin.html`, `api/`, `vercel.json` e `assets/`. Não configure comando de build.

A aplicação usa as URLs `/` (site), `/admin.html` (painel), `/api/index?action=services` (catálogo) e demais ações `/api/index`.

## 2. Configure a Vercel com segurança

Abra **Vercel → Projeto Dom Ruiz → Settings → Environment Variables**. Configure as três variáveis abaixo nos ambientes em que vai publicar:

| Nome | Valor |
|---|---|
| `SUPABASE_URL` | `https://bysxwsoiyxsflildpznf.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_BsTF4RNQ3wBSymPDG3ApFg_6dzDRHSZ` |
| `SUPABASE_SERVICE_ROLE_KEY` | Copie a **chave privada service_role** do projeto Dom Ruiz no Supabase |

Para obter a chave secreta: abra **[Supabase → projeto Dom Ruiz](https://supabase.com/dashboard/project/bysxwsoiyxsflildpznf/settings/api-keys)**, procure **Legacy API Keys → service_role**. Dependendo da interface, pode ser necessário habilitar/exibir a chave legada. **Nunca copie essa chave para o GitHub, HTML, JS do navegador, `config.js` ou WhatsApp**. Somente a Vercel pode guardá-la como variável secreta de servidor. A chave publishable presente no site é pública por definição.

Salve e faça um **Redeploy** do projeto na Vercel. A configuração em `config.js` já contém apenas dados públicos do projeto Dom Ruiz e não precisa ser preenchida.

## 3. Crie o login do Rodrigues

1. No projeto Dom Ruiz, vá a **Supabase → Authentication → Users → Add user**.
2. Crie um usuário com **o e-mail do Rodrigues e uma senha forte definida por ele**. Marque a confirmação de e-mail se a interface oferecer essa opção para um usuário criado pelo administrador.
3. Abra **SQL Editor → New query** no projeto Dom Ruiz. Cole o SQL abaixo, **trocando `EMAIL_DO_RODRIGUES` pelo e-mail criado**:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('EMAIL_DO_RODRIGUES')
on conflict (user_id) do nothing;
```

4. Clique em **Run**. Entre no painel pelo endereço `https://seu-site.vercel.app/admin.html` com esse e-mail e senha. **Não publique essas credenciais no código ou neste chat.**

Só os usuários que estiverem na tabela privada `admin_users` conseguem usar o painel, mesmo se outra pessoa fizer login no Supabase.

## 4. Confira antes de entregar ao cliente

1. Abra o site e confira se os seis serviços carregam com fotos e preços.
2. Escolha um serviço, dia e horário; preencha nome e WhatsApp e confirme uma reserva de teste.
3. Entre no painel e confira se a reserva aparece na agenda do dia.
4. Tente reservar **o mesmo horário** em outra aba: deve aparecer indisponível.
5. No painel, conclua o atendimento de teste e confirme a atualização dos indicadores de faturamento.
6. Teste bloqueio de horário, alteração de preço e mudança de expediente. O site deve refletir os dados atualizados.
7. Cancele a reserva de teste ou elimine os registros de teste no painel. Faça testes de celular e computador.

## Atenção com a operação

- Para evitar agendas em conflito, **pare de receber reservas no InBarber/BestBarbers quando a agenda própria entrar em produção** ou migre os horários existentes antes de abrir o novo site.
- O WhatsApp não envia mensagens automaticamente: o botão prepara uma mensagem, e a pessoa escolhe enviá-la. Mensagens automáticas exigem integração adicional aprovada.
- O formulário salva nome e WhatsApp, por isso há aviso de finalidade. Publique também um canal para solicitações sobre dados de clientes.
- Proteções de base (checagem de sobreposição, honeypot e limite simples por telefone) foram incluídas. Para alto volume ou abuso, configure proteção adicional contra bots/rate limiting na Vercel/Cloudflare.
- Sem senha de admin e sem a variável secreta de servidor, **a API não confirma agendamentos reais**. Não substitua valores do site por resultados fictícios.
- Serviço de hospedagem e Supabase podem ter limites de uso conforme os planos gratuitos. O Supabase Free pode pausar projetos com baixa atividade.

## Estrutura

```text
index.html, style.css, script.js    Site público e agendamento
admin.html, admin.css, admin.js     Painel administrativo
config.js                          Configuração pública
api/index.js                       API privada executada na Vercel
assets/                            Fotos, logo e vídeo originais
sql/schema.sql                     Cópia do SQL inicial, já aplicado no banco
vercel.json                        Cabeçalhos de segurança
.env.example                       Exemplo sem segredos
```

**Nunca rode novamente `sql/schema.sql` em outro projeto Supabase por engano.** Ele está incluído para documentar a estrutura criada, não é necessário executá-lo na Dom Ruiz.
