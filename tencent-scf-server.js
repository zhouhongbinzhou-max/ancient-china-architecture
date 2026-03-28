// tencent-scf-server.js - 腾讯云云函数专用服务器文件
const express = require('express');
const https = require('https');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 静态文件服务
app.use(express.static(__dirname));
app.use('/创作素材', express.static(path.join(__dirname, '创作素材')));

// 从环境变量获取 API 配置（腾讯云会自动注入）
const API_KEY = process.env.API_KEY || '90d3b17b-8fef-4682-bf72-7d51b24a48f4';
const ENDPOINT_ID = process.env.ENDPOINT_ID || "ep-20260321225445-p7gjs";
const TRANSLATE_API_KEY = process.env.TRANSLATE_API_KEY || '4454c3d9-a5b7-4a9c-969e-c4f750a6f82a';
const TRANSLATE_MODEL_ID = process.env.TRANSLATE_MODEL_ID || "ep-20260327161112-jjmbv";

// ==================== API 路由 ====================

// AI 问答 API
app.post('/api/ask', (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: '问题不能为空' });

    console.log('📝 收到问题:', question.substring(0, 50) + '...');

    const postData = JSON.stringify({
        model: ENDPOINT_ID,
        messages: [
            { role: "system", content: "你是专注于中国古代建筑文化的智能助手，只回答与中国古代建筑相关的问题，回答要专业、简洁、易懂。" },
            { role: "user", content: question }
        ],
        temperature: 0.7,
        max_tokens: 2000
    });

    const options = {
        method: 'POST',
        hostname: 'ark.cn-beijing.volces.com',
        path: '/api/v3/chat/completions',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        }
    };

    const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => data += chunk);
        apiRes.on('end', () => {
            try {
                const result = JSON.parse(data);
                console.log('📥 API 响应状态:', apiRes.statusCode);
                
                if (result.choices && result.choices.length > 0) {
                    const answer = result.choices[0].message.content;
                    console.log('✅ AI 回答成功:', answer.substring(0, 50) + '...');
                    res.json({ answer: answer });
                } else if (result.error) {
                    console.error('❌ API 调用失败:', result.error);
                    res.status(500).json({ error: 'API 调用失败', ...result.error });
                } else {
                    res.status(500).json({ error: 'API 返回格式异常', details: result });
                }
            } catch (e) {
                console.error('❌ 解析失败:', e);
                res.status(500).json({ error: '解析失败', message: e.message });
            }
        });
    });

    apiReq.on('error', (e) => {
        console.error('❌ 网络错误:', e);
        res.status(500).json({ error: '网络错误', message: e.message });
    });

    apiReq.write(postData);
    apiReq.end();
});

// 图片分析 API
app.post('/api/analyze-image', (req, res) => {
    const { images, question } = req.body;
    
    if (!images || images.length === 0) {
        return res.status(400).json({ error: '请提供图片' });
    }

    console.log('📸 收到图片分析请求，图片数量:', images.length);

    const messages = [
        { 
            role: "system", 
            content: "你是专注于中国古代建筑文化的智能助手，擅长分析和识别古代建筑。请详细分析用户提供的建筑图片，包括建筑类型、年代、风格、特征、文化内涵等。" 
        }
    ];

    // 添加图片内容
    const imageContent = images.map(img => ({
        type: "image_url",
        image_url: { url: img.data }
    }));

    // 添加问题文本
    imageContent.push({ type: "text", text: question || "请分析这张建筑图片" });

    messages.push({
        role: "user",
        content: imageContent
    });

    const postData = JSON.stringify({
        model: ENDPOINT_ID,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
    });

    const options = {
        method: 'POST',
        hostname: 'ark.cn-beijing.volces.com',
        path: '/api/v3/chat/completions',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        }
    };

    const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => data += chunk);
        apiRes.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.choices && result.choices.length > 0) {
                    const answer = result.choices[0].message.content;
                    console.log('✅ 图片分析成功');
                    res.json({ success: true, response: answer });
                } else if (result.error) {
                    console.error('❌ API 调用失败:', result.error);
                    res.status(500).json({ error: 'API 调用失败', ...result.error });
                }
            } catch (e) {
                console.error('❌ 解析失败:', e);
                res.status(500).json({ error: '解析失败' });
            }
        });
    });

    apiReq.on('error', (e) => {
        console.error('❌ 网络错误:', e);
        res.status(500).json({ error: '网络错误' });
    });

    apiReq.write(postData);
    apiReq.end();
});

// 翻译 API
app.post('/api/translate', (req, res) => {
    const { q, from, to } = req.body;
    
    if (!q) {
        return res.status(400).json({ error: '请提供要翻译的文本' });
    }

    console.log('🌐 翻译请求:', { text: q.substring(0, 50), from, to });

    const postData = JSON.stringify({
        model: TRANSLATE_MODEL_ID,
        input: [
            {
                content: q,
                options: {
                    source_language: from,
                    target_language: to
                }
            }
        ]
    });

    const options = {
        method: 'POST',
        hostname: 'ark.cn-beijing.volces.com',
        path: '/api/v3/responses',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TRANSLATE_API_KEY}`
        }
    };

    const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => data += chunk);
        apiRes.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.data && result.data[0] && result.data[0].choices) {
                    const translation = result.data[0].choices[0].message.content;
                    console.log('✅ 翻译成功');
                    res.json({ success: true, translation: translation });
                } else if (result.error) {
                    console.error('❌ API 调用失败:', result.error);
                    res.status(500).json({ error: 'API 调用失败', ...result.error });
                }
            } catch (e) {
                console.error('❌ 解析失败:', e);
                res.status(500).json({ error: '解析失败' });
            }
        });
    });

    apiReq.on('error', (e) => {
        console.error('❌ 网络错误:', e);
        res.status(500).json({ error: '网络错误' });
    });

    apiReq.write(postData);
    apiReq.end();
});

// ==================== 云函数入口 ====================

// 腾讯云云函数入口函数
exports.main_handler = async (event, context) => {
    console.log('☁️ 云函数被调用:', event.path);
    
    return new Promise((resolve, reject) => {
        const method = event.httpMethod || 'GET';
        const requestPath = event.path || '/';
        const headers = event.headers || {};
        let body = {};
        
        try {
            if (event.body && typeof event.body === 'string') {
                body = JSON.parse(event.body);
            } else if (event.body) {
                body = event.body;
            }
        } catch (e) {
            console.error('解析 body 失败:', e);
        }

        // 创建 mock 的 response 对象
        const mockRes = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: '',
            setHeader: function(key, value) {
                this.headers[key] = value;
            },
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.body = JSON.stringify(data);
                resolve({
                    statusCode: this.statusCode,
                    headers: this.headers,
                    body: this.body,
                    isBase64Encoded: false
                });
            },
            send: function(data) {
                this.body = data;
                resolve({
                    statusCode: this.statusCode,
                    headers: this.headers,
                    body: this.body,
                    isBase64Encoded: false
                });
            }
        };

        // 创建 mock 的 request 对象
        const mockReq = {
            method,
            url: requestPath,
            headers,
            body,
            query: event.queryStringParameters || {}
        };

        // 路由处理
        if (method === 'POST' && requestPath === '/api/ask') {
            handleAsk(mockReq, mockRes);
        } else if (method === 'POST' && requestPath === '/api/analyze-image') {
            handleAnalyzeImage(mockReq, mockRes);
        } else if (method === 'POST' && requestPath === '/api/translate') {
            handleTranslate(mockReq, mockRes);
        } else {
            // 静态文件处理
            handleStaticFile(requestPath, resolve);
        }
    });
};

// 辅助处理函数
function handleAsk(req, res) {
    const { question } = req.body;
    if (!question) {
        res.status(400).json({ error: '问题不能为空' });
        return;
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

    const options = {
        method: 'POST',
        hostname: 'ark.cn-beijing.volces.com',
        path: '/api/v3/chat/completions',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        }
    };

    const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.choices && result.choices.length > 0) {
                    res.json({ answer: result.choices[0].message.content });
                } else {
                    res.status(500).json({ error: 'API 调用失败', ...result.error });
                }
            } catch (e) {
                res.status(500).json({ error: '解析失败' });
            }
        });
    });

    apiReq.on('error', e => res.status(500).json({ error: '网络错误' }));
    apiReq.write(postData);
    apiReq.end();
}

function handleAnalyzeImage(req, res) {
    const { images, question } = req.body;
    if (!images || images.length === 0) {
        res.status(400).json({ error: '请提供图片' });
        return;
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

    const options = {
        method: 'POST',
        hostname: 'ark.cn-beijing.volces.com',
        path: '/api/v3/chat/completions',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        }
    };

    const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.choices && result.choices.length > 0) {
                    res.json({ success: true, response: result.choices[0].message.content });
                } else {
                    res.status(500).json({ error: 'API 调用失败' });
                }
            } catch (e) {
                res.status(500).json({ error: '解析失败' });
            }
        });
    });

    apiReq.on('error', e => res.status(500).json({ error: '网络错误' }));
    apiReq.write(postData);
    apiReq.end();
}

function handleTranslate(req, res) {
    const { q, from, to } = req.body;
    if (!q) {
        res.status(400).json({ error: '请提供要翻译的文本' });
        return;
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

    const options = {
        method: 'POST',
        hostname: 'ark.cn-beijing.volces.com',
        path: '/api/v3/responses',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TRANSLATE_API_KEY}`
        }
    };

    const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.data && result.data[0] && result.data[0].choices) {
                    res.json({ success: true, translation: result.data[0].choices[0].message.content });
                } else {
                    res.status(500).json({ error: 'API 调用失败' });
                }
            } catch (e) {
                res.status(500).json({ error: '解析失败' });
            }
        });
    });

    apiReq.on('error', e => res.status(500).json({ error: '网络错误' }));
    apiReq.write(postData);
    apiReq.end();
}

function handleStaticFile(filePath, resolve) {
    if (filePath === '/') filePath = '/index.html';
    
    const fullPath = path.join(__dirname, filePath);
    
    fs.readFile(fullPath, 'utf8', (err, content) => {
        if (err) {
            resolve({
                statusCode: 404,
                headers: { 'Content-Type': 'text/plain' },
                body: 'File not found',
                isBase64Encoded: false
            });
        } else {
            const contentType = getContentType(filePath);
            resolve({
                statusCode: 200,
                headers: { 
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*'
                },
                body: content,
                isBase64Encoded: false
            });
        }
    });
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const types = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon'
    };
    return types[ext] || 'text/plain';
}

// 本地测试用：如果直接运行此文件，启动 Express 服务器
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`🚀 本地测试服务器运行在 http://localhost:${PORT}`);
        console.log(`📌 AI 问答接入点：${ENDPOINT_ID}`);
        console.log(`📌 翻译接入点：${TRANSLATE_MODEL_ID}`);
    });
}
