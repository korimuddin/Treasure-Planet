"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { startDive } from "./startDive";
import "./dive-landing.css";

export function DiveLanding() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    return startDive(rootRef.current);
  }, []);

  return (
    <div className="tp-dive" ref={rootRef}>
      <canvas id="ocean" aria-hidden="true" />
      <canvas id="motes" aria-hidden="true" />
      <div id="glare" aria-hidden="true" />

      <header className="topbar">
        <Link className="wordmark" href="/">
          TREASURE PLANET
        </Link>
        <nav className="nav" aria-label="Account">
          <Link className="signin" href="/login">
            Sign in
          </Link>
          <Link className="btn-gold" href="/register">
            Request access
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero wrap" aria-label="Introduction">
          <div className="hero-inner">
            <h1>TREASURE PLANET</h1>
            <p className="lede">
              Unfinished software sinks quietly. Founders list their dormant projects here, and builders bring them
              back up.
            </p>
            <div className="cue">Scroll to dive</div>
          </div>
        </section>

        <section className="interlude wrap" aria-label="Why it exists">
          <p id="interlude-line">Every abandoned repo was somebody’s best idea once.</p>
        </section>

        <section className="gate wrap" id="how" aria-labelledby="gate-title">
          <div className="inner">
            <div className="gate-copy">
              <span className="eyebrow">How it works</span>
              <h2 className="section" id="gate-title">
                Anonymous until both sides sign
              </h2>
              <p>
                Buyers see enough to judge a project: the stack, the stage and the asking price. The founder, the code
                and the strategy stay sealed until a mutual NDA is signed.
              </p>
              <ol className="steps">
                <li>
                  <b>01</b>
                  <span>
                    Browse sealed listings<em>Stack · stage · price</em>
                  </span>
                </li>
                <li>
                  <b>02</b>
                  <span>
                    Both parties sign a mutual NDA<em>Handled in the app</em>
                  </span>
                </li>
                <li>
                  <b>03</b>
                  <span>
                    The listing opens and you agree terms<em>Acquire · Co-found · Merge</em>
                  </span>
                </li>
              </ol>
              <div className="fee">
                <strong>10%</strong>on close · no listing fees
              </div>
            </div>

            <article className="listing" id="listing" aria-label="Example listing">
              <div className="l-head">
                <span>Example listing · TP-0412</span>
                <span id="l-state">Sealed</span>
              </div>
              <div className="l-title">
                <div className="redact" aria-hidden="true" />
                <span className="real">TIDEPOOL</span>
              </div>
              <div className="tags">
                <span>Next.js</span>
                <span>Supabase</span>
                <span>Stripe</span>
                <span>B2B SaaS</span>
              </div>
              <div className="l-grid">
                <div>
                  <small>Stage</small>
                  <b>Beta</b>
                </div>
                <div>
                  <small>Users</small>
                  <b>340</b>
                </div>
                <div>
                  <small>Asking</small>
                  <b>£18K</b>
                </div>
              </div>
              <div className="locked">
                <div>
                  <small>Product</small>
                  <span>Booking and payments for surf schools</span>
                </div>
                <div>
                  <small>Founder</small>
                  <span>Solo founder, Cornwall</span>
                </div>
                <div>
                  <small>Repository</small>
                  <span>github.com/tidepool-app/core</span>
                </div>
              </div>
              <div className="l-foot">
                <span className="fine-inline" id="l-note">
                  Sample data for illustration
                </span>
                <button className="btn-gold" id="reveal" type="button">
                  Sign NDA to reveal
                </button>
              </div>
            </article>
          </div>
        </section>

        <section className="deals wrap" id="deals" aria-labelledby="deals-title">
          <div className="inner">
            <span className="eyebrow">Three ways to bring it up</span>
            <h2 className="section" id="deals-title">
              Choose your deal
            </h2>
            <div className="deal-list">
              <article className="deal">
                <h3>Acquire</h3>
                <p>Buy the codebase, the domain and the rights outright, and ship it under your own name.</p>
                <small>Full IP</small>
              </article>
              <article className="deal">
                <h3>Co-Found</h3>
                <p>Join the original founder for a share of the company and finish what they started.</p>
                <small>Equity</small>
              </article>
              <article className="deal">
                <h3>Merge</h3>
                <p>Fold two half-built projects into one product that neither team could finish alone.</p>
                <small>Combine</small>
              </article>
            </div>
          </div>
        </section>

        <section className="access wrap" id="access" aria-labelledby="cta-title">
          <div className="inner">
            <span className="eyebrow">Founding Fleet</span>
            <h2 className="section" id="cta-title">
              List with zero fees
            </h2>
            <p>The first sellers on Treasure Planet pay nothing on close. Create an account to list before launch.</p>
            <Link className="btn-gold" href="/register">
              Request access
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <b>TREASURE PLANET</b>
            <p>An NDA-gated marketplace for dormant and unfinished software projects.</p>
          </div>
          <nav className="foot-col" aria-label="Marketplace">
            <h5>Marketplace</h5>
            <ul>
              <li><Link href="/marketplace">Browse listings</Link></li>
              <li><Link href="/how-it-works">How it works</Link></li>
              <li><Link href="/how-ndas-work">Mutual NDAs</Link></li>
            </ul>
          </nav>
          <nav className="foot-col" aria-label="Company">
            <h5>Company</h5>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/register">Founding Fleet</Link></li>
              <li><Link href="/legal">Terms &amp; privacy</Link></li>
            </ul>
          </nav>
        </div>
        <div className="foot-base">
          <span>© 2026 Treasure Planet</span>
          <span className="fine">Every deal protected by our mutual NDA</span>
        </div>
      </footer>
    </div>
  );
}
