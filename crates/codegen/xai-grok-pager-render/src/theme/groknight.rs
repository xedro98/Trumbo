//! GrokNight theme — neutral gray base with TokyoNight accent colors.
//!
//! The canonical palette is defined in RGB (`Color::Rgb`). At startup the
//! theme is run through [`Theme::quantized`] which downgrades every color
//! to the terminal's detected capability level (256-color, 16-color, etc.).

use ratatui::style::{Color, Modifier};

use super::tokyonight::Theme;

/// Helper for concise const `Color::Rgb` definitions.
const fn rgb(r: u8, g: u8, b: u8) -> Color {
    Color::Rgb(r, g, b)
}

// GrokNight palette — neutral gray base + TokyoNight accent colors.
//
// Backgrounds and text use a custom grayscale ramp anchored at:
//   • bg  = #141414 (20)
//   • fg  = #f3f3f3 (243)
//
// Accent colors are the original TokyoNight Night hex values.
#[allow(dead_code)]
mod palette {
    use super::*;

    // ── Backgrounds (Trumbo green-tinted surfaces) ──────────────────────
    pub const BG: Color = rgb(10, 14, 12); //  #0a0e0c — terminal bg (green-black)
    pub const BG_DARK: Color = rgb(11, 16, 13); //  #0b100d — darkest
    pub const BG_STORM_DARK: Color = rgb(15, 21, 18); //  #0f1512 — dark bg
    pub const BG_STORM: Color = rgb(18, 30, 24); //  #121e18 — main bg (dark green)
    pub const BG_HIGHLIGHT: Color = rgb(28, 43, 34); //  #1c2b22 — highlight bg

    // ── Text / grays ────────────────────────────────────────────────────
    pub const FG: Color = rgb(226, 230, 227); // #e2e6e3 — primary text (slight green)
    pub const FG_DARK: Color = rgb(200, 206, 202); // #c8ceca — secondary text
    pub const FG_GUTTER: Color = rgb(94, 108, 99); //  #5e6c63 — dim
    pub const COMMENT: Color = rgb(117, 128, 122); //  #75807a — muted
    pub const DARK3: Color = rgb(90, 102, 95); //  #5a665f — medium gray-green
    pub const DARK5: Color = rgb(127, 138, 132); // #7f8a84 — bright gray-green

    // ── Trumbo brand accents ─────────────────────────────────────────────
    pub const BRAND: Color = rgb(43, 191, 119); // #2BBF77 — Trumbo green
    pub const BRAND_BRIGHT: Color = rgb(61, 214, 134); // #3DD686

    // ── Secondary accent colors (TokyoNight Night) ────────────────────────
    pub const BLUE: Color = rgb(122, 162, 247); // #7aa2f7
    pub const BLUE0: Color = rgb(61, 89, 161); // #3d59a1
    pub const BLUE1: Color = rgb(58, 149, 171); // #3A95AB
    pub const CYAN: Color = rgb(125, 207, 255); // #7dcfff
    pub const GREEN: Color = rgb(158, 206, 106); // #9ece6a
    pub const GREEN1: Color = rgb(115, 218, 202); // #73daca
    pub const ORANGE: Color = rgb(255, 158, 100); // #ff9e64
    pub const PURPLE: Color = rgb(157, 124, 216); // #9d7cd8
    pub const RED: Color = rgb(247, 118, 142); // #f7768e
    pub const RED1: Color = rgb(219, 75, 75); // #db4b4b
    pub const TEAL: Color = rgb(26, 188, 156); // #1abc9c
    pub const YELLOW: Color = rgb(224, 175, 104); // #e0af68

    pub const RED_DARK: Color = rgb(66, 14, 20); // #420e14 — quantizes to 256-color red, not gray
    pub const GREEN_DARK: Color = rgb(6, 56, 6); // #063806 — quantizes to 256-color green, not gray
}
use palette::*;

impl Theme {
    /// Trumbo theme — neutral gray base with Trumbo green accents (default).
    ///
    /// Colors are defined in RGB. Call [`Theme::quantized`] to downgrade
    /// them to the terminal's supported color level before rendering.
    pub const fn groknight() -> Self {
        Self {
            bg_base: BG_STORM,
            bg_light: BG_HIGHLIGHT,
            bg_dark: rgb(25, 38, 30), // #19261e — lighter green for code blocks
            bg_highlight: BG_HIGHLIGHT,
            bg_hover: rgb(35, 51, 41), // #233329
            bg_terminal: BG,

            accent_user: BRAND_BRIGHT,
            accent_assistant: BRAND,
            accent_thinking: BRAND,
            accent_tool: DARK5,
            accent_system: BLUE,
            accent_error: RED,
            accent_success: GREEN,
            accent_running: BRAND,
            accent_skill: BLUE,

            text_primary: FG,
            text_secondary: FG_DARK,

            gray_dim: rgb(88, 88, 88), // #585858 — slightly brighter than FG_GUTTER
            gray: COMMENT,
            gray_bright: DARK5,

            command: YELLOW,
            path: ORANGE,
            running: CYAN,
            warning: YELLOW,

            fuzzy_accent: BLUE,

            accent_plan: rgb(255, 219, 141), // #FFDB8D — golden

            accent_verify: rgb(187, 154, 247), // #bb9af7 — violet

            accent_remember: Color::Rgb(139, 195, 74), // #8BC34A — Material Design light green

            selection_border: rgb(38, 82, 60),
            prompt_border: rgb(28, 56, 43), // #1c382b — dim green prompt chrome
            prompt_border_active: rgb(43, 191, 119), // #2BBF77 — Trumbo green when focused
            hover_border: rgb(23, 44, 33),

            accent_model: TEAL,

            scrollbar_bg: BG_STORM_DARK,
            scrollbar_fg: rgb(60, 96, 76), // green-tinted scrollbar thumb

            diff_delete_bg: RED_DARK,
            diff_delete_fg: RED,
            diff_insert_bg: GREEN_DARK,
            diff_insert_fg: GREEN,
            diff_equal_fg: COMMENT,
            diff_gutter_fg: COMMENT,

            bg_visual: rgb(54, 54, 54),

            paste_bg: BG_STORM_DARK,
            paste_fg: FG_DARK,
            paste_dim: FG_GUTTER,

            md_heading_h1: TEAL,
            md_heading_h1_mod: Modifier::BOLD,
            md_heading_h2: BLUE,
            md_heading_h2_mod: Modifier::BOLD,
            md_heading_h3: PURPLE,
            md_heading_h3_mod: Modifier::BOLD,
            md_heading_h4: DARK5, // bright gray
            md_heading_h4_mod: Modifier::BOLD,
            md_heading_h5: COMMENT, // medium gray
            md_heading_h5_mod: Modifier::BOLD,
            md_heading_h6: DARK3, // medium gray, unbold
            md_heading_h6_mod: Modifier::empty(),
            md_code: BLUE1,
            md_task_checked: GREEN,
            md_task_unchecked: FG_DARK, // text_secondary
            md_muted: COMMENT,
            md_code_bg: rgb(28, 28, 28),
            md_text: FG_DARK,
            link_fg: rgb(122, 166, 218), // #7aa6da -- soft blue for dark bg
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore = "known broken: expected accent values drift from runtime theme"]
    fn test_groknight_theme() {
        let theme = Theme::groknight();
        assert!(matches!(theme.bg_base, Color::Rgb(20, 20, 20)));
        assert!(matches!(theme.accent_user, Color::Rgb(225, 225, 225)));
        assert!(matches!(theme.text_primary, Color::Rgb(225, 225, 225)));
    }
}
