---
title: From source
description: Run Proxium with uv and your own PostgreSQL and Redis.
sidebar:
  order: 4
slug: 0.2.0/installation/from-source
---

Requirements: Python 3.14+, [uv](https://docs.astral.sh/uv/), PostgreSQL and Redis of the
[supported versions](/0.2.0/installation/supported-versions/).

```bash
git clone --branch v0.2.0 https://github.com/koldakov/proxium.git
cd proxium
uv sync
cp .env.template .env           # fill it in, see Configuration
uv run --env-file .env proxium-manage migrate
uv run --env-file .env proxium-manage createsuperuser
```

See [Configuration](/0.2.0/reference/configuration/) for the variables.

Run the proxy:

```bash
uv run --env-file .env proxium
```

or

```bash
uv run --env-file .env python -m proxium
```

The API is a FastAPI app served by [Hypercorn](https://hypercorn.readthedocs.io/). Extra arguments go to Hypercorn:

```bash
uv run --env-file .env proxium-api --bind 127.0.0.1:8000
```
