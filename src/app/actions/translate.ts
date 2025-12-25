"use server";

export async function translateText(text: string, targetLang: string) {
    if (!text) return { success: false, error: "No text provided" };
    if (!targetLang) return { success: false, error: "No target language" };

    try {
        // 1. Try DeepL
        const deeplRes = await translateWithDeepL(text, targetLang);
        if (deeplRes.success) {
            return { success: true, text: deeplRes.text, service: "DeepL" };
        }

        // 2. If DeepL failed with Quota Exceeded (456), Fallback to Google
        if (deeplRes.error === "QUOTA_EXCEEDED") {
            const googleRes = await translateWithGoogle(text, targetLang);
            if (googleRes.success) {
                return { success: true, text: googleRes.text, service: "Google Cloud (Fallback)" };
            }
            return { success: false, error: "Translation failed on both services. " + googleRes.error };
        }

        // Other DeepL error
        return { success: false, error: "DeepL Error: " + deeplRes.error };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function translateWithDeepL(text: string, targetLang: string) {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) return { success: false, error: "Missing DeepL API Key" };

    const url = apiKey.endsWith(":fx") 
        ? "https://api-free.deepl.com/v2/translate" 
        : "https://api.deepl.com/v2/translate";

    const params = new URLSearchParams();
    params.append("auth_key", apiKey);
    params.append("text", text);
    params.append("target_lang", targetLang.toUpperCase());

    try {
        const res = await fetch(url, {
            method: "POST",
            body: params,
        });

        if (res.status === 456) {
            return { success: false, error: "QUOTA_EXCEEDED" };
        }

        if (!res.ok) {
            const err = await res.text();
            return { success: false, error: `DeepL API Error ${res.status}: ${err}` };
        }

        const data = await res.json();
        return { success: true, text: data.translations[0].text };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

async function translateWithGoogle(text: string, targetLang: string) {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) return { success: false, error: "Missing Google API Key" };

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                q: text,
                target: targetLang
            })
        });

        if (!res.ok) {
            const err = await res.text();
            return { success: false, error: `Google API Error ${res.status}: ${err}` };
        }

        const data = await res.json();
        return { success: true, text: data.data.translations[0].translatedText };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
