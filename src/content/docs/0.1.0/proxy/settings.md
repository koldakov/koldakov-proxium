---
title: Settings
description: Allowed networks, timeouts and cache TTLs, applied without a restart.
sidebar:
  order: 6
slug: 0.1.0/proxy/settings
---

The Settings page of the admin UI holds what the proxy does with connections. The proxy looks the settings up
every `PROXY_SETTINGS_POLL_INTERVAL` seconds and applies them without a restart: new connections get them, open
ones keep the old.

## Allowed networks

The proxy reaches only the public internet, loopback, private networks and cloud metadata (`169.254.169.254`) are
blocked. List the private networks clients may reach anyway, e.g. `10.0.0.0/8`. Every client gets them, accounts
and trusted networks alike.

## Timeouts

In seconds:

- handshake, for a client to authenticate and send its request, `10` by default
- idle, after which a silent tunnel is closed, `300`
- connect, to resolve and reach a target, `10`

## Cache TTLs

In seconds, `10` by default each: how long the proxy reuses checks instead of looking them up and hashing secrets
on every connection.

Basic accounts, token accounts and trusted networks have two each:

- **passed**, within which a revoked or expired account keeps connecting and a removed trusted network stays
  trusted
- **refused**, within which a new or re-enabled one isn't let in yet

The TLS certificate has one: how soon activating another one applies. Lowering a TTL drops what it cached, so it
applies at once. If the database is down, clients without a cached check are refused.

## Checking and stopping

Check an account with a site that shows the caller's IP:

```bash
curl -x http://USERNAME:PASSWORD@127.0.0.1:8080 https://ifconfig.me
```

`Ctrl+C` (SIGINT) or SIGTERM stops accepting and waits up to `PROXY_GRACEFUL_TIMEOUT` for open connections.
A second signal stops immediately.
