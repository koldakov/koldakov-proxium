---
title: Protocols
description: HTTP and SOCKS5 on the same port, basic and token accounts.
sidebar:
  order: 1
slug: 0.1.0/proxy/protocols
---

Every port speaks HTTP and SOCKS5, the protocol is detected by the first byte of the connection.
Clients authenticate with proxy accounts from the database, inactive and expired ones are refused:

```bash
curl -x http://username:password@127.0.0.1:8080 https://example.com                  # basic account
curl -x http://127.0.0.1:8080 --proxy-header "Proxy-Authorization: Bearer <token>" https://example.com  # token account
curl -x socks5h://username:password@127.0.0.1:8080 https://example.com                # basic account over SOCKS5
```

HTTP supports CONNECT tunnels and plain HTTP forwarding. SOCKS5 supports only CONNECT, with IPv4, IPv6 and domain
targets, and only basic accounts: the protocol has username/password authentication but no tokens.

:::tip
Use `socks5h://` so the proxy resolves domains, with `socks5://` curl resolves them itself.
:::

Clients from [trusted networks](/0.1.0/proxy/trusted-networks/) connect without credentials. To encrypt the connection
to the proxy, see [TLS](/0.1.0/proxy/tls/).
