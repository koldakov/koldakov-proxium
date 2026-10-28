---
title: Configuration
description: Environment variables of the proxy, the API, the management commands and the Docker image.
sidebar:
  order: 1
---

Settings are read from environment variables. In Docker pass them with `-e`. From source, copy the template and
fill it in:

```bash
cp .env.template .env
```

Business settings, e.g. timeouts and allowed networks, live in the database and are changed in the admin UI, see
[Settings](/proxy/settings/).

## Common

Read by the proxy, the API and the management commands.

| Variable                       | Description                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                 | PostgreSQL URL, e.g. `postgres://user:password@host/db_name`                                                            |
| `ENCRYPTION_KEY`               | Fernet key that encrypts private keys of TLS certificates in the database, see [TLS](/proxy/tls/#encryption-key)        |
| `ENCRYPTION_OLD_KEYS`          | Comma-separated previous keys, they still decrypt during [key rotation](/proxy/tls/#encryption-key)                     |
| `DATABASE_ECHO`                | Log every SQL query, default `false`. Parameters are always hidden                                                      |
| `DATABASE_POOL_SIZE`           | Connections each process keeps open, default `5`                                                                        |
| `DATABASE_POOL_MAX_OVERFLOW`   | Extra connections under load, default `10`                                                                              |
| `DATABASE_POOL_TIMEOUT`        | Seconds to wait for a free connection, default `30`                                                                     |
| `DATABASE_POOL_RECYCLE`        | Seconds after which a connection is replaced, default `-1` (never)                                                      |
| `REDIS_URL`                    | Redis URL, e.g. `redis://host:6379/0`, `rediss://` for TLS or `unix:///path/redis.sock`, see [Redis](/reference/redis/) |
| `REDIS_PASSWORD`               | Redis password, if it's not in `REDIS_URL`                                                                              |
| `REDIS_KEY_PREFIX`             | Starts every key, default `proxium:`. Different ones let several installations share one Redis                          |
| `REDIS_POOL_MAX_CONNECTIONS`   | Connections each process opens at most, default `100`. A command beyond them fails                                      |
| `REDIS_SOCKET_CONNECT_TIMEOUT` | Seconds to connect to Redis, default `2`                                                                                |
| `REDIS_SOCKET_TIMEOUT`         | Seconds to wait for an answer of Redis, default `2`                                                                     |

## Proxy

| Variable                       | Description                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PROXY_LISTEN`                 | Addresses to listen on, default `127.0.0.1:8080`, see below                                                                                                                                                                                                                                                                                     |
| `PROXY_GRACEFUL_TIMEOUT`       | Seconds open connections get to finish on shutdown, default `30`                                                                                                                                                                                                                                                                                |
| `PROXY_REUSE_PORT`             | Let another proxy listen on the same ports, default `true`, see [Restart without downtime](/proxy/restart/)                                                                                                                                                                                                                                     |
| `PROXY_BACKLOG`                | Connections waiting to be accepted per listening socket, default `1024`. Raise it if bursts of new connections stall. Takes effect on restart, see below                                                                                                                                                                                        |
| `PROXY_LOG_LEVEL`              | `DEBUG`, `INFO`, `WARNING`, `ERROR` or `CRITICAL`, default `INFO`                                                                                                                                                                                                                                                                               |
| `PROXY_SETTINGS_POLL_INTERVAL` | Seconds between lookups of the [settings](/proxy/settings/) from the admin UI, default `5`                                                                                                                                                                                                                                                      |
| `PROXY_HEARTBEAT_INTERVAL`     | Seconds between reports of each instance to the database, default `30`. An instance that misses three in a row shows as unknown, see [Proxy instances](/admin/instances/)                                                                                                                                                                       |
| `PROXY_CONNECTION_LEASE`       | Seconds a crashed instance's connections keep counting toward connection limits, and its unwritten traffic toward quotas, default `30`, at least `3 + REDIS_SOCKET_CONNECT_TIMEOUT + REDIS_SOCKET_TIMEOUT`, `7` by default, see [Connection limits](/reference/redis/#connection-limits) and [Traffic quotas](/reference/redis/#traffic-quotas) |
| `PROXY_REDIS_OUTAGE_TIMEOUT`   | Seconds connection limits and quotas are counted in each instance alone while Redis is down, default `30`. At least the two Redis timeouts together, see [Connection limits](/reference/redis/#connection-limits) and [Traffic quotas](/reference/redis/#traffic-quotas)                                                                        |
| `PROXY_SPEED_BATCH`            | Seconds of a speed limit's rate an instance takes from Redis at once, default `0.1`. Each instance may go over a limit by one batch, see [Speed limits](/reference/redis/#speed-limits)                                                                                                                                                         |
| `PROXY_NAME`                   | Names the instance in `Proxy-Status` of HTTP responses, default `proxium`, e.g. its host name. Printable ASCII, an IP or a name with spaces is sent in quotes, see [Protocols](/proxy/protocols/#proxy-status)                                                                                                                                  |

`PROXY_LISTEN` is a comma-separated list of `host:port` pairs. A host is an IP address, a network or a host name,
IPv6 goes in brackets. A port may be an inclusive range. Every host listens on every port of its pair:

```bash
PROXY_LISTEN=127.0.0.1:8080                          # one socket
PROXY_LISTEN=localhost:8080                          # every address localhost resolves to
PROXY_LISTEN=0.0.0.0:8080,[::]:8080                  # all IPv4 and IPv6 interfaces
PROXY_LISTEN=10.0.0.0/29:10000-10999                 # 6 host addresses x 1000 ports
```

Host names are resolved once, on start.

Linux caps `PROXY_BACKLOG` at `net.core.somaxconn`, `4096` on recent kernels. To go higher, raise it too.
In Docker it belongs to the container's network, so set it on the container:

```bash
docker run --sysctl net.core.somaxconn=16384 -e PROXY_BACKLOG=16384 ...
```

With `--network host` the container shares the host's network: set it on the host, e.g. in `/etc/sysctl.d/`.

## API

| Variable                     | Description                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `API_SECRET_KEY`             | Secret that signs API user tokens, at least 32 characters. Changing it logs everyone out                            |
| `API_CORS_ORIGINS`           | Comma-separated browser origins allowed to call the API, e.g. the admin dev server. Empty blocks all                |
| `API_OUTGOING_POOL_MAX_SIZE` | IPs in one outgoing IP pool at most, default `256`                                                                  |
| `API_POLICIES_MAX_PER_OWNER` | Policies assigned to one account or trusted network at most, up to `100`, default `32`                              |
| `API_GLOBAL_POLICIES_MAX`    | Global policies at most, turned off ones too, up to `100`, default `32`. Lowering it keeps the ones past it working |

## Management commands

| Variable             | Description                                                                       |
| -------------------- | --------------------------------------------------------------------------------- |
| `SUPERUSER_EMAIL`    | `createsuperuser --no-input`: email, if `--email` isn't passed                    |
| `SUPERUSER_PASSWORD` | `createsuperuser --no-input`: password, there is no flag for it                   |
| `SUPERUSER_NAME`     | `createsuperuser --no-input`: name, if `--name` isn't passed, default blank       |
| `SUPERUSER_SURNAME`  | `createsuperuser --no-input`: surname, if `--surname` isn't passed, default blank |

Without `--no-input` these are ignored: `createsuperuser` always prompts.

## Docker

Read only by the [image](/installation/docker/). There `DATABASE_URL`, `REDIS_URL`, `ENCRYPTION_KEY` and
`API_SECRET_KEY` are optional: unset, the bundled PostgreSQL and Redis run and the keys are generated once, all kept
in the volume. Redis keeps nothing: it starts empty each time.

| Variable             | Description                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `PROXIUM_SERVICES`   | Services to run, comma-separated: `proxy`, `api`, `admin`. Default all                                                                    |
| `SUPERUSER_CREATE`   | `true` creates the superuser from `SUPERUSER_*` on start, an existing one is skipped. Default `false`                                     |
| `ADMIN_TLS`          | How the admin UI is served: `off`, `auto`, `files` or `internal`, see [HTTPS for the admin UI](/installation/admin-https/). Default `off` |
| `ADMIN_HOST`         | Admin host name, e.g. `admin.example.com`. Needed by `auto` and `files`, `internal` defaults to `localhost`                               |
| `ADMIN_ACME_CA`      | Own ACME server for `auto` instead of Let's Encrypt                                                                                       |
| `ADMIN_HTTP_PORT`    | Admin HTTP port, default `80`                                                                                                             |
| `ADMIN_HTTPS_PORT`   | Admin HTTPS port, default `443`                                                                                                           |
| `API_BIND`           | Where the API listens, default the socket `unix:/run/proxium/api.sock`                                                                    |
| `ADMIN_API_UPSTREAM` | Where the admin UI finds the API, default the same socket. `host:port` when the API runs in another container                             |
