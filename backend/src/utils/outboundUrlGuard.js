const dns = require('dns').promises;
const net = require('net');

// RFC1918, loopback, link-local, CGNAT, documentation, benchmark, multicast, and reserved ranges.
const BLOCKED_IPV4_RANGES = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

const ipv4ToLong = (ip) => {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = (value << 8) + octet;
  }
  return value >>> 0;
};

const isBlockedIpv4 = (ip) => {
  const value = ipv4ToLong(ip);
  if (value === null) return false;
  return BLOCKED_IPV4_RANGES.some(([base, bits]) => {
    const baseValue = ipv4ToLong(base);
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (value & mask) === (baseValue & mask);
  });
};

const isBlockedIpv6 = (ip) => {
  const value = ip.toLowerCase();
  if (value === '::' || value === '::1') return true;
  // Block IPv4-mapped addresses outright. They can otherwise be used to smuggle
  // loopback/RFC1918 destinations past a hostname-only check.
  if (value.startsWith('::ffff:')) return true;
  // fc00::/7 (unique local), fe80::/10 (link local), ff00::/8 (multicast).
  if (/^f[cd][0-9a-f]{2}:/.test(value)) return true;
  if (/^fe[89ab][0-9a-f]:/.test(value)) return true;
  if (/^ff[0-9a-f]{2}:/.test(value)) return true;
  // NAT64 prefix can embed private IPv4 destinations.
  if (value.startsWith('64:ff9b:')) return true;
  if (value.startsWith('2001:db8:')) return true;
  return false;
};

const isPrivateAddress = (address) => {
  const family = net.isIP(address);
  if (family === 4) return isBlockedIpv4(address);
  if (family === 6) return isBlockedIpv6(address);
  return true;
};

/**
 * Validate a merchant-supplied outbound webhook URL before the server fetches it.
 * Blocks non-HTTP protocols, credentials in URLs, localhost/internal hostnames,
 * and every DNS result that points at a private/reserved address.
 *
 * This does not fully eliminate DNS-rebinding attacks (the fetch performs its own
 * DNS lookup after this check), so callers must also disable redirects and should
 * keep the request timeout short.
 */
const assertSafeOutboundUrl = async (rawUrl) => {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('Webhook URL is required');
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Webhook URL is invalid');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Webhook URL must use HTTP or HTTPS');
  }
  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
    throw new Error('Webhook URL must use HTTPS in production');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Webhook URL must not contain credentials');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (!hostname) {
    throw new Error('Webhook URL must include a hostname');
  }

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.home.arpa') ||
    hostname === 'metadata.google.internal' ||
    hostname === 'instance-data'
  ) {
    throw new Error('Webhook URL must not target a local or internal hostname');
  }

  let addresses;
  if (net.isIP(hostname)) {
    addresses = [hostname];
  } else {
    try {
      const results = await dns.lookup(hostname, { all: true, verbatim: true });
      addresses = results.map((result) => result.address);
    } catch {
      throw new Error('Webhook hostname could not be resolved');
    }
  }

  if (!addresses.length) {
    throw new Error('Webhook hostname did not resolve to an address');
  }
  if (addresses.some((address) => isPrivateAddress(address))) {
    throw new Error('Webhook URL targets a private or reserved network');
  }

  return parsed;
};

module.exports = {
  assertSafeOutboundUrl,
  isPrivateAddress,
};
