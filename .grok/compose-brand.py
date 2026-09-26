#!/usr/bin/env python3
"""Compose RPG Platis share cards from the app's own tabletop art + crisp type."""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

HERO = Path("/workspace/public/hero.jpg")
OUT_OG_RAW = Path("/workspace/.grok/og-raw.jpg")
OUT_BANNER_RAW = Path("/workspace/.grok/x-banner-raw.jpg")
FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"

OLIVE = (9, 10, 8)
IVORY = (236, 232, 220)
INK = (42, 44, 36)
WARM = (210, 186, 140)


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def spaced_width(font: ImageFont.FreeTypeFont, text: str, tracking: float) -> float:
    if not text:
        return 0.0
    w = 0.0
    for i, ch in enumerate(text):
        w += font.getlength(ch)
        if i < len(text) - 1:
            w += tracking
    return w


def draw_spaced(
    draw: ImageDraw.ImageDraw,
    xy: tuple[float, float],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill,
    tracking: float,
) -> None:
    x, y = xy
    for i, ch in enumerate(text):
        draw.text((x, y), ch, font=font, fill=fill)
        x += font.getlength(ch) + (tracking if i < len(text) - 1 else 0)


def draw_carved_line(
    base: Image.Image,
    text: str,
    center: tuple[float, float],
    font: ImageFont.FreeTypeFont,
    tracking: float,
) -> None:
    """Bone-ivory carved serif with olive ink outline and warm highlight."""
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    tw = spaced_width(font, text, tracking)
    x = center[0] - tw / 2
    y = center[1]
    # Deep ink outline
    for a in range(0, 360, 20):
        rad = math.radians(a)
        ox = math.cos(rad) * 3.2
        oy = math.sin(rad) * 3.2
        draw_spaced(draw, (x + ox, y + oy), text, font, (*OLIVE, 220), tracking)
    # Drop shadow
    draw_spaced(draw, (x + 3, y + 5), text, font, (0, 0, 0, 140), tracking)
    # Warm under-edge (carved catch-light from candle)
    draw_spaced(draw, (x - 1.2, y - 1.6), text, font, (*WARM, 90), tracking)
    # Main ivory
    draw_spaced(draw, (x, y), text, font, (*IVORY, 255), tracking)
    base.alpha_composite(overlay)


def feather_rect(size: tuple[int, int], box: tuple[int, int, int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle(box, radius=radius, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(max(8, radius // 2)))


def hide_lettering(im: Image.Image) -> Image.Image:
    """Smear garbled generated lockup and card nameplates so we can set clean type."""
    w, h = im.size
    boxes = [
        # Weathered "RPG PLATIS" lockup, upper-left-center.
        (int(w * 0.12), int(h * 0.02), int(w * 0.62), int(h * 0.38)),
        # Front character-card nameplate ("ELRI" and similar glyphs).
        (int(w * 0.04), int(h * 0.66), int(w * 0.24), int(h * 0.80)),
    ]
    out = im
    arr_src = np.array(im).astype(np.float32)
    smeared = im.filter(ImageFilter.GaussianBlur(36))
    for box in boxes:
        x0, y0, x1, y1 = box
        mask = feather_rect(im.size, box, radius=max(24, (y1 - y0) // 4))
        pad = 28
        ring = arr_src[max(0, y0 - pad) : min(h, y1 + pad), max(0, x0 - pad) : min(w, x1 + pad)]
        lum = ring.mean(axis=2)
        keep = (lum > 28) & (lum < 150)
        if keep.sum() > 200:
            tone = ring[keep].mean(axis=0)
        else:
            tone = np.array([48, 50, 36], dtype=np.float32)
        wash = Image.new("RGB", im.size, tuple(int(c) for c in tone))
        rng = np.random.default_rng(11 + x0)
        grain = rng.normal(0, 7, (h, w, 1)).astype(np.float32)
        g_arr = np.clip(np.array(wash).astype(np.float32) + grain, 0, 255).astype(np.uint8)
        wash = Image.fromarray(g_arr)
        wash = Image.blend(wash, smeared, 0.55)
        out = Image.composite(wash, out, mask)
    return out


def vignette(im: Image.Image, strength: float = 0.55) -> Image.Image:
    w, h = im.size
    ys = np.linspace(-1, 1, h)[:, None]
    xs = np.linspace(-1, 1, w)[None, :]
    r = np.sqrt((xs * 1.05) ** 2 + (ys * 1.15) ** 2)
    v = np.clip(1.0 - strength * np.clip(r - 0.35, 0, None) ** 1.35, 0.18, 1.0)
    arr = np.array(im).astype(np.float32)
    olive = np.array(OLIVE, dtype=np.float32)
    mixed = arr * v[..., None] + olive * (1.0 - v[..., None])
    return Image.fromarray(np.clip(mixed, 0, 255).astype(np.uint8))


def grade(im: Image.Image) -> Image.Image:
    im = ImageEnhance.Color(im).enhance(0.82)
    im = ImageEnhance.Contrast(im).enhance(1.08)
    im = ImageEnhance.Brightness(im).enhance(0.92)
    arr = np.array(im).astype(np.float32)
    # Nudge shadows toward olive-black, keep bone highlights.
    lum = arr.mean(axis=2, keepdims=True) / 255.0
    olive = np.array(OLIVE, dtype=np.float32)
    arr = arr * (0.88 + 0.12 * lum) + olive * (0.10 * (1.0 - lum))
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def add_film_grain(im: Image.Image, sigma: float = 5.5) -> Image.Image:
    arr = np.array(im).astype(np.float32)
    rng = np.random.default_rng(21)
    noise = rng.normal(0, sigma, arr.shape[:2] + (1,))
    return Image.fromarray(np.clip(arr + noise, 0, 255).astype(np.uint8))


def draw_lockup(im: Image.Image, cx: float, cy: float, scale: float, tracking_scale: float = 1.0) -> None:
    """Two-line RPG / PLATIS lockup. scale=1 is sized for the 1792-wide hero."""
    rpg_font = load_font(FONT_BOLD, int(118 * scale))
    plat_font = load_font(FONT_BOLD, int(164 * scale))
    rpg_track = 18 * scale * tracking_scale
    plat_track = 10 * scale * tracking_scale
    rpg_h = rpg_font.getbbox("RPG")[3] - rpg_font.getbbox("RPG")[1]
    plat_h = plat_font.getbbox("PLATIS")[3] - plat_font.getbbox("PLATIS")[1]
    gap = 10 * scale
    total_h = rpg_h + gap + plat_h
    top = cy - total_h / 2
    draw_carved_line(im, "RPG", (cx, top), rpg_font, rpg_track)
    draw_carved_line(im, "PLATIS", (cx, top + rpg_h + gap), plat_font, plat_track)
    # Bone rule between the two lines
    overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    rule_y = top + rpg_h + gap * 0.38
    tw = spaced_width(plat_font, "PLATIS", plat_track) * 0.42
    d.rectangle([cx - tw, rule_y, cx + tw, rule_y + max(2, 3 * scale)], fill=(*IVORY, 150))
    im.alpha_composite(overlay)


def compose_og() -> Image.Image:
    hero = Image.open(HERO).convert("RGB")
    hero = hide_lettering(hero)
    hero = grade(hero)
    hero = vignette(hero, 0.48)
    hero = add_film_grain(hero, 4.5)
    rgba = hero.convert("RGBA")
    w, h = rgba.size
    # Centered lockup, width of PLATIS ~ 0.55 of frame.
    draw_lockup(rgba, cx=w * 0.50, cy=h * 0.46, scale=1.0)
    return rgba.convert("RGB")


def compose_banner() -> Image.Image:
    hero = Image.open(HERO).convert("RGB")
    hero = hide_lettering(hero)
    w, h = hero.size
    # 50:11 strip of the table itself (dice, cards, map), skipping the old title.
    band_h = int(round(w * 11 / 50))
    y0 = int(h * 0.46)
    y0 = min(max(0, y0), h - band_h)
    strip = hero.crop((0, y0, w, y0 + band_h))
    strip = grade(strip)
    # Darken left half so the lockup reads over the felt.
    arr = np.array(strip).astype(np.float32)
    sw = arr.shape[1]
    fade = np.clip(np.linspace(0.42, 1.0, sw), 0.42, 1.0)
    fade = np.where(np.arange(sw) < sw * 0.52, fade, 1.0).astype(np.float32)
    # smoother left wash
    x = np.arange(sw, dtype=np.float32) / sw
    wash = np.clip((x - 0.02) / 0.50, 0, 1)
    wash = wash * wash * (3 - 2 * wash)
    factor = 0.38 + 0.62 * wash
    olive = np.array(OLIVE, dtype=np.float32)
    arr = arr * factor[None, :, None] + olive * (1.0 - factor[None, :, None]) * 0.65
    strip = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    strip = vignette(strip, 0.28)
    strip = add_film_grain(strip, 4.0)
    rgba = strip.convert("RGBA")
    bw, bh = rgba.size
    # Entire lockup in the left half AND above the midline; empty strip along the bottom.
    rpg_font = load_font(FONT_BOLD, int(bh * 0.15))
    plat_font = load_font(FONT_BOLD, int(bh * 0.22))
    rpg_track = bh * 0.022
    plat_track = bh * 0.012
    rpg_h = rpg_font.getbbox("RPG")[3] - rpg_font.getbbox("RPG")[1]
    plat_h = plat_font.getbbox("PLATIS")[3] - plat_font.getbbox("PLATIS")[1]
    gap = bh * 0.025
    left = bw * 0.06
    top = bh * 0.08
    overlay = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    def carved_left(text, xy, font, tracking):
        x, y = xy
        for a in range(0, 360, 24):
            rad = math.radians(a)
            ox = math.cos(rad) * 2.2
            oy = math.sin(rad) * 2.2
            draw_spaced(draw, (x + ox, y + oy), text, font, (*OLIVE, 230), tracking)
        draw_spaced(draw, (x + 2, y + 3), text, font, (0, 0, 0, 130), tracking)
        draw_spaced(draw, (x, y), text, font, (*IVORY, 255), tracking)

    carved_left("RPG", (left, top), rpg_font, rpg_track)
    carved_left("PLATIS", (left, top + rpg_h + gap), plat_font, plat_track)
    tw = spaced_width(plat_font, "PLATIS", plat_track) * 0.45
    rule_y = top + rpg_h + gap * 0.35
    draw.rectangle([left, rule_y, left + tw, rule_y + 2], fill=(*IVORY, 140))
    rgba.alpha_composite(overlay)
    return rgba.convert("RGB")


def main() -> None:
    og = compose_og()
    og.save(OUT_OG_RAW, "JPEG", quality=95, subsampling=0)
    print("og-raw", og.size, OUT_OG_RAW)
    banner = compose_banner()
    banner.save(OUT_BANNER_RAW, "JPEG", quality=95, subsampling=0)
    print("banner-raw", banner.size, OUT_BANNER_RAW)


if __name__ == "__main__":
    main()
