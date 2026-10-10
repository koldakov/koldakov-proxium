---
title: Trusted networks
description: Let clients from your networks use the proxy without credentials.
sidebar:
  order: 3
---

Clients from trusted networks use the proxy without credentials, over HTTP and SOCKS5 alike. There are none by
default, so everyone needs an account. Add them under Trusted networks in the admin UI, e.g. `192.168.0.0/16` for
a local network or `10.0.0.5` for a single address.

:::caution
Add only networks you control: anyone in them gets in.
:::

```bash
curl -x http://127.0.0.1:8080 https://example.com         # from a trusted network
curl -x socks5h://127.0.0.1:8080 https://example.com
```

New connections follow changes within the trusted network cache TTLs ([settings](/proxy/settings/)). Clients
connected right now keep their open connections until they close: removing a network doesn't cut them off at once.

A client that sends credentials is checked as an account even from a trusted network. The trusted network
authenticator itself refuses any credentials, since it can't check them: registered for a credentials kind by
mistake, it doesn't let in any password.

## Nested networks

Networks may nest, e.g. `10.0.0.0/8` for the office and `10.1.2.3` for a CI server inside it. The narrowest
active one names the client in logs, e.g. `network:10.1.2.3/32`, and turning off one keeps the other working.

The admin UI lists the networks containing the one being edited and the ones inside it, page by page, and tells
how many keep trusting the addresses of a network being deleted. `/0` trusts the whole internet: the admin UI asks
to confirm saving it and warns while one is active.
