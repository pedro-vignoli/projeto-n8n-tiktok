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

**English** | [Português](README.pt-BR.md)

## About

n8n workflow that posts the day's videos to TikTok through the official Content Posting API. It reads a folder named after today's date, uses a tags file as the caption, uploads each video and leaves a marker file so the same video is never posted twice.

## How it works

1. **List videos** reads `Posts/<YYYY-MM-DD>/*.mp4` and skips files that already have a `.tiktok.ok` marker.
2. **Get token** loads the saved token and refreshes it when it is about to expire.
3. **Post video** sends the file to TikTok (init, upload, status check) and writes the marker.

## Requirements

- Docker and Node.js 18 or newer.
- A TikTok developer app with the Content Posting API and the `user.info.basic` and `video.publish` scopes, plus a registered redirect URI.

## How to run

```
git clone https://github.com/pedro-vignoli/projeto-n8n-tiktok.git
cd projeto-n8n-tiktok
cp .env.example .env        # set VIDEOS_DIR to your videos folder
docker compose up -d
node scripts/authorize.js   # one time, saves the token in the n8n volume
```

Then open `http://localhost:5678`, go to Workflows > Import from file, choose `workflow/post-tiktok.json` and click Execute.

Put the videos like this:

```
Posts/
|-- tags-tiktok.txt
`-- 2026-01-01/
    `-- my-clip.mp4
```

## Settings

| Where | What |
|-------|------|
| `nodes/list-videos.js` | `TIMEZONE` decides which folder counts as "today" |
| `nodes/post-video.js` | `PRIVACY`, see the note below |
| `.env` | `VIDEOS_DIR`, folder mounted into the container |

After changing a file in `nodes/`, run `node build.js` and import the workflow again.

## Note on audit

A TikTok app that has not passed the audit can only post to a private account, with `SELF_ONLY` privacy. The API answers with `unaudited_client_can_only_post_to_private_accounts`. After the app is approved, set `PRIVACY` to `PUBLIC_TO_EVERYONE`.

## Structure

```
|-- nodes/                code of each n8n Code node
|-- scripts/authorize.js  one-time authorization
|-- workflow/             importable workflow (generated)
|-- examples/             sample folder layout
|-- build.js              builds the workflow from nodes/
|-- docker-compose.yml    n8n with the right settings
`-- .env.example
```

## Security

The client secret and tokens live only in the n8n volume (`tiktok.json`). They are never part of the workflow file. Do not commit `tiktok.json` or `.env`.
