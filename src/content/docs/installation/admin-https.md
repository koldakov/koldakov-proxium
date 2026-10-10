---
title: HTTPS for the admin UI
description: Serve the admin UI on your domain with Let's Encrypt, your own certificate or a self-signed one.
sidebar:
  order: 2
---

| Want                         | Add                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| Let's Encrypt                | `-p 443:443 -e ADMIN_HOST=admin.example.com -e ADMIN_TLS=auto`                                |
| Own ACME server, no internet | the same plus `-e ADMIN_ACME_CA=https://ca.corp.lan/acme/directory`                           |
| Own certificate              | `-p 443:443 -e ADMIN_HOST=admin.example.com -e ADMIN_TLS=files -v /etc/ssl/proxium:/certs:ro` |
| Self-signed, no internet     | `-p 443:443 -e ADMIN_HOST=admin.corp.lan -e ADMIN_TLS=internal`                               |

`ADMIN_HOST` must point to this server: add a DNS A or AAAA record for it at your DNS provider. `auto` also needs
port 80 or 443 reachable by the ACME server: from the internet for Let's Encrypt, from your network for
`ADMIN_ACME_CA`. Behind your own load balancer or Kubernetes ingress that terminates TLS, keep `ADMIN_TLS=off` and
route the host to the container's port 80.

`files` reads `cert.pem` and `key.pem`, readable by UID 10001. `internal` signs with Caddy's own CA: trust
`/var/lib/proxium/caddy/pki/authorities/local/root.crt` from the volume on client machines.

The proxy's own TLS doesn't depend on this: its certificates are managed in the admin UI, see [TLS](/proxy/tls/).
