# DOM RUIZ | Fotos e painel atualizados

Este pacote atualiza as páginas, sem modificar os dados do Supabase.

## O que corrigimos
- Fotos reais dos seis serviços sempre presentes, mesmo quando o Supabase envia `/assets/...` e a pasta não existe na implantação da Vercel.
- O catálogo continua usando serviços, preços e duração **do banco de dados**. Não volta a usar dados de demonstração quando a API responde.
- Fotos personalizadas enviadas pelo painel, com URL do Supabase Storage, continuam funcionando e têm fallback se a imagem não carregar.
- O painel foi refinado visualmente: menu, cards, gráficos, catálogo, botões e experiência responsiva, mantendo os controles e a API atuais.
- A pasta `api` contém a versão corrigida, compatível com `sb_secret_` e legacy `service_role`.

## Publicação mais simples
1. Se o site e a API já estão funcionando na Vercel, substitua **somente** `index.html` e `admin.html` na raiz do repositório GitHub.
2. Não substitua as variáveis da Vercel, não rode o SQL novamente, não recrie o Supabase.
3. Depois que a implantação estiver pronta, confira as fotos dos 6 serviços no site.
4. Entre em `/admin.html`, abra Serviços e confira as miniaturas e o painel.
5. Confirme que a API continua em `/api/index?action=health` retornando `ok:true`.

Observação: esta versão não foi publicada automaticamente na sua conta Vercel. Não compartilhe chaves privadas. Este é um site de teste, mantenha o domínio oficial no projeto antigo.
