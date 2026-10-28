---
title: Protocols
description: HTTP and SOCKS5 on the same port, basic and token accounts.
sidebar:
  order: 1
slug: 0.2.0/proxy/protocols
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

Clients from [trusted networks](/0.2.0/proxy/trusted-networks/) connect without credentials. To encrypt the connection
to the proxy, see [TLS](/0.2.0/proxy/tls/).

## Proxy-Status

Every HTTP response carries `Proxy-Status` ([RFC 9209](https://www.rfc-editor.org/rfc/rfc9209)). On a refusal it
says why, e.g. `Proxy-Status: proxium; error=destination_unavailable` on a 502: a client tells a refusal of the proxy
from a response of the target with the same status. A response of the target gets just the name, after the members
of proxies further on, if any. A 503 over limits that can't be checked also says when to retry in `Retry-After`.
With several instances, give each its own `PROXY_NAME`, e.g. its host name, to see which one answered.

## Plain HTTP forwarding

Plain HTTP forwarding carries one request per connection, as RFC 9112 and RFC 9110 have a proxy do it:

- The response says `Connection: close`, the target's own connection fields don't reach the client. What a client
  sends after its request, e.g. a pipelined one, doesn't reach the target: past a request head's size it isn't read
  until the response ends.
- A request whose body end is unclear gets a 400: `Transfer-Encoding` not ending in `chunked`, next to
  `Content-Length` or in an HTTP/1.0 request, a bad or conflicting `Content-Length`, a malformed chunk.
- A response the client could misread gets a 502 with the reason in `Proxy-Status`: a head that breaks off
  (`http_response_incomplete`), none at all (`connection_terminated`), or one that isn't valid HTTP
  (`http_protocol_error`), e.g. with a line ending in a bare LF or CR, folded or malformed fields, a conflicting
  `Content-Length`, `Transfer-Encoding` on a body in answer to an HTTP/1.0 request, more than 16 interim `1xx`
  heads, or `101 Switching Protocols`: upgrades aren't forwarded.
- A request cut before its response, e.g. over a quota, gets the client the refusal, e.g. `429 Quota Exceeded`.
  Before closing, the proxy reads off what the client still sends, e.g. the rest of an upload, for up to 5 seconds:
  closing with unread data would reset the refusal away.
- A target that sends no head until the idle timeout gets the client a 504 with `error=http_response_timeout`. A
  client that hasn't sent its whole request by then gets a 408 instead: the target is waiting for it. Unless it sent
  `Expect: 100-continue` and no `100 Continue` came: then it waits for the target, which gets the 504.
- HTTP/1.0 clients get no interim `1xx` responses, they don't know them.
