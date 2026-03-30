// app.js - Web 函数入口文件
const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// API 配置
const API_KEY = process.env.API_KEY || '90d3b17b-8fef-4682-bf72-7d51b24a48f4';
const ENDPOINT_ID = process.env.ENDPOINT_ID || "ep-20260321225445-p7gjs";
const TRANSLATE_API_KEY = process.env.TRANSLATE_API_KEY || '4454c3d9-a5b7-4a9c-969e-c4f750a6f82a';
const TRANSLATE_MODEL_ID = process.env.TRANSLATE_MODEL_ID || "ep-20260327161112-jjmbv";

// 中间件 - 增大请求体限制到 10MB（支持图片上传）
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 处理 URL 路径映射（在静态文件服务之前）
app.use((req, res, next) => {
    let url = req.url;
    
    // 处理 /release/ 前缀（兼容本地开发）
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

// 静态文件服务 - 优先处理，确保所有静态资源正确托管
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif') || path.endsWith('.svg') || path.endsWith('.ico')) {
            // 图片类型自动检测，但确保缓存
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
    }
}));

// 子页面路由支持 - 自动映射 /xxx 到 /xxx.html
const htmlPages = [
    'translator', 'test-ai', 'about', 'contact', 'join', 'privacy', 'terms',
    'sitemap', 'travel-guide', 'international-exchange', 'cultural-cities',
    'famous-buildings', 'architecture-style', 
    'architecture-technique', 'architecture-culture', 'forum'
];

htmlPages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, `${page}.html`));
    });
});

// 兜底路由 - 处理所有未匹配的 GET 请求
app.get('*', (req, res, next) => {
    const url = req.url;
    
    // 如果是 API 请求，跳过
    if (url.startsWith('/api/')) {
        return next();
    }
    
    // 尝试访问对应的 HTML 文件
    const htmlFile = path.join(__dirname, `${url.replace(/^\//, '')}.html`);
    const fs = require('fs');
    
    if (fs.existsSync(htmlFile)) {
        res.sendFile(htmlFile);
    } else {
        // 如果文件不存在，返回 404 状态码但继续让静态文件中间件处理
        res.status(404);
        next();
    }
});

// API 路由：AI 问答
app.post('/api/ask', async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ error: '问题不能为空' });
        }

        console.log('📝 收到 AI 问答请求:', question.substring(0, 50));
        console.log('🔑 使用 API Key:', API_KEY.substring(0, 8) + '...');
        console.log('🎯 使用接入点:', ENDPOINT_ID);

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
        
        console.log('📦 API 响应:', JSON.stringify(result).substring(0, 200));
        
        // 检查是否有错误
        if (result.error) {
            console.error('❌ AI API 错误:', result.error);
            return res.status(500).json({ 
                error: 'AI 服务不可用',
                message: result.error.message || '未知错误',
                code: result.error.code
            });
        }
        
        // 提取 AI 回复内容并添加 success 字段
        const response = {
            success: true,
            response: result.choices?.[0]?.message?.content || 'AI 没有返回内容',
            raw: result
        };
        res.json(response);
    } catch (error) {
        console.error('❌ AI 问答错误:', error);
        res.status(500).json({ 
            error: 'AI 服务错误',
            message: error.message 
        });
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
        // 提取 AI 回复内容并添加 success 字段
        const response = {
            success: true,
            response: result.choices?.[0]?.message?.content || 'AI 没有返回内容',
            raw: result
        };
        res.json(response);
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

        console.log('📝 收到翻译请求:', q.substring(0, 50));
        console.log('🔑 使用 API Key:', API_KEY.substring(0, 8) + '...');
        console.log('🎯 使用接入点:', ENDPOINT_ID);

        // 使用与 AI 问答相同的模型，通过系统提示词指定翻译任务
        const messages = [
            {
                role: "system",
                content: `你是一个专业的翻译助手。请将以下文本从 ${from} 翻译成 ${to}。只输出翻译结果，不要输出任何其他内容。`
            },
            {
                role: "user",
                content: q
            }
        ];

        const postData = JSON.stringify({
            model: ENDPOINT_ID,  // 使用与问答相同的模型
            messages: messages,
            temperature: 0.1,
            max_tokens: 1000
        });

        const result = await callVolcengineAPI(postData, API_KEY, '/api/v3/chat/completions');
        
        console.log('📦 翻译 API 响应:', JSON.stringify(result).substring(0, 200));
        
        // 检查是否有错误
        if (result.error) {
            console.error('❌ 翻译 API 错误:', result.error);
            return res.status(500).json({ 
                error: '翻译服务不可用',
                message: result.error.message || '未知错误',
                code: result.error.code
            });
        }
        
        // 提取翻译结果 - Chat API 格式
        let translatedText = null;
        if (result.choices && result.choices[0] && result.choices[0].message) {
            translatedText = result.choices[0].message.content;
        }
        
        if (!translatedText) {
            console.warn('⚠️ 翻译成功但无结果');
        }
        
        // 处理多个释义的情况，只保留第一个
        if (translatedText) {
            // 处理分号分隔的多个释义
            if (translatedText.includes(';')) {
                translatedText = translatedText.split(';')[0].trim();
            }
            // 处理顿号分隔的多个释义
            if (translatedText.includes('、')) {
                translatedText = translatedText.split('、')[0].trim();
            }
        }
        
        console.log('✅ 最终翻译结果:', translatedText);
        
        // 返回兼容格式
        res.json({
            translatedText: translatedText || q,
            result: translatedText || q,
            success: true
        });
    } catch (error) {
        console.error('❌ 翻译错误:', error);
        res.status(500).json({ 
            error: '翻译服务错误',
            message: error.message 
        });
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
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 服务器已启动，监听端口 ${port}`);
    console.log(` 访问地址：http://localhost:${port}`);
});
