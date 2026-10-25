---
title: Outgoing IPs
description: Pick the IP sites see, per account and trusted network.
sidebar:
  order: 4
slug: 0.1.1/proxy/outgoing-ips
---

On a server with several IPs, each account and trusted network picks the one sites see, its outgoing mode:

- `system`, the default: the OS picks, usually the main IP of the server.
- `listener`: the IP the client connected to. A client of `203.0.113.11:8080` goes out from `203.0.113.11`, so
  listen on every IP, e.g. `PROXY_LISTEN=203.0.113.8/29:8080`. It works on `0.0.0.0` too.
- `pool`: a random IP of the account's pool, picked anew for every connection. A pool of one IP is a dedicated IP.

## Pools

First add the server's IPs under Outgoing IPs in the admin UI. Then pick the mode on the account or trusted
network form: for `pool`, the IPs of the pool go right under it, on creating too. Later the pool is edited on the
account's page or the network's form, and changes apply to new connections within the cache TTL of passed checks.

A pool takes IPs of one family, IPv4 or IPv6: an IPv4 IP can't reach IPv6-only sites and back, so a mixed pool
would fail at random. The admin offers only the IPs a pool can take. A pool in use keeps at least one IP, switch
the mode first to empty it. An IP in a pool can't be deleted, and an IP's address can change only within its
family. A pool holds up to `API_OUTGOING_POOL_MAX_SIZE` IPs.

## Server requirements

The proxy binds the outgoing socket to the IP before connecting, so the IP must be on the server's interfaces,
e.g. `ip addr add 203.0.113.11/32 dev eth0`, and routed to it. Nothing checks that on saving, the API may run on
another host: a connection from an IP that isn't there fails with "not on this host or loopback" in the log, and
so does one from loopback, e.g. `listener` on `127.0.0.1`. Nothing falls back to another IP.

Behind cloud NAT, use the private IPs the public ones map to. IPs of different providers need policy routing
(`ip rule`) in the OS. In Docker, outgoing IPs need `--network host`, see [Ports and IPs](/0.1.1/installation/docker/#ports-and-ips).
