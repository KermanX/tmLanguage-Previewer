export const parsers = {
  json: async (source: string) => JSON.parse(source),
  yaml: async (source: string) => (await import('js-yaml')).load(source),
}
