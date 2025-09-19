export function shortenAddress(addr, first = 6, last = 4) {
    return addr.length > first + last + 3
        ? `${addr.slice(0, first)}…${addr.slice(-last)}`
        : addr;
}
//# sourceMappingURL=address.js.map