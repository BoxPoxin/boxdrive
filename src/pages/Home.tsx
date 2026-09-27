import { useState } from 'react'
import { Link } from '../lib/nav'

const audiences = {
  robotics: {
    title: 'Joints that never lose a step.',
    body: 'Closed-loop control on every NEMA 17. The AS5600 watches the shaft, the TMC2209 whispers, and the ESP32-C6 keeps the whole arm in sync over CAN.',
  },
  cnc: {
    title: 'Silence on the mill.',
    body: 'StealthChop keeps the machine quiet. StallGuard and encoder feedback mean you can push feeds without babysitting skipped steps.',
  },
  wireless: {
    title: 'A mesh of motors.',
    body: 'Wi-Fi 6, BLE 5 and CAN on the same 42 mm board. Flash once over USB-C, then OTA the fleet from the couch.',
  },
} as const

const audienceLabels: Record<keyof typeof audiences, string> = {
  robotics: 'Robotics',
  cnc: 'CNC',
  wireless: 'Wireless',
}

type Audience = keyof typeof audiences

export function Home() {
  const [audience, setAudience] = useState<Audience>('robotics')
  const active = audiences[audience]

  return (
    <>
      {/* ── Hero ───────────────────────────────── */}
      <section className="hero-wrap">
        <div className="hero-card">
          <div className="hero-visual">
            <img
              src="/stepper.png"
              alt="BOXDRIVE mounted on a NEMA 17 stepper motor"
              width="800"
              height="800"
            />
          </div>
          <div className="hero-copy">
            <h1>BOXDRIVE <span className="hero-star" aria-hidden="true">✳</span></h1>
            <p>
              Closed-loop stepper controller for makers, roboticists, and many more use cases
            </p>
            <Link to="/product" className="btn btn-buy">
              Buy
            </Link>
          </div>
        </div>
      </section>

      {/* ── Story: "Feels like home" ───────────── */}
      <section className="story">
        <h2 className="reveal">Feels like home. <span style={{color: 'var(--c-accent-2)'}}>✦</span></h2>
        <div className="story-split reveal">
          <div className="story-photo">
            <img
              src="/illustration2.png"
              alt="BOXDRIVE pop-art comic style top view"
              width="800"
              height="800"
              loading="lazy"
            />
          </div>
          <div className="code-window">
            <div className="code-chrome">
              <span />
              <span />
              <span />
              <em>boxdrive.ino</em>
            </div>
            <pre>{`#include <BOXDRIVE.h>

BOXDRIVE motor;

void setup() {
  motor.begin();
  motor.setCurrent(800);
}

void loop() {
  motor.moveTo(90);
}`}</pre>
            <div className="code-status">
              Everything working fine! · BOXDRIVE on COM3
            </div>
          </div>
        </div>

        <div className="tabs reveal" role="tablist">
          {(Object.keys(audiences) as Audience[]).map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={audience === key}
              aria-controls={`panel-${key}`}
              id={`tab-${key}`}
              className={audience === key ? 'tab active' : 'tab'}
              onClick={() => setAudience(key)}
            >
              {audienceLabels[key]}
            </button>
          ))}
        </div>
        <div className="tab-panel" id={`panel-${audience}`} key={audience} role="tabpanel" aria-labelledby={`tab-${audience}`}>
          <h3>{active.title}</h3>
          <p>{active.body}</p>
        </div>
      </section>

      {/* ── Feature band ───────────────────────── */}
      <section className="feature-band">
        <div className="feature-copy reveal">
          <h2>From idea to motion in minutes.</h2>
          <p>
            Don&apos;t spend a weekend wiring a driver, encoder and MCU on a
            breadboard. Bolt BOXDRIVE to the back of a NEMA 17 and start
            writing firmware.
          </p>
          <p className="muted">Start right over</p>
        </div>
        <img
          src="/doodle.png"
          alt="BOXDRIVE doodle sketch guide with pinouts and features"
          className="feature-img reveal"
          width="800"
          height="800"
          loading="lazy"
          style={{ width: '100%', maxWidth: '450px', height: 'auto', borderRadius: '12px', margin: '0 auto', display: 'block' }}
        />
      </section>

      <section className="feature-band" style={{ background: 'var(--c-bg-raised)', color: 'var(--c-text)' }}>
        <img
          src="/illustration.png"
          alt="BOXDRIVE pop-art comic style isometric view"
          className="feature-img reveal"
          width="800"
          height="800"
          loading="lazy"
          style={{ width: '100%', maxWidth: '450px', height: 'auto', borderRadius: '12px', margin: '0 auto', display: 'block' }}
        />
        <div className="feature-copy reveal">
          <h2 style={{ color: 'var(--c-text)' }}>Know exactly what you're doing.</h2>
          <p style={{ color: 'var(--c-text-2)' }}>
            With clear silkscreen indicators and logically grouped I/O, BOXDRIVE makes it immediately obvious where everything goes. The onboard ESP32-C6 gives you the freedom to build exactly what you want.
          </p>
        </div>
      </section>

      <section className="feature-band">
        <div className="feature-copy reveal">
          <h2>Daisy chain forever.</h2>
          <p>
            Building a multi-axis machine? Connect motors back-to-back using the CAN bus and the high-current XT30 connectors to completely eliminate wiring spaghetti. One cable for power, one for data.
          </p>
        </div>
        <img
          src="/daisy chain.png"
          alt="BOXDRIVE daisy chained over CAN bus"
          className="feature-img reveal"
          width="800"
          height="800"
          loading="lazy"
          style={{ width: '100%', maxWidth: '450px', height: 'auto', borderRadius: '12px', margin: '0 auto', display: 'block' }}
        />
      </section>

      {/* ── Pillars (3 features) ───────────────── */}
      <section className="pillars">
        <article className="reveal">
          <h2>Silence is a spec.</h2>
          <ul>
            <li>StealthChop</li>
            <li>SpreadCycle</li>
            <li>2.0 A RMS</li>
          </ul>
          <p>
            TMC2209 keeps the motor quiet even under load. UART configurability
            for current, microsteps and StallGuard.
          </p>
        </article>
        <article className="reveal">
          <h2>Absolute position.</h2>
          <ul>
            <li>AS5600</li>
            <li>12-bit</li>
            <li>0.0879°</li>
          </ul>
          <p>
            A magnet on the shaft, an encoder on the back of the board.
            Closed-loop without an extra sensor harness.
          </p>
        </article>
        <article className="reveal">
          <h2>Wireless from day one.</h2>
          <ul>
            <li>Wi-Fi 6</li>
            <li>BLE 5</li>
            <li>CAN</li>
          </ul>
          <p>
            ESP32-C6 RISC-V at 160 MHz. Program over USB-C like any ESP32, then
            update the fleet over the air.
          </p>
        </article>
      </section>

      {/* ── Toolbox / specs ────────────────────── */}
      <section className="toolbox">
        <h2 className="reveal">Small board. Big toolbox.</h2>
        <p className="lede reveal">
          Every chip, connector and rail BOXDRIVE packs in.
        </p>
        <div className="spec-grid">
          {SPECS.map((spec) => (
            <div key={spec.title} className="spec-card reveal">
              <h3>{spec.title}</h3>
              <p>{spec.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What you get ───────────────────────── */}
      <section className="included reveal" style={{ marginBottom: '8rem' }}>
        <h2>This is what you get.</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center', marginTop: '3rem' }}>
          <img
            src="/exploded.png"
            alt="BOXDRIVE exploded parts view showing heat sink and casing"
            width="800"
            height="800"
            loading="lazy"
            style={{ width: '100%', maxWidth: '450px', height: 'auto', borderRadius: '12px', margin: '0 auto', display: 'block' }}
          />
          <div style={{ flex: '1 1 300px' }}>
            <ul style={{ fontSize: '1.25rem', lineHeight: '2', margin: 0, paddingLeft: '1.5rem', listStyleType: 'disc' }}>
              <li><strong>BoxDrive</strong></li>
              <li>XT30CAN cable</li>
              <li>Aluminum heat sink</li>
              <li>Casing</li>
              <li>4 M3 Screws</li>
              <li>Magnet</li>
              <li>Manual</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────── */}
      <section className="closing reveal">
        <div>
          <h2>Get your BOXDRIVE</h2>
          <p>In stock now. Ships in 2–3 business days.</p>
        </div>
        <Link to="/product" className="btn btn-buy">
          Buy
        </Link>
      </section>
    </>
  )
}

const SPECS = [
  {
    title: 'ESP32-C6 RISC-V',
    body: '160 MHz wireless MCU with 4 MB flash and 512 KB SRAM.',
  },
  {
    title: 'TMC2209 driver',
    body: 'Silent StealthChop / SpreadCycle, UART setup, up to 2.0 A RMS.',
  },
  {
    title: 'AS5600 encoder',
    body: '12-bit magnetic rotary sensing at 0.0879° resolution.',
  },
  {
    title: '4.75–24 V input',
    body: 'XT30 daisy-chain power for multi-axis machines.',
  },
  {
    title: 'CAN bus',
    body: 'SN65HVD230 transceiver so axes talk without a wiring nest.',
  },
  {
    title: 'Wi-Fi 6 + BLE 5',
    body: 'On-chip radio with PCB antenna. OTA capable.',
  },
  {
    title: 'USB-C',
    body: 'Native USB programming and debug — Arduino, PlatformIO, ESP-IDF.',
  },
  {
    title: 'NEMA 17 mount',
    body: '42.31 × 42.31 × 9.1 mm with 4× M3 holes on the 31 mm pattern.',
  },
]
