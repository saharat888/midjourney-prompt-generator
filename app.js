document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const providerSelect = document.getElementById('provider-select');
    const modelSelect = document.getElementById('model-select');
    const keywordInput = document.getElementById('keyword-input');
    const promptTemplateSelect = document.getElementById('prompt-template-select');
    const systemPromptInput = document.getElementById('system-prompt-input');
    const promptCountInput = document.getElementById('prompt-count-input');
    const generateBtn = document.getElementById('generate-btn');
    const resultContainer = document.getElementById('result-container');

    // --- DATA & CONFIG ---
    // ⭐ MODIFIED: Updated the Anthropic model list here
    const models = {
        openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        anthropic: [
            'claude-opus-4-20250514',
            'claude-sonnet-4-20250514',
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022'
        ],
        google: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest']
    };

    const promptTemplates = {
        default: "You are a creative prompt engineer for Midjourney v7. Create unique, detailed, and creative prompts that will generate interesting images. Each prompt should be creative and different from others use these new parameters: - --style raw (for more photographic results) - --personalize (for personalized style) - --stylize [value] (0-1000, default 100) - --chaos [value] (0-100, adds variety) - --weird [value] (0-3000, adds unconventional elements) - --tile (for repeating patterns) - --ar [ratio] (aspect ratios) Create prompts that include: 1. Detailed subject description 2. Style and artistic direction 3. Lighting and mood 4. Technical photography terms 5. Appropriate v7 parameters Make each prompt unique and creative with rich visual details.",
        artistic: "You are an artistic prompt engineer specializing in fine art styles for Midjourney v7. artistic prompts that focus on: - Classical art movements (Renaissance, Baroque, Impressionism, etc.) - Contemporary art styles (Abstract, Surrealism, Pop Art, etc.) - Traditional media (Oil painting, Watercolor, Charcoal, etc.) - Artistic techniques and compositions - Color theory and lighting principles Parameters to use: - --style raw or --style artistic - --stylize 150-300 (for enhanced artistic interpretation) - --chaos 20-40 (for artistic variety) - --ar 3:4 or 4:5 (portrait ratios for artwork) Focus on creating museum-quality artistic concepts with rich visual storytelling.",
        photography: "You are a photography prompt engineer for Midjourney v7. professional photography prompts focusing on: - Professional photography techniques - Camera settings and lens specifications - Lighting setups (studio, natural, dramatic) - Composition rules and framing - Post-processing styles Technical parameters to include: - --style raw (for photorealistic results) - --ar 16:9, 3:2, or 4:3 (photography ratios) - --stylize 50-150 (for natural look) - Camera specifications (50mm, 85mm, wide-angle, etc.) - Lighting details (golden hour, studio lighting, etc.) Create prompts that would result in portfolio-quality photographs.",
        fantasy: "You are a fantasy world prompt engineer for Midjourney v7. Generate exactly 10 fantasy prompts featuring: - Mythical creatures and magical beings - Epic fantasy landscapes and realms - Medieval and magical architecture - Mystical lighting and atmospheric effects - Fantasy character design Creative parameters: - --chaos 30-60 (for fantastical variety) - --weird 500-1500 (for magical elements) - --stylize 200-400 (for enhanced fantasy style) - --ar 16:9 or 2:3 (cinematic or portrait) Focus on creating immersive fantasy worlds with rich lore and magical atmosphere.",
        whitebackground: "You are the Photography Tutorials Engineer for Midjourney v7. Professional photography tutorials focused on: - Professional photography techniques. Photos of objects isolated against smooth white backgrounds. Photos for transparent backgrounds. - Camera settings and lens specs. - Lighting settings (studio, natural, dramatic). - Composition and framing rules. - Post-processing styles.  - Camera specs (50mm, 85mm, wide angle, etc.). - Lighting details (golden hour, studio lighting, etc.). Create tutorials that will lead to portfolio-quality photos. Required technical parameters: - --raw style (for realistic results). - --ar 1:1, 3:2, or 4:3 (aspect ratio). - --50-150 style (for natural looking shots) Midjourney v7.",
        custom: ""
    };

    // --- FUNCTIONS ---
    function updateModels() {
        const selectedProvider = providerSelect.value;
        modelSelect.innerHTML = '';
        models[selectedProvider].forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });
    }

    function updateSystemPrompt() {
        const selectedTemplate = promptTemplateSelect.value;
        if (selectedTemplate === 'custom') {
            systemPromptInput.value = localStorage.getItem('customSystemPrompt') || "กรุณาใส่ System Prompt ของคุณที่นี่...";
            systemPromptInput.readOnly = false;
            systemPromptInput.focus();
        } else {
            systemPromptInput.value = promptTemplates[selectedTemplate];
            systemPromptInput.readOnly = true;
        }
    }

    function saveCustomPrompt() {
        if (promptTemplateSelect.value === 'custom') {
            localStorage.setItem('customSystemPrompt', systemPromptInput.value);
        }
    }
    
    async function handleGeneration() {
        const keyword = keywordInput.value.trim();
        if (!keyword) {
            alert('กรุณาใส่ Keyword ที่ต้องการ');
            return;
        }

        const systemPrompt = systemPromptInput.value.trim();
        if (!systemPrompt) {
            alert('System Prompt ว่างเปล่า กรุณาเลือกรูปแบบหรือกำหนดเอง');
            return;
        }

        generateBtn.disabled = true;
        resultContainer.innerHTML = '<p class="placeholder">กำลังสร้าง Prompt กรุณารอสักครู่...</p>';

        try {
            const provider = providerSelect.value;
            const model = modelSelect.value;
            const count = parseInt(promptCountInput.value, 10);

            const finalUserPrompt = `Based on the user's idea, generate ${count} distinct and creative variations for a Midjourney prompt.
            User's Idea: "${keyword}"
            Please format the output clearly. Each prompt must start on a new line and be prefixed with "1. ", "2. ", etc. Do not add any extra text or explanations before or after the list of prompts.`;
            
            const responseText = await callProxyApi(provider, model, systemPrompt, finalUserPrompt);
            displayResults(responseText);

        } catch (error) {
            resultContainer.innerHTML = `<p class="placeholder" style="color: #f44336;">เกิดข้อผิดพลาด: ${error.message}</p>`;
        } finally {
            generateBtn.disabled = false;
        }
    }
    
    async function callProxyApi(provider, model, systemPrompt, userKeyword) {
        const response = await fetch('/api/proxy-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider,
                model,
                systemPrompt,
                userKeyword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'An unknown error occurred.');
        }
        
        if (provider === 'openai') return data.choices[0].message.content.trim();
        if (provider === 'anthropic') return data.content[0].text.trim();
        if (provider === 'google') return data.candidates[0].content.parts[0].text.trim();
        
        return "ไม่สามารถดึงข้อมูลจาก Provider ที่เลือกได้";
    }
    
    function displayResults(responseText) {
        resultContainer.innerHTML = '';
        const prompts = responseText.split(/\n?\d+\.\s/).filter(p => p.trim() !== '');

        if (prompts.length === 0) {
            resultContainer.innerHTML = '<p class="placeholder">ไม่ได้รับผลลัพธ์ที่ถูกต้องจาก AI ลองใหม่อีกครั้ง</p>';
            return;
        }

        prompts.forEach(promptText => {
            const cleanedText = promptText.trim();
            const itemDiv = document.createElement('div');
            itemDiv.className = 'result-item';
            const textP = document.createElement('p');
            textP.textContent = cleanedText;
            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'คัดลอก';
            copyBtn.className = 'copy-btn-item';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(cleanedText)
                    .then(() => {
                        copyBtn.textContent = 'คัดลอกแล้ว!';
                        setTimeout(() => { copyBtn.textContent = 'คัดลอก'; }, 2000);
                    })
                    .catch(err => console.error('Copy failed', err));
            };
            itemDiv.appendChild(textP);
            itemDiv.appendChild(copyBtn);
            resultContainer.appendChild(itemDiv);
        });
    }

    // --- EVENT LISTENERS ---
    providerSelect.addEventListener('change', updateModels);
    generateBtn.addEventListener('click', handleGeneration);
    promptTemplateSelect.addEventListener('change', updateSystemPrompt);
    systemPromptInput.addEventListener('input', saveCustomPrompt);

    // --- INITIALIZATION ---
    updateModels();
    updateSystemPrompt();
});
