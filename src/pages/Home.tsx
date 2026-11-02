import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Check, Copy, Download, FileCode, RotateCw, Wifi } from 'lucide-react'
import { Link } from '../lib/nav'
import { GithubIcon } from '../components/GithubIcon'

const applications = {
  robotics: { title: 'Motion that stays on target.', body: 'Closed-loop NEMA 17 control for robotic joints and automation. Encoder feedback helps every move land where you planned.' },
  cnc: { title: 'Quiet precision for CNC.', body: 'Choose smooth, quiet motion or more torque at speed. BOXDRIVE brings the driver, encoder and controller together.' },
  wireless: { title: 'Connected from day one.', body: 'Wi-Fi, Bluetooth and CAN are built in. Flash over USB-C, then monitor or update your setup wirelessly.' },
} as const
type Application = keyof typeof applications
const cloneCommand = 'git clone https://github.com/BoxPoxin/BoxDrive_Library.git BoxDrive'

export function Home() {
  const [application, setApplication] = useState<Application>('robotics')
  const [copied, setCopied] = useState(false)
  const active = applications[application]

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(cloneCommand)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return <>
    <section className="hero-wrap">
      <div className="hero-card">
        <div className="hero-visual"><img src="/real5.png" alt="BOXDRIVE closed-loop controller mounted on a NEMA 17 motor" width="800" height="800" /></div>
        <div className="hero-copy">
          <span className="eyebrow">BOXPOX · Precision motion</span>
          <h1>Make every movement count.</h1>
          <p>Meet BOXDRIVE: a compact, closed-loop controller built for your next idea.</p>
          <Link to="/product" className="btn btn-buy">Explore BOXDRIVE <ArrowUpRight size={17} /></Link>
        </div>
      </div>
    </section>

    <section className="proof-strip" aria-label="BOXDRIVE highlights">
      <div className="proof-intro"><span className="eyebrow">Built to move</span><strong>Powerful control.<br/>In one compact board.</strong></div>
      <div className="proof-stat"><b>12-bit</b><span>magnetic feedback</span></div>
      <div className="proof-stat"><b>2.0 A</b><span>motor current</span></div>
      <div className="proof-stat"><b>Wi-Fi · BLE · CAN</b><span>connected out of the box</span></div>
    </section>

    <section className="story" id="technology">
      <span className="eyebrow">Designed for makers</span>
      <h2>Everything you need to move with confidence.</h2>
      <div className="story-split reveal">
        <div className="story-photo"><img src="/clean_iso.png" alt="BOXDRIVE controller board, product render" width="800" height="800" loading="lazy" /></div>
        <div className="code-window">
          <div className="code-chrome"><span/><span/><span/><em>boxdrive.ino</em></div>
          <pre>{`#include <BoxDrive.h>\n\nBoxDrive motor;\n\nvoid setup() {\n  motor.begin();\n  motor.enableMotor();\n}\n\nvoid loop() {\n  motor.moveToAngle(90);\n}`}</pre>
          <div className="code-status">Ready to build · BOXDRIVE</div>
        </div>
      </div>
      <div className="tabs" role="tablist" aria-label="Explore applications">
        {(Object.keys(applications) as Application[]).map((key) => <button key={key} role="tab" aria-selected={application === key} className={application === key ? 'tab active' : 'tab'} onClick={() => setApplication(key)}>{key === 'cnc' ? 'CNC' : key === 'wireless' ? 'Connected systems' : 'Robotics'}</button>)}
      </div>
      <div className="tab-panel" role="tabpanel"><h3>{active.title}</h3><p>{active.body}</p></div>
    </section>

    <section className="feature-band">
      <div className="feature-copy reveal"><span className="eyebrow">Simple setup</span><h2>From unboxing to motion.</h2><p>Mount it to a NEMA 17, connect power and USB-C, then build with the tools you already know.</p><Link to="/product" className="text-link">See BOXDRIVE details <ArrowRight size={16} /></Link></div>
      <img src="/real4.png" alt="Close-up of the BOXDRIVE controller board" className="feature-img reveal" width="800" height="800" loading="lazy" />
    </section>

    <section className="pillars">
      <article className="reveal"><span className="eyebrow">01 / Control</span><h2>Closed-loop precision.</h2><ul><li>AS5600 encoder</li><li>12-bit feedback</li></ul><p>Know the shaft’s real position, not just the steps sent.</p></article>
      <article className="reveal"><span className="eyebrow">02 / Performance</span><h2>Quiet when it counts.</h2><ul><li>TMC2209</li><li>Up to 2 A RMS</li></ul><p>Fine tune for smooth, quiet movement or higher torque.</p></article>
      <article className="reveal"><span className="eyebrow">03 / Connectivity</span><h2>Ready to work together.</h2><ul><li>Wi-Fi 6</li><li>BLE 5 · CAN</li></ul><p>Connect, control and scale from a single compact board.</p></article>
    </section>

    <section className="feature-band feature-band-light">
      <img src="/real5.png" alt="BOXDRIVE controller and wiring detail" className="feature-img reveal" width="800" height="800" loading="lazy" />
      <div className="feature-copy reveal"><span className="eyebrow">Scale your setup</span><h2>One neat connection at a time.</h2><p>Link multiple axes over CAN and pass power along the chain. Less wiring, more room to build.</p><a className="text-link" href="/BoxDrive_Datasheet_Preview.pdf" download>Download datasheet PDF <ArrowUpRight size={16} /></a></div>
    </section>

    <section className="toolbox" id="specifications">
      <span className="eyebrow">At a glance</span><h2>Small board. Serious capability.</h2>
      <div className="spec-grid">{SPECS.map((spec) => <article key={spec.title} className="spec-card reveal"><h3>{spec.title}</h3><p>{spec.body}</p></article>)}</div>
    </section>

    <section className="library-section reveal" id="resources">
      <div className="library-header"><span className="eyebrow">Open source</span><h2>Start building with BoxDrive.</h2><p className="lede">Examples and tools for Arduino, CAN, wireless control and closed-loop motion.</p></div>
      <div className="library-grid">
        <article className="library-card"><div className="library-card-icon"><FileCode size={22}/></div><h3>Ready-to-use examples</h3><p>Start from proven sketches for motion control and connected axes.</p><span className="library-tag">Arduino library</span></article>
        <article className="library-card"><div className="library-card-icon"><RotateCw size={22}/></div><h3>Feedback built in</h3><p>AS5600 sensing with closed-loop control for reliable positioning.</p><span className="library-tag">Encoder + PID</span></article>
        <article className="library-card"><div className="library-card-icon"><Wifi size={22}/></div><h3>Wireless control</h3><p>Connect to the onboard dashboard for quick setup and testing.</p><span className="library-tag">Wi-Fi dashboard</span></article>
      </div>
      <div className="terminal-box"><div className="terminal-header"><div className="terminal-dots"><span/><span/><span/></div><span className="terminal-title">Get the library</span><span className="terminal-lang">GIT</span></div><div className="terminal-body"><div className="terminal-code-wrap"><code>{cloneCommand}</code></div><button type="button" className="terminal-copy-btn" onClick={() => void copyCommand()}>{copied ? <Check size={14}/> : <Copy size={14}/>}<span>{copied ? 'COPIED' : 'COPY'}</span></button></div></div>
      <div className="library-actions"><a href="https://github.com/BoxPoxin/BoxDrive_Library" target="_blank" rel="noreferrer" className="btn btn-github"><GithubIcon size={17}/><span>View library</span></a><a href="https://github.com/BoxPoxin/BoxDrive_Library/archive/refs/heads/main.zip" target="_blank" rel="noreferrer" className="btn btn-secondary-mono"><Download size={16}/><span>Download ZIP</span></a></div>
    </section>

    <section className="included reveal"><span className="eyebrow">In the box</span><h2>Everything to get started.</h2><div><img src="/clean_iso.png" alt="BOXDRIVE controller board" width="800" height="800" loading="lazy"/><ul><li>BOXDRIVE controller</li><li>XT30 CAN cable</li><li>Aluminum heatsink</li><li>Enclosure and screws</li><li>Encoder magnet</li><li>Quick-start manual</li></ul></div></section>

    <section className="closing reveal"><div><span className="eyebrow">Ready when you are</span><h2>Bring your next idea to life.</h2><p>In stock · ships in 2–3 business days</p></div><Link to="/product" className="btn btn-buy">Shop BOXDRIVE <ArrowRight size={16} /></Link></section>
  </>
}

const SPECS = [
  { title: 'ESP32-C6', body: '160 MHz MCU with Wi-Fi 6 and BLE 5.' },
  { title: 'TMC2209', body: 'Quiet motion with UART configuration.' },
  { title: 'AS5600 encoder', body: '12-bit magnetic feedback for precision.' },
  { title: '4.75–24 V input', body: 'XT30 power for compact builds.' },
  { title: 'CAN bus', body: 'Reliable communication across multiple axes.' },
  { title: 'USB-C', body: 'Simple programming and debugging.' },
  { title: 'NEMA 17 mount', body: 'Compact 42 mm board footprint.' },
  { title: 'Open platform', body: 'Arduino, PlatformIO and ESP-IDF.' },
]
