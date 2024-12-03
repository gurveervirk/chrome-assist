export const defaultSettings = {
    prompt: {
        available: { temperature: [0, 1], topK: [1, 8] },
        temperature: 0.3,
        topK: 5,
    },
    summarize: {
        available: {
            type: ["tl;dr", "key-points", "teaser", "headline"],
            format: ["plain-text", "markdown"],
            length: ["short", "medium", "long"],
        },
        type: "tl;dr",
        format: "plain-text",
        length: "medium",
    },
    rewrite: {
        available: {
            tone: ["as-is", "more-formal", "more-casual"],
            format: ["as-is", "plain-text", "markdown"],
            length: ["as-is", "shorter", "longer"],
        },
        tone: "as-is",
        length: "as-is",
        format: "as-is",
        context: "I am.",
    },
    write: {
        available: {
            tone: ["formal", "neutral", "casual"],
            format: ["plain-text", "markdown"],
            length: ["short", "medium", "long"],
        },
        tone: "formal",
        length: "medium",
        format: "plain-text",
        context: "I am.",
    },
    detect: {
        languageMapping: {
            af: "Afrikaans",
            am: "Amharic",
            ar: "Arabic",
            "ar-Latn": "Arabic (Latin)",
            az: "Azerbaijani",
            be: "Belarusian",
            bg: "Bulgarian",
            "bg-Latn": "Bulgarian (Latin)",
            bn: "Bengali",
            bs: "Bosnian",
            ca: "Catalan",
            ceb: "Cebuano",
            co: "Corsican",
            cs: "Czech",
            cy: "Welsh",
            da: "Danish",
            de: "German",
            el: "Greek",
            "el-Latn": "Greek (Latin)",
            en: "English",
            eo: "Esperanto",
            es: "Spanish",
            et: "Estonian",
            eu: "Basque",
            fa: "Persian",
            fi: "Finnish",
            fil: "Filipino",
            fr: "French",
            fy: "Frisian",
            ga: "Irish",
            gd: "Scottish Gaelic",
            gl: "Galician",
            gu: "Gujarati",
            ha: "Hausa",
            haw: "Hawaiian",
            hi: "Hindi",
            "hi-Latn": "Hindi (Latin)",
            hmn: "Hmong",
            hr: "Croatian",
            ht: "Haitian Creole",
            hu: "Hungarian",
            hy: "Armenian",
            id: "Indonesian",
            ig: "Igbo",
            is: "Icelandic",
            it: "Italian",
            iw: "Hebrew",
            ja: "Japanese",
            "ja-Latn": "Japanese (Latin)",
            jv: "Javanese",
            ka: "Georgian",
            kk: "Kazakh",
            km: "Khmer",
            kn: "Kannada",
            ko: "Korean",
            ku: "Kurdish",
            ky: "Kyrgyz",
            la: "Latin",
            lb: "Luxembourgish",
            lo: "Lao",
            lt: "Lithuanian",
            lv: "Latvian",
            mg: "Malagasy",
            mi: "Maori",
            mk: "Macedonian",
            ml: "Malayalam",
            mn: "Mongolian",
            mr: "Marathi",
            ms: "Malay",
            mt: "Maltese",
            my: "Burmese",
            ne: "Nepali",
            nl: "Dutch",
            no: "Norwegian",
            ny: "Chichewa",
            pa: "Punjabi",
            pl: "Polish",
            ps: "Pashto",
            pt: "Portuguese",
            ro: "Romanian",
            ru: "Russian",
            "ru-Latn": "Russian (Latin)",
            sd: "Sindhi",
            si: "Sinhala",
            sk: "Slovak",
            sl: "Slovenian",
            sm: "Samoan",
            sn: "Shona",
            so: "Somali",
            sq: "Albanian",
            sr: "Serbian",
            st: "Sesotho",
            su: "Sundanese",
            sv: "Swedish",
            sw: "Swahili",
            ta: "Tamil",
            te: "Telugu",
            tg: "Tajik",
            th: "Thai",
            tr: "Turkish",
            uk: "Ukrainian",
            ur: "Urdu",
            uz: "Uzbek",
            vi: "Vietnamese",
            xh: "Xhosa",
            yi: "Yiddish",
            yo: "Yoruba",
            zh: "Chinese",
            "zh-Latn": "Chinese (Latin)",
            zu: "Zulu",
        },
    },
    translate: {
        languageMapping: {
            en: "English",
            es: "Spanish",
            fr: "French",
            de: "German",
            ar: "Arabic",
            bn: "Bengali",
            hi: "Hindi",
            it: "Italian",
            ja: "Japanese",
            ko: "Korean",
            nl: "Dutch",
            pl: "Polish",
            pt: "Portuguese",
            ru: "Russian",
            th: "Thai",
            tr: "Turkish",
            vi: "Vietnamese",
            zh: "Chinese (Simplified)",
            "zh-Hant": "Chinese (Traditional)",
        },
    },
    bookmark: {
        available: {
            type: ["tl;dr", "key-points", "teaser", "headline"],
            format: ["plain-text", "markdown"],
            length: ["short", "medium", "long"],
            numKeywords: [1, 50],
        },
        type: "tl;dr",
        format: "plain-text",
        length: "long",
        titlePrompt:"Generate a clear, concise title capturing the text's core theme, tone, and purpose, appealing to the intended audience. Return only the title." ,
        keywordsPrompt: "Identify numKeywords relevant keywords that capture the text's main topics, themes, and concepts, enhancing discoverability and search relevance. Return only the keywords as an unordered list in HTML.",
        numKeywords: 25,
    },
    search: {
      available: {
        numQueries: [1, 10],
      },
      prompt: "You are an advanced AI model designed to generate enhanced web search queries from user input.\nYour task is to understand the user's input prompt and craft numQueries sleek, concise web search queries to help the user find better results.\n\nKey Guidelines:\n- Focus only on relevant keywords that contribute directly to finding useful results.\n- Omit unnecessary or 'extra' words that add no value to the search process.\n- These queries should be phrases, not full sentences or questions.\n- Ensure the queries are highly specific, well-targeted, and optimized for web search engines.\nReturn the final numQueries web search queries as an unordered list.",
      numQueries: 5,
    }
};