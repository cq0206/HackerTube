# Third-party notices

## Application code

Original application code in this repository is licensed under the MIT license in
[LICENSE](LICENSE). HackerTube Desktop is an independent project. It is not affiliated
with HackerTube.org, YouTube, Google, Hacker News, or Y Combinator.

## Bundled video catalog — separate data license

`extension/data/videos.jsonl` is an unmodified subset of the public HackerTube data
export dated **2026-10-31**, obtained from <https://hackertube.org/data>.
It contains 6,454 video records, including AI-generated summaries, topic labels and
representative Hacker News comment quotations. The full export, comment corpus,
embeddings and video files are not bundled.

The dataset is made available under the **Open Data Commons Attribution License
(ODC-By) v1.0**, not the application's MIT license:
<https://opendatacommons.org/licenses/by/1-0/>.

Data sources and attribution:

- HackerTube: <https://hackertube.org> — video selection and comment analysis.
- open-index/hacker-news: <https://huggingface.co/datasets/open-index/hacker-news>.
- Hacker News data is provided by Y Combinator. Individual comments belong to their
  original authors; video titles and channel names belong to their creators.

The upstream documentation and original licensing statement are retained verbatim
in [extension/data/DATA.md](extension/data/DATA.md). Its file map describes the
**full upstream export**, not all files shipped by this application.
Please retain this notice and the upstream statement when redistributing the data.

## External images and videos

YouTube thumbnails are fetched on demand from `i.ytimg.com`; video playback opens
YouTube in the system browser. Thumbnails and videos are not relicensed by this
repository. Video availability and geographic restrictions remain with YouTube.

## Desktop runtime and build tooling

Electron is MIT licensed and bundles Chromium, Node.js and other components with
their respective licenses. Runtime distributions include Electron's `LICENSE` and
`LICENSES.chromium.html`. Dependency versions and provenance are recorded in
`package-lock.json`; build and test tools keep their own upstream licenses.
