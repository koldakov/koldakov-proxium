---
title: Policies
description: Connection limits, speed limits and traffic quotas, with rules and conditions.
sidebar:
  order: 5
---

A policy limits how clients use the proxy: how many connections they open at once, how fast data goes and how much
of it they may move. Create policies under Policies in the admin UI. A global one applies to every client, any
other to the accounts and trusted networks it's assigned to, on their pages.

A client gets the limits of all its policies at once: a policy only adds limits, the strictest one wins. To give
some clients more than a global policy allows, raise its limit and set the lower one in a policy assigned to the
rest. Every global policy is checked on every connection, so there are up to `API_GLOBAL_POLICIES_MAX` of them,
turned off ones too: many rules for everyone fit in the rules of one global policy.

## Limits

Each connection and speed limit is counted over a scope: the connections it groups share one limit.

| Scope                  | Connections that share the limit                         | E.g.                             |
| ---------------------- | -------------------------------------------------------- | -------------------------------- |
| Per account or network | All of one account or trusted network, from any IP       | 10 connections per client        |
| Per client IP          | All from one IP address, whatever account they use       | 20 Mbit/s per office             |
| Per target host        | All to one site, as the client named it, from any client | 50 connections to `example.com`  |
| Per connection         | Each connection on its own                               | 5 Mbit/s per download            |
| Whole proxy            | Every connection of every client                         | 1 Gbit/s for the server's uplink |

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

Usage is the traffic in the database plus what the proxy instances haven't written yet, shared through Redis:
traffic of other instances counts within about two seconds.

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

The proxy looks policies up every `PROXY_SETTINGS_POLL_INTERVAL` seconds. Every change reaches new connections.
Open ones get some of them:

| Change                                                                                                                    | Open connections                                                                      |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Speed limit's speed, burst or direction edited                                                                            | Get them at once, data already waiting within one burst                               |
| Speed limit's scope changed                                                                                               | Keep the old limit until they close                                                   |
| Speed limit removed, with its rule, or its policy turned off                                                              | Aren't slowed down by it anymore. Turned on again, it slows them again                |
| Connection limit edited                                                                                                   | Stay open and keep counting: new ones are refused until fewer than the limit are open |
| Traffic quota used up                                                                                                     | Are cut within a second                                                               |
| Anything else: rules and conditions, quotas edited, limits added, connection limits and quotas removed, policies assigned | Keep what they started with until they close                                          |

Assigning a policy reaches a client within the cache TTL of passed checks. An account or network takes up to
`API_POLICIES_MAX_PER_OWNER` policies.

## Several instances

Connection limits, speed limits and quotas are counted in Redis: all proxy instances share them, a limit of 10
connections is 10 across all of them. See what happens if Redis is down for
[connection limits](/reference/redis/#connection-limits), [speed limits](/reference/redis/#speed-limits) and
[traffic quotas](/reference/redis/#traffic-quotas).
