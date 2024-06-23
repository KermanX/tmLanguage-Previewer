import { bundledLanguages, createHighlighter } from 'shiki'

export async function getTokenizer(grammars: any[], dark: boolean) {
  try {
    const theme = dark ? 'vitesse-dark' : 'vitesse-light'
    const grammarLangs = grammars.map(g => g.name?.toLowerCase())
    const highlighter = await createHighlighter({
      themes: [theme],
      langs: Object.keys(bundledLanguages)
        .filter(n => !grammarLangs.includes(n.toLowerCase()))
        .concat(grammars),
    })

    return (code: string, lang: string) => {
      try {
        return highlighter.codeToTokensBase(code, {
          lang: lang.toLowerCase() as any,
          theme,
          includeExplanation: true,
        })
      }
      catch (e) {
        return String(e)
      }
    }
  }
  catch (e) {
    return () => String(e)
  }
}
