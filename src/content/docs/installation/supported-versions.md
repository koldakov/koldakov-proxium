---
title: Supported versions
description: PostgreSQL and Redis versions Proxium runs on, and how to upgrade Redis.
sidebar:
  order: 5
---

|            | Supported | Docker image            | Compose example |
| ---------- | --------- | ----------------------- | --------------- |
| PostgreSQL | 17, 18    | 17                      | 17              |
| Redis      | 7.4, 8    | 8, from its Debian base | 8               |

Every supported version runs the full test suite in CI. Your own database or Redis, e.g. a managed one, works on
any of them. Redis must be 7.4 or newer: traffic quotas use hash fields that expire, which older Redis doesn't have,
and the proxy doesn't start on it. One that turns older while the proxy runs, e.g. after a failover, is an outage
for quotas, and the log says why. PostgreSQL 13 to 16 should work too, nothing newer is used, but they aren't tested.

The image keeps PostgreSQL data in its volume, and a new major version can't read an older one's data. So the
bundled PostgreSQL changes only in a release that comes with an [upgrade guide](/installation/upgrading/).

## Upgrading Redis

Nothing is lost whichever way Redis is upgraded. It keeps only what's true right now: the connections open at the
moment, traffic not yet written to the database and the migration lock. Every proxy knows its own connections and
traffic and writes them to Redis again on its own, so there's no data to move. The bundled Redis and the compose
example don't even save it to disk.

With the Docker image the bundled Redis comes with the image: it's upgraded with Proxium, nothing to do.

With the compose example or your own Redis, pick one of two ways.

### Restart in place

The simple one. E.g. `docker compose -f docker/compose.yaml pull redis`, then
`docker compose -f docker/compose.yaml up -d redis`, or the upgrade of a managed Redis.

- Proxies keep running. For up to `PROXY_REDIS_OUTAGE_TIMEOUT` seconds of Redis being away, 30 by default, clients
  notice nothing. If it takes longer, until Redis is back new connections under connection limits are refused,
  and connections under quotas are refused or cut. Others go on.
- Redis comes back empty. Within a third of `PROXY_CONNECTION_LEASE`, 10 seconds by default, every proxy writes its
  open connections there again, its unwritten traffic within a second. Until then a connection limit may let up to
  its value more in.

### Switch to a new Redis

No outage at all.

1. Start the new Redis of a supported version, see the table above.
2. Restart the instances one by one with `REDIS_URL` of the new one, see
   [Restart without downtime](/proxy/restart/). An old process finishes its connections counted in the old Redis,
   the new one counts in the new Redis.
3. Once no old process is left, stop the old Redis. What it still holds are connections of processes that are gone.

While old and new processes overlap they don't see each other's connections and unwritten traffic: a connection
limit may let up to its value more in, a quota what the old processes haven't written yet, for up to
`PROXY_GRACEFUL_TIMEOUT`.

:::caution
Either way, don't upgrade Proxium at the same time: instances starting on different Redis don't share the migration
lock of `proxium-manage migrate`.
:::

More on how the proxy handles Redis failures: [Redis](/reference/redis/).
