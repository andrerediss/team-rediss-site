# Team Rediss Site

Site institucional de André Rediss, personal trainer e professor de Muay Thai. A aplicação apresenta os serviços, os planos de treino, o agendamento de aula experimental e as listas de espera das turmas de Muay Thai.

## Stack

- React 19, TanStack Start e TanStack Router
- Vite e TypeScript
- Tailwind CSS v4 e componentes shadcn/ui
- Renderização SSR com servidor Node em `server.mjs`
- n8n para agendamentos e para as listas de espera das turmas

## Requisitos

- Node.js 22, a mesma versão de produção (o repositório não tem `.nvmrc`; a versão é definida no EasyPanel)
- npm

## Desenvolvimento

```bash
npm ci --ignore-scripts
npm run dev
```

Comandos disponíveis:

```bash
npm run build
npm run start
npm run lint
npm run format
```

`npm run start` serve o build SSR na porta definida por `PORT` ou na porta `3000`.

## Estrutura

- `src/routes/`: rotas file-based do TanStack Router.
- `src/routes/treinar/`: seletor de modalidade (Personal, Muay Thai particular e turma).
- `src/routes/treinar/personal/` e `src/routes/treinar/muaythai/`: planos, local e agendamento de aula experimental.
- `src/routes/treinar/turma/`: seletor entre as duas turmas, com uma pasta por unidade (`studio-top-fitness/` e `ct-ishigeki/`), cada uma com a página da turma e sua lista de espera.
- `src/components/`: componentes reutilizáveis e primitives shadcn/ui.
- `src/styles.css`: tokens visuais, tipografia e estilos globais.
- `src/routeTree.gen.ts`: arquivo gerado automaticamente pelo roteador; não editar manualmente.

## Turmas De Muay Thai

Existem duas turmas, cada uma com página e formulário próprios:

| Turma | Página | Lista de espera | Webhook n8n | Data Table |
| --- | --- | --- | --- | --- |
| Studio Top Fitness | `/treinar/turma/studio-top-fitness` | `.../interesse` | `/webhook/interesse/turma` | `interessados_turma_muay_thai` |
| CT Ishigeki | `/treinar/turma/ct-ishigeki` | `.../interesse` | `/webhook/interesse/turma-ishigeki` | `interessados_turma_ct_ishigeki` |

**Nenhuma das turmas começou.** As páginas exibem "Em breve" e não anunciam data de início — o texto do site não deve voltar a citar datas enquanto a turma não for confirmada. Os formulários continuam abertos, mas apenas como lista de espera: não prometem vaga nem matrícula.

Os formulários não redirecionam para o WhatsApp. O do Studio Top Fitness coleta nome, WhatsApp, idade e turno de interesse; o do CT Ishigeki coleta nome, WhatsApp e idade. Os workflows n8n validam os dados, gravam a inscrição na Data Table correspondente com status `novo` e devolvem uma confirmação ao site.

Ao abrir uma turma, atualize a página da unidade, o card em `/treinar/turma`, o card em `/treinar` e as meta descriptions das quatro rotas — todas mencionam o estado da turma.

## Agendamento De Aula Experimental

As rotas `/treinar/personal/agendar` e `/treinar/muaythai/agendar` usam o `BookingCalendar`, que busca os horários livres em `/webhook/slots/...` e envia o agendamento para `/webhook/agendar/...` no n8n.

## Deploy

O deploy de produção é feito no EasyPanel (serviço `team-rediss-site`) com Nixpacks 1.41.0, a partir do branch `main` e com caminho de build `/`. Os comandos de instalação, build e início (`npm install`, `npm run build` e `npm run start`) estão definidos no `nixpacks.toml` e também nas configurações de construção do EasyPanel — mantenha os dois iguais.

O runtime de produção é o Node 22, definido **apenas** no campo "Pacotes Nix" do EasyPanel como `nodejs_22`. O repositório não fixa a versão do Node (não há `.nvmrc`, `engines` nem `nixPkgs` no `nixpacks.toml`). Para mudar a versão, altere no EasyPanel, não no repositório.

Não adicione um segundo pacote de Node (como `nodejs_20`) nem `NIXPACKS_NODE_VERSION` no EasyPanel, e não volte a colocar `nixPkgs` no `nixpacks.toml`: duas versões do Node na mesma imagem causam conflito no Nix.

O domínio canônico é `https://andrerediss.com`; o `server.mjs` redireciona `www` para o domínio sem prefixo.

Antes de publicar, execute:

```bash
npm run build
```
