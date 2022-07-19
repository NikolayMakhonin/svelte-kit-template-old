export function removeConsoleColor(message) {
  return message.replace(/\u001B\[\d+m/g, '')
}
