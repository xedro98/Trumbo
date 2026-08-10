//! Logo component — renders the ASCII Trumbo mark.
//!
//! A single full "T" glyph (ASCII only, no braille) so it renders on every
//! console host, including bare ConHost. The 15-row mark is shown whenever it
//! fits; below that threshold no logo is rendered — the earlier clipped 5-row
//! variant (`logo05`) is gone. Unlike the sibling chrome glyphs there is
//! nothing to fall back from — the mark never takes the legacy-console path.

use ratatui::buffer::Buffer;
use ratatui::layout::{Alignment, Rect};
use ratatui::style::{Color, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Paragraph, Widget};

use crate::render::color::blend_color;
use crate::theme::Theme;

const LOGO: &str = include_str!("../../../assets/logo/logo07.txt");

/// Height at or above which the (15-row) logo is shown; below it, no logo.
/// The stacked layout needs 15 + menu + prompt + version + padding, so this
/// sits where the full mark fits rather than clipping short terminals.
const FULL_LOGO_MIN_HEIGHT: u16 = 29;

fn pick_logo(window_height: u16) -> Option<&'static str> {
    pick_logo_for(window_height, logo_hidden())
}

/// Pure tier selection so tests can drive a hidden flag directly.
fn pick_logo_for(window_height: u16, hidden: bool) -> Option<&'static str> {
    if hidden || window_height < FULL_LOGO_MIN_HEIGHT {
        None
    } else {
        Some(LOGO)
    }
}

/// Whether the welcome logo is suppressed. Never: the ASCII mark renders on
/// every console host (bare ConHost included), so unlike the sibling chrome
/// glyphs there is no braille to guard against. The name + `pick_logo_for`'s
/// `hidden` param keep the pure suppression contract testable.
fn logo_hidden() -> bool {
    false
}

fn non_empty_lines(logo: &str) -> impl Iterator<Item = &str> {
    logo.lines().filter(|l| !l.is_empty())
}

fn count_lines(logo: &str) -> u16 {
    non_empty_lines(logo).count() as u16
}

fn visual_width(logo: &str) -> u16 {
    non_empty_lines(logo)
        .map(unicode_width::UnicodeWidthStr::width)
        .max()
        .unwrap_or(24) as u16
}

/// Animation phase in seconds since the first render. Wall-clock based so the
/// shimmer speed is independent of the frame rate.
fn anim_phase_secs() -> f32 {
    use std::sync::OnceLock;
    use std::time::Instant;
    static START: OnceLock<Instant> = OnceLock::new();
    START.get_or_init(Instant::now).elapsed().as_secs_f32()
}

/// Shimmer redraw cadence in frames per second. The sweep is slow, so a few fps
/// looks smooth while sparing the long-lived welcome screen from full-rate
/// repaints.
const SHIMMER_FPS: f32 = 12.0;

/// Quantized shimmer frame for the current wall-clock phase. The welcome screen
/// redraws only when this advances, throttling the animation to ~`SHIMMER_FPS`
/// rather than the full event-loop tick rate.
pub fn shimmer_frame() -> u64 {
    (anim_phase_secs() * SHIMMER_FPS) as u64
}

/// Per-glyph shine opacity in `[0, 1]` at normalized diagonal position `diag`
/// (0 = bottom-left .. 1 = top-right) and animation time `secs`. A raised-cosine
/// band sweeps bottom-left → top-right and parks off-screen between sweeps; a
/// gentle global pulse breathes underneath it. 0 keeps the resting gray, 1 is
/// full bright.
fn shine_opacity(diag: f32, secs: f32) -> f32 {
    const BAND: f32 = 0.38; // half-width of the shine band — wider = more gradual falloff
    const CYCLE: f32 = 4.0; // seconds per sweep + rest
    const SWEEP_FRAC: f32 = 0.32; // portion of the cycle spent sweeping (~1.3s glint, rest idles)
    const SHINE: f32 = 0.33; // peak shine strength
    const PULSE: f32 = 0.06; // global breathing amount
    const PULSE_SECS: f32 = 5.0; // breathing period

    let p = (secs % CYCLE) / CYCLE;
    let q = (p / SWEEP_FRAC).min(1.0); // parks the band off-screen during the rest
    let band_pos = -BAND + q * (1.0 + 2.0 * BAND);
    let pulse = PULSE * (0.5 - 0.5 * (std::f32::consts::TAU * secs / PULSE_SECS).cos());

    let d = (diag - band_pos).abs();
    let shine = if d < BAND {
        0.5 * (1.0 + (std::f32::consts::PI * d / BAND).cos())
    } else {
        0.0
    };
    (pulse + SHINE * shine).clamp(0.0, 1.0)
}

fn render_into(area: Rect, buf: &mut Buffer, theme: &Theme, logo: &str) {
    let lines: Vec<&str> = non_empty_lines(logo).collect();
    let rows = lines.len().max(1) as f32;
    let cols = lines
        .iter()
        .map(|l| l.chars().count())
        .max()
        .unwrap_or(1)
        .max(1) as f32;
    let secs = anim_phase_secs();

    // Blend each glyph from a resting bright gray toward the Trumbo green by its
    // shine opacity, so a sheen sweeps across the ASCII mark. Resting on
    // `gray_bright` (not `gray`) keeps the sparse ASCII glyphs clearly legible
    // on dark backgrounds. Adjacent glyphs that land on the same blended color
    // share one Span to hold down the per-frame allocation.
    let base = theme.gray_bright;
    // Shimmer highlights in Trumbo green so the mark reads on-brand.
    let hilite = theme.accent_assistant;
    let logo_lines: Vec<Line> = lines
        .iter()
        .enumerate()
        .map(|(row, line)| {
            let mut spans: Vec<Span> = Vec::new();
            let mut run = String::new();
            let mut run_color: Option<Color> = None;
            for (col, ch) in line.chars().enumerate() {
                // Sweep along the bottom-left → top-right diagonal: the
                // coordinate grows as col increases and row decreases.
                let diag = (col as f32 + (rows - 1.0 - row as f32)) / (cols + rows);
                let color = blend_color(base, hilite, shine_opacity(diag, secs)).unwrap_or(base);
                if run_color != Some(color) {
                    if let Some(prev) = run_color {
                        spans.push(Span::styled(
                            std::mem::take(&mut run),
                            Style::default().fg(prev),
                        ));
                    }
                    run_color = Some(color);
                }
                run.push(ch);
            }
            if let Some(prev) = run_color {
                spans.push(Span::styled(run, Style::default().fg(prev)));
            }
            Line::from(spans).alignment(Alignment::Center)
        })
        .collect();
    Paragraph::new(logo_lines).render(area, buf);
}

pub fn logo_line_count(window_height: u16) -> u16 {
    pick_logo(window_height).map_or(0, count_lines)
}

pub fn logo_visual_width(window_height: u16) -> u16 {
    pick_logo(window_height).map_or(24, visual_width)
}

pub fn render_logo(area: Rect, buf: &mut Buffer, theme: &Theme, window_height: u16) {
    if let Some(logo) = pick_logo(window_height) {
        render_into(area, buf, theme, logo);
    }
}

/// The hero box always shows the full logo: it is laid out beside the menu, so
/// it fits whenever the box does. These report and render that logo directly,
/// independent of the height-based [`pick_logo`] tiers used by the stacked
/// layout.
pub fn full_logo_line_count() -> u16 {
    count_lines(LOGO)
}

#[cfg(test)]
fn full_logo_line_count_for(hidden: bool) -> u16 {
    if hidden { 0 } else { count_lines(LOGO) }
}

pub fn full_logo_visual_width() -> u16 {
    visual_width(LOGO)
}

#[cfg(test)]
fn full_logo_visual_width_for(hidden: bool) -> u16 {
    if hidden { 0 } else { visual_width(LOGO) }
}

pub fn render_full_logo(area: Rect, buf: &mut Buffer, theme: &Theme) {
    render_into(area, buf, theme, LOGO);
}

/// Line count of the logo used in minimal's committed welcome card. The mark
/// is a single full-height variant (the clipped 5-row cut is gone), so this
/// matches the full logo's row count.
pub fn compact_logo_line_count() -> u16 {
    count_lines(LOGO)
}

/// Render the ASCII logo (centered) into `area` for minimal's welcome card.
pub fn render_compact_logo(area: Rect, buf: &mut Buffer, theme: &Theme) {
    render_into(area, buf, theme, LOGO);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn logo_sizes_by_height() {
        // A single full-height mark: nothing below the fit threshold (the
        // clipped 5-row variant is gone), the full logo once it fits.
        assert!(pick_logo_for(FULL_LOGO_MIN_HEIGHT - 1, false).is_none());
        assert_eq!(pick_logo_for(FULL_LOGO_MIN_HEIGHT, false), Some(LOGO));
        assert_eq!(pick_logo_for(u16::MAX, false), Some(LOGO));
    }

    // The pure tier gate still honors an explicit hidden flag (the contract
    // callers rely on); the live welcome logo simply never sets it.
    #[test]
    fn pick_logo_for_honors_hidden_flag() {
        for h in [0, FULL_LOGO_MIN_HEIGHT, u16::MAX] {
            assert!(pick_logo_for(h, true).is_none(), "height {h}");
        }
    }

    #[test]
    fn live_logo_never_suppressed() {
        assert!(!logo_hidden(), "the ASCII mark must always render");
        assert_eq!(pick_logo(u16::MAX), Some(LOGO));
    }

    #[test]
    fn hero_box_always_uses_full_logo() {
        // The box renders the full logo regardless of height (it's laid out
        // beside the menu), and it's the single full-height mark — never a
        // clipped variant.
        assert_eq!(full_logo_line_count_for(false), count_lines(LOGO));
        assert_eq!(full_logo_visual_width_for(false), visual_width(LOGO));
        assert!(full_logo_line_count_for(false) > 0);
    }

    #[test]
    fn full_logo_helpers_collapse_when_hidden() {
        assert_eq!(full_logo_line_count_for(true), 0);
        assert_eq!(full_logo_visual_width_for(true), 0);
    }

    #[test]
    fn compact_logo_line_count_matches_full_logo() {
        // The minimal welcome card uses the same single full-height mark as
        // the hero box (the clipped 5-row cut is gone), so its row count
        // equals the full logo's.
        assert_eq!(compact_logo_line_count(), count_lines(LOGO));
        assert!(compact_logo_line_count() > 0);
    }

    #[test]
    fn shine_opacity_stays_in_unit_range() {
        let mut secs = 0.0;
        while secs < 10.0 {
            for i in 0..=20 {
                let diag = i as f32 / 20.0;
                let op = shine_opacity(diag, secs);
                assert!(
                    (0.0..=1.0).contains(&op),
                    "opacity {op} out of range at diag {diag}, secs {secs}"
                );
            }
            secs += 0.13;
        }
    }

    #[test]
    fn shine_band_sweeps_across() {
        // The brightest point along the diagonal advances left → right as the
        // sweep progresses through its active phase.
        let brightest = |secs: f32| -> f32 {
            (0..=100)
                .map(|i| i as f32 / 100.0)
                .max_by(|a, b| {
                    shine_opacity(*a, secs)
                        .partial_cmp(&shine_opacity(*b, secs))
                        .unwrap()
                })
                .unwrap()
        };
        let early = brightest(0.1);
        let mid = brightest(0.4);
        let late = brightest(0.7);
        assert!(early < mid, "early {early} should precede mid {mid}");
        assert!(mid < late, "mid {mid} should precede late {late}");
    }

    #[test]
    fn shine_rests_dim_between_sweeps() {
        // During the rest phase the band is parked off-screen, so an interior
        // glyph falls back to at most the gentle pulse — never full bright.
        let op = shine_opacity(0.5, 6.0); // secs % 4.0 = 2.0 → past SWEEP_FRAC, in the rest phase
        assert!(op < 0.2, "resting opacity {op} should stay dim");
    }
}
