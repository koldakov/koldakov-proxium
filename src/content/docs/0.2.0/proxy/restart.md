---
title: Restart without downtime
description: Upgrade or restart the proxy while clients keep connecting.
sidebar:
  order: 7
slug: 0.2.0/proxy/restart
---

Two proxies can listen on the same ports at once, Linux spreads new connections between them. To upgrade, start the
new version, then send SIGTERM to the old one: it stops accepting and finishes open connections within
`PROXY_GRACEFUL_TIMEOUT`.

- Both proxies run as the same user, else Linux refuses the port.
- The old proxy's connections waiting to be accepted at the moment it stops are reset, clients retry them.
- Connection limits, speed limits and quotas are shared by both proxies through [Redis](/0.2.0/reference/redis/).

With `PROXY_REUSE_PORT=false` a second proxy on a taken port fails to start instead of taking a share of the
clients, see [Configuration](/0.2.0/reference/configuration/#proxy).

:::note[Since 0.1.1]
A 0.1.0 proxy doesn't share its ports, so upgrading from it is a plain restart.
:::

## Docker

It takes `--network host`, two containers can't publish one port with `-p`, a database and Redis outside the
container, with `PROXIUM_SERVICES=proxy`. Both proxies must use the same Redis: with the bundled one each container
counts limits and quotas alone.

```bash
docker run -d --name proxium-new --network host -e PROXIUM_SERVICES=proxy \
  -e DATABASE_URL=... -e REDIS_URL=... -e ENCRYPTION_KEY=... -e PROXY_LISTEN=... ikoldakov/proxium:NEW
docker stop --time 40 proxium-old
```

`--time` is how long Docker waits before killing the old container. Leave it a few seconds over
`PROXY_GRACEFUL_TIMEOUT`: closing connections release their places in Redis, and the last traffic goes to the
database and Redis, each Redis step up to the two Redis timeouts.

:::note[Upgrades that change quotas in Redis]
If a release changes how quotas keep traffic in Redis, or the old proxy is from before quotas were shared, the
release notes say so: meanwhile the old and the new proxy don't see each other's traffic not yet in the database, a
quota may let through what the old one hasn't written, for up to `PROXY_GRACEFUL_TIMEOUT`. From 0.1.1 to 0.2 see
[Upgrading](/0.2.0/installation/upgrading/#without-downtime).
:::
