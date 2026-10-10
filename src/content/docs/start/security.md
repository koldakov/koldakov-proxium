---
title: Security
description: What Proxium protects and what it doesn't.
sidebar:
  order: 3
---

## Security model

- **No anonymous access.** Every client authenticates or comes from a trusted network you added. There are none by
  default.
- **Secrets are hashed.** Passwords and tokens are stored as salted PBKDF2-SHA256 hashes.
- **Private keys are encrypted.** TLS keys are protected with field-level encryption, the API never returns them,
  the encryption key rotates without downtime.
- **No SSRF by default.** The proxy reaches only the public internet: loopback, private networks and
  `169.254.169.254` are blocked unless allowed in the [settings](/proxy/settings/).
- **Least privilege for admins.** A user grants only the permissions they have, only superusers manage superusers,
  a new password logs the user out everywhere.

## Threat model

Proxium protects your proxy from unauthorized use and your network from being reached through it. It doesn't:

- **Inspect traffic.** HTTPS goes through as an end-to-end tunnel, the proxy sees only the target host and port.
- **Hide credentials without TLS.** Plain HTTP and SOCKS5 send passwords and tokens in the clear: enable
  [TLS](/proxy/tls/) for clients outside your network.
- **Revoke instantly.** A revoked account keeps connecting for the cache TTL, 10 seconds by default, configurable.
- **Vouch for trusted networks.** Anyone inside one gets in, add only networks you control.

## Reporting vulnerabilities

Report vulnerabilities privately, see
[SECURITY.md](https://github.com/koldakov/proxium/blob/main/SECURITY.md).
