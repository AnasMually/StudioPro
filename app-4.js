// --- AI LOCALIZATION PROMPT ---
document.getElementById('copyAiPromptBtn').onclick = () => {
    const promptText = `
Act as an expert mobile app localizer. Translate the text below into the following 30 languages.

Target Languages (ISO 639-1 codes):
1. English (en) - Global
2. Japanese (ja) - High Spend
3. Korean (ko) - High Spend
4. German (de) - DACH Region
5. French (fr) - High Spend
6. Chinese Simplified (zh-CN) - China/Singapore
7. Chinese Traditional (zh-TW) - Taiwan/HK (Very High Spend)
8. Spanish (es) - Global Volume
9. Italian (it) - High Spend
10. Dutch (nl) - High Spend
11. Swedish (sv) - Nordic High CPM
12. Norwegian (no) - Nordic High CPM
13. Danish (da) - Nordic High CPM
14. Finnish (fi) - Nordic High CPM
15. Polish (pl) - Central Europe Leader
16. Czech (cs) - Central Europe High Spend
17. Slovak (sk) - Central Europe High Spend
18. Romanian (ro) - Emerging Tech Market
19. Hungarian (hu) - Isolated Language Market
20. Ukrainian (uk) - High Loyalty/Growth
21. Portuguese (pt) - Brazil (Huge Volume)
22. Russian (ru) - High Volume
23. Turkish (tr) - High Volume
24. Arabic (ar) - MENA High Spend
25. Hebrew (he) - High Spend Tech Market
26. Indonesian (id) - Massive User Base
27. Malay (ms) - SE Asia High Spend
28. Vietnamese (vi) - High Android Growth
29. Thai (th) - SE Asia High Engagement
30. Hindi (hi) - Massive Volume (India)

Output Requirement:
Provide the result strictly as a valid JSON object. Do not include markdown formatting or explanations.
IMPORTANT: Preserve line breaks (\\n) in the translated text exactly as they appear in the source.

Format: {"en": "Line 1\\nLine 2", "zh-TW": "Line 1\\nLine 2", ...}

Text to translate:
"${document.getElementById('textContent').value}"
`;

    window.prompt('انسخ برومبت الترجمة:', promptText);
};
