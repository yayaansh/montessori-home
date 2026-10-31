/** Prefix an absolute public path with the deployment base (e.g. "/montessori-home/"). */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

export function asset(path: string): string {
  if (!path) return path
  if (/^(https?:)?\/\//.test(path)) return path
  return BASE + (path.startsWith('/') ? path : '/' + path)
}
