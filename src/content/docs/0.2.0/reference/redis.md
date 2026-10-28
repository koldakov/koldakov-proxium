---
title: Redis
description: What the proxy instances share in Redis, and how limits and quotas
  hold on while it's down.
sidebar:
  order: 3
slug: 0.2.0/reference/redis
---

Redis is required, like PostgreSQL: instances on one database share their state in it, e.g. the migration lock, see
[Management commands](/0.2.0/reference/management-commands/#migrate). The Docker image runs its own Redis when
`REDIS_URL` isn't set. Its variables are under [Configuration](/0.2.0/reference/configuration/#common), its versions under
[Supported versions](/0.2.0/installation/supported-versions/).

- The password goes either in the URL or in `REDIS_PASSWORD`, both is an error. Separate, it's easier to pass from a
  secret, e.g. in Kubernetes.
- If Redis doesn't answer within `REDIS_SOCKET_CONNECT_TIMEOUT` and `REDIS_SOCKET_TIMEOUT`, what needs it fails.
  Connection limits, speed limits and traffic quotas of the proxy hold on, see below.
- Keep `maxmemory-policy noeviction`, the Redis default: a full Redis then refuses writes, and the proxy handles it
  as an outage. Other policies may drop keys of connection limits and quotas silently.

## Connection limits

Every proxy instance keeps its open connections in Redis, so a limit of 10 connections is 10 across all instances.
A new connection is checked against the limit in one atomic round trip. Each connection is leased for
`PROXY_CONNECTION_LEASE` seconds and renewed every third of it: if an instance dies, its connections stop counting
on their own. Leases run on the clock of Redis, clocks of the instances don't matter.

If Redis goes down:

1. For `PROXY_REDIS_OUTAGE_TIMEOUT` seconds clients go on as usual. Each instance counts only its own connections,
   so with N instances up to N × limit may open.
2. Longer, new connections under connection limits are refused until Redis is back: HTTP clients get
   `503 Limits Unavailable`, SOCKS5 ones a general failure. Open connections go on, and clients without
   connection limits aren't affected.
3. The proxy checks Redis every second. Once it answers, each instance writes all its open connections there, those
   opened during the outage too, and limits are shared again. Connections over the limit stay until they close, new
   ones are refused until there are fewer than the limit.

The log shows an error when Redis fails and a message when it's back.

Nothing is lost for good: Redis keeps only the connections open right now, and each instance knows all of its own.
An instance may be stopped or restarted anytime, during an outage too. Where counts may be off for a while:

| Case                                                                             | Effect                                         | For how long                                            |
| -------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Redis is down within the outage timeout                                          | Up to N × limit connections                    | Until the extra ones close                              |
| An instance crashed, or stopped while Redis was down                             | Its connections still take places of the limit | Up to `PROXY_CONNECTION_LEASE` after their last renewal |
| Redis restarted empty, or failed over to a replica that missed the latest writes | Limits let up to the limit more in             | Up to a third of `PROXY_CONNECTION_LEASE`               |
| Redis restored from an older snapshot                                            | Connections closed since still take places     | Up to `PROXY_CONNECTION_LEASE`                          |

E.g. the proxy is stopped while Redis is down, then Redis and the proxy are started again: Redis either starts empty
or has the old connections, which have expired or expire within `PROXY_CONNECTION_LEASE`. The proxy starts with none
and counts as usual. A proxy started while Redis is down counts its own for `PROXY_REDIS_OUTAGE_TIMEOUT` from the
first failure, though in the Docker image it doesn't start then: migrations wait for Redis first.

`PROXY_REDIS_OUTAGE_TIMEOUT` must be at least `REDIS_SOCKET_CONNECT_TIMEOUT + REDIS_SOCKET_TIMEOUT`, as long as one
command may take. Otherwise no process starts.

## Speed limits

Every limited client has a bucket in Redis per direction, so 1 MB/s is 1 MB/s across all instances. Each instance
takes `PROXY_SPEED_BATCH` seconds of the rate at once, 100 KB of 1 MB/s by default, and spends it on its
connections: one round trip per batch while bytes flow, none while they don't. So each instance may go over the
limit by one batch: smaller batches are more precise, larger ones take fewer round trips. Buckets refill on the clock
of Redis, clocks of the instances don't matter. The connection scope is counted in memory: one connection has
nothing to share.

A batch is taken at once, in debt if the bucket hasn't got it yet: the instance waits until the bucket pays it,
then spends it. Instances wait in the order their requests reach Redis, so one far from Redis gets its share too.
A batch is at most the burst. With a burst under what the rate moves in a round trip to Redis, a client gets less
than its rate: e.g. a burst of 32 KB at 100 Mbit/s, 3 ms away from Redis. The default burst, a second of the rate,
is far from that.

Other errors of Redis than an outage, e.g. of the script for one key or a permission taken away in the ACL, leave
that key to the instance alone for a second, then it tries Redis again. The other keys stay in Redis. Such errors
are logged at most once a second.

If Redis goes down, each instance limits its own connections until Redis is back, with no timeout: with N instances
a client may get up to N × the rate meanwhile. Until a hanging Redis counts as down, up to
`REDIS_SOCKET_CONNECT_TIMEOUT + REDIS_SOCKET_TIMEOUT`, the data of limited clients waits. Then each of them starts
with a full burst in the instance, once. A speed limit only slows connections down, so going over it ends
with the outage, while refusing would stall the traffic of every limited client. The proxy checks Redis every
second with a write, so a full Redis that still answers stays down until it takes writes again. The log shows an
error when Redis fails and a message when it's back.

## Traffic quotas

Every proxy instance writes its traffic to the database about once a minute, and every second it puts what it
hasn't written yet in Redis. A quota counts the traffic in the database plus what every instance has in Redis, so
10 GB is 10 GB across all instances. Each instance sees the others' traffic within about two seconds: a client may
go over a quota by about two seconds of its traffic per instance, plus the second between checks of an open
connection. Each instance makes one write per client with traffic not in the database yet and one read per client
under a quota every second, in batches of 1000: with tens of thousands of active clients, size Redis for it. Every
write of an instance makes the others read that client's sums from the database again: with N instances, about N
reads a minute per client under a quota, in batches too.

What an instance has in Redis is leased for `PROXY_CONNECTION_LEASE` seconds and renewed every second. Right after
an instance writes traffic to the database, it takes the same bytes out of Redis in one step, and the others read
the database again. Until then, or until its lease expires if it crashes in between, they may count those bytes
twice: the quota ends a bit sooner, never later. Traffic of a crashed instance not yet in the database is lost, as
before, and stops counting with its lease.

If Redis goes down:

1. For `PROXY_REDIS_OUTAGE_TIMEOUT` seconds clients go on as usual. Each instance counts the database, its own
   traffic and the others' as last read from Redis: a short blip loses nothing. Once a minute it reads the database
   again, where the others have written their traffic by then, and counts alone from there: with N instances a
   client may go over a quota by up to what N − 1 of them haven't written.
2. Longer, connections under quotas are refused until Redis is back: new ones get `503 Limits Unavailable` over HTTP,
   a general failure over SOCKS5, open ones are cut on their next check. Clients without quotas aren't affected.
   Open connections are cut, unlike under connection limits, on purpose. An open connection can't raise the number
   of connections, and going over a speed limit ends with the outage. Over a quota an open download goes on adding
   gigabytes, and nothing takes them back: with N instances each counting alone, a long outage would let a client
   through as much as it can download. A quota sold to a client is a promise to stop at it, so the proxy stops
   rather than guesses. If Redis may stay down for long, e.g. during maintenance, raise `PROXY_REDIS_OUTAGE_TIMEOUT`
   for that time.
3. The proxy checks Redis every second. Once it answers, each instance puts its unwritten traffic there again,
   reads the others' and reads the database again, quotas are shared again.

If only one instance loses Redis while the others still reach it, its unwritten traffic expires there within
`PROXY_CONNECTION_LEASE`, and its writes reach the others only once it's back: they count without it. It refuses
quotas itself after `PROXY_REDIS_OUTAGE_TIMEOUT`, so a client may go over a quota by up to what it hasn't written,
as above. If it stops before Redis is back, what it wrote meanwhile reaches the others once any instance writes
traffic of the same client: within about a minute where the client still connects.

Nothing is lost for good: the traffic itself is in the database, Redis keeps only what isn't there yet, and each
instance knows its own.
