// 智能翻译器悬浮小部件
(function() {
    // 创建翻译器小部件
    function createTranslatorWidget() {
        // 主容器
        const widget = document.createElement('div');
        widget.id = 'translator-widget';
        widget.innerHTML = `
            <div class="translator-toggle" id="translatorToggle">
            </div>
            <div class="translator-panel" id="translatorPanel">
                <div class="translator-panel-header">
                    <h3>🌐 智能翻译</h3>
                    <button class="translator-close" id="translatorClose">✕</button>
                </div>
                <div class="translator-panel-body">
                    <div class="translator-option">
                        <label>源语言：</label>
                        <select id="sourceLang">
                            <option value="zh">中文</option>
                            <option value="en">英语</option>
                            <option value="ja">日语</option>
                            <option value="ko">韩语</option>
                            <option value="fr">法语</option>
                            <option value="es">西班牙语</option>
                            <option value="de">德语</option>
                            <option value="ru">俄语</option>
                        </select>
                    </div>
                    <div class="translator-option">
                        <label>目标语言：</label>
                        <select id="targetLang">
                            <option value="en">英语</option>
                            <option value="zh">中文</option>
                            <option value="ja">日语</option>
                            <option value="ko">韩语</option>
                            <option value="fr">法语</option>
                            <option value="es">西班牙语</option>
                            <option value="de">德语</option>
                            <option value="ru">俄语</option>
                        </select>
                    </div>
                    <button class="translator-btn" id="translateBtn">
                        <span class="btn-text">开始翻译</span>
                        <span class="btn-loading" style="display:none;">翻译中...</span>
                    </button>
                    <div class="translator-progress" id="translatorProgress" style="display:none;">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div class="progress-text" id="progressText">0%</div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #translator-widget {
                position: fixed;
                bottom: 30px;
                right: 30px;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                user-select: none;
                -webkit-user-select: none;
            }
            
            #translator-widget.dragging {
                cursor: grabbing;
            }
            
            #translator-widget .translator-toggle {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-image: url('assets/translation-logo.jpg');
                background-size: cover;
                background-position: center;
                box-shadow: 0 4px 20px rgba(139,69,19,0.4);
                cursor: grab;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                animation: pulse 2s infinite;
            }
            
            #translator-widget .translator-toggle:active {
                cursor: grabbing;
            }
            
            #translator-widget .translator-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(139,69,19,0.5);
            }
            

            
            @keyframes pulse {
                0%, 100% {
                    box-shadow: 0 4px 20px rgba(139,69,19,0.4);
                }
                50% {
                    box-shadow: 0 4px 30px rgba(139,69,19,0.6);
                }
            }
            
            #translator-widget .translator-panel {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 320px;
                background: #fff;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                overflow: hidden;
                transform: scale(0) translateY(20px);
                transform-origin: bottom right;
                transition: all 0.3s ease;
                opacity: 0;
                user-select: none;
                -webkit-user-select: none;
            }
            
            #translator-widget .translator-panel.active {
                transform: scale(1) translateY(0);
                opacity: 1;
            }
            
            #translator-widget .translator-panel-header {
                background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
                color: #fff;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: grab;
            }
            
            #translator-widget .translator-panel-header:active {
                cursor: grabbing;
            }
            
            #translator-widget .translator-panel-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                pointer-events: none;
            }
            
            #translator-widget .translator-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: #fff;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            #translator-widget .translator-close:hover {
                background: rgba(255,255,255,0.3);
                transform: rotate(90deg);
            }
            
            #translator-widget .translator-panel-body {
                padding: 20px;
            }
            
            #translator-widget .translator-option {
                margin-bottom: 15px;
            }
            
            #translator-widget .translator-option label {
                display: block;
                font-size: 13px;
                font-weight: 500;
                color: #555;
                margin-bottom: 6px;
            }
            
            #translator-widget .translator-option select {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 14px;
                outline: none;
                transition: all 0.2s;
                background: #fff;
                cursor: pointer;
            }
            
            #translator-widget .translator-option select:focus {
                border-color: #8B4513;
                box-shadow: 0 0 0 3px rgba(139,69,19,0.1);
            }
            
            #translator-widget .translator-btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #DAA520 0%, #B8860B 100%);
                border: none;
                border-radius: 8px;
                color: #fff;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                margin-top: 10px;
            }
            
            #translator-widget .translator-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(218,165,32,0.4);
            }
            
            #translator-widget .translator-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            
            #translator-widget .btn-loading {
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            
            #translator-widget .btn-loading::before {
                content: '';
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: #fff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            #translator-widget .translator-progress {
                margin-top: 15px;
                display: none;
            }
            
            #translator-widget .progress-bar {
                height: 6px;
                background: #f0f0f0;
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            #translator-widget .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #DAA520 0%, #8B4513 100%);
                width: 0%;
                transition: width 0.3s ease;
                border-radius: 3px;
            }
            
            #translator-widget .progress-text {
                text-align: center;
                font-size: 12px;
                color: #666;
                font-weight: 500;
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                #translator-widget {
                    bottom: 20px;
                    right: 20px;
                }
                
                #translator-widget .translator-toggle {
                    width: 50px;
                    height: 50px;
                }
                
                #translator-widget .translator-icon {
                    font-size: 24px;
                }
                
                #translator-widget .translator-panel {
                    width: 280px;
                    bottom: 70px;
                }
            }
        `;
        
        widget.appendChild(style);
        document.body.appendChild(widget);
        
        // 绑定事件
        initWidgetEvents();
    }
    
    // 初始化小部件事件
    function initWidgetEvents() {
        const widget = document.getElementById('translator-widget');
        const toggle = document.getElementById('translatorToggle');
        const panel = document.getElementById('translatorPanel');
        const panelHeader = panel.querySelector('.translator-panel-header');
        const closeBtn = document.getElementById('translatorClose');
        const translateBtn = document.getElementById('translateBtn');
        const sourceLang = document.getElementById('sourceLang');
        const targetLang = document.getElementById('targetLang');
        const progress = document.getElementById('translatorProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        // 拖动功能变量
        let isDragging = false;
        let isPanelDragging = false;
        let startX, startY, initialRight, initialBottom;
        let panelStartX, panelStartY, panelInitialRight, panelInitialBottom;
        
        // 切换面板显示
        toggle.addEventListener('click', (e) => {
            if (!isDragging) {
                panel.classList.toggle('active');
            }
        });
        
        // 关闭面板
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('active');
        });
        
        // 点击外部关闭面板
        document.addEventListener('click', (e) => {
            if (!widget.contains(e.target)) {
                panel.classList.remove('active');
            }
        });
        
        // ===== 翻译器按钮拖动功能 =====
        toggle.addEventListener('mousedown', (e) => {
            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = widget.getBoundingClientRect();
            initialRight = window.innerWidth - rect.right;
            initialBottom = window.innerHeight - rect.bottom;
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            function onMouseMove(e) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                // 如果移动距离超过 5px，认为是拖动而不是点击
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                    isDragging = true;
                    widget.classList.add('dragging');
                    
                    widget.style.right = (initialRight - dx) + 'px';
                    widget.style.bottom = (initialBottom - dy) + 'px';
                    widget.style.left = 'auto';
                    widget.style.top = 'auto';
                }
            }
            
            function onMouseUp() {
                widget.classList.remove('dragging');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                
                // 保存位置到 localStorage
                const rect = widget.getBoundingClientRect();
                const right = window.innerWidth - rect.right;
                const bottom = window.innerHeight - rect.bottom;
                localStorage.setItem('translator_widget_position', JSON.stringify({ right, bottom }));
            }
        });
        
        // 触摸拖动支持（移动端）
        toggle.addEventListener('touchstart', (e) => {
            isDragging = false;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            
            const rect = widget.getBoundingClientRect();
            initialRight = window.innerWidth - rect.right;
            initialBottom = window.innerHeight - rect.bottom;
            
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
            
            function onTouchMove(e) {
                e.preventDefault();
                const touch = e.touches[0];
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;
                
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                    isDragging = true;
                    widget.classList.add('dragging');
                    
                    widget.style.right = (initialRight - dx) + 'px';
                    widget.style.bottom = (initialBottom - dy) + 'px';
                    widget.style.left = 'auto';
                    widget.style.top = 'auto';
                }
            }
            
            function onTouchEnd() {
                widget.classList.remove('dragging');
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
                
                const rect = widget.getBoundingClientRect();
                const right = window.innerWidth - rect.right;
                const bottom = window.innerHeight - rect.bottom;
                localStorage.setItem('translator_widget_position', JSON.stringify({ right, bottom }));
            }
        });
        
        // ===== 翻译面板拖动功能 =====
        panelHeader.addEventListener('mousedown', (e) => {
            if (e.target === closeBtn) return; // 如果点击的是关闭按钮，不拖动
            
            isPanelDragging = false;
            panelStartX = e.clientX;
            panelStartY = e.clientY;
            
            const rect = panel.getBoundingClientRect();
            panelInitialRight = window.innerWidth - rect.right;
            panelInitialBottom = window.innerHeight - rect.bottom;
            
            document.addEventListener('mousemove', onPanelMouseMove);
            document.addEventListener('mouseup', onPanelMouseUp);
            
            function onPanelMouseMove(e) {
                const dx = e.clientX - panelStartX;
                const dy = e.clientY - panelStartY;
                
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                    isPanelDragging = true;
                    panel.style.cursor = 'grabbing';
                    
                    panel.style.right = (panelInitialRight - dx) + 'px';
                    panel.style.bottom = (panelInitialBottom - dy) + 'px';
                    panel.style.left = 'auto';
                    panel.style.top = 'auto';
                    panel.style.transformOrigin = 'center center';
                }
            }
            
            function onPanelMouseUp() {
                panel.style.cursor = 'grab';
                document.removeEventListener('mousemove', onPanelMouseMove);
                document.removeEventListener('mouseup', onPanelMouseUp);
                
                const rect = panel.getBoundingClientRect();
                const right = window.innerWidth - rect.right;
                const bottom = window.innerHeight - rect.bottom;
                localStorage.setItem('translator_panel_position', JSON.stringify({ right, bottom }));
            }
        });
        
        // 触摸拖动支持（移动端）
        panelHeader.addEventListener('touchstart', (e) => {
            if (e.target === closeBtn) return;
            
            isPanelDragging = false;
            const touch = e.touches[0];
            panelStartX = touch.clientX;
            panelStartY = touch.clientY;
            
            const rect = panel.getBoundingClientRect();
            panelInitialRight = window.innerWidth - rect.right;
            panelInitialBottom = window.innerHeight - rect.bottom;
            
            document.addEventListener('touchmove', onPanelTouchMove, { passive: false });
            document.addEventListener('touchend', onPanelTouchEnd);
            
            function onPanelTouchMove(e) {
                e.preventDefault();
                const touch = e.touches[0];
                const dx = touch.clientX - panelStartX;
                const dy = touch.clientY - panelStartY;
                
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                    isPanelDragging = true;
                    panel.style.right = (panelInitialRight - dx) + 'px';
                    panel.style.bottom = (panelInitialBottom - dy) + 'px';
                    panel.style.left = 'auto';
                    panel.style.top = 'auto';
                    panel.style.transformOrigin = 'center center';
                }
            }
            
            function onPanelTouchEnd() {
                document.removeEventListener('touchmove', onPanelTouchMove);
                document.removeEventListener('touchend', onPanelTouchEnd);
                
                const rect = panel.getBoundingClientRect();
                const right = window.innerWidth - rect.right;
                const bottom = window.innerHeight - rect.bottom;
                localStorage.setItem('translator_panel_position', JSON.stringify({ right, bottom }));
            }
        });
        
        // 恢复保存的位置
        function restoreWidgetPosition() {
            const savedPos = localStorage.getItem('translator_widget_position');
            if (savedPos) {
                try {
                    const pos = JSON.parse(savedPos);
                    widget.style.right = pos.right + 'px';
                    widget.style.bottom = pos.bottom + 'px';
                    widget.style.left = 'auto';
                    widget.style.top = 'auto';
                } catch (e) {
                    console.error('恢复翻译器位置失败:', e);
                }
            }
            
            const savedPanelPos = localStorage.getItem('translator_panel_position');
            if (savedPanelPos) {
                try {
                    const pos = JSON.parse(savedPanelPos);
                    panel.style.right = pos.right + 'px';
                    panel.style.bottom = pos.bottom + 'px';
                    panel.style.left = 'auto';
                    panel.style.top = 'auto';
                } catch (e) {
                    console.error('恢复翻译面板位置失败:', e);
                }
            }
        }
        
        // 页面加载时恢复位置
        restoreWidgetPosition();
        
        // 翻译按钮点击事件
        translateBtn.addEventListener('click', async () => {
            const from = sourceLang.value;
            const to = targetLang.value;
            
            if (from === to) {
                alert('源语言和目标语言不能相同');
                return;
            }
            
            // 禁用按钮
            translateBtn.disabled = true;
            translateBtn.querySelector('.btn-text').style.display = 'none';
            translateBtn.querySelector('.btn-loading').style.display = 'inline';
            
            // 显示进度
            progress.style.display = 'block';
            
            try {
                // 使用新的翻译方法，传递 from 和 to 参数
                await translatePage(from, to);
            } catch (error) {
                console.error('翻译错误:', error);
                alert('翻译失败：' + error.message);
            } finally {
                resetButton();
            }
            
            function resetButton() {
                translateBtn.disabled = false;
                translateBtn.querySelector('.btn-text').style.display = 'inline';
                translateBtn.querySelector('.btn-loading').style.display = 'none';
                progress.style.display = 'none';
                progressFill.style.width = '0%';
                progressText.textContent = '0%';
            }
        });
        
        // 使用 TreeWalker 获取所有可翻译的文本节点
        function getAllTextNodes(root) {
            const textNodes = [];
            const walker = document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        // 过滤掉 script、style 等标签内的文本
                        if (node.parentElement?.closest('script, style, noscript')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        // 过滤空白文本（仅空格/换行）
                        if (node.textContent.trim().length === 0) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        // 过滤导航栏文本，避免翻译后破坏布局
                        if (node.parentElement?.closest('.navbar')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        // 过滤翻译小部件本身的文本
                        if (node.parentElement?.closest('#translator-widget')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );
            
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }
            
            console.log(`🔍 getAllTextNodes: 找到 ${textNodes.length} 个文本节点`);
            return textNodes;
        }
        
        // 翻译页面所有文本节点
        async function translatePage(from, to) {
            console.log(' 开始翻译页面...');
            console.log('当前源语言:', from, '目标语言:', to);
            
            // 检查语言是否变化，如果变化则清除所有翻译标记
            const lastFrom = localStorage.getItem('translator_last_from');
            const lastTo = localStorage.getItem('translator_last_to');
            
            if (lastFrom !== from || lastTo !== to) {
                console.log('🔄 检测到语言变化，清除所有翻译标记');
                clearAllTranslationMarks();
                // 保存当前语言配置
                localStorage.setItem('translator_last_from', from);
                localStorage.setItem('translator_last_to', to);
            }
            
            // 获取所有可翻译的文本节点
            const textNodes = getAllTextNodes(document.body);
            console.log(`📝 找到 ${textNodes.length} 个可翻译文本节点`);
            
            if (textNodes.length === 0) {
                alert('没有找到可翻译的文本');
                return;
            }
            
            // 检测文本语言
            function detectLanguage(text) {
                // 更准确的语言检测：包含中文字符则认为是中文
                const hasChinese = /[\u4e00-\u9fa5]/.test(text);
                if (hasChinese) return 'zh';
                
                // 检测俄语字符
                const hasCyrillic = /[\u0400-\u04FF]/.test(text);
                if (hasCyrillic) return 'ru';
                
                // 默认为英文
                return 'en';
            }
            
            // 过滤需要翻译的节点（长度大于 1 个字符，确保所有中文都被翻译，且语言匹配源语言）
            const nodesToTranslate = textNodes.filter(node => {
                const text = node.textContent.trim();
                const nodeLang = detectLanguage(text);
                // 长度改为 1 个字符，确保所有中文都被翻译
                const shouldTranslate = node._translated !== true && text.length >= 1 && nodeLang === from;
                if (shouldTranslate) {
                    console.log(`🔍 检测到需要翻译的节点: "${text}" (语言: ${nodeLang})`);
                }
                return shouldTranslate;
            });
            
            console.log(`🎯 过滤后需要翻译的节点：${nodesToTranslate.length} 个`);
            
            if (nodesToTranslate.length === 0) {
                alert('没有需要翻译的新文本');
                return;
            }
            
            let translatedCount = 0;
            const totalNodes = nodesToTranslate.length;
            
            // 批量翻译优化：将多个文本合并为一个请求
            const batchSize = 100; // 增加批量处理大小到100个文本
            const batches = [];
            
            for (let i = 0; i < totalNodes; i += batchSize) {
                batches.push(nodesToTranslate.slice(i, i + batchSize));
            }
            
            console.log(`📦 总共 ${batches.length} 个批次，开始批量处理`);
            
            // 实现预缓存：优先处理短文本
            const shortTextNodes = [];
            const longTextNodes = [];
            
            // 分离短文本和长文本
            nodesToTranslate.forEach(node => {
                const text = node.textContent.trim();
                if (text.length <= 50) {
                    shortTextNodes.push(node);
                } else {
                    longTextNodes.push(node);
                }
            });
            
            // 优先处理短文本
            if (shortTextNodes.length > 0) {
                console.log(`⚡ 优先处理 ${shortTextNodes.length} 个短文本节点`);
                await processNodesBatch(shortTextNodes, from, to);
            }
            
            // 处理长文本
            if (longTextNodes.length > 0) {
                console.log(`� 处理 ${longTextNodes.length} 个长文本节点`);
                await processNodesBatch(longTextNodes, from, to);
            }
            
            // 批量处理函数
            async function processNodesBatch(nodes, from, to) {
                const batchSize = 100;
                const subBatches = [];
                
                for (let i = 0; i < nodes.length; i += batchSize) {
                    subBatches.push(nodes.slice(i, i + batchSize));
                }
                
                for (let subBatch of subBatches) {
                    // 分离需要翻译的节点和已经缓存的节点
                    const nodesWithCache = [];
                    const nodesToAPI = [];
                    
                    subBatch.forEach(node => {
                        const originalText = node.textContent.trim();
                        const cacheKey = `translate_${from}_${to}_${originalText}`;
                        const cachedResult = localStorage.getItem(cacheKey);
                        
                        if (cachedResult) {
                            // 从缓存获取
                            nodesWithCache.push({ node, originalText, translatedText: cachedResult });
                        } else {
                            // 需要API翻译
                            nodesToAPI.push({ node, originalText });
                        }
                    });
                    
                    // 处理缓存的节点
                    nodesWithCache.forEach(({ node, originalText, translatedText }) => {
                        console.log(`💾 从缓存获取翻译结果: "${originalText.substring(0, 30)}"`);
                        
                        if (translatedText && translatedText !== originalText && translatedText.length > 0) {
                            node.textContent = translatedText;
                            node._translated = true;
                            translatedCount++;
                        } else {
                            console.warn(`⚠️ 缓存翻译结果异常: "${translatedText || '空'}"`);
                        }
                    });
                    
                    // 处理需要API翻译的节点
                    if (nodesToAPI.length > 0) {
                        try {
                            // 提取文本数组
                            const textsToTranslate = nodesToAPI.map(item => item.originalText);
                            
                            // 调用批量翻译API
                            const translatedTexts = await callBatchTranslateAPI(textsToTranslate, from, to);
                            
                            // 处理翻译结果
                            nodesToAPI.forEach(({ node, originalText }, index) => {
                                const translatedText = translatedTexts[index];
                                
                                if (translatedText && translatedText !== originalText && translatedText.length > 0) {
                                    node.textContent = translatedText;
                                    node._translated = true;
                                    translatedCount++;
                                    
                                    // 缓存翻译结果
                                    const cacheKey = `translate_${from}_${to}_${originalText}`;
                                    localStorage.setItem(cacheKey, translatedText);
                                    console.log(`✅ 翻译并缓存结果: "${originalText.substring(0, 30)}"`);
                                } else {
                                    console.warn(`⚠️ 翻译结果异常或与原文相同: "${translatedText || '空'}"`);
                                }
                            });
                        } catch (error) {
                            console.error('批量翻译失败:', error);
                            
                            // 失败时回退到单个翻译
                            await Promise.all(nodesToAPI.map(async ({ node, originalText }) => {
                                try {
                                    const translatedText = await callTranslateAPI(originalText, from, to);
                                    
                                    if (translatedText && translatedText !== originalText && translatedText.length > 0) {
                                        node.textContent = translatedText;
                                        node._translated = true;
                                        translatedCount++;
                                        
                                        // 缓存翻译结果
                                        const cacheKey = `translate_${from}_${to}_${originalText}`;
                                        localStorage.setItem(cacheKey, translatedText);
                                    }
                                } catch (error) {
                                    console.error('单个翻译失败:', originalText.substring(0, 50), error);
                                }
                            }));
                        }
                    }
                    
                    // 更新进度
                    const percent = Math.round((translatedCount / totalNodes) * 100);
                    requestAnimationFrame(() => {
                        progressFill.style.width = percent + '%';
                        progressText.textContent = percent + '%';
                    });
                    
                    // 批次间短暂延迟，避免API请求过于密集
                    await new Promise(resolve => setTimeout(resolve, 50)); // 减少延迟到50ms
                }
            }
            
            // 翻译完成后提示
            setTimeout(() => {
                const successRate = Math.round((translatedCount / totalNodes) * 100);
                alert(`翻译完成！页面已更新，请查看效果。\n\n共翻译 ${translatedCount}/${totalNodes} 个文本节点\n成功率：${successRate}%\n\n提示：部分复杂布局的文本可能需要手动调整。`);
                
                // 保存翻译状态，用于页面切换后自动翻译
                localStorage.setItem('translator_last_translation_time', Date.now());
            }, 100);
        }
        
        // 清除所有节点的翻译标记
        function clearAllTranslationMarks() {
            const textNodes = getAllTextNodes(document.body);
            textNodes.forEach(node => {
                if (node._translated === true) {
                    delete node._translated;
                }
            });
            console.log(`✅ 已清除 ${textNodes.length} 个节点的翻译标记`);
        }
        
        // 获取元素的直接文本内容（不包括子元素）
        function getDirectText(element) {
            let text = '';
            const childNodes = element.childNodes;
            
            for (let i = 0; i < childNodes.length; i++) {
                const node = childNodes[i];
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                }
            }
            
            return text.trim();
        }
        
        // 替换元素中的文本内容
        function replaceTextContent(element, oldText, newText) {
            const childNodes = element.childNodes;
            
            // 尝试 1: 直接匹配并替换文本节点
            for (let i = 0; i < childNodes.length; i++) {
                const node = childNodes[i];
                if (node.nodeType === Node.TEXT_NODE) {
                    const nodeText = node.textContent.trim();
                    // 使用包含关系而不是严格相等，提高匹配成功率
                    if (nodeText === oldText || node.textContent.includes(oldText)) {
                        node.textContent = newText;
                        return true;
                    }
                }
            }
            
            // 尝试 2: 如果元素只有一个文本子节点，直接替换
            if (childNodes.length === 1 && childNodes[0].nodeType === Node.TEXT_NODE) {
                childNodes[0].textContent = newText;
                return true;
            }
            
            // 尝试 3: 如果没有子节点，直接设置 textContent
            if (childNodes.length === 0) {
                element.textContent = newText;
                return true;
            }
            
            // 尝试 4: 使用 innerText 替换（最后的手段）
            console.log(`⚠️ 常规替换失败，使用 innerText 替换："${oldText}" → "${newText}"`);
            element.innerText = newText;
            return true;
        }
        
        // 提取页面文本（保留备用）
        function extractTexts() {
            const texts = [];
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let node;
            while (node = walker.nextNode()) {
                const text = node.textContent.trim();
                
                // 排除翻译小部件本身的文本
                if (node.parentNode.closest('#translator-widget')) {
                    continue;
                }
                
                // 排除脚本、样式等
                if (text.length > 2 && 
                    !node.parentNode.closest('script, style, textarea, code, pre') &&
                    !/^\s*$/.test(text)) {
                    texts.push({
                        node: node,
                        text: text
                    });
                }
            }
            
            return texts;
        }
        
        // 优化翻译结果，使其更简洁
        function optimizeTranslation(text, targetLang) {
            // 常见的冗长翻译替换
            const replacements = {
                'Chinese Ancient Architecture': 'Ancient Chinese Architecture',
                'Chinese Classical Architecture': 'Ancient Chinese Architecture',
                'China\'s Ancient Architecture': 'Ancient Chinese Architecture',
                'Home Page': 'Home',
                'Building Appreciation': 'Architecture',
                'AI Question and Answer': 'AI Q&A',
                'Cultural Topics': 'Culture',
                'International Exchange': 'Exchange',
                'About Us': 'About',
                'Cultural Cities': 'Cities',
                'Famous Buildings': 'Famous Sites',
                'Intelligent Question and Answer System': 'AI Q&A System',
                'Ask Doubao about Classical Architecture': 'Ask Doubao',
                'Architectural Culture': 'Architecture Culture',
                'Architectural Techniques': 'Techniques',
                'Architectural Styles': 'Styles',
                'Cross-Border Impact of Architectural Culture': 'Cross-Border Impact',
                'International Master\'s Perspectives': 'Master Views',
                'Cross-Border Exchange Cases': 'Exchange Cases',
                'Platform Introduction': 'Platform',
                'Contact Us': 'Contact',
                'Join Us': 'Join',
                'Search Chinese Ancient Architecture Knowledge...': 'Search...',
                'Search': 'Search',
                'Use Terms': 'Terms',
                'Privacy Policy': 'Privacy',
                'Site Map': 'Sitemap',
                'Architecture Forum': 'Forum'
            };
            
            let optimizedText = text;
            for (const [long, short] of Object.entries(replacements)) {
                optimizedText = optimizedText.replace(new RegExp(long, 'gi'), short);
            }
            
            // 移除多余的冠词和虚词
            if (targetLang === 'en') {
                optimizedText = optimizedText
                    .replace(/\bthe\s+/gi, '')
                    .replace(/\ba\s+/gi, '')
                    .replace(/\ban\s+/gi, '')
                    .trim();
            }
            
            return optimizedText;
        }
        
        // 调用翻译 API
        async function callTranslateAPI(text, from, to) {
            console.log('📤 发送翻译请求:', { text: text.substring(0, 50), from, to });
            
            // 使用相对路径，前端和后端部署在 Render 同一域名下
            const API_URL = '/api/translate';
            console.log('🔗 调用 API URL:', API_URL);
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    q: text,
                    from: from,
                    to: to
                })
            });
            
            console.log('📥 API 响应状态:', response.status);
            console.log('📥 API 响应头:', response.headers.get('content-type'));
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API 错误:', errorText);
                throw new Error('翻译 API 调用失败：' + response.status);
            }
            
            const data = await response.json();
            console.log('📦 API 返回完整数据:', data);  // 打印完整对象
            
            let translatedText = null;
            if (data.translatedText) {
                translatedText = data.translatedText;
                console.log('✅ 使用 translatedText 字段');
            } else if (data.success && data.translation) {
                translatedText = data.translation;
                console.log('✅ 使用 translation 字段');
            } else if (data.success && data.result) {
                translatedText = data.result;
                console.log('✅ 使用 result 字段');
            } else {
                console.warn('⚠️ 未识别翻译字段，使用原文本');
                return text;
            }
            
            // 优化翻译结果
            const optimizedText = optimizeTranslation(translatedText, to);
            console.log('✅ 最终翻译文本:', optimizedText);
            return optimizedText;
        }
        
        // 批量调用翻译 API
        async function callBatchTranslateAPI(texts, from, to) {
            console.log('📤 发送批量翻译请求:', { count: texts.length, from, to });
            
            const API_URL = '/api/translate';
            console.log('🔗 调用 API URL:', API_URL);
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    texts: texts,
                    from: from,
                    to: to
                })
            });
            
            console.log('📥 API 响应状态:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API 错误:', errorText);
                throw new Error('翻译 API 调用失败：' + response.status);
            }
            
            const data = await response.json();
            console.log('📦 API 返回完整数据:', data);
            
            if (data.success && data.results && Array.isArray(data.results)) {
                console.log('✅ 批量翻译成功，返回', data.results.length, '个结果');
                // 优化批量翻译结果
                const optimizedResults = data.results.map(result => optimizeTranslation(result, to));
                return optimizedResults;
            } else {
                console.warn('⚠️ 批量翻译返回格式错误');
                // 失败时返回原文
                return texts;
            }
        }
        
        // 监听动态内容变化，自动翻译新添加的内容
        function observeDynamicContent() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 对新添加的区域重新提取并翻译文本节点
                            const newTextNodes = getAllTextNodes(node);
                            if (newTextNodes.length > 0) {
                                console.log(`🆕 检测到新内容，找到 ${newTextNodes.length} 个可翻译节点`);
                                // 可以选择自动翻译或等待用户操作
                            }
                        }
                    });
                });
            });
            
            observer.observe(document.body, { 
                childList: true, 
                subtree: true 
            });
            
            console.log('✅ 已启动动态内容监听');
        }
        
        // 启动动态内容监听
        observeDynamicContent();
    }
    
    // 创建 widget 引用
    const widget = null;
    
    // 页面加载完成后创建小部件
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            createTranslatorWidget();
            // 页面加载完成后检查是否需要自动翻译
            checkAndAutoTranslate();
        });
    } else {
        createTranslatorWidget();
        // 页面加载完成后检查是否需要自动翻译
        checkAndAutoTranslate();
    }
    
    // 检查是否需要自动翻译
    function checkAndAutoTranslate() {
        const lastTranslationTime = localStorage.getItem('translator_last_translation_time');
        const lastFrom = localStorage.getItem('translator_last_from');
        const lastTo = localStorage.getItem('translator_last_to');
        
        // 如果有翻译记录且时间在24小时内，自动执行翻译
        if (lastTranslationTime && lastFrom && lastTo) {
            const timeDiff = Date.now() - parseInt(lastTranslationTime);
            const oneDay = 24 * 60 * 60 * 1000;
            
            if (timeDiff < oneDay) {
                console.log('🔄 检测到历史翻译记录，自动执行翻译');
                // 等待DOM完全加载
                setTimeout(() => {
                    // 模拟点击翻译按钮
                    const translateBtn = document.getElementById('translateBtn');
                    if (translateBtn) {
                        // 设置语言选择
                        const sourceLang = document.getElementById('sourceLang');
                        const targetLang = document.getElementById('targetLang');
                        if (sourceLang && targetLang) {
                            sourceLang.value = lastFrom;
                            targetLang.value = lastTo;
                            // 触发翻译
                            translateBtn.click();
                        }
                    }
                }, 500);
            }
        }
    }
    
    // 全局函数，用于从导航栏调用
    window.toggleTranslator = function() {
        const panel = document.getElementById('translatorPanel');
        if (panel) {
            panel.classList.toggle('active');
        }
    };
})();
