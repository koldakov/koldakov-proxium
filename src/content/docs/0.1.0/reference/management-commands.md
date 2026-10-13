---
title: Management commands
description: Superusers, passwords, migrations, certificates and key rotation
  from the command line.
sidebar:
  order: 2
slug: 0.1.0/reference/management-commands
---

Django-style commands run with `proxium-manage <command>`, `--help` lists them. The examples run from source, in
Docker run the same command in the container:

```bash
docker exec -it proxium proxium-manage <command>
```

## createsuperuser

Create the first superuser, it prompts for the email and password, `SUPERUSER_*` variables are ignored. Name and
surname are blank unless passed with `--name`, `--surname`:

```bash
uv run --env-file .env proxium-manage createsuperuser
uv run --env-file .env proxium-manage createsuperuser --email admin@example.com --name Ivan
```

Without prompts, e.g. in scripts, the password comes only from `SUPERUSER_PASSWORD`, the email from `--email` or
`SUPERUSER_EMAIL`, name and surname from flags or `SUPERUSER_NAME`, `SUPERUSER_SURNAME`, see
[Configuration](/0.1.0/reference/configuration/#management-commands):

```bash
SUPERUSER_PASSWORD=... uv run --env-file .env proxium-manage createsuperuser --no-input --email admin@example.com
```

With `--if-missing` a taken email is skipped, not an error, e.g. in start scripts. Other errors still fail:

```bash
uv run --env-file .env proxium-manage createsuperuser --no-input --if-missing
```

## changepassword

Set a new password for any user, e.g. a forgotten one, it prompts for it twice:

```bash
uv run --env-file .env proxium-manage changepassword admin@example.com
```

## migrate

Apply database migrations, up to the latest one or the given revision:

```bash
uv run --env-file .env proxium-manage migrate
uv run --env-file .env proxium-manage migrate --wait 60   # wait up to 60s for the database to start
```

## importcert

Add a TLS certificate from PEM files and activate it, see [TLS](/0.1.0/proxy/tls/). It asks before turning the active
one off, `--no-input` doesn't. The same certificate imported again is only activated. The key must have no
password:

```bash
uv run --env-file .env proxium-manage importcert --cert fullchain.pem --key privkey.pem
```

## rotateencryptionkey

Re-encrypt stored secrets with `ENCRYPTION_KEY`, reading them with it or `ENCRYPTION_OLD_KEYS`, see
[Encryption key](/0.1.0/proxy/tls/#encryption-key):

```bash
uv run --env-file .env proxium-manage rotateencryptionkey
```
