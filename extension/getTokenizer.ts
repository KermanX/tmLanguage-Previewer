import { bundledLanguages, createHighlighter } from 'shiki'

export async function getTokenizer(code: string, dark: boolean) {
  let parsed: any
  try {
    const theme = dark ? 'vitesse-dark' : 'vitesse-light'
    parsed = JSON.parse(code)
    const highlighter = await createHighlighter({
      themes: [theme],
      langs: Object.keys(bundledLanguages).filter(n => n !== parsed.name).concat([parsed]),
    })

    return [parsed.scopeName, (code: string) => highlighter.codeToTokensBase(code, {
      lang: parsed.name as any,
      theme,
      includeExplanation: true,
    })]
  }
  catch (e) {
    return [parsed?.scopeName, () => String(e)]
  }
}
