// Glyph Art Generator
// Generates abstract art using distorted characters from various language scripts
class GlyphArtGenerator {
    constructor() {
        // Character pools from different scripts
        this.characterPools = {
            // Latin extended
            latin: ['À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Æ', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ì', 'Í', 'Î', 'Ï', 'Ð', 'Ñ', 'Ò', 'Ó', 'Ô', 'Õ', 'Ö', 'Ø', 'Ù', 'Ú', 'Û', 'Ü', 'Ý', 'Þ', 'ß', 'Ā', 'Ē', 'Ī', 'Ō', 'Ū', 'Ĉ', 'Ĝ', 'Ĥ', 'Ĵ', 'Ŝ', 'Ŭ', 'Ž', 'Ƀ', 'Ɖ', 'Ɛ', 'Ɨ', 'Ŋ', 'Ɵ', 'Ʃ', 'Ʈ', 'Ʊ', 'Ʋ', 'Ʒ'],
            
            // Cyrillic
            cyrillic: ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я', 'Ѐ', 'Ѕ', 'Ј', 'Љ', 'Њ', 'Ћ', 'Ќ', 'Ў', 'Џ', 'Ѡ', 'Ѣ', 'Ѧ', 'Ѩ', 'Ѭ', 'Ѯ', 'Ѱ', 'Ѳ', 'Ѵ', 'Ѷ', 'Ѹ', 'Ѻ', 'Ѽ', 'Ѿ', 'Ҁ'],
            
            // Greek
            greek: ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω'],
            
            // Arabic (isolated forms)
            arabic: ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'],
            
            // Hebrew
            hebrew: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'],
            
            // CJK (selection of common characters)
            cjk: ['中', '国', '日', '本', '水', '火', '木', '金', '土', '龍', '鳳', '虎', '馬', '鳥', '花', '月', '星', '雲', '山', '川', '海', '風', '雨', '雪'],
            
            // Mathematical and symbols
            symbols: ['∀', '∁', '∂', '∃', '∄', '∅', '∆', '∇', '∈', '∉', '∋', '∌', '∏', '∐', '∑', '−', '∓', '∔', '∕', '∖', '∗', '∘', '∙', '√', '∛', '∜', '∝', '∞', '∟', '∠', '∡', '∢', '∣', '∤', '∥', '∦', '∧', '∨', '∩', '∪', '∫', '∬', '∭', '∮', '∯', '∰', '∱', '∲', '∳', '⊀', '⊁', '⊂', '⊃', '⊄', '⊅', '⊆', '⊇', '⊈', '⊉', '⊊', '⊋', '⊌', '⊍', '⊎', '⊏', '⊐', '⊑', '⊒', '⊓', '⊔', '⊕', '⊖', '⊗', '⊘', '⊙', '⊚', '⊛', '⊜', '⊝', '⊞', '⊟', '⊠', '⊡', '⊢', '⊣', '⊤', '⊥', '⊦', '⊧', '⊨', '⊩', '⊪', '⊫', '⊬', '⊭', '⊮', '⊯', '⊰', '⊱', '⊲', '⊳', '⊴', '⊵', '⊶', '⊷', '⊸', '⊹', '⊺', '⊻', '⊼', '⊽', '⊾', '⊿', '⋀', '⋁', '⋂', '⋃'],
            
            // Geometric shapes
            geometric: ['◆', '◇', '◈', '◉', '◊', '○', '◌', '◍', '◎', '●', '◐', '◑', '◒', '◓', '◔', '◕', '◖', '◗', '◘', '◙', '◚', '◛', '◜', '◝', '◞', '◟', '◠', '◡', '◢', '◣', '◤', '◥', '◦', '◧', '◨', '◩', '◪', '◫', '◬', '◭', '◮', '◯', '▀', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▉', '▊', '▋', '▌', '▍', '▎', '▏', '▐', '░', '▒', '▓', '▔', '▕', '▖', '▗', '▘', '▙', '▚', '▛', '▜', '▝', '▞', '▟', '■', '□', '▢', '▣', '▤', '▥', '▦', '▧', '▨', '▩', '▪', '▫', '▬', '▭', '▮', '▯', '▰', '▱', '▲', '△', '▴', '▵', '▶', '▷', '▸', '▹', '►', '▻', '▼', '▽', '▾', '▿', '◀', '◁', '◂', '◃', '◄', '◅', '★', '☆', '☉', '☊', '☋', '☌', '☍', '☎', '☏', '☐', '☑', '☒', '☓', '☔', '☕', '☖', '☗', '☘', '☙', '☚', '☛', '☜', '☝', '☞', '☟', '☠', '☡', '☢', '☣', '☤', '☥', '☦', '☧', '☨', '☩', '☪', '☫', '☬', '☭', '☮', '☯', '☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'],
            
            // Runic alphabet
            runic: ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚻ', 'ᚾ', 'ᛁ', 'ᛂ', 'ᛃ', 'ᛄ', 'ᛅ', 'ᛆ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛋ', 'ᛌ', 'ᛍ', 'ᛎ', 'ᛏ', 'ᛐ', 'ᛑ', 'ᛒ', 'ᛓ', 'ᛔ', 'ᛕ', 'ᛖ', 'ᛗ', 'ᛘ', 'ᛙ', 'ᛚ', 'ᛛ', 'ᛜ', 'ᛝ', 'ᛞ', 'ᛟ', 'ᛠ', 'ᛡ', 'ᛢ', 'ᛣ', 'ᛤ', 'ᛥ', 'ᛦ', 'ᛧ', 'ᛨ', 'ᛩ', 'ᛪ'],
            
            // Hiragana selection
            hiragana: ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と', 'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ', 'ま', 'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ', 'ら', 'り', 'る', 'れ', 'ろ', 'わ', 'を', 'ん'],
            
            // Katakana selection
            katakana: ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト', 'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ', 'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', 'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン'],
            
            // Alchemical and astrological symbols
            alchemical: ['🜀', '🜁', '🜂', '🜃', '🜄', '🜅', '🜆', '🜇', '🜈', '🜉', '🜊', '🜋', '🜌', '🜍', '🜎', '🜏', '🜐', '🜑', '🜒', '🜓', '🜔', '🜕', '🜖', '🜗', '🜘', '🜙', '🜚', '🜛', '🜜', '🜝', '🜞', '🜟', '🜠', '🜡', '🜢', '🜣', '🜤', '🜥', '🜦', '🜧', '🜨', '🜩', '🜪', '🜫', '🜬', '🜭', '🜮', '🜯', '🜰', '🜱', '🜲', '🜳', '🜴', '🜵', '🜶', '🜷', '🜸', '🜹', '🜺', '🜻', '🜼', '🜽', '🜾', '🜿', '🝀', '🝁', '🝂', '🝃']
        };
        
        // Art styles configuration
        this.artStyles = {
            // Organic flowing style
            organic: {
                glyphCount: { min: 12, max: 20 },
                rotationRange: { min: -45, max: 90 },
                scaleRange: { min: 1.0, max: 2.0 },
                skewRange: { min: -25, max: 25 },
                blurRange: { min: 0, max: 3 },
                opacity: { min: 0.4, max: 0.7 },
                preferredScripts: ['latin', 'cyrillic', 'greek', 'hiragana', 'runic']
            },
            
            // Geometric angular style  
            geometric: {
                glyphCount: { min: 10, max: 18 },
                rotationRange: { min: -90, max: 160 },
                scaleRange: { min: 0.8, max: 1.6 },
                skewRange: { min: -25, max: 25 },
                blurRange: { min: 0, max: 6 },
                opacity: { min: 0.5, max: 0.8 },
                preferredScripts: ['symbols', 'geometric', 'cjk', 'katakana']
            },
            
            // Mystical ethereal style
            mystical: {
                glyphCount: { min: 10, max: 12 },
                rotationRange: { min: -180, max: 270 },
                scaleRange: { min: 0.2, max: 3.0 },
                skewRange: { min: -20, max: 40 },
                blurRange: { min: 1, max: 4 },
                opacity: { min: 0.2, max: 0.6 },
                preferredScripts: ['arabic', 'hebrew', 'symbols', 'alchemical', 'runic']
            },
            
            // Technical modern style
            technical: {
                glyphCount: { min: 8, max: 16 },
                rotationRange: { min: -55, max: 90 },
                scaleRange: { min: 0.2, max: 2.4 },
                skewRange: { min: -25, max: 25 },
                blurRange: { min: 0, max: 7 },
                opacity: { min: 0.5, max: 1.0 },
                preferredScripts: ['symbols', 'geometric', 'latin', 'katakana']
            }
        };
        
        // Color palettes for different rarities
        this.colorPalettes = {
            common: [
                '#6B7280', '#9CA3AF', '#D1D5DB', '#374151'
            ],
            uncommon: [
                '#10B981', '#059669', '#047857', '#065F46'
            ],
            rare: [
                '#3B82F6', '#2563EB', '#1D4ED8', '#75c3e7ff', '#f7ca4eff'
            ],
            mythic: [
                '#f5be0bff', '#D97706', '#B45309', '#92400E',
                '#EF4444', '#DC2626', '#B91C1C', '#991B1B'
            ]
        };
    }
    
    // Generate a deterministic seed from a string
    generateSeed(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    // Seeded random number generator
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    // Get random value from range using seeded random
    randomInRange(min, max, seed) {
        return min + (this.seededRandom(seed) * (max - min));
    }
    
    // Select art style based on card name and rarity
    selectArtStyle(cardName, rarity) {
        const seed = this.generateSeed(cardName + rarity);
        const styles = Object.keys(this.artStyles);
        
        // Influence style selection by rarity
        let styleWeights = {
            organic: 1,
            geometric: 1,
            mystical: rarity === 'mythic' ? 2 : (rarity === 'rare' ? 1.5 : 0.5),
            technical: rarity === 'common' ? 1.5 : 1
        };
        
        // Weighted random selection
        const totalWeight = Object.values(styleWeights).reduce((a, b) => a + b, 0);
        const random = this.seededRandom(seed) * totalWeight;
        
        let currentWeight = 0;
        for (const style in styleWeights) {
            currentWeight += styleWeights[style];
            if (random <= currentWeight) {
                return style;
            }
        }
        
        return 'organic'; // fallback
    }
    
    // Generate glyph art for a card
    generateArt(cardName, rarity) {
        const baseSeed = this.generateSeed(cardName + rarity);
        const artStyle = this.selectArtStyle(cardName, rarity);
        const style = this.artStyles[artStyle];
        const colors = this.colorPalettes[rarity] || this.colorPalettes.common;
        
        // Determine number of glyphs
        const glyphCount = Math.floor(this.randomInRange(
            style.glyphCount.min, 
            style.glyphCount.max + 1, 
            baseSeed
        ));
        
        // Generate glyphs
        const glyphs = [];
        for (let i = 0; i < glyphCount; i++) {
            const seed = baseSeed + i * 1000;
            
            // Select script
            const scriptIndex = Math.floor(this.randomInRange(0, style.preferredScripts.length, seed));
            const scriptName = style.preferredScripts[scriptIndex];
            let script = this.characterPools[scriptName];
            
            // Safety check for undefined script
            if (!script || script.length === 0) {
                console.warn(`Script '${scriptName}' not found, falling back to 'latin'`);
                script = this.characterPools['latin'];
            }
            
            // Select character
            const charIndex = Math.floor(this.randomInRange(0, script.length, seed + 100));
            const character = script[charIndex];
            
            // Generate transformations
            const rotation = this.randomInRange(style.rotationRange.min, style.rotationRange.max, seed + 200);
            const scale = this.randomInRange(style.scaleRange.min, style.scaleRange.max, seed + 300);
            const skewX = this.randomInRange(style.skewRange.min, style.skewRange.max, seed + 400);
            const skewY = this.randomInRange(style.skewRange.min, style.skewRange.max, seed + 500);
            const blur = this.randomInRange(style.blurRange.min, style.blurRange.max, seed + 600);
            const opacity = this.randomInRange(style.opacity.min, style.opacity.max, seed + 700);
            
            // Select color
            const colorIndex = Math.floor(this.randomInRange(0, colors.length, seed + 800));
            const color = colors[colorIndex];
            
            // Position (distributed across full area with bias toward center)
            const centerBias = this.randomInRange(0, 1, seed + 850);
            let x, y;
            
            if (centerBias < 0.3) {
                // Edge positions for variety
                x = this.randomInRange(5, 95, seed + 900);
                y = this.randomInRange(5, 95, seed + 1000);
            } else {
                // Center-biased positions
                const centerX = 30;
                const centerY = 30;
                const maxOffset = 35;
                x = centerX + this.randomInRange(-maxOffset, maxOffset, seed + 900);
                y = centerY + this.randomInRange(-maxOffset, maxOffset, seed + 1000);
                
                // Clamp to valid range
                x = Math.max(5, Math.min(95, x));
                y = Math.max(5, Math.min(95, y));
            }
            
            glyphs.push({
                character,
                x,
                y,
                rotation,
                scale,
                skewX,
                skewY,
                blur,
                opacity,
                color,
                zIndex: Math.floor(this.randomInRange(1, 20, seed + 1100))
            });
        }
        
        return {
            glyphs,
            style: artStyle,
            rarity
        };
    }
    
    // Render art to HTML
    renderArtHTML(artData) {
        const glyphElements = artData.glyphs.map(glyph => {
            const transform = `
                rotate(${glyph.rotation}deg) 
                scale(${glyph.scale}) 
                skew(${glyph.skewX}deg, ${glyph.skewY}deg)
            `;
            
            const filter = glyph.blur > 0 ? `blur(${glyph.blur}px)` : 'none';
            
            return `
                <div class="glyph-element" style="
                    position: absolute;
                    left: ${glyph.x}%;
                    top: ${glyph.y}%;
                    transform: ${transform};
                    filter: ${filter};
                    opacity: ${glyph.opacity};
                    color: ${glyph.color};
                    z-index: ${glyph.zIndex};
                    font-size: 1.2em;
                    font-weight: bold;
                    pointer-events: none;
                    user-select: none;
                    transform-origin: center;
                ">${glyph.character}</div>
            `;
        }).join('');
        
        return `
            <div class="glyph-art glyph-art-${artData.style}" style="
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
            ">
                ${glyphElements}
            </div>
        `;
    }
    
    // Rendered-art cache.
    //
    // This used to be a screenshot pipeline: queue each card, rasterize it with
    // html2canvas, cache the data URL. html2canvas was never actually loaded by
    // index.html, so createScreenshot() always bailed, the cache never held a single
    // entry, every card paid full generation cost on every render, and the queue kept
    // re-arming its timers for nothing.
    //
    // generateArt() is seeded on cardName + rarity (see hashCode/seededRandom), so the
    // markup for a given card is always identical -- which makes it trivially cacheable.
    // Cache the HTML string instead.
    artCache = new Map();
    maxArtCacheEntries = 400;

    getCardArtHTML(cardName, rarity) {
        const cacheKey = cardName + '_' + rarity;
        const cached = this.artCache.get(cacheKey);
        if (cached !== undefined) {
            // Refresh insertion order so the cache evicts least-recently-used.
            this.artCache.delete(cacheKey);
            this.artCache.set(cacheKey, cached);
            return cached;
        }

        const html = this.renderArtHTML(this.generateArt(cardName, rarity));
        this.artCache.set(cacheKey, html);
        this.manageCacheSize();
        return html;
    }

    manageCacheSize(maxEntries = this.maxArtCacheEntries) {
        while (this.artCache.size > maxEntries) {
            // Map iteration is insertion-ordered, so this drops the oldest entry.
            this.artCache.delete(this.artCache.keys().next().value);
        }
    }

    clearPerformanceCache() {
        this.artCache.clear();
    }

    getCacheStats() {
        return { artCache: this.artCache.size };
    }
}

// Create global instance
window.glyphArtGenerator = new GlyphArtGenerator();