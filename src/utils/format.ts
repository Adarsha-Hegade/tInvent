export function formatAccessLevel(level: string): string {
  switch (level) {
    case 'read':
      return 'Read Only';
    case 'read-write':
      return 'Read & Write';
    default:
      return level;
  }
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}