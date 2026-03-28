// cloud-function.js - 腾讯云函数简化版入口文件
const https = require('https');
const fs = require('fs');
const path = require('path');

// API 配置
const API_KEY = process.env.API_KEY || '90d3b17b-8fef-4682-bf72-7d51b24a48f4';
const ENDPOINT_ID = process.env.ENDPOINT_ID || "ep-20260321225445-p7gjs";
const TRANSLATE_API_KEY = process.env.TRANSLATE_API_KEY || '4454c3d9-a5b7-4a9c-969e-c4f750a6f82a';
const TRANSLATE_MODEL_ID = process.env.TRANSLATE_MODEL_ID || "ep-20260327161112-jjmbv";

// 云函数入口
exports.main_handler = async (event, context) => {
    console.log('☁️ 云函数调用:', event.path);
    
    const method = event.httpMethod || 'GET';
    const requestPath = event.path || '/';
    
    try {
        // API 路由处理
        if (method === 'POST' && requestPath === '/api/ask') {
            return await handleAsk(event.body);
        } else if (method === 'POST' && requestPath === '/api/analyze-image') {
            return await handleAnalyzeImage(event.body);
        } else if (method === 'POST' && requestPath === '/api/translate') {
            return await handleTranslate(event.body);
        } else {
            // 静态文件处理
            return await handleStaticFile(requestPath);
        }
    } catch (error) {
        console.error('❌ 错误:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: '服务器错误',
                message: error.message
            })
        };
    }
};

// 处理 AI 问答
async function handleAsk(body) {
    const { question } = body;
    if (!question) {
        return jsonResponse(400, { error: '问题不能为空' });
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
        return jsonResponse(400, { error: '请提供图片' });
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
        return jsonResponse(400, { error: '请提供要翻译的文本' });
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
                    if (result.choices?.[0]?.message?.content) {
                        resolve(jsonResponse(200, { answer: result.choices[0].message.content }));
                    } else if (result.data?.[0]?.choices?.[0]?.message?.content) {
                        resolve(jsonResponse(200, { translation: result.data[0].choices[0].message.content }));
                    } else if (result.error) {
                        resolve(jsonResponse(500, { error: 'API 调用失败', ...result.error }));
                    } else {
                        resolve(jsonResponse(500, { error: 'API 返回格式异常', details: result }));
                    }
                } catch (e) {
                    resolve(jsonResponse(500, { error: '解析失败', message: e.message }));
                }
            });
        });

        apiReq.on('error', e => {
            resolve(jsonResponse(500, { error: '网络错误', message: e.message }));
        });

        apiReq.write(postData);
        apiReq.end();
    });
}

// 处理静态文件
async function handleStaticFile(filePath) {
    if (filePath === '/') filePath = '/index.html';
    
    // 移除 /release/ 前缀（如果有）
    if (filePath.startsWith('/release')) {
        filePath = filePath.replace('/release', '');
    }
    
    const fullPath = path.join(__dirname, filePath);
    
    try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const contentType = getContentType(filePath);
        
        return {
            statusCode: 200,
            headers: { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            },
            body: content,
            isBase64Encoded: false
        };
    } catch (e) {
        // 如果文件不存在，返回 404
        return {
            statusCode: 404,
            headers: { 
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*'
            },
            body: '<h1>404 - File not found</h1>',
            isBase64Encoded: false
        };
    }
}

// 辅助函数：JSON 响应
function jsonResponse(statusCode, data) {
    return {
        statusCode: statusCode,
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(data),
        isBase64Encoded: false
    };
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
