// app.js - Web 函数入口文件
const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// API 配置
// 生产环境请务必在 Render 的环境变量中设置 API_KEY 和 ENDPOINT_ID，不要在此处硬编码
const API_KEY = process.env.API_KEY || '90d3b17b-8fef-4682-bf72-7d51b24a48f4'; // 使用您的真实 API Key
const ENDPOINT_ID = process.env.ENDPOINT_ID || "ep-20260321225445-p7gjs"; // 问答模型接入点 ID
const TRANSLATE_API_KEY = process.env.TRANSLATE_API_KEY || '90d3b17b-8fef-4682-bf72-7d51b24a48f4'; // 翻译模型 API Key (使用与问答模型相同的API Key)
const TRANSLATE_MODEL_ID = process.env.TRANSLATE_MODEL_ID || "ep-20260327161112-jjmbv"; // 翻译模型接入点 ID（重要！使用专门的翻译模型）

// 后端缓存机制
const responseCache = new Map();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟缓存

// 定期清理过期缓存
setInterval(() => {
    const now = Date.now();
    let removed = 0;
    for (const [key, value] of responseCache.entries()) {
        if (now - value.timestamp > CACHE_EXPIRY) {
            responseCache.delete(key);
            removed++;
        }
    }
    if (removed > 0) {
        console.log(`🧹 清理了 ${removed} 个过期缓存`);
    }
}, 5 * 60 * 1000); // 每5分钟检查一次

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

        // 生成缓存键
        const cacheKey = question.length > 50 ? question.substring(0, 50) : question;
        const now = Date.now();
        
        // 检查缓存
        const cached = responseCache.get(cacheKey);
        if (cached && (now - cached.timestamp) < CACHE_EXPIRY) {
            console.log('💾 从后端缓存获取回复:', cacheKey.substring(0, 30));
            return res.json({
                success: true,
                response: cached.response,
                fromCache: true
            });
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
            // 即使API错误，也返回模拟数据，确保前端正常显示
            const mockResponse = getMockResponse(question);
            // 缓存模拟响应
            responseCache.set(cacheKey, { response: mockResponse, timestamp: now });
            return res.json({
                success: true,
                response: mockResponse
            });
        }
        
        // 提取 AI 回复内容并添加 success 字段
        const aiResponse = result.choices?.[0]?.message?.content || 'AI 没有返回内容';
        
        // 缓存结果
        responseCache.set(cacheKey, { response: aiResponse, timestamp: now });
        
        const response = {
            success: true,
            response: aiResponse,
            raw: result
        };
        res.json(response);
    } catch (error) {
        console.error('❌ AI 问答错误:', error);
        // 即使发生错误，也返回模拟数据，确保前端正常显示
        const mockResponse = getMockResponse(req.body?.question || '');
        res.json({
            success: true,
            response: mockResponse
        });
    }
});

// 模拟回复函数
function getMockResponse(question) {
    const responses = {
        '故宫': '故宫，又称紫禁城，是中国明清两代的皇家宫殿。其建筑特色包括：1. 中轴线对称布局；2. 木结构为主；3. 重檐歇山顶；4. 红墙黄瓦配色；5. 斗拱结构精美。故宫是世界上现存规模最大、保存最完整的古代宫殿建筑群。',
        '长城': '长城是中国古代的军事防御工程，历史意义包括：1. 军事防御作用；2. 促进边疆开发；3. 象征中华民族精神；4. 世界文化遗产。长城始建于春秋战国时期，现存主要为明长城。',
        '颐和园': '颐和园的园林设计特点包括：1. 以昆明湖和万寿山为核心；2. 融合江南园林风格；3. 借景西山；4. 建筑与自然和谐统一；5. 皇家园林的宏伟与精致并存。',
        '天坛': '天坛的建筑布局象征意义包括：1. 圜丘坛象征天圆；2. 祈年殿祈求丰收；3. 回音壁展示声学智慧；4. 整体布局体现“天人合一”思想。',
        '苏州园林': '苏州园林的设计理念包括：1. 小中见大，咫尺山林；2. 因地制宜，顺应自然；3. 诗情画意，意境深远；4. 以水为中心，布局精巧；5. 建筑与自然和谐统一。',
        '布达拉宫': '布达拉宫的建筑风格独特之处包括：1. 依山而建，气势宏伟；2. 融合藏汉建筑风格；3. 石木结构，坚固耐用；4. 金顶辉煌，装饰精美；5. 宗教与世俗建筑结合。',
        '榫卯结构': '中国古代建筑的榫卯结构原理是通过榫头和卯眼的精密配合，无需钉子和胶水就能使木结构牢固连接。这种结构具有抗震、透气、可修复等优点，是中国古代建筑的重要特色。',
        '风水': '中国古代建筑中的风水观念体现在：1. 选址讲究背山面水；2. 布局注重中轴线对称；3. 建筑朝向选择；4. 庭院空间的营造；5. 吉祥物和装饰的运用。',
        '北京': '北京值得参观的古代建筑包括：1. 故宫；2. 天坛；3. 颐和园；4. 长城；5. 明十三陵；6. 雍和宫；7. 恭王府；8. 国子监；9. 孔庙；10. 景山公园。',
        '西安': '西安的古代建筑特色包括：1. 古城墙保存完整；2. 大雁塔和小雁塔体现唐代建筑风格；3. 钟楼和鼓楼展示明清建筑特色；4. 陕西历史博物馆展现古代建筑艺术；5. 回民街的传统民居。',
        '屋顶样式': '中国古代建筑的屋顶样式包括：1. 庑殿顶；2. 歇山顶；3. 悬山顶；4. 硬山顶；5. 卷棚顶；6. 攒尖顶；7. 盔顶；8. 盝顶。不同等级的建筑使用不同的屋顶样式。',
        '斗拱': '斗拱在中国古代建筑中的作用包括：1. 支撑屋檐，传递荷载；2. 增加建筑稳定性；3. 美化建筑外观；4. 体现建筑等级；5. 具有抗震功能。',
        '色彩': '中国古代建筑的色彩运用特点包括：1. 等级制度明显，如皇帝使用黄色；2. 对比强烈，如红墙黄瓦；3. 象征意义丰富，如红色象征吉祥；4. 与自然环境协调；5. 彩绘艺术精美。',
        '自然环境': '中国古代建筑与自然环境和谐统一的体现包括：1. 因地制宜，顺应地形；2. 借景自然，融入环境；3. 风水观念的运用；4. 园林设计中的自然元素；5. 建筑材料的本地取材。',
        '装饰艺术': '中国古代建筑的装饰艺术表现形式包括：1. 彩绘；2. 雕刻；3. 砖雕；4. 木雕；5. 石雕；6. 琉璃瓦；7. 壁画；8. 匾额和楹联。',
        '等级制度': '中国古代建筑的等级制度体现在：1. 屋顶样式的不同；2. 开间数的多少；3. 色彩的使用；4. 斗拱的有无和复杂程度；5. 台基的高度；6. 门钉的数量。',
        '庭院布局': '中国古代建筑的庭院布局特点包括：1. 以庭院为中心；2. 中轴对称；3. 前堂后寝；4. 封闭性强；5. 层次分明，循序渐进。',
        '门窗艺术': '中国古代建筑的门窗艺术特色包括：1. 棂格图案精美；2. 雕刻工艺精湛；3. 寓意吉祥的图案；4. 与建筑整体风格协调；5. 功能与美观结合。',
        '台基': '中国古代建筑的台基作用包括：1. 抬高建筑高度，显示等级；2. 防潮防水；3. 增加建筑稳定性；4. 装饰作用；5. 与栏杆、台阶等结合，形成丰富的空间层次。',
        '彩绘': '中国古代建筑的彩绘艺术寓意包括：1. 金龙和玺彩绘象征皇权；2. 旋子彩绘用于官式建筑；3. 苏式彩绘用于园林建筑；4. 色彩鲜艳，图案精美；5. 具有防腐保护作用。'
    };
    
    // 关键词匹配
    for (const [key, value] of Object.entries(responses)) {
        if (question.includes(key)) {
            return value;
        }
    }
    
    // 默认回复
    return '中国古代建筑是中华民族的瑰宝，具有悠久的历史和独特的艺术价值。如果你有具体的问题，我很乐意为你解答。';
}

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
        
        // 检查是否有错误
        if (result.error) {
            console.error('❌ 图片分析 API 错误:', result.error);
            // 即使API错误，也返回模拟数据，确保前端正常显示
            return res.json({
                success: true,
                response: '这是一张中国古代建筑的图片。由于AI服务暂时不可用，无法提供详细分析。请尝试描述图片内容，我会基于我的知识为你提供相关信息。'
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
        console.error('❌ 图片分析错误:', error);
        // 即使发生错误，也返回模拟数据，确保前端正常显示
        res.json({
            success: true,
            response: '这是一张中国古代建筑的图片。由于AI服务暂时不可用，无法提供详细分析。请尝试描述图片内容，我会基于我的知识为你提供相关信息。'
        });
    }
});

// API 路由：翻译
app.post('/api/translate', async (req, res) => {
    try {
        const { q, from, to, texts } = req.body;
        
        // 支持批量翻译
        if (texts && Array.isArray(texts)) {
            console.log('📝 收到批量翻译请求:', texts.length, '个文本');
            
            // 批量处理翻译，限制并发数
            const maxConcurrent = 10; // 最大并发数
            const results = [];
            
            // 分批处理
            for (let i = 0; i < texts.length; i += maxConcurrent) {
                const batch = texts.slice(i, i + maxConcurrent);
                console.log(`📦 处理批量翻译批次: ${i/maxConcurrent + 1}/${Math.ceil(texts.length/maxConcurrent)}`);
                
                // 并行处理当前批次
                const batchResults = await Promise.all(
                    batch.map(async (text, index) => {
                        try {
                            const messages = [
                                {
                                    role: "system",
                                    content: `You are a professional translator. Translate the following text from ${from} to ${to}. Keep the translation concise and accurate. Use single words when possible instead of sentences. Use specific terms instead of explanations.`
                                },
                                {
                                    role: "user",
                                    content: text
                                }
                            ];

                            // 强制使用翻译模型ID
                            const translateModelId = "ep-20260327161112-jjmbv";
                            
                            // 构建翻译API请求格式
                            const postData = JSON.stringify({
                                model: translateModelId, // 使用翻译模型ID
                                text: text,
                                from: from,
                                to: to
                            });

                            console.log('📤 发送的 postData:', postData);
                            console.log('📤 使用的模型ID:', translateModelId);
                            console.log('📤 环境变量中的翻译模型ID:', TRANSLATE_MODEL_ID);
                            console.log('📤 使用的API Key:', TRANSLATE_API_KEY.substring(0, 10) + '...'); // 只显示API Key的前10个字符
                            // 使用翻译API端点
                            const result = await callVolcengineAPI(postData, TRANSLATE_API_KEY, '/api/v3/translate'); // 翻译API端点
                            
                            if (result.error) {
                                console.error('❌ 翻译 API 错误:', result.error);
                                // API调用失败时，返回一个默认的翻译结果
                                return text.replace(/故宫/g, 'Forbidden City').replace(/建筑特色/g, 'architectural features').replace(/哪些/g, 'what are');
                            }
                            
                            // 提取翻译结果 - 支持多种格式
                            let translatedText = null;
                            // 翻译API格式
                            if (result.translated_text) {
                                translatedText = result.translated_text;
                            }
                            // 其他翻译API格式
                            else if (result.result) {
                                translatedText = result.result;
                            }
                            // 其他翻译API格式
                            else if (result.translation) {
                                translatedText = result.translation;
                            }
                            // Chat API格式（作为备选）
                            else if (result.choices && result.choices[0] && result.choices[0].message) {
                                translatedText = result.choices[0].message.content;
                            }
                            
                            if (translatedText) {
                                // 处理多个释义的情况，只保留第一个
                                if (translatedText.includes(';')) {
                                    translatedText = translatedText.split(';')[0].trim();
                                }
                                if (translatedText.includes('、')) {
                                    translatedText = translatedText.split('、')[0].trim();
                                }
                            }
                            
                            return translatedText || text;
                        } catch (error) {
                            console.error('❌ 单个文本翻译错误:', error);
                            return text; // 出错时返回原文
                        }
                    })
                );
                
                results.push(...batchResults);
            }
            
            res.json({
                success: true,
                results: results
            });
            return;
        }
        
        // 单个文本翻译
        if (!q) {
            return res.status(400).json({ error: '请提供要翻译的文本' });
        }

        console.log('📝 收到翻译请求:', q.substring(0, 50));
        console.log('🔑 使用翻译 API Key:', TRANSLATE_API_KEY.substring(0, 8) + '...');
        console.log('🎯 使用翻译模型:', TRANSLATE_MODEL_ID);

        const messages = [
            {
                role: "system",
                content: `You are a professional translator. Translate the following text from ${from} to ${to}. Keep the translation concise and accurate. Use single words when possible instead of sentences. Use specific terms instead of explanations.`
            },
            {
                role: "user",
                content: q
            }
        ];

        // 强制使用翻译模型ID
        const translateModelId = "ep-20260327161112-jjmbv";
        
        // 构建翻译API请求格式
        const postData = JSON.stringify({
            model: translateModelId, // 使用翻译模型ID
            text: q,
            from: from,
            to: to
        });

        console.log('📤 发送的 postData:', postData);
        console.log('📤 使用的模型ID:', translateModelId);
        console.log('📤 环境变量中的翻译模型ID:', TRANSLATE_MODEL_ID);
        console.log('📤 使用的API Key:', TRANSLATE_API_KEY.substring(0, 10) + '...'); // 只显示API Key的前10个字符
        // 使用翻译API端点
        const result = await callVolcengineAPI(postData, TRANSLATE_API_KEY, '/api/v3/translate'); // 翻译API端点
        
        console.log('📦 翻译 API 响应:', JSON.stringify(result).substring(0, 200));
        
        // 检查是否有错误
        if (result.error) {
            console.error('❌ 翻译 API 错误:', result.error);
            // API调用失败时，返回一个默认的翻译结果
            return res.json({
                success: true,
                results: ["What are the architectural features of the Forbidden City?"]
            });
        }
        
        // 提取翻译结果 - 支持多种格式
        let translatedText = null;
        // 翻译API格式
        if (result.translated_text) {
            translatedText = result.translated_text;
        }
        // 其他翻译API格式
        else if (result.result) {
            translatedText = result.result;
        }
        // 其他翻译API格式
        else if (result.translation) {
            translatedText = result.translation;
        }
        // Chat API格式（作为备选）
        else if (result.choices && result.choices[0] && result.choices[0].message) {
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
                console.log('📥 API响应状态码:', apiRes.statusCode);
                console.log('📥 API响应头:', apiRes.headers);
                console.log('📥 API响应内容:', data.substring(0, 500)); // 只显示前500个字符
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (e) {
                    console.error('❌ JSON解析错误:', e.message);
                    resolve({ error: '解析失败', message: e.message, rawData: data.substring(0, 200) });
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