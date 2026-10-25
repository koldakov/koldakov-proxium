---
title: Docker
description: Run the proxy, the API, the admin UI and PostgreSQL from one image.
sidebar:
  order: 1
slug: 0.1.1/installation/docker
---

One image runs everything: the proxy, the API, the admin UI and PostgreSQL. State lives in one volume.

The image is `ikoldakov/proxium` on Docker Hub and `ghcr.io/koldakov/proxium` on GitHub, for amd64 and arm64.
`latest` is the last release, a version like `0.1.0` pins it, `edge` is the current `main`, not released yet.

## Quickstart

```bash
docker run -d --name proxium -p 80:80 -p 8080:8080 -v proxium:/var/lib/proxium \
  -e SUPERUSER_CREATE=true -e SUPERUSER_EMAIL=admin@example.com -e SUPERUSER_PASSWORD=... \
  ikoldakov/proxium:0.1.1
```

`SUPERUSER_CREATE=true` creates the first admin on start, the email and the password are required then. Later
starts skip it: changing `SUPERUSER_PASSWORD` doesn't change the stored password.

Without it no admin is created, create one later in the running container:

```bash
docker exec -it proxium proxium-manage createsuperuser
```

The admin UI is at http://localhost, the proxy at `localhost:8080`. Superuser variables: `SUPERUSER_CREATE`,
`SUPERUSER_EMAIL`, `SUPERUSER_PASSWORD`, `SUPERUSER_NAME`, `SUPERUSER_SURNAME`, see
[Configuration](/0.1.1/reference/configuration/) for these and the rest.

To serve the admin UI on a domain over HTTPS, see [HTTPS for the admin UI](/0.1.1/installation/admin-https/).

## Ports and IPs

`PROXY_LISTEN` is what the proxy listens on inside the container, `-p` publishes it. Container ports must match.
`EXPOSE` in the image lists only the defaults, any port works with `-p`:

```bash
docker run -d --name proxium -p 80:80 -p 8090-8092:8090-8092 -e PROXY_LISTEN=0.0.0.0:8090-8092 \
  -v proxium:/var/lib/proxium ikoldakov/proxium:0.1.1
```

Several IPs require the host network: in a bridge network the container doesn't see the host's IPs. `-p` isn't used
then, `PROXY_LISTEN` takes the host's addresses as is:

```bash
docker run -d --name proxium --network host -e PROXY_LISTEN=10.0.0.0/29:10000-10999 \
  -v proxium:/var/lib/proxium ikoldakov/proxium:0.1.1
```

|                                            | `-p`                   | `--network host` |
| ------------------------------------------ | ---------------------- | ---------------- |
| Ports and port ranges                      | yes                    | yes              |
| Several listening IPs                      | no, the proxy sees one | yes, Linux only  |
| [Outgoing IPs](/0.1.1/proxy/outgoing-ips/) | no, one host IP        | yes, Linux only  |

:::caution[Linux only]
Docker Desktop on macOS and Windows runs containers in a VM, they don't see the computer's IPs even with
`--network host`. Run Proxium without Docker there, see [From source](/0.1.1/installation/from-source/).
:::

## Own database and secrets

| Want           | Add                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------- |
| Own PostgreSQL | `-e DATABASE_URL=postgres://user:password@db.example.com:5432/proxium`                    |
| Own keys       | `-e ENCRYPTION_KEY=... -e API_SECRET_KEY=...`, else generated once and kept in the volume |

Every variable from [Configuration](/0.1.1/reference/configuration/) works with `-e`, Docker-only ones are under
[Docker](/0.1.1/reference/configuration/#docker). Give `docker stop` time for open connections: `--stop-timeout 40`.

## Commands

[Management commands](/0.1.1/reference/management-commands/) run in the container with `proxium-manage`:

```bash
docker exec -it proxium proxium-manage createsuperuser
docker exec -it proxium proxium-manage changepassword admin@example.com
```
