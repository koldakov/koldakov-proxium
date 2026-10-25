---
title: Restart without downtime
description: Upgrade or restart the proxy while clients keep connecting.
sidebar:
  order: 7
slug: 0.1.1/proxy/restart
---

Two proxies can listen on the same ports at once, Linux spreads new connections between them. To upgrade, start the
new version, then send SIGTERM to the old one: it stops accepting and finishes open connections within
`PROXY_GRACEFUL_TIMEOUT`.

- Both proxies run as the same user, else Linux refuses the port.
- The old proxy's connections waiting to be accepted at the moment it stops are reset, clients retry them.
- Both count connection and speed limits on their own, so while they overlap a client may get up to twice its
  limits.

With `PROXY_REUSE_PORT=false` a second proxy on a taken port fails to start instead of taking a share of the
clients, see [Configuration](/0.1.1/reference/configuration/#proxy).

:::note[Since 0.1.1]
A 0.1.0 proxy doesn't share its ports, so upgrading from it is a plain restart.
:::

## Docker

It takes `--network host`, two containers can't publish one port with `-p`, and a database outside the container,
with `PROXIUM_SERVICES=proxy`:

```bash
docker run -d --name proxium-new --network host -e PROXIUM_SERVICES=proxy \
  -e DATABASE_URL=... -e ENCRYPTION_KEY=... -e PROXY_LISTEN=... ikoldakov/proxium:NEW
docker stop --time 40 proxium-old
```

`--time` is how long Docker waits before killing the old container, keep it above `PROXY_GRACEFUL_TIMEOUT`.
