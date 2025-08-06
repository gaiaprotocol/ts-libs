export function shortenAddress(addr: string, first = 6, last = 4) {
  return addr.length > first + last + 3
    ? `${addr.slice(0, first)}…${addr.slice(-last)}`
    : addr;
}
