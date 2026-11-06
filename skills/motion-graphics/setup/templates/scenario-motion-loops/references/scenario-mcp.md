# What Scenario MCP does in this skill

The loop is code and never needs a model. Scenario MCP makes what code cannot draw: the user's
subject (a mascot, a product, a character) as a cut-out, and optionally a short AI video shot of it.
Both are composited over the coded loop.

## 0. Connect and pick a scope

Call `teams_list`. If the Scenario tools are missing or the call fails to authenticate, stop and give
the user the setup: add the MCP server `https://mcp.scenario.com` to the agent (in Claude Code:
`claude mcp add --transport http scenario https://mcp.scenario.com`), sign in with a Scenario account,
and optionally install the companion skills with `npx skills add scenario-labs/skills`.

If several teams or projects come back, ask the user which to use; do not pick one. Pass `team_id`
and `project_id` to every later call. With a signed-in (OAuth) account, `search`, `model_schema_get`
and `model_run` refuse to run without them; `recommend` works without them but then ranks the whole
public catalogue instead of what the team can use.

## 1. The loop for every generation step

1. **Choose the model** with `recommend`: the user's intent as `prompt`, a `capability`, and
   `limit`. When `next_step.type` is `ask_user`, show the question and options and wait for the
   answer. When it is `no_match`, explain what is missing; do not relax the requirement silently.
   Read each entry's `caveats`. Use `search` with `target: "models"` and `public: true` only to find a
   model by name. Take model ids from these results, never from memory.
2. **Read the inputs** with `model_schema_get`. The schema is the contract: field names, which image
   fields take arrays, allowed values, and options such as a transparent background.
3. **Upload the user's files** before any run that uses them: `upload_asset` with `file_name`,
   `content_type`, `kind` and `file_size` (from `wc -c`), PUT each part to the returned URL with curl
   (no extra checksum headers), then `upload_asset_complete` with the `upload_id`. Pass the returned
   asset id to `model_run`; it never takes a local path. Outputs of earlier runs are already assets:
   pass their ids directly.
4. **Price it**: `model_run` with `dry_run: true` and the full parameters. Tell the user the price of
   each step and the total, and wait for a go before the first paid run.
5. **Run**: `model_run` (`"wait": false` for several runs), then one `jobs_wait` with all job ids
   (at most 32). If it returns `pending_job_ids`, call `jobs_wait` again with those.
6. **Download**: `asset_download` with the asset id (`"format": "png"` for a still), then
   `curl -L -o <file> "<url>"` (follow redirects).

## 2. The subject cut-out (the main route)

`recommend` with `capability: "txt2img"` (described in words) or `"img2img"` (from the user's own
mascot, logo or product photo, uploaded first). Ask for what the loop needs, in the prompt:

```json
{
  "capability": "img2img",
  "prompt": "The mascot from the reference image, full body, three-quarter view, a light floating pose, cut out on a transparent background with clean edges, no shadow, no text",
  "limit": 5
}
```

Prefer a model whose schema offers a transparent background output. If the chosen model only
makes opaque images, add a background removal step: `recommend` again with
`capability: "img2img"` and a prompt such as "remove the background, keep the subject with a clean
alpha edge", then the same schema, dry run, run and download loop.

Before compositing, look at the cut-out at 100 % on the loop's background colour. Halos around hair,
outlines and soft shadows show on dark tones. Regenerate or cut again rather than hiding a halo.

The loop page draws the PNG itself (`?overlay=subject.png`, function `drawOverlay`), on the loop's
clock: it keeps the motion blur and the seamless loop.

## 3. An AI video shot over the loop (optional)

For a subject that really moves (waves, turns, walks), generate a shot and lay it over the rendered
loop.

1. `recommend` with `capability: "img2video"` and the cut-out (or the user's still) as the start
   image: "the mascot waves and turns its head, plain flat background, locked-off camera, no cuts".
   A plain background and a locked camera make the next step clean. Schema, dry run, go, run,
   `jobs_wait`, download.
2. `recommend` with `capability: "video2video"` and a prompt such as "remove the background from
   this clip, keep the subject with an alpha channel". Choose an output with alpha: WebM VP9 with
   alpha for browsers and ffmpeg, ProRes 4444 for editing software. Schema, dry run, go, run,
   download.
3. Composite with ffmpeg. The loop repeats under the shot and the output is as long as the shot:

```bash
ffmpeg -stream_loop -1 -i loop.mp4 -c:v libvpx-vp9 -i shot.webm \
  -filter_complex "[1:v]scale=-2:720[s];[0:v][s]overlay=(W-w)/2:(H-h)/2:shortest=1,format=yuv420p" \
  -c:v libx264 -crf 16 -preset slow -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -color_range tv -movflags +faststart -an composite.mp4
```

- `-c:v libvpx-vp9` must come before `-i shot.webm`. The built-in VP9 decoder ignores the alpha
  channel, and the shot arrives in a black box. ffprobe reports such a file as `yuv420p` with the tag
  `alpha_mode=1`; that is still a file with alpha. A ProRes 4444 `.mov` needs no decoder flag.
- The composite is a one-shot clip, not a seamless loop, unless the shot itself loops. Some video
  models offer a loop option; their first and last frames still need checking. Run
  `node scripts/render-loop.mjs --qa composite.mp4` on anything meant to loop.
- Match the shot's frame rate to the loop (24 fps) or let ffmpeg convert it with `fps=24` in the
  filter, and keep the shot's subject at the size and position the loop leaves room for.

## Traps

- Several teams or projects and no choice from the user: ask; never pick for them.
- A model id or a price from memory: always `recommend` or `search`, `model_schema_get`, `dry_run`.
- A local path in `model_run`: upload first.
- A generated clip used as the loop itself: its last frame rarely meets its first exactly, and fine
  lines can shimmer. Keep the loop in code.
- An overlay PNG opened from disk in a page that reads pixels back taints the canvas. Render
  through `render-loop.mjs`, which serves the folder over a local address.
