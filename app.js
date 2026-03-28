// app.js - Web 函数入口文件
const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = 9000;

// API 配置
const API_KEY = process.env.API_KEY || '90d3b17b-8fef-4682-bf72-7d51b24a48f4';
const ENDPOINT_ID = process.env.ENDPOINT_ID || "ep-20260321225445-p7gjs";
const TRANSLATE_API_KEY = process.env.TRANSLATE_API_KEY || '4454c3d9-a5b7-4a9c-969e-c4f750a6f82a';
const TRANSLATE_MODEL_ID = process.env.TRANSLATE_MODEL_ID || "ep-20260327161112-jjmbv";

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（自动处理 /release/ 前缀）
app.use((req, res, next) => {
    let url = req.url;
    
    // 处理 /release/ 前缀
    if (url.startsWith('/release')) {
        url = url.replace('/release', '');
        if (url === '' || url === '/') {
            url = '/index.html';
        }
        req.url = url;
    }
    
    // 根路径重定向到 index.html
    if (url === '/') {
        req.url = '/index.html';
    }
    
    next();
});

// 静态文件服务
app.use(express.static(__dirname));

// API 路由：AI 问答
app.post('/api/ask', async (req, res) => {
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
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API 路由：图片分析
app.post('/api/analyze-image', async (req, res) => {
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
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API 路由：翻译
app.post('/api/translate', async (req, res) => {
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
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 服务器已启动，监听端口 ${PORT}`);
});
