---
title: Introduction
description: What Proxium is, why it exists and how it works.
sidebar:
  order: 1
slug: 0.1.0/start/introduction
---

Proxium is an HTTP and SOCKS5 proxy with accounts, quotas, speed limits, outgoing IP pools and a web admin
panel. Self-hosted, open source, no config files.

## Why Proxium?

Squid, Dante and 3proxy are solid engines, but users, ACLs and limits live in their config files: every change is
an edit and a reload, every admin needs shell access. Proxium keeps all of it in a database behind an admin panel:

- **Change anything live.** Accounts, networks, policies and certificates reach the proxy within seconds, open
  connections keep working.
- **Give access, not root.** Admins get per-section permissions through groups: a support engineer revokes
  accounts, an accountant sees traffic, neither touches TLS.
- **One port for everything.** HTTP, SOCKS5 and TLS on the same port, detected automatically.

## Features

**Proxy**

- HTTP (CONNECT tunnels and plain forwarding) and SOCKS5 on the same port, detected by the first byte
- TLS to the proxy on the same ports, credentials never travel in the clear
- Listen on many IPs and port ranges at once, e.g. `10.0.0.0/29:10000-10999`
- Graceful shutdown: open connections get time to finish

**Identity and access**

- Basic (username/password) and bearer token accounts, with expiry and revocation
- Trusted networks: clients from your networks connect without credentials, nested networks supported
- Outbound ACL: loopback, private networks and cloud metadata are blocked unless you allow them

**Policies**

- Connection limits, speed limits per direction, traffic quotas per day, month or in total
- Counted per connection, account, client IP, target host or the whole proxy
- Rules with conditions: time of day and week, target domain, IP and port, protocol, client IP, TLS
- Global policies for everyone, assigned ones for chosen accounts and networks

**Outgoing IPs**

- `system`, `listener` or `pool` mode per account and trusted network
- A pool of one IP is a dedicated IP

**Administration**

- Web admin UI
- Users, groups and per-action permissions, no privilege escalation
- TLS certificates: upload, generate self-signed, import from certbot, encryption key rotation
- Traffic per account and network

## How it works

```
                 ┌──────────────────────────────┐
  Clients ──────→│           Proxium            │──────→ Internet
  HTTP           │                              │        from the outgoing IP
  SOCKS5         │  Authentication              │        you pick
  over TLS       │  Network ACL                 │
                 │  Policies and quotas         │
                 │  Outgoing IP selection       │
                 │  Traffic accounting          │
                 └──────┬───────────────┬───────┘
                        │               │ polls settings and policies,
                 ┌──────┴──────┐        │ writes traffic
                 │    Cache    │        │
                 └──────┬──────┘        │
                        │ on a miss     │
                 ┌──────┴───────────────┴───────┐
  Admins ───────→│  Admin UI → API → PostgreSQL │
                 └──────────────────────────────┘
```

|                | What it does                                                                                | Runs as                              |
| -------------- | ------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Proxy**      | Accepts clients, authenticates, applies policies, forwards traffic, counts it               | `proxium`                            |
| **Cache**      | Keeps account, network and TLS certificate lookups for a TTL, connections skip the database | pluggable, in the proxy's memory now |
| **API**        | Reads and writes the database for the admin UI                                              | `proxium-api`                        |
| **Admin UI**   | Web interface for admins, talks only to the API                                             | static files behind Caddy            |
| **PostgreSQL** | Single source of truth: accounts, policies, certificates, traffic                           | bundled or your own                  |

Connections don't query the database each time: authentication and the TLS certificate come from the cache,
settings and policies from memory refreshed every few seconds, traffic is written in batches about once a minute.

The proxy never takes commands from the API: it reads the database on its own, so the API and the admin UI can run
on another host or be stopped without touching client traffic.
