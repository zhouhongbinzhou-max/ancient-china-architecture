// cloud-function-web.js - Web 函数版本，监听端口
const https = require('https');
const fs = require('fs');
const path = require('path');
const http = require('http');

// API 配置
const API_KEY = process.env.API_KEY || '90d3b17b-8fef-4682-bf72-7d51b24a48f4';
const ENDPOINT_ID = process.env.ENDPOINT_ID || "ep-20260321225445-p7gjs";
const TRANSLATE_API_KEY = process.env.TRANSLATE_API_KEY || '4454c3d9-a5b7-4a9c-969e-c4f750a6f82a';
const TRANSLATE_MODEL_ID = process.env.TRANSLATE_MODEL_ID || "ep-20260327161112-jjmbv";

// 创建 HTTP 服务器
const server = http.createServer(handleRequest);

// 启动服务器
const PORT = process.env.PORT || 9000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 服务器已启动，监听端口 ${PORT}`);
});

// 处理请求
function handleRequest(req, res) {
    const method = req.method;
    let requestPath = req.url || '/';
    
    console.log('☁️ 请求:', method, requestPath);
    
    // 处理 /release/ 前缀
    if (requestPath.startsWith('/release')) {
        requestPath = requestPath.replace('/release', '');
        if (requestPath === '' || requestPath === '/') {
            requestPath = '/index.html';
        }
    }
    
    // 确保路径以 / 开头
    if (!requestPath.startsWith('/')) {
        requestPath = '/' + requestPath;
    }
    
    // 根路径重定向到 index.html
    if (requestPath === '/') {
        requestPath = '/index.html';
    }
    
    console.log('📂 文件路径:', requestPath);
    
    // API 路由处理
    if (method === 'POST' && requestPath === '/api/ask') {
        handleAPIRequest(req, res, handleAsk);
    } else if (method === 'POST' && requestPath === '/api/analyze-image') {
        handleAPIRequest(req, res, handleAnalyzeImage);
    } else if (method === 'POST' && requestPath === '/api/translate') {
        handleAPIRequest(req, res, handleTranslate);
    } else {
        // 静态文件处理
        handleStaticFile(requestPath, res);
    }
}

// 处理 API 请求
function handleAPIRequest(req, res, handler) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const parsedBody = JSON.parse(body);
            const result = await handler(parsedBody);
            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(result));
        } catch (error) {
            res.writeHead(400, {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ error: '请求格式错误' }));
        }
    });
}

// 处理 AI 问答
async function handleAsk(body) {
    const { question } = body;
    if (!question) {
        return { error: '问题不能为空' };
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

    return await callVolcengineAPI(postData, API_KEY);
}

// 处理图片分析
async function handleAnalyzeImage(body) {
    const { images, question } = body;
    if (!images || images.length === 0) {
        return { error: '请提供图片' };
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

    return await callVolcengineAPI(postData, API_KEY);
}

// 处理翻译
async function handleTranslate(body) {
    const { q, from, to } = body;
    if (!q) {
        return { error: '请提供要翻译的文本' };
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

    return await callVolcengineAPI(postData, TRANSLATE_API_KEY, '/api/v3/responses');
}

// 调用火山引擎 API
async function callVolcengineAPI(postData, apiKey, endpoint = '/api/v3/chat/completions') {
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

// 处理静态文件
function handleStaticFile(filePath, res) {
    console.log('📄 读取文件:', filePath);
    
    const fullPath = path.join(__dirname, filePath);
    console.log('📍 完整路径:', fullPath);
    
    try {
        // 检查文件是否存在
        if (!fs.existsSync(fullPath)) {
            console.log('❌ 文件不存在:', fullPath);
            res.writeHead(404, { 
                'Content-Type': 'text/html; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            });
            res.end('<h1>404 - File not found</h1><p>文件不存在：' + filePath + '</p>');
            return;
        }
        
        const content = fs.readFileSync(fullPath);
        const contentType = getContentType(filePath);
        
        console.log('✅ 文件读取成功:', filePath, 'Content-Type:', contentType);
        
        res.writeHead(200, { 
            'Content-Type': contentType + '; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(content);
    } catch (e) {
        console.error('❌ 读取文件失败:', e.message);
        res.writeHead(500, { 
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        });
        res.end('<h1>500 - Internal Server Error</h1><p>' + e.message + '</p>');
    }
}

// 辅助函数：获取 Content-Type
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
