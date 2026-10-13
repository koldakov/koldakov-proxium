---
title: TLS
description: Encrypt connections to the proxy, manage certificates and rotate
  the encryption key.
sidebar:
  order: 2
slug: 0.1.0/proxy/tls
---

Clients may encrypt the connection to the proxy, on the same ports: a connection starting with a TLS handshake is
decrypted, and HTTP or SOCKS5 is detected inside. Credentials then don't travel in the clear. TLS is on while a
certificate is active: add one under TLS certificates in the admin UI, the first one is activated right away.
Without one, TLS clients get a handshake failure, plain HTTP and SOCKS5 keep working.

```bash
curl -x https://username:password@proxy.example.com:8080 https://example.com
```

## Certificates

The certificate must be for the host name clients connect to. One certificate is active at a time and serves all
ports, for several names use one with all of them in it. Activating another one, on adding it or later on its
page, turns the active one off: new connections get it within the certificate cache TTL
([settings](/0.1.0/proxy/settings/)), open ones keep theirs, no restart needed. The proxy looks the certificate up once
per that TTL, not on every connection: TLS clients can't load the database before they authenticate.

The admin UI names the one turned off, and if another admin has activated one meanwhile, it refuses and shows the
new state instead of turning off a certificate you haven't seen. The active one can't be deleted, deactivate it
first.

## Self-signed certificates

A self-signed certificate works too, the admin UI generates one for given names. Clients trust it only if told
to: download the certificate from its page for curl's `--proxy-cacert`, or skip the check with `--proxy-insecure`.

```bash
curl -x https://username:password@proxy.example.com:8080 --proxy-cacert proxium-1.pem https://example.com
```

## Renewal with certbot

A renewed certificate, e.g. from Let's Encrypt, goes in with `importcert`, see
[Management commands](/0.1.0/reference/management-commands/#importcert). certbot can run it after every renewal, with
the same environment as the proxy:

```bash
certbot renew --deploy-hook 'cd /opt/proxium && uv run --env-file .env proxium-manage importcert --no-input \
  --cert "$RENEWED_LINEAGE/fullchain.pem" --key "$RENEWED_LINEAGE/privkey.pem"'
```

## Encryption key

Private keys are stored encrypted with `ENCRYPTION_KEY`, the API never returns them. Generate the key once and give
the same one to the proxy, the API and the management commands:

```bash
python3 -c "import base64, os; print(base64.urlsafe_b64encode(os.urandom(32)).decode())"
```

:::danger
Losing or changing it makes the stored keys unreadable: TLS clients are refused with "can't be decrypted" in the
log until the certificate is uploaded again.
:::

To replace the key without downtime, e.g. after a leak:

1. Generate a new key. Set it as `ENCRYPTION_KEY` and the current one as `ENCRYPTION_OLD_KEYS` for the proxy, the
   API and the management commands, then restart them. Both keys now decrypt, new secrets get the new one.

2. Re-encrypt the stored secrets with the new key. Stopped halfway, it's just run again:

   ```bash
   uv run --env-file .env proxium-manage rotateencryptionkey
   ```

3. Remove `ENCRYPTION_OLD_KEYS` everywhere and restart again.

## Temporary directory

The proxy needs a writable temporary directory: Python's `ssl` loads a key only from a file, not from memory
([python/cpython#60691](https://github.com/python/cpython/issues/60691)), so the decrypted key goes to a file
readable by the proxy's user alone and is removed right after loading. In a container with a read-only root, point
`TMPDIR` to a tmpfs, e.g. an `emptyDir` with `medium: Memory` in Kubernetes: the key then never reaches a disk.
Without it, TLS clients are refused with "Can't write the certificate to a temporary file" in the log.

## Limitations

SOCKS5 inside TLS works too, but few clients support it, curl doesn't. HTTP/2 to the proxy isn't supported, clients
fall back to HTTP/1.1.

:::caution
Don't terminate TLS in front of the proxy, e.g. with nginx `stream`: the proxy would see nginx's connection
instead of the client's, so trusted networks would check nginx's IP, and the `listener` outgoing mode would take
the address nginx connects to.
:::
