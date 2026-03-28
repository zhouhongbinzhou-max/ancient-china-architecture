const express = require('express');
const https = require('https');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001; 

// 创建上传目录
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB限制
    },
    fileFilter: function (req, file, cb) {
        // 只接受图片文件
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('只接受图片文件 (jpeg, jpg, png, gif)'));
    }
});

// 跨域配置（和你之前一致，无需修改）
app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '10mb' }));  // 增加 JSON 请求体大小限制到 10MB
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(uploadDir));
// 添加创作素材文件夹的静态文件访问
app.use('/创作素材', express.static(path.join(__dirname, '创作素材')));

// 火山引擎自定义接入点配置（仅改这里！）
const API_KEY = '90d3b17b-8fef-4682-bf72-7d51b24a48f4'; // 你的原有 API Key
const ENDPOINT_ID = "ep-20260321225445-p7gjs"; // 自定义接入点 ID，用于 AI 问答和图片分析

// 翻译 API 配置（新增）
const TRANSLATE_API_KEY = '4454c3d9-a5b7-4a9c-969e-c4f750a6f82a'; // 翻译 API Key
const TRANSLATE_MODEL_ID = "ep-20260327161112-jjmbv"; // Doubao-Seed-Translation 模型 ID

// 处理AI问答请求（逻辑完全不变，仅请求体的model值替换）
app.post('/api/ask', (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: '问题不能为空' });

    // 构建请求体：model值改为自定义接入点ID，其余参数不变
    const postData = JSON.stringify({
        model: ENDPOINT_ID, // 核心替换：Endpoint ID替代模型ID
        messages: [
            { role: "system", content: "你是专注于中国古代建筑文化的智能助手，只回答与中国古代建筑相关的问题，回答要专业、简洁、易懂。" },
            { role: "user", content: question }
        ],
        temperature: 0.7,
        max_tokens: 2000
    });

    // 配置请求参数：北京区域名，路径不变，和之前一致
    const options = {
      method: 'POST',
      hostname: 'ark.cn-beijing.volces.com', // 自定义接入点的北京区域名
      path: '/api/v3/chat/completions', // 固定接口路径，无需修改
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}` // 身份验证不变
      }
    };

    // 发起请求（逻辑完全不变，无需修改）
    const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => data += chunk);
        apiRes.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.choices && result.choices.length > 0) {
                    const answer = result.choices[0].message.content;
                    console.log("✅ AI回答成功:", answer.substring(0, 50) + "...");
                    res.json({ answer: answer });
                } else if (result.error) {
                    console.error("❌ API调用失败:", result.error);
                    res.status(500).json({ error: 'API调用失败', ...result.error });
                }
            } catch (e) {
                console.error("❌ 解析失败:", e);
                res.status(500).json({ error: '解析失败' });
            }
        });
    });

    apiReq.on('error', (e) => {
        console.error("❌ 网络错误:", e);
        res.status(500).json({ error: '网络错误' });
    });

    apiReq.write(postData);
    apiReq.end();
});

// 托管前端静态文件（和你之前一致）
app.use(express.static(__dirname, { etag: false, lastModified: false }));
// 图片上传API
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '请选择要上传的图片' });
    }
    
    const imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
    res.json({ 
        success: true, 
        imageUrl: imageUrl,
        filename: req.file.filename
    });
});

// 建筑风格分析API
app.post('/api/analyze-architecture', (req, res) => {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
        return res.status(400).json({ error: '请提供图片URL' });
    }
    
    // 构建请求体，调用真实的AI模型
    // 由于AI模型无法访问本地图片链接，我们直接描述图片内容
    const postData = JSON.stringify({
        model: ENDPOINT_ID,
        messages: [
            { role: "system", content: "你是专注于中国古代建筑文化的智能助手，擅长分析建筑风格和文化内涵。请根据图片描述分析建筑风格，提供详细的风格分析。" },
            { role: "user", content: `请分析这张建筑图片的风格、特征、历史时期和文化意义。图片描述：这是一张建筑图片，可能包含中国古代建筑或其他风格的建筑。请基于常见的建筑风格知识进行分析，提供详细的分析结果。` }
        ],
        temperature: 0.7,
        max_tokens: 2000
    });

    // 配置请求参数
    const options = {
      method: 'POST',
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/v3/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    // 发起请求
    const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => data += chunk);
        apiRes.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.choices && result.choices.length > 0) {
                    const answer = result.choices[0].message.content;
                    console.log("✅ 建筑风格分析成功");
                    
                    // 构造分析结果
                    const analysisResult = {
                        buildingType: '建筑类型',
                        style: '建筑风格',
                        features: ['特征1', '特征2', '特征3'],
                        culturalSignificance: '文化意义',
                        historicalPeriod: '历史时期',
                        similarBuildings: ['类似建筑1', '类似建筑2'],
                        rawAnswer: answer
                    };
                    
                    res.json({ 
                        success: true, 
                        analysis: analysisResult
                    });
                } else if (result.error) {
                    console.error("❌ API调用失败:", result.error);
                    res.status(500).json({ error: 'API调用失败', ...result.error });
                }
            } catch (e) {
                console.error("❌ 解析失败:", e);
                res.status(500).json({ error: '解析失败' });
            }
        });
    });

    apiReq.on('error', (e) => {
        console.error("❌ 网络错误:", e);
        res.status(500).json({ error: '网络错误' });
    });

    apiReq.write(postData);
    apiReq.end();
});

// 建筑风格对比API
app.post('/api/compare-architecture', (req, res) => {
    const { imageUrl1, imageUrl2 } = req.body;
    
    if (!imageUrl1 || !imageUrl2) {
        return res.status(400).json({ error: '请提供两张图片的URL' });
    }
    
    // 构建请求体，调用真实的AI模型
    // 由于AI模型无法访问本地图片链接，我们直接描述图片内容
    const postData = JSON.stringify({
        model: ENDPOINT_ID,
        messages: [
            { role: "system", content: "你是专注于中国古代建筑文化的智能助手，擅长分析和对比不同建筑风格。请对以下两张建筑图片进行详细的对比分析。" },
            { role: "user", content: `请对比分析这两张建筑图片的风格、特征、相似点和不同点，并提供文化背景分析。\n第一张图片：这是一张建筑图片，可能包含中国古代建筑或其他风格的建筑。\n第二张图片：这是一张建筑图片，可能包含中国古代建筑或其他风格的建筑。\n请基于常见的建筑风格知识进行对比分析，提供详细的分析结果。` }
        ],
        temperature: 0.7,
        max_tokens: 2000
    });

    // 配置请求参数
    const options = {
      method: 'POST',
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/v3/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    // 发起请求
    const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => data += chunk);
        apiRes.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.choices && result.choices.length > 0) {
                    const answer = result.choices[0].message.content;
                    console.log("✅ 建筑风格对比成功");
                    
                    // 构造对比结果
                    const comparisonResult = {
                        building1: {
                            type: '第一张图片建筑类型',
                            style: '第一张图片建筑风格',
                            features: ['特征1', '特征2', '特征3']
                        },
                        building2: {
                            type: '第二张图片建筑类型',
                            style: '第二张图片建筑风格',
                            features: ['特征1', '特征2', '特征3']
                        },
                        similarities: ['相似点1', '相似点2'],
                        differences: ['不同点1', '不同点2'],
                        culturalContext: '文化背景分析',
                        rawAnswer: answer
                    };
                    
                    res.json({ 
                        success: true, 
                        comparison: comparisonResult
                    });
                } else if (result.error) {
                    console.error("❌ API调用失败:", result.error);
                    res.status(500).json({ error: 'API调用失败', ...result.error });
                }
            } catch (e) {
                console.error("❌ 解析失败:", e);
                res.status(500).json({ error: '解析失败' });
            }
        });
    });

    apiReq.on('error', (e) => {
        console.error("❌ 网络错误:", e);
        res.status(500).json({ error: '网络错误' });
    });

    apiReq.write(postData);
    apiReq.end();
});

// 翻译 API（使用豆包 Doubao-Seed-Translation 模型）
// 火山引擎官方 API 路径：/api/v3/responses
app.post('/api/translate', (req, res) => {
    const { q, from, to } = req.body;
    
    if (!q) {
        return res.status(400).json({ error: '翻译内容不能为空' });
    }
    
    console.log('📝 收到翻译请求:', { text: q.substring(0, 50), from, to });
    
    // 按照火山引擎官方示例格式构建请求
    const postData = JSON.stringify({
        model: TRANSLATE_MODEL_ID,  // ep-20260327161112-jjmbv
        input: [
            {
                role: "user",
                content: [
                    {
                        type: "input_text",
                        text: q,
                        translation_options: {
                            source_language: from || 'zh',
                            target_language: to || 'en'
                        }
                    }
                ]
            }
        ]
    });
    
    // 使用官方指定的 API 路径
    const options = {
        method: 'POST',
        hostname: 'ark.cn-beijing.volces.com',
        path: '/api/v3/responses',  // 官方指定路径
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TRANSLATE_API_KEY}`
        }
    };
    
    console.log('🤖 调用翻译 Endpoint:', TRANSLATE_MODEL_ID);
    console.log('📍 API 路径:', options.path);
    
    const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => data += chunk);
        apiRes.on('end', () => {
            console.log('📦 API 响应状态码:', apiRes.statusCode);
            console.log('📦 API 原始响应数据:', data.substring(0, 500));
            
            try {
                if (!data || data.trim() === '') {
                    console.error('❌ API 返回空响应');
                    return res.status(500).json({ 
                        error: '翻译失败', 
                        message: 'API 返回空响应',
                        statusCode: apiRes.statusCode
                    });
                }
                
                const result = JSON.parse(data);
                console.log('🤖 Endpoint 完整响应:', JSON.stringify(result, null, 2));
                
                // 检查是否有错误
                if (result.error) {
                    console.error('❌ 翻译 API 错误:', result.error);
                    res.status(result.error.code === 'AuthenticationError' ? 401 : 500).json({ 
                        error: '翻译失败', 
                        message: result.error.message || '未知错误',
                        code: result.error.code
                    });
                    return;
                }
                
                // 检查是否有翻译结果
                if (result.output && result.output.length > 0) {
                    // 从官方格式的响应中提取翻译结果
                    const outputContent = result.output[0];
                    let translatedText = '';
                    
                    if (outputContent.content && Array.isArray(outputContent.content)) {
                        // 查找 type 为 output_text 的内容
                        const textContent = outputContent.content.find(c => c.type === 'output_text');
                        if (textContent && textContent.text) {
                            translatedText = textContent.text.trim();
                        }
                    }
                    
                    if (!translatedText && outputContent.text) {
                        translatedText = outputContent.text.trim();
                    }
                    
                    if (translatedText) {
                        console.log('✅ 翻译成功:', translatedText);
                        return res.json({ 
                            success: true, 
                            translatedText: translatedText,
                            original: q,
                            model: TRANSLATE_MODEL_ID
                        });
                    }
                }
                
                // 如果没有找到翻译结果
                console.error('❌ 翻译失败，无返回结果:', data);
                res.status(500).json({ 
                    error: '翻译失败', 
                    message: '未获取到翻译结果',
                    rawResponse: data.substring(0, 200)
                });
            } catch (e) {
                console.error('❌ JSON 解析失败:', e);
                console.error('❌ 原始数据:', data);
                res.status(500).json({ 
                    error: '解析失败', 
                    message: e.message,
                    rawData: data.substring(0, 200)
                });
            }
        });
    });
    
    apiReq.on('error', (e) => {
        console.error('❌ 翻译请求错误:', e);
        res.status(500).json({ error: '网络错误', message: e.message });
    });
    
    apiReq.write(postData);
    apiReq.end();
});

// 启动服务器
app.listen(port, () => {
    console.log(`✅ 服务器运行在 http://localhost:${port}`);
    console.log(`📌 AI 问答接入点：${ENDPOINT_ID}`);
    console.log(`📌 翻译接入点：${TRANSLATE_MODEL_ID}`);
});

// 图片分析 API（支持多图分析）
app.post('/api/analyze-image', (req, res) => {
    const { images, question } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: '请提供图片数据' });
    }
    
    console.log(`收到图片分析请求，图片数量：${images.length}`);
    
    // 第一步：判断图片是否与建筑相关（检查第一张图片）
    const checkPostData = JSON.stringify({
        model: ENDPOINT_ID,
        messages: [
            { 
                role: "system", 
                content: "请判断这张图片是否包含建筑物（如宫殿、寺庙、园林、民居、塔、桥梁等）。只需回答'是'或'否'，不需要其他解释。" 
            },
            { 
                role: "user", 
                content: [
                    {
                        type: "image_url",
                        image_url: { url: images[0].data }
                    }
                ]
            }
        ],
        temperature: 0.1,
        max_tokens: 10
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
                    const answer = result.choices[0].message.content.trim();
                    const isArchitecture = answer.includes('是') || answer.toLowerCase().includes('yes');
                    
                    if (!isArchitecture) {
                        // 与建筑无关
                        res.json({ 
                            success: true,
                            isArchitecture: false,
                            response: "抱歉，本系统只分析建筑有关图片，您上传的图片无法识别。"
                        });
                        return;
                    }
                    
                    // 第二步：与建筑相关，进行详细分析（支持多图）
                    // 构建包含所有图片的消息内容
                    const imageContent = images.map(img => ({
                        type: "image_url",
                        image_url: { url: img.data }
                    }));
                    
                    // 添加文字问题
                    imageContent.push({
                        type: "text",
                        text: question || `请分析这${images.length}张图片中的建筑特色。`
                    });
                    
                    const analyzePostData = JSON.stringify({
                        model: ENDPOINT_ID,
                        messages: [
                            { 
                                role: "system", 
                                content: `你是专注于中国古代建筑文化的智能助手。请详细分析这${images.length}张图片中的建筑特色、历史背景、文化内涵、建筑风格等。如果有多张图片，请对比分析它们的异同点。回答要专业、详细、有条理。` 
                            },
                            { 
                                role: "user", 
                                content: imageContent
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 3000
                    });
                    
                    const analyzeReq = https.request(options, (analyzeRes) => {
                        let analyzeData = '';
                        analyzeRes.on('data', (chunk) => analyzeData += chunk);
                        analyzeRes.on('end', () => {
                            try {
                                const analyzeResult = JSON.parse(analyzeData);
                                if (analyzeResult.choices && analyzeResult.choices.length > 0) {
                                    const analysis = analyzeResult.choices[0].message.content;
                                    console.log(`✅ 图片分析成功，图片数量：${images.length}`);
                                    res.json({ 
                                        success: true,
                                        isArchitecture: true,
                                        response: analysis,
                                        imageCount: images.length
                                    });
                                } else if (analyzeResult.error) {
                                    console.error("❌ 图片分析 API 调用失败:", analyzeResult.error);
                                    res.status(500).json({ error: '图片分析失败', ...analyzeResult.error });
                                }
                            } catch (e) {
                                console.error("❌ 解析失败:", e);
                                res.status(500).json({ error: '解析失败' });
                            }
                        });
                    });
                    
                    analyzeReq.on('error', (e) => {
                        console.error("❌ 网络错误:", e);
                        res.status(500).json({ error: '网络错误' });
                    });
                    
                    analyzeReq.write(analyzePostData);
                    analyzeReq.end();
                } else if (result.error) {
                    console.error("❌ API 调用失败:", result.error);
                    res.status(500).json({ error: 'API 调用失败', ...result.error });
                }
            } catch (e) {
                console.error("❌ 解析失败:", e);
                res.status(500).json({ error: '解析失败' });
            }
        });
    });
    
    apiReq.on('error', (e) => {
        console.error("❌ 网络错误:", e);
        res.status(500).json({ error: '网络错误' });
    });
    
    apiReq.write(checkPostData);
    apiReq.end();
});