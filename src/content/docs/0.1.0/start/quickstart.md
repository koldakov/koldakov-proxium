---
title: Quickstart
description: Run Proxium in 30 seconds, add an account and send the first request.
sidebar:
  order: 2
slug: 0.1.0/start/quickstart
---

## Try it in 30 seconds

```bash
docker run -d --name proxium -p 80:80 -p 8080:8080 -v proxium:/var/lib/proxium \
  -e SUPERUSER_CREATE=true -e SUPERUSER_EMAIL=admin@example.com -e SUPERUSER_PASSWORD=change-me \
  ikoldakov/proxium:0.1.0
```

1. Open the admin UI at http://localhost and log in.
2. Add an account under Proxy accounts → Basic, copy its password: it's shown once.
3. Use it:

```bash
curl -x http://username:password@localhost:8080 https://ifconfig.me
curl -x socks5h://username:password@localhost:8080 https://ifconfig.me
```

One image runs the proxy, the API, the admin UI and PostgreSQL, for amd64 and arm64. Own certificates, own
database, separate containers and running from source: see [Installation](/0.1.0/installation/docker/).

## Own domains and HTTPS

The admin UI and the proxy each get their own domain and certificate, e.g. `admin.example.com` and
`proxy.example.com`, on one server or on different ones. Recreate the container, the volume keeps the data:

```bash
docker rm -f proxium
docker run -d --name proxium -p 80:80 -p 443:443 -p 8080:8080 -v proxium:/var/lib/proxium \
  -e ADMIN_HOST=admin.example.com -e ADMIN_TLS=auto \
  ikoldakov/proxium:0.1.0
```

Point both domains to the server with DNS A or AAAA records. The admin UI gets a Let's Encrypt certificate on
start. Add a certificate for `proxy.example.com` in the admin UI under TLS certificates, then clients connect
over TLS:

```bash
curl -x https://username:password@proxy.example.com:8080 https://ifconfig.me
```

More on this: [HTTPS for the admin UI](/0.1.0/installation/admin-https/) and [TLS](/0.1.0/proxy/tls/).
