// notes are loaded on demand: vite turns each matched file into its own small chunk,
// so opening the dashboard doesn't download 27 notes worth of text and diagrams.
//   content/<slug>.md    the note text (loaded as a raw string)
//   diagrams/<slug>.jsx  named React components the note can place with a ```diagram block
const contentLoaders = import.meta.glob("./content/*.md", { query: "?raw", import: "default" })
const diagramLoaders = import.meta.glob("./diagrams/*.jsx")

export async function loadNote(slug) {
    const content = contentLoaders[`./content/${slug}.md`]
    const diagrams = diagramLoaders[`./diagrams/${slug}.jsx`]
    const [markdown, module] = await Promise.all([
        content ? content() : null,
        diagrams ? diagrams() : {},
    ])
    // a module's named exports are already a { Name: Component } map, exactly what the renderer needs
    return { markdown, diagrams: module }
}
