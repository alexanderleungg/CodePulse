import { useEffect, useState } from "react"
import { state, hue } from "./colors"

// legend entries: [{ s: "active", label: "current" }] uses a state's color, or { color: "blue", label }
function Legend({ items }) {
    return (
        <div className="fig-legend">
            {items.map((it, k) => (
                <span key={k}>
                    <i style={{ background: it.s ? state(it.s).stroke : hue(it.color) }} />
                    {it.label}
                </span>
            ))}
        </div>
    )
}

// a diagram card: the picture, then an optional legend and caption underneath
export function Figure({ caption, legend, children, wide }) {
    return (
        <figure className={`fig${wide ? " wide" : ""}`}>
            <div className="fig-body">{children}</div>
            {legend && <Legend items={legend} />}
            {caption && <figcaption>{caption}</figcaption>}
        </figure>
    )
}

/**
 * steps through a list of frames, like a slideshow of an algorithm running.
 *   frames  [{ view: <SomeViz .../>, caption: "what changed in this step" }]
 *   title   text above the controls, e.g. "Binary search for 7"
 */
export function Stepper({ frames, title, legend }) {
    const [i, setI] = useState(0)
    const [playing, setPlaying] = useState(false)
    const last = frames.length - 1

    // while playing, advance every 1.8s and stop at the last frame
    useEffect(() => {
        if (!playing) return
        const id = setInterval(() => {
            setI(prev => {
                if (prev >= last) {
                    setPlaying(false)
                    return prev
                }
                return prev + 1
            })
        }, 1800)
        return () => clearInterval(id)
    }, [playing, last])

    const onKey = e => {
        if (e.key === "ArrowRight") setI(v => Math.min(v + 1, last))
        if (e.key === "ArrowLeft") setI(v => Math.max(v - 1, 0))
    }

    const togglePlay = () => {
        if (!playing && i === last) setI(0) // replay from the start
        setPlaying(p => !p)
    }

    return (
        <figure className="fig stepper" tabIndex={0} onKeyDown={onKey} aria-label={title}>
            <div className="stepper-head">
                {title && <span className="stepper-title">{title}</span>}
                <div className="stepper-controls">
                    <button onClick={() => { setPlaying(false); setI(v => Math.max(v - 1, 0)) }} disabled={i === 0} aria-label="previous step">Prev</button>
                    <span className="stepper-count">{i + 1} / {frames.length}</span>
                    <button onClick={() => { setPlaying(false); setI(v => Math.min(v + 1, last)) }} disabled={i === last} aria-label="next step">Next</button>
                    <button onClick={togglePlay} className="play" aria-label={playing ? "pause" : "play"}>{playing ? "Pause" : "Play"}</button>
                </div>
            </div>
            {/* every frame sits in the same grid cell and only the current one is visible,
                so the figure is always as tall as its tallest frame and the controls never jump */}
            <div className="fig-body stepper-frames">
                {frames.map((f, k) => (
                    <div key={k} className={k === i ? "on" : ""} aria-hidden={k !== i}>{f.view}</div>
                ))}
            </div>
            <div className="stepper-dots" aria-hidden="true">
                {frames.map((_, k) => (
                    <button key={k} className={k === i ? "on" : ""} onClick={() => { setPlaying(false); setI(k) }} tabIndex={-1} />
                ))}
            </div>
            {legend && <Legend items={legend} />}
            <figcaption className="stepper-caption">{frames[i].caption}</figcaption>
        </figure>
    )
}
