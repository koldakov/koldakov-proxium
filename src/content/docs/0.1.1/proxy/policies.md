---
title: Policies
description: Connection limits, speed limits and traffic quotas, with rules and conditions.
sidebar:
  order: 5
slug: 0.1.1/proxy/policies
---

A policy limits how clients use the proxy: how many connections they open at once, how fast data goes and how much
of it they may move. Create policies under Policies in the admin UI. A global one applies to every client, any
other to the accounts and trusted networks it's assigned to, on their pages.

A client gets the limits of all its policies at once: a policy only adds limits, the strictest one wins. To give
some clients more than a global policy allows, raise its limit and set the lower one in a policy assigned to the
rest.

## Limits

Each limit is counted over a scope: one connection, an account or network with all its connections, a client IP,
a target host or the whole proxy. E.g. 10 connections per account, or 100 Mbit/s for the whole proxy that all
clients share.

- **Connections.** Past a connection limit new connections are refused, HTTP clients get
  `429 Too Many Connections`.
- **Speed.** A speed limit never cuts a connection, it slows it down. It's set per direction: download, upload or
  each way on its own. After a pause up to the burst goes at once, one second of the rate unless set.

## Traffic quotas

A traffic quota caps the gigabytes of one account or network per period: every N days or months, or in total
without reset. It counts downloads, uploads or both together. Past it new connections are refused, HTTP clients
get `429 Quota Exceeded`, and open ones are cut within a second.

Periods follow one another from a UTC day: for a global policy it's set on the policy, for an assigned one on the
account or network page, next to the policy, e.g. the day the client paid. Assigning sets it to that day. Monthly
periods from the 31st start on the last day of shorter months.

Usage is the traffic in the database plus what the proxy hasn't written yet: traffic of other proxy processes
counts within a minute.

## Rules and conditions

The limits of a policy sit in rules, each with a condition. In each policy the first rule whose condition matches
applies, so put the narrow rules first and a rule without conditions last for everything else: e.g. 10 Mbit/s on
weekdays from 9:00 till 18:00 in your time zone, 100 Mbit/s otherwise. A rule without a match leaves the client
free of that policy.

A condition checks:

- the time: days of the week and hours, past midnight too
- the target host with its subdomains
- the target IP
- the target port
- the protocol: HTTP, HTTP CONNECT tunnels, SOCKS5
- the client IP
- TLS to the proxy

Conditions of a rule must all match or any one of them, each can be turned into its opposite. Hosts compare by
the name the client asked for: a target IP is matched by networks, not names.

Open connections switch rules on their next data, checked once a second, e.g. when the night starts: the old
limits let go, the new ones apply, and if those refuse, e.g. no connection is free, the connection is cut.

### Example: slow down everything but work sites

One rule is enough: all conditions match, Time Mon–Fri 09:00–18:00, Target domain `company.com, github.com` with
Not, speed 5 Mbit/s per account. Off hours or to work sites the rule doesn't match and the policy limits nothing.

:::note
SOCKS5 clients must leave DNS to the proxy, e.g. `socks5h://` in curl: a client that resolves names itself sends an
IP, which no domain matches.
:::

## When changes apply

The proxy looks policies up every `PROXY_SETTINGS_POLL_INTERVAL` seconds. A change reaches new connections, open
ones keep the limits they started with, though a connection limit changed in place keeps counting them.
Assigning a policy reaches a client within the cache TTL of passed checks.

Limits are counted in the proxy's memory: with several proxy processes each counts its own. An account or network
takes up to `API_POLICIES_MAX_PER_OWNER` policies.
