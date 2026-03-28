// api/index.js - Vercel Serverless Function
const https = require('https');

// API 配置
const API_KEY = process.env.API_KEY || '90d3b17b-8fef-4682-bf72-7d51b24a48f4';
const ENDPOINT_ID = process.env.ENDPOINT_ID || "ep-20260321225445-p7gjs";
const TRANSLATE_API_KEY = process.env.TRANSLATE_API_KEY || '4454c3d9-a5b7-4a9c-969e-c4f750a6f82a';
const TRANSLATE_MODEL_ID = process.env.TRANSLATE_MODEL_ID || "ep-20260327161112-jjmbv";

module.exports = async (req, res) => {
    // 启用 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const method = req.method;
    let url = req.url || '/';
    
    // 处理 /release/ 前缀
    if (url.startsWith('/release')) {
        url = url.replace('/release', '');
    }
    
    // API 路由处理
    if (method === 'POST' && url === '/api/ask') {
        await handleAsk(req, res);
    } else if (method === 'POST' && url === '/api/analyze-image') {
        await handleAnalyzeImage(req, res);
    } else if (method === 'POST' && url === '/api/translate') {
        await handleTranslate(req, res);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
};

// 处理 AI 问答
async function handleAsk(req, res) {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ error: '问题不能为空' });
        }

        const postData = JSON.stringify({
            model: ENDPOINT_ID,
            messages: [
                { role: "system", content: "你是专注于中国古代建筑文化的智能助手，只回答与中国古代建筑相关的问题，回答要专业、简洁、易懂。" },
                { role: "user", content: question }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        const result = await callVolcengineAPI(postData, API_KEY);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// 处理图片分析
async function handleAnalyzeImage(req, res) {
    try {
        const { images, question } = req.body;
        if (!images || images.length === 0) {
            return res.status(400).json({ error: '请提供图片' });
        }

        const messages = [{
            role: "system",
            content: "你是专注于中国古代建筑文化的智能助手，擅长分析和识别古代建筑。"
        }];

        const imageContent = images.map(img => ({
            type: "image_url",
            image_url: { url: img.data }
        }));
        imageContent.push({ type: "text", text: question || "请分析这张建筑图片" });

        messages.push({ role: "user", content: imageContent });

        const postData = JSON.stringify({
            model: ENDPOINT_ID,
            messages,
            temperature: 0.7,
            max_tokens: 2000
        });

        const result = await callVolcengineAPI(postData, API_KEY);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// 处理翻译
async function handleTranslate(req, res) {
    try {
        const { q, from, to } = req.body;
        if (!q) {
            return res.status(400).json({ error: '请提供要翻译的文本' });
        }

        const postData = JSON.stringify({
            model: TRANSLATE_MODEL_ID,
            input: [{
                content: q,
                options: {
                    source_language: from,
                    target_language: to
                }
            }]
        });

        const result = await callVolcengineAPI(postData, TRANSLATE_API_KEY, '/api/v3/responses');
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// 调用火山引擎 API
function callVolcengineAPI(postData, apiKey, endpoint = '/api/v3/chat/completions') {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            hostname: 'ark.cn-beijing.volces.com',
            path: endpoint,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        };

        const apiReq = https.request(options, (apiRes) => {
            let data = '';
            apiRes.on('data', chunk => data += chunk);
            apiRes.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (e) {
                    resolve({ error: '解析失败', message: e.message });
                }
            });
        });

        apiReq.on('error', e => {
            resolve({ error: '网络错误', message: e.message });
        });

        apiReq.write(postData);
        apiReq.end();
    });
}
