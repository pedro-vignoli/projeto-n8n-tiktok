```
 _   _   ___   _   _
| \ | | ( _ ) | \ | |
|  \| | / _ \ |  \| |
| |\  || (_) || |\  |
|_| \_| \___/ |_| \_|

 _____  ___  _  __ _____   ___   _  __
|_   _||_ _|| |/ /|_   _| / _ \ | |/ /
  | |   | | | ' /   | |  | | | || ' /
  | |   | | | . \   | |  | |_| || . \
  |_|  |___||_|\_\  |_|   \___/ |_|\_\
```

[English](README.md) | **Português**

## Sobre

Fluxo do n8n que posta no TikTok os vídeos do dia, pela API oficial de publicação de conteúdo. Ele lê a pasta com a data de hoje, usa um arquivo de tags como legenda, envia cada vídeo e deixa um marcador para nunca postar o mesmo vídeo duas vezes.

## Como funciona

1. **List videos** lê `Posts/<AAAA-MM-DD>/*.mp4` e pula os arquivos que já têm o marcador `.tiktok.ok`.
2. **Get token** carrega o token salvo e renova quando está perto de expirar.
3. **Post video** envia o arquivo ao TikTok (init, upload, consulta de status) e grava o marcador.

## Requisitos

- Docker e Node.js 18 ou mais novo.
- Um app no portal de desenvolvedores do TikTok com a Content Posting API e os escopos `user.info.basic` e `video.publish`, mais uma redirect URI cadastrada.

## Como executar

```
git clone https://github.com/pedro-vignoli/projeto-n8n-tiktok.git
cd projeto-n8n-tiktok
cp .env.example .env        # defina VIDEOS_DIR com a pasta dos vídeos
docker compose up -d
node scripts/authorize.js   # uma vez, guarda o token no volume do n8n
```

Depois abra `http://localhost:5678`, vá em Workflows > Import from file, escolha `workflow/post-tiktok.json` e clique em Execute.

Organize os vídeos assim:

```
Posts/
|-- tags-tiktok.txt
`-- 2026-01-01/
    `-- meu-corte.mp4
```

## Configurações

| Onde | O quê |
|------|-------|
| `nodes/list-videos.js` | `TIMEZONE` define qual pasta conta como "hoje" |
| `nodes/post-video.js` | `PRIVACY`, veja a nota abaixo |
| `.env` | `VIDEOS_DIR`, pasta montada dentro do container |

Depois de mudar um arquivo em `nodes/`, rode `node build.js` e importe o fluxo de novo.

## Nota sobre a auditoria

Um app do TikTok que ainda não passou pela auditoria só posta em conta privada, com privacidade `SELF_ONLY`. A API responde `unaudited_client_can_only_post_to_private_accounts`. Depois que o app for aprovado, troque `PRIVACY` para `PUBLIC_TO_EVERYONE`.

## Estrutura

```
|-- nodes/                código de cada nó Code do n8n
|-- scripts/authorize.js  autorização feita uma vez
|-- workflow/             fluxo para importar (gerado)
|-- examples/             exemplo da estrutura de pastas
|-- build.js              monta o fluxo a partir de nodes/
|-- docker-compose.yml    n8n com as configurações certas
`-- .env.example
```

## Segurança

O client secret e os tokens ficam só no volume do n8n (`tiktok.json`). Nunca entram no arquivo do fluxo. Não suba `tiktok.json` nem `.env` para o Git.
